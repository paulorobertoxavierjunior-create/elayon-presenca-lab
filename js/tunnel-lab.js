(function () {
  const CRS_URL = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";
  const HEALTH_URL = "https://nucleo-crs-elayon.onrender.com/health";
  const TIMEOUT_MS = 20000;

  let activeStream = null;
  let activeRecognition = null;
  let recognitionRunning = false;
  let ttsActive = false;

  function withTimeout(promise, timeoutMs = TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("timeout da requisição"));
      }, timeoutMs);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  async function healthcheck() {
    const base = {
      tts: "speechSynthesis" in window,
      mic: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      stt: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      crs: false,
      streamOpen: !!activeStream,
      ttsActive,
      recognitionRunning
    };

    try {
      const res = await withTimeout(fetch(HEALTH_URL));
      base.crs = res.ok;
    } catch {
      base.crs = false;
    }

    return base;
  }

  const tts = {
    speak(text) {
      return new Promise((resolve, reject) => {
        try {
          if (!("speechSynthesis" in window)) {
            reject(new Error("TTS não disponível"));
            return;
          }

          window.speechSynthesis.cancel();

          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = "pt-BR";
          utter.rate = 1;
          utter.pitch = 1;
          utter.volume = 1;

          utter.onstart = () => {
            ttsActive = true;
          };

          utter.onend = () => {
            ttsActive = false;
            resolve({ ok: true, text });
          };

          utter.onerror = (e) => {
            ttsActive = false;
            reject(new Error(e.error || "erro no TTS"));
          };

          window.speechSynthesis.speak(utter);
        } catch (err) {
          ttsActive = false;
          reject(err);
        }
      });
    },

    stop() {
      return new Promise((resolve) => {
        try {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        } catch {}
        ttsActive = false;
        resolve({ ok: true });
      });
    }
  };

  const mic = {
    async open() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("microfone não disponível");
      }

      if (activeStream) {
        return {
          ok: true,
          tracks: activeStream.getAudioTracks().length,
          labels: activeStream.getAudioTracks().map(t => t.label || "Padrão")
        };
      }

      activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      return {
        ok: true,
        tracks: activeStream.getAudioTracks().length,
        labels: activeStream.getAudioTracks().map(t => t.label || "Padrão")
      };
    },

    async close() {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
        activeStream = null;
      }
      return { ok: true };
    }
  };

  const stt = {
    listenOnce({ silenceMs = 4000, onPartial } = {}) {
      return new Promise((resolve, reject) => {
        try {
          const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

          if (!RecognitionCtor) {
            reject(new Error("SpeechRecognition não disponível"));
            return;
          }

          let finalText = "";
          let partialText = "";
          let silenceTimer = null;
          let finished = false;

          function finish(result) {
            if (finished) return;
            finished = true;
            recognitionRunning = false;
            clearTimeout(silenceTimer);
            try {
              activeRecognition && activeRecognition.stop();
            } catch {}
            resolve(result);
          }

          activeRecognition = new RecognitionCtor();
          activeRecognition.lang = "pt-BR";
          activeRecognition.interimResults = true;
          activeRecognition.continuous = true;

          activeRecognition.onstart = () => {
            recognitionRunning = true;
          };

          activeRecognition.onresult = (event) => {
            partialText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const trecho = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalText += `${trecho} `;
              } else {
                partialText += `${trecho} `;
              }
            }

            const currentText = `${finalText}${partialText}`.trim();

            if (typeof onPartial === "function") {
              onPartial({
                ok: true,
                text: currentText,
                final: finalText.trim(),
                partial: partialText.trim()
              });
            }

            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              finish({
                ok: true,
                text: currentText,
                final: finalText.trim(),
                partial: partialText.trim()
              });
            }, silenceMs);
          };

          activeRecognition.onerror = (event) => {
            recognitionRunning = false;
            clearTimeout(silenceTimer);
            reject(new Error(event.error || "erro no reconhecimento"));
          };

          activeRecognition.onend = () => {
            if (!finished) {
              recognitionRunning = false;
              clearTimeout(silenceTimer);
              finish({
                ok: true,
                text: `${finalText}${partialText}`.trim(),
                final: finalText.trim(),
                partial: partialText.trim()
              });
            }
          };

          activeRecognition.start();
        } catch (err) {
          recognitionRunning = false;
          reject(err);
        }
      });
    },

    stop() {
      try {
        activeRecognition && activeRecognition.stop();
      } catch {}
      recognitionRunning = false;
      return { ok: true };
    }
  };

  const crs = {
    buildPayload(transcript, extra = {}) {
      const text = (transcript || "").trim();

      return {
        context: extra.context || "",
        transcript_raw: text,
        duration_sec: Math.max(1, Math.ceil(text.length / 12)),
        silence_pct: extra.silence_pct ?? 15,
        pause_count: extra.pause_count ?? 2,
        mean_pause_ms: extra.mean_pause_ms ?? 180,
        source_text: extra.source_text || "",
        timeline_events: extra.timeline_events || [],
        uploaded_file_name: extra.uploaded_file_name || ""
      };
    },

    async analyze(payload) {
      const res = await withTimeout(fetch(CRS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`CRS HTTP ${res.status}: ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        throw new Error("CRS respondeu sem JSON válido");
      }
    }
  };

  const loop = {
    async runStep({ instruction, context, sourceText }) {
      await tts.speak(instruction);

      const heard = await stt.listenOnce({
        silenceMs: 4000
      });

      const payload = crs.buildPayload(heard.text, {
        context: context || "",
        source_text: sourceText || instruction
      });

      const analysis = await crs.analyze(payload);

      return {
        ok: true,
        heard,
        payload,
        analysis
      };
    }
  };

  window.ELAYON_TUNNEL = {
    healthcheck,
    tts,
    mic,
    stt,
    crs,
    loop
  };
})();