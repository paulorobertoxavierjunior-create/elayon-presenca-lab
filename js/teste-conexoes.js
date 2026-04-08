(function () {
  const LAB = window.ELAYON_LAB;

  const URL_RENDER_HEALTH = "https://nucleo-crs-elayon.onrender.com/health";
  const URL_CRS_ANALISAR = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";

  function setConnectionValue(id, value) {
    LAB.setValue(id, value);
  }

  function resetConnections() {
    setConnectionValue("chkFront", "—");
    setConnectionValue("chkJS", "—");
    setConnectionValue("chkConfig", "—");
    setConnectionValue("chkRender", "—");
    setConnectionValue("chkCRS", "—");
    setConnectionValue("chkMic", "—");
    setConnectionValue("chkTTS", "—");
    LAB.appendLog("Reset das conexões executado", "warn");
  }

  async function checkFront() {
    setConnectionValue("chkFront", "OK");
    LAB.appendLog("Front carregado com sucesso");
  }

  async function checkJS() {
    if (!window.ELAYON_LAB) {
      throw new Error("base.js não carregado");
    }
    setConnectionValue("chkJS", "OK");
    LAB.appendLog("JS base carregado");
  }

  async function checkConfig() {
    if (window.ELAYON_CONFIG) {
      setConnectionValue("chkConfig", "OK");
      LAB.appendLog("Config encontrado no window.ELAYON_CONFIG");
      return;
    }

    setConnectionValue("chkConfig", "AUSENTE");
    LAB.appendLog("Config ausente neste laboratório", "warn");
  }

  async function checkMic() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setConnectionValue("chkMic", "DISPONÍVEL");
      LAB.appendLog("API de microfone disponível");
      return;
    }

    throw new Error("getUserMedia não disponível neste navegador");
  }

  async function checkTTS() {
    if ("speechSynthesis" in window) {
      setConnectionValue("chkTTS", "DISPONÍVEL");
      LAB.appendLog("speechSynthesis disponível");
      return;
    }

    throw new Error("speechSynthesis não disponível neste navegador");
  }

  async function checkRender() {
    LAB.appendLog(`Testando Render em ${URL_RENDER_HEALTH}`);

    const t0 = performance.now();
    const response = await fetch(URL_RENDER_HEALTH, {
      method: "GET"
    });
    const elapsed = Math.round(performance.now() - t0);

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Render falhou com HTTP ${response.status}: ${text}`);
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Render respondeu, mas não retornou JSON válido");
    }

    setConnectionValue("chkRender", `OK (${elapsed}ms)`);
    LAB.appendLog(`Render respondeu em ${elapsed}ms`);
    LAB.appendLog(`Render payload: ${JSON.stringify(json)}`);
  }

  async function checkCRS() {
    const payload = {
      context: "teste de conexao",
      transcript_raw: "fala de teste enviada pelo laboratorio",
      duration_sec: 3,
      silence_pct: 12,
      pause_count: 1,
      mean_pause_ms: 150,
      source_text: "checagem laboratorial",
      timeline_events: [],
      uploaded_file_name: ""
    };

    LAB.appendLog(`Testando CRS em ${URL_CRS_ANALISAR}`);
    LAB.appendLog(`Payload CRS: ${JSON.stringify(payload)}`);

    const t0 = performance.now();
    const response = await fetch(URL_CRS_ANALISAR, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const elapsed = Math.round(performance.now() - t0);

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`CRS falhou com HTTP ${response.status}: ${text}`);
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("CRS respondeu, mas não retornou JSON válido");
    }

    setConnectionValue("chkCRS", `OK (${elapsed}ms)`);
    LAB.appendLog(`CRS respondeu em ${elapsed}ms`);
    LAB.appendLog(`CRS retorno: ${JSON.stringify(json)}`);
  }

  async function runChecklist() {
    LAB.appendLog("Iniciando checklist geral");

    try {
      await checkFront();
    } catch (error) {
      setConnectionValue("chkFront", "ERRO");
      LAB.setError(error);
    }

    try {
      await checkJS();
    } catch (error) {
      setConnectionValue("chkJS", "ERRO");
      LAB.setError(error);
    }

    try {
      await checkConfig();
    } catch (error) {
      setConnectionValue("chkConfig", "ERRO");
      LAB.setError(error);
    }

    try {
      await checkMic();
    } catch (error) {
      setConnectionValue("chkMic", "ERRO");
      LAB.setError(error);
    }

    try {
      await checkTTS();
    } catch (error) {
      setConnectionValue("chkTTS", "ERRO");
      LAB.setError(error);
    }

    try {
      await checkRender();
    } catch (error) {
      setConnectionValue("chkRender", "FALHOU");
      LAB.setError(error);
    }

    try {
      await checkCRS();
    } catch (error) {
      setConnectionValue("chkCRS", "FALHOU");
      LAB.setError(error);
    }

    LAB.appendLog("Checklist finalizado");
  }

  document.addEventListener("DOMContentLoaded", () => {
    LAB.appendLog("Painel de conexões carregado");

    document.getElementById("btnCheck")?.addEventListener("click", runChecklist);
    document.getElementById("btnReset")?.addEventListener("click", resetConnections);
    document.getElementById("btnClear")?.addEventListener("click", LAB.clearLog);
  });
})();