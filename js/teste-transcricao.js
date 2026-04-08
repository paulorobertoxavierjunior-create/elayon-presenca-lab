(function () {
  const LAB = window.ELAYON_LAB;

  let recognition = null;
  let running = false;

  function getRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function setIdle() {
    LAB.resetDiagnostics();
    LAB.setValue("statusGeral", "aguardando");
    LAB.setValue("textoTranscrito", "—");
    LAB.setValue("respostaAtual", "—");
  }

  function pararTranscricaoInterna(logEvent = true) {
    if (recognition && running) {
      try {
        recognition.stop();
      } catch {}
    }

    running = false;

    if (logEvent) {
      LAB.appendLog("Transcrição interrompida");
    }
  }

  function iniciarTranscricao() {
    try {
      const RecognitionCtor = getRecognitionCtor();

      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnIniciarTranscricao");
      LAB.setValue("canalAtual", "DOM → JavaScript → SpeechRecognition");
      LAB.setValue("receptorAtual", "campo #textoTranscrito");
      LAB.setValue(
        "payloadAtual",
        JSON.stringify(
          {
            lang: "pt-BR",
            interimResults: true,
            continuous: true
          },
          null,
          2
        )
      );
      LAB.setValue("ultimoEvento", "checando suporte de reconhecimento");
      LAB.appendLog("Emissor acionado: botão #btnIniciarTranscricao");

      if (!RecognitionCtor) {
        throw new Error("SpeechRecognition não disponível neste navegador");
      }

      if (running) {
        LAB.appendLog("Reconhecimento já estava ativo", "warn");
        return;
      }

      recognition = new RecognitionCtor();
      recognition.lang = "pt-BR";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        running = true;
        LAB.setValue("statusGeral", "transcrevendo");
        LAB.setValue("ultimoEvento", "reconhecimento iniciado");
        LAB.appendLog("Canal de transcrição iniciado");
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

        const texto = `${textoFinal}${textoParcial}`.trim();

        LAB.setValue("textoTranscrito", texto || "—");
        LAB.setValue(
          "respostaAtual",
          JSON.stringify(
            {
              texto,
              final: textoFinal.trim(),
              parcial: textoParcial.trim()
            },
            null,
            2
          )
        );
        LAB.setValue("ultimoEvento", "texto reconhecido");
      };

      recognition.onerror = (event) => {
        LAB.setValue("statusGeral", "falhou");
        LAB.setError(new Error(`SpeechRecognition: ${event.error}`));
      };

      recognition.onend = () => {
        running = false;
        LAB.setValue("statusGeral", "parado");
        LAB.setValue("ultimoEvento", "reconhecimento encerrado");
        LAB.appendLog("Reconhecimento encerrado");
      };

      recognition.start();
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function pararTranscricao() {
    LAB.setValue("emissorAtual", "botão #btnPararTranscricao");
    LAB.setValue("ultimoEvento", "encerrando reconhecimento");
    LAB.appendLog("Emissor acionado: botão #btnPararTranscricao");
    pararTranscricaoInterna(false);
  }

  function resetTeste() {
    pararTranscricaoInterna(false);
    setIdle();
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setIdle();
    LAB.appendLog("Página carregada. Sistema pronto para teste de transcrição.");

    document.getElementById("btnIniciarTranscricao")?.addEventListener("click", iniciarTranscricao);
    document.getElementById("btnPararTranscricao")?.addEventListener("click", pararTranscricao);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTeste);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();