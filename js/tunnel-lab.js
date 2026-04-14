(function () {
  const CRS_URL = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";
  const CRS_TIMEOUT_MS = 12000;

  let currentStream = null;
  let recognition = null;
  let recognitionRunning = false;
  let ttsActive = false;

  function fetchWithTimeout(url, options = {}, timeoutMs = CRS_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
  }

  function getRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function beep() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 880;
      gain.gain.value = 0.05;

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  async function speak(text, config = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!("speechSynthesis" in window)) {
          reject(new Error("speechSynthesis não disponível neste navegador"));
          return;
        }

        if (!text || !String(text).trim()) {
          reject(new Error("Texto vazio para TTS"));
          return;
        }

        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(String(text).trim());
        utter.lang = config.lang || "pt-BR";
        utter.rate = config.rate ?? 1;
        utter.pitch = config.pitch ?? 1;
        utter.volume = config.volume ?? 1;

        utter.onstart = () => {
          ttsActive = true;
          config.onStart?.();
        };

        utter.onend = () => {
          ttsActive = false;
          config.onEnd?.();
          resolve({
            ok: true,
            text: utter.text
          });
        };

        utter.onerror = (event) => {
          ttsActive = false;
          reject(new Error(`speechSynthesis: ${event.error || "erro desconhecido"}`));
        };

        window.speechSynthesis.speak(utter);
      } catch (error) {
        reject(error);
      }
    });
  }

  function stopSpeak() {
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      ttsActive = false;
      return { ok: true };
    } catch (error) {
      throw error;
    }
  }

  async function openMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia não disponível neste navegador");
    }

    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    return {
      ok: true,
      tracks: currentStream.getAudioTracks().length,
      labels: currentStream.getAudioTracks().map(track => track.label || "sem label")
    };
  }

  function closeMic() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    return { ok: true };
  }

  async function listenOnce(config = {}) {
    return new Promise((resolve, reject) => {
      try {
        const RecognitionCtor = getRecognitionCtor();

        if (!RecognitionCtor) {
          reject(new Error("SpeechRecognition não disponível neste navegador"));
          return;
        }

        if (recognitionRunning && recognition) {
          try { recognition.stop(); } catch {}
        }

        recognition = new RecognitionCtor();
        recognition.lang = config.lang || "pt-BR";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        let finalText = "";
        let partialText = "";
        let endTimer = null;
        const silenceMs = config.silenceMs ?? 3000;

        function armEndTimer() {
          clearTimeout(endTimer);
          endTimer = setTimeout(() => {
            try { recognition.stop(); } catch {}
          }, silenceMs);
        }

        recognition.onstart = () => {
          recognitionRunning = true;
          config.onStart?.();
        };

        recognition.onresult = (event) => {
          finalText = "";
          partialText = "";

          for (let i = 0; i < event.results.length; i++) {
            const trecho = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += trecho + " ";
            } else {
              partialText += trecho + " ";
            }
          }

          const merged = `${finalText}${partialText}`.trim();
          config.onPartial?.({
            text: merged,
            final: finalText.trim(),
            partial: partialText.trim()
          });

          armEndTimer();
        };

        recognition.onerror = (event) => {
          recognitionRunning = false;
          clearTimeout(endTimer);
          reject(new Error(`SpeechRecognition: ${event.error}`));
        };

        recognition.onend = () => {
          recognitionRunning = false;
          clearTimeout(endTimer);

          const merged = `${finalText}${partialText}`.trim();

          resolve({
            ok: true,
            text: merged,
            final: finalText.trim(),
            partial: partialText.trim()
          });
        };

        if (config.beep !== false) beep();
        recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function analyzeCRS(payload) {
    const response = await fetchWithTimeout(CRS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("CRS respondeu, mas não retornou JSON válido");
    }

    return json;
  }

  function buildDefaultPayload(transcript, config = {}) {
    const clean = String(transcript || "").trim();

    return {
      context: config.context || "",
      transcript_raw: clean,
      duration_sec: config.duration_sec ?? Math.max(1, Math.ceil((clean.length || 1) / 12)),
      silence_pct: config.silence_pct ?? (clean ? 15 : 40),
      pause_count: config.pause_count ?? (clean ? 2 : 0),
      mean_pause_ms: config.mean_pause_ms ?? (clean ? 180 : 0),
      source_text: config.source_text || "",
      timeline_events: config.timeline_events || [],
      uploaded_file_name: config.uploaded_file_name || ""
    };
  }

  async function runStep(config = {}) {
    const instruction = config.instruction || "";
    const readText = config.readText || "";
    const context = config.context || "";
    const sourceText = config.sourceText || "";
    const silenceMs = config.silenceMs ?? 3000;

    if (instruction) {
      await speak(instruction, {
        onStart: config.onTTSStart,
        onEnd: config.onTTSEnd
      });
    }

    const heard = await listenOnce({
      lang: "pt-BR",
      silenceMs,
      beep: true,
      onStart: config.onMicStart,
      onPartial: config.onPartial
    });

    const payload = buildDefaultPayload(heard.final || heard.text, {
      context,
      source_text: readText || sourceText || instruction
    });

    const analysis = await analyzeCRS(payload);

    if (analysis?.user_report?.summary && config.readSummary !== false) {
      await speak(analysis.user_report.summary, {
        onStart: config.onSummaryStart,
        onEnd: config.onSummaryEnd
      });
    }

    return {
      ok: true,
      heard,
      payload,
      analysis
    };
  }

  async function healthcheck() {
    const result = {
      tts: "speechSynthesis" in window,
      mic: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      stt: !!getRecognitionCtor(),
      crs: true,
      streamOpen: !!currentStream,
      ttsActive,
      recognitionRunning
    };

    return result;
  }

  window.ELAYON_TUNNEL = {
    version: "1.0.0",
    healthcheck,

    tts: {
      speak,
      stop: stopSpeak
    },

    mic: {
      open: openMic,
      close: closeMic
    },

    stt: {
      listenOnce
    },

    crs: {
      analyze: analyzeCRS,
      buildPayload: buildDefaultPayload
    },

    loop: {
      runStep
    }
  };
})();