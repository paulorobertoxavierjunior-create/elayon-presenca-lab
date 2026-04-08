(function () {
  const LAB = window.ELAYON_LAB;
  let currentStream = null;

  function setIdle() {
    LAB.resetDiagnostics();
    LAB.setValue("statusGeral", "aguardando");
    LAB.setValue("respostaAtual", "microfone desligado");
  }

  async function ligarMicrofone() {
    try {
      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnLigarMic");
      LAB.setValue("canalAtual", "DOM → JavaScript → getUserMedia");
      LAB.setValue("receptorAtual", "MediaStream do navegador");
      LAB.setValue(
        "payloadAtual",
        JSON.stringify({ audio: true }, null, 2)
      );
      LAB.setValue("ultimoEvento", "solicitando permissão do microfone");

      LAB.appendLog("Emissor acionado: botão #btnLigarMic");
      LAB.appendLog("Canal aberto: DOM → JavaScript → getUserMedia");
      LAB.appendLog("Solicitando permissão de microfone");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia não disponível neste navegador");
      }

      currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const tracks = currentStream.getAudioTracks();
      const response = {
        ok: true,
        tracks: tracks.length,
        labels: tracks.map(track => track.label || "sem label")
      };

      LAB.setValue("statusGeral", "microfone ativo");
      LAB.setValue("respostaAtual", JSON.stringify(response, null, 2));
      LAB.setValue("ultimoEvento", "stream de microfone aberta");

      LAB.appendLog("Permissão concedida");
      LAB.appendLog(`Receptor ativo: MediaStream com ${tracks.length} track(s)`);
      LAB.appendLog("Microfone ativo com sucesso");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function desligarMicrofone() {
    try {
      LAB.setValue("emissorAtual", "botão #btnDesligarMic");
      LAB.setValue("ultimoEvento", "encerrando stream");

      LAB.appendLog("Emissor acionado: botão #btnDesligarMic");

      if (!currentStream) {
        LAB.appendLog("Nenhum stream ativo para desligar", "warn");
        LAB.setValue("statusGeral", "sem stream ativo");
        LAB.setValue("respostaAtual", "nenhum stream ativo");
        return;
      }

      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;

      LAB.setValue("statusGeral", "microfone desligado");
      LAB.setValue("respostaAtual", "stream encerrada com sucesso");
      LAB.setValue("ultimoEvento", "stream encerrada");

      LAB.appendLog("Tracks encerradas com sucesso");
      LAB.appendLog("Microfone desligado");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou ao desligar");
      LAB.setError(error);
    }
  }

  function resetTeste() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }

    setIdle();
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setIdle();
    LAB.appendLog("Página carregada. Sistema pronto para teste de microfone.");

    document.getElementById("btnLigarMic")?.addEventListener("click", ligarMicrofone);
    document.getElementById("btnDesligarMic")?.addEventListener("click", desligarMicrofone);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTeste);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();