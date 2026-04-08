(function () {
  const LAB = window.ELAYON_LAB;

  let currentStream = null;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationId = null;
  let lastLoggedAt = 0;

  function setVolumeUI(value) {
    const volumeEl = document.getElementById("volumeAtual");
    const barEl = document.getElementById("barraVolume");

    if (volumeEl) volumeEl.textContent = String(value);
    if (barEl) barEl.style.width = `${value}%`;
  }

  function getAverageVolume(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return Math.max(0, Math.min(100, Math.round(sum / arr.length)));
  }

  function renderLoop() {
    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);
    const volume = getAverageVolume(dataArray);

    setVolumeUI(volume);
    LAB.setValue("respostaAtual", JSON.stringify({ volume }, null, 2));
    LAB.setValue("ultimoEvento", `volume atualizado: ${volume}`);

    const now = Date.now();
    if (now - lastLoggedAt > 1200) {
      LAB.appendLog(`Leitura de volume: ${volume}`);
      lastLoggedAt = now;
    }

    animationId = requestAnimationFrame(renderLoop);
  }

  async function iniciarVolume() {
    try {
      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnIniciarVolume");
      LAB.setValue("canalAtual", "DOM → JavaScript → getUserMedia → AudioContext → AnalyserNode");
      LAB.setValue("receptorAtual", "barra de volume + leitura DOM");
      LAB.setValue("payloadAtual", JSON.stringify({ audio: true, mode: "volume_live" }, null, 2));
      LAB.setValue("ultimoEvento", "solicitando captura contínua");
      LAB.appendLog("Emissor acionado: botão #btnIniciarVolume");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia não disponível neste navegador");
      }

      currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(currentStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      LAB.setValue("statusGeral", "captando volume");
      LAB.setValue("ultimoEvento", "captura contínua iniciada");
      LAB.appendLog("Permissão concedida");
      LAB.appendLog("Canal de análise aberto com AnalyserNode");
      LAB.appendLog("Renderização de volume iniciada");

      renderLoop();
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  async function pararVolume() {
    try {
      LAB.setValue("emissorAtual", "botão #btnPararVolume");
      LAB.setValue("ultimoEvento", "encerrando captura");
      LAB.appendLog("Emissor acionado: botão #btnPararVolume");

      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
      }

      if (audioContext && audioContext.state !== "closed") {
        await audioContext.close();
      }

      audioContext = null;
      analyser = null;
      dataArray = null;

      setVolumeUI(0);
      LAB.setValue("statusGeral", "volume parado");
      LAB.setValue("respostaAtual", "captura encerrada");
      LAB.setValue("ultimoEvento", "captura encerrada");
      LAB.appendLog("Captura encerrada com sucesso");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou ao parar");
      LAB.setError(error);
    }
  }

  async function resetTeste() {
    try {
      await pararVolume();
    } catch {}

    LAB.resetDiagnostics();
    setVolumeUI(0);
    LAB.setValue("statusGeral", "aguardando");
    LAB.setValue("respostaAtual", "—");
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    LAB.resetDiagnostics();
    setVolumeUI(0);
    LAB.appendLog("Página carregada. Sistema pronto para teste de volume.");

    document.getElementById("btnIniciarVolume")?.addEventListener("click", iniciarVolume);
    document.getElementById("btnPararVolume")?.addEventListener("click", pararVolume);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTeste);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();