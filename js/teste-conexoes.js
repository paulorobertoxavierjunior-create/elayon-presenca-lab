(function () {
  const LAB = window.ELAYON_LAB;

  async function checkAll() {
    LAB.appendLog("Iniciando checklist completo");

    // FRONT
    try {
      LAB.setValue("chkFront", "OK");
      LAB.appendLog("Front carregado");
    } catch (e) {
      LAB.setValue("chkFront", "ERRO");
      LAB.setError(e);
    }

    // JS BASE
    try {
      if (window.ELAYON_LAB) {
        LAB.setValue("chkJS", "OK");
        LAB.appendLog("JS base ativo");
      } else {
        throw new Error("base.js não carregado");
      }
    } catch (e) {
      LAB.setValue("chkJS", "ERRO");
      LAB.setError(e);
    }

    // CONFIG
    try {
      if (window.ELAYON_CONFIG) {
        LAB.setValue("chkConfig", "OK");
        LAB.appendLog("Config encontrado");
      } else {
        LAB.setValue("chkConfig", "AUSENTE");
        LAB.appendLog("Config não definido", "warn");
      }
    } catch (e) {
      LAB.setValue("chkConfig", "ERRO");
      LAB.setError(e);
    }

    // MICROFONE
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        LAB.setValue("chkMic", "DISPONÍVEL");
        LAB.appendLog("Microfone disponível");
      } else {
        throw new Error("getUserMedia indisponível");
      }
    } catch (e) {
      LAB.setValue("chkMic", "ERRO");
      LAB.setError(e);
    }

    // TTS
    try {
      if ("speechSynthesis" in window) {
        LAB.setValue("chkTTS", "DISPONÍVEL");
        LAB.appendLog("TTS disponível");
      } else {
        throw new Error("TTS não suportado");
      }
    } catch (e) {
      LAB.setValue("chkTTS", "ERRO");
      LAB.setError(e);
    }

    // RENDER (ajusta URL depois)
    try {
      const t0 = Date.now();

      const res = await fetch("https://SEU-RENDER.onrender.com/health");

      const t1 = Date.now();

      if (res.ok) {
        LAB.setValue("chkRender", `OK (${t1 - t0}ms)`);
        LAB.appendLog("Render respondeu OK");
      } else {
        throw new Error("Render respondeu erro");
      }

    } catch (e) {
      LAB.setValue("chkRender", "FALHOU");
      LAB.setError(e);
    }

    // CRS (ajusta URL depois)
    try {
      const res = await fetch("https://SEU-CRS/api/ping");

      if (res.ok) {
        const json = await res.json();
        LAB.setValue("chkCRS", "OK");
        LAB.appendLog("CRS respondeu");
        LAB.appendLog(JSON.stringify(json));
      } else {
        throw new Error("CRS erro");
      }

    } catch (e) {
      LAB.setValue("chkCRS", "FALHOU");
      LAB.setError(e);
    }

    LAB.appendLog("Checklist finalizado");
  }

  function reset() {
    LAB.setValue("chkFront", "—");
    LAB.setValue("chkJS", "—");
    LAB.setValue("chkConfig", "—");
    LAB.setValue("chkRender", "—");
    LAB.setValue("chkCRS", "—");
    LAB.setValue("chkMic", "—");
    LAB.setValue("chkTTS", "—");

    LAB.appendLog("Reset executado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    LAB.appendLog("Painel de conexões pronto");

    document.getElementById("btnCheck")?.addEventListener("click", checkAll);
    document.getElementById("btnReset")?.addEventListener("click", reset);
    document.getElementById("btnClear")?.addEventListener("click", LAB.clearLog);
  });

})();