(function () {
  const LAB = window.ELAYON_LAB;

  const URL_RENDER_HEALTH = "https://nucleo-crs-elayon.onrender.com/health";
  const URL_CRS_ANALISAR = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";
  const TIMEOUT_MS = 12000;

  function set(id, value) {
    LAB.setValue(id, value);
  }

  function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
  }

  function resetPainel() {
    set("statusGeral", "aguardando");
    set("chkFront", "—");
    set("chkJS", "—");
    set("chkConfig", "—");
    set("chkMic", "—");
    set("chkTTS", "—");
    set("chkRender", "—");
    set("chkCRS", "—");
    set("chkLoop", "—");
    set("ultimoEvento", "nenhum");
    set("ultimoErro", "nenhum");
    set("respostaAtual", "—");
    LAB.appendLog("Painel resetado", "warn");
  }

  async function checkFront() {
    set("chkFront", "OK");
    LAB.appendLog("Front carregado");
  }

  async function checkJS() {
    if (!window.ELAYON_LAB) throw new Error("base.js não carregado");
    set("chkJS", "OK");
    LAB.appendLog("JS base ativo");
  }

  async function checkConfig() {
    if (window.ELAYON_CONFIG) {
      set("chkConfig", "OK");
      LAB.appendLog("Config encontrado");
    } else {
      set("chkConfig", "AUSENTE");
      LAB.appendLog("Config ausente no lab", "warn");
    }
  }

  async function checkMic() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      set("chkMic", "DISPONÍVEL");
      LAB.appendLog("Microfone disponível");
      return;
    }
    throw new Error("getUserMedia não disponível");
  }

  async function checkTTS() {
    if ("speechSynthesis" in window) {
      set("chkTTS", "DISPONÍVEL");
      LAB.appendLog("TTS disponível");
      return;
    }
    throw new Error("speechSynthesis não disponível");
  }

  async function checkRender() {
    const t0 = performance.now();
    const response = await fetchWithTimeout(URL_RENDER_HEALTH, { method: "GET" });
    const elapsed = Math.round(performance.now() - t0);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Render HTTP ${response.status}: ${text}`);
    }

    JSON.parse(text);
    set("chkRender", `OK (${elapsed}ms)`);
    LAB.appendLog(`Render OK em ${elapsed}ms`);
  }

  async function checkCRS() {
    const payload = {
      context: "verificacao continua",
      transcript_raw: "teste rapido do modulo de verificacao",
      duration_sec: 2,
      silence_pct: 10,
      pause_count: 1,
      mean_pause_ms: 120,
      source_text: "diagnostico",
      timeline_events: [],
      uploaded_file_name: ""
    };

    const t0 = performance.now();
    const response = await fetchWithTimeout(URL_CRS_ANALISAR, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const elapsed = Math.round(performance.now() - t0);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`CRS HTTP ${response.status}: ${text}`);
    }

    const json = JSON.parse(text);
    const summary = json?.user_report?.summary || "CRS respondeu sem summary";

    set("chkCRS", `OK (${elapsed}ms)`);
    set("respostaAtual", summary);
    LAB.appendLog(`CRS OK em ${elapsed}ms`);
    LAB.appendLog(`Summary: ${summary}`);
  }

  async function checkLoopCapability() {
    const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasTTS = "speechSynthesis" in window;
    const hasFetch = typeof fetch === "function";

    if (hasRecognition && hasTTS && hasFetch) {
      set("chkLoop", "PRONTO");
      LAB.appendLog("Capacidade de loop mínimo disponível");
      return;
    }

    set("chkLoop", "PARCIAL");
    LAB.appendLog("Capacidade de loop mínimo parcial", "warn");
  }

  async function executarVerificacao() {
    set("statusGeral", "executando");
    set("ultimoEvento", "iniciando verificação");
    LAB.appendLog("Verificação contínua iniciada");

    let failures = 0;

    const checks = [
      checkFront,
      checkJS,
      checkConfig,
      checkMic,
      checkTTS,
      checkRender,
      checkCRS,
      checkLoopCapability
    ];

    for (const fn of checks) {
      try {
        await fn();
      } catch (error) {
        failures++;
        LAB.setError(error);
      }
    }

    if (failures === 0) {
      set("statusGeral", "sistema íntegro");
      set("ultimoEvento", "verificação concluída sem falhas");
      LAB.appendLog("Verificação concluída sem falhas");
    } else {
      set("statusGeral", `concluído com ${failures} falha(s)`);
      set("ultimoEvento", "verificação concluída com falhas");
      LAB.appendLog(`Verificação concluída com ${failures} falha(s)`, "err");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    resetPainel();
    LAB.appendLog("Página carregada. Sistema pronto para verificação contínua.");

    document.getElementById("btnExecutarVerificacao")?.addEventListener("click", executarVerificacao);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetPainel);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();