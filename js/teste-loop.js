(function () {
  const LAB = window.ELAYON_LAB;
  const URL_CRS = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";
  const TIMEOUT_MS = 12000;

  let recognition = null;
  let running = false;
  let transcriptFinal = "";
  let ttsActive = false;

  function getRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
  }

  function setText(id, value) {
    LAB.setValue(id, value);
  }

  function stopRecognitionInternal(logEvent = false) {
    if (recognition && running) {
      try {
        recognition.stop();
      } catch {}
    }
    running = false;
    if (logEvent) LAB.appendLog("Reconhecimento interrompido");
  }

  function stopTTS() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    ttsActive = false;
  }

  function resetState() {
    stopRecognitionInternal(false);
    stopTTS();
    transcriptFinal = "";

    LAB.resetDiagnostics();
    setText("statusGeral", "aguardando");
    setText("textoTranscrito", "—");
    setText("textoResposta", "—");
    setText("respostaAtual", "—");
  }

  function buildPayload() {
    const context = (document.getElementById("inpContext")?.value || "").trim();
    const goal = (document.getElementById("inpGoal")?.value || "").trim();

    return {
      context,
      transcript_raw: transcriptFinal.trim(),
      duration_sec: Math.max(1, Math.ceil((transcriptFinal.trim().length || 1) / 12)),
      silence_pct: transcriptFinal.trim() ? 15 : 40,
      pause_count: transcriptFinal.trim() ? 2 : 0,
      mean_pause_ms: transcriptFinal.trim() ? 180 : 0,
      source_text: goal,
      timeline_events: [],
      uploaded_file_name: ""
    };
  }

  async function sendToCRS() {
    const payload = buildPayload();

    LAB.setValue("canalAtual", "SpeechRecognition → fetch → CRS");
    LAB.setValue("receptorAtual", "endpoint /api/crs/analisar + TTS");
    LAB.setValue("payloadAtual", JSON.stringify(payload, null, 2));
    LAB.setValue("ultimoEvento", "enviando transcrição para o CRS");

    LAB.appendLog(`Payload enviado ao CRS: ${JSON.stringify(payload)}`);

    const t0 = performance.now();
    const response = await fetchWithTimeout(URL_CRS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const elapsed = Math.round(performance.now() - t0);
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

    const summary =
      json?.user_report?.summary ||
      "O CRS respondeu, mas não trouxe summary.";

    setText("textoResposta", summary);
    setText("respostaAtual", JSON.stringify(json, null, 2));
    setText("statusGeral", `loop concluído (${elapsed}ms)`);
    setText("ultimoEvento", "resposta do CRS recebida");

    LAB.appendLog(`CRS respondeu em ${elapsed}ms`);
    LAB.appendLog(`Summary recebido: ${summary}`);

    speakSummary(summary);

    return json;
  }

  function speakSummary(text) {
    if (!text || !("speechSynthesis" in window)) return;

    stopTTS();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onstart = () => {
      ttsActive = true;
      LAB.appendLog("TTS iniciou leitura da resposta");
    };

    utter.onend = () => {
      ttsActive = false;
      LAB.appendLog("TTS encerrou leitura da resposta");
    };

    utter.onerror = (event) => {
      if (event.error === "interrupted") {
        LAB.appendLog("TTS interrompido manualmente", "warn");
        return;
      }
      LAB.setError(new Error(`speechSynthesis: ${event.error || "erro desconhecido"}`));
    };

    window.speechSynthesis.speak(utter);
  }

  function startLoop() {
    try {
      const RecognitionCtor = getRecognitionCtor();

      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnIniciarLoop");
      LAB.setValue("canalAtual", "DOM → SpeechRecognition");
      LAB.setValue("receptorAtual", "campo #textoTranscrito");
      LAB.setValue("ultimoEvento", "checando suporte de reconhecimento");

      LAB.appendLog("Emissor acionado: botão #btnIniciarLoop");

      if (!RecognitionCtor) {
        throw new Error("SpeechRecognition não disponível neste navegador");
      }

      if (running) {
        LAB.appendLog("Reconhecimento já estava ativo", "warn");
        return;
      }

      transcriptFinal = "";
      setText("textoTranscrito", "—");
      setText("textoResposta", "—");

      recognition = new RecognitionCtor();
      recognition.lang = "pt-BR";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        running = true;
        setText("statusGeral", "escutando");
        setText("ultimoEvento", "reconhecimento iniciado");
        LAB.appendLog("Canal SpeechRecognition iniciado");
      };

      recognition.onresult = (event) => {
        let textoFinal = "";
        let textoParcial = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trecho = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            textoFinal += trecho + " ";
          } else {
            textoParcial += trecho + " ";
          }
        }

        if (textoFinal.trim()) {
          transcriptFinal += `${textoFinal.trim()} `;
        }

        const textoAtual = `${transcriptFinal}${textoParcial}`.trim();

        setText("textoTranscrito", textoAtual || "—");
        setText("ultimoEvento", "texto reconhecido");
      };

      recognition.onerror = (event) => {
        setText("statusGeral", "falhou");
        LAB.setError(new Error(`SpeechRecognition: ${event.error}`));
      };

      recognition.onend = async () => {
        running = false;
        setText("statusGeral", "processando");
        setText("ultimoEvento", "reconhecimento encerrado");
        LAB.appendLog("SpeechRecognition encerrou");

        if (!transcriptFinal.trim()) {
          setText("statusGeral", "sem texto");
          LAB.appendLog("Nenhum texto final reconhecido", "warn");
          return;
        }

        try {
          await sendToCRS();
        } catch (error) {
          setText("statusGeral", "falhou");
          LAB.setError(error);
        }
      };

      recognition.start();
    } catch (error) {
      setText("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function stopLoop() {
    LAB.setValue("emissorAtual", "botão #btnPararLoop");
    LAB.setValue("ultimoEvento", "encerrando escuta");
    LAB.appendLog("Emissor acionado: botão #btnPararLoop");
    stopRecognitionInternal(false);
  }

  function replayResponse() {
    const summary = document.getElementById("textoResposta")?.textContent || "";
    if (!summary || summary === "—") {
      LAB.appendLog("Nenhuma resposta disponível para leitura", "warn");
      return;
    }
    speakSummary(summary);
  }

  function resetTest() {
    resetState();
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    resetState();
    LAB.appendLog("Página carregada. Sistema pronto para teste de loop mínimo.");

    document.getElementById("btnIniciarLoop")?.addEventListener("click", startLoop);
    document.getElementById("btnPararLoop")?.addEventListener("click", stopLoop);
    document.getElementById("btnLerResposta")?.addEventListener("click", replayResponse);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTest);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();