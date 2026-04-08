(function () {
  const LAB = window.ELAYON_LAB;
  let currentUtterance = null;

  function setIdle() {
    LAB.resetDiagnostics();
    LAB.setValue("statusGeral", "aguardando");
    LAB.setValue("respostaAtual", "—");
  }

  function falarTexto() {
    try {
      if (!("speechSynthesis" in window)) {
        throw new Error("speechSynthesis não disponível neste navegador");
      }

      const texto = (document.getElementById("textoFalado")?.value || "").trim();

      if (!texto) {
        throw new Error("Digite um texto para o TTS falar");
      }

      window.speechSynthesis.cancel();

      currentUtterance = new SpeechSynthesisUtterance(texto);
      currentUtterance.lang = "pt-BR";
      currentUtterance.rate = 1;
      currentUtterance.pitch = 1;
      currentUtterance.volume = 1;

      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnFalarTexto");
      LAB.setValue("canalAtual", "DOM → JavaScript → speechSynthesis");
      LAB.setValue("receptorAtual", "motor TTS do navegador");
      LAB.setValue(
        "payloadAtual",
        JSON.stringify(
          {
            text: texto,
            lang: currentUtterance.lang,
            rate: currentUtterance.rate,
            pitch: currentUtterance.pitch,
            volume: currentUtterance.volume
          },
          null,
          2
        )
      );
      LAB.setValue("ultimoEvento", "preparando fala sintetizada");
      LAB.appendLog("Emissor acionado: botão #btnFalarTexto");

      currentUtterance.onstart = () => {
        LAB.setValue("statusGeral", "falando");
        LAB.setValue("ultimoEvento", "fala iniciada");
        LAB.setValue("respostaAtual", "fala iniciada com sucesso");
        LAB.appendLog("Canal TTS iniciado");
      };

      currentUtterance.onend = () => {
        LAB.setValue("statusGeral", "encerrado");
        LAB.setValue("ultimoEvento", "fala encerrada");
        LAB.setValue("respostaAtual", "fala concluída");
        LAB.appendLog("Fala sintetizada encerrada");
      };

      currentUtterance.onerror = (event) => {
        LAB.setValue("statusGeral", "falhou");
        LAB.setError(new Error(`speechSynthesis: ${event.error || "erro desconhecido"}`));
      };

      window.speechSynthesis.speak(currentUtterance);
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function pararFala() {
    try {
      LAB.setValue("emissorAtual", "botão #btnPararFala");
      LAB.setValue("ultimoEvento", "interrompendo fala");
      LAB.appendLog("Emissor acionado: botão #btnPararFala");

      window.speechSynthesis.cancel();

      LAB.setValue("statusGeral", "parado");
      LAB.setValue("respostaAtual", "fala interrompida manualmente");
      LAB.setValue("ultimoEvento", "fala interrompida");
      LAB.appendLog("Fala interrompida com sucesso");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function resetTeste() {
    try {
      window.speechSynthesis.cancel();
    } catch {}

    setIdle();
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setIdle();
    LAB.appendLog("Página carregada. Sistema pronto para teste de TTS.");

    document.getElementById("btnFalarTexto")?.addEventListener("click", falarTexto);
    document.getElementById("btnPararFala")?.addEventListener("click", pararFala);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTeste);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();