(function () {
  const el = (id) => document.getElementById(id);

  const statusGeral = el("statusGeral");
  const chkFront = el("chkFront");
  const chkJS = el("chkJS");
  const chkConfig = el("chkConfig");
  const chkMic = el("chkMic");
  const chkTTS = el("chkTTS");
  const chkRender = el("chkRender");
  const chkCRS = el("chkCRS");
  const chkLoop = el("chkLoop");
  const ultimoEvento = el("ultimoEvento");
  const ultimoErro = el("ultimoErro");
  const respostaAtual = el("respostaAtual");
  const logBox = el("logBox");

  const btnExecutarVerificacao = el("btnExecutarVerificacao");
  const btnResetarTeste = el("btnResetarTeste");
  const btnLimparLog = el("btnLimparLog");

  // Já deixei evidente no código:
  // ajuste estes dois endpoints quando quiser apontar para outro ambiente.
  const RENDER_HEALTH_URL = "https://nucleo-crs-elayon.onrender.com/health";
  const CRS_URL = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";

  function log(msg) {
    const t = new Date().toLocaleTimeString("pt-BR");
    logBox.textContent += `[${t}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
    console.log("[TESTE 8]", msg);
  }

  function setErro(msg) {
    ultimoErro.textContent = msg || "nenhum";
    if (msg && msg !== "nenhum") log(`ERRO: ${msg}`);
  }

  function setEvento(msg) {
    ultimoEvento.textContent = msg || "nenhum";
    if (msg) log(msg);
  }

  function setResumo(msg) {
    respostaAtual.textContent = msg || "—";
  }

  function resetPainel() {
    statusGeral.textContent = "aguardando";
    chkFront.textContent = "—";
    chkJS.textContent = "—";
    chkConfig.textContent = "—";
    chkMic.textContent = "—";
    chkTTS.textContent = "—";
    chkRender.textContent = "—";
    chkCRS.textContent = "—";
    chkLoop.textContent = "—";
    ultimoEvento.textContent = "nenhum";
    ultimoErro.textContent = "nenhum";
    respostaAtual.textContent = "—";
    log("Painel resetado");
  }

  function hasBaseJS() {
    try {
      return typeof window !== "undefined";
    } catch {
      return false;
    }
  }

  function hasConfig() {
    return !!window.ELAYON_CONFIG;
  }

  async function testRender() {
    const t0 = performance.now();

    const resp = await fetch(RENDER_HEALTH_URL, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const dt = Math.round(performance.now() - t0);

    if (!resp.ok) {
      throw new Error(`Render retornou HTTP ${resp.status}`);
    }

    const data = await resp.json();
    chkRender.textContent = `OK (${dt}ms)`;
    log(`Render OK em ${dt}ms`);
    log(`Render payload: ${JSON.stringify(data)}`);
    return { ok: true, data, ms: dt };
  }

  async function testCRS() {
    const payload = {
      context: "teste de verificacao continua",
      transcript_raw: "fala de teste enviada pelo painel de verificacao",
      duration_sec: 4,
      silence_pct: 18,
      pause_count: 2,
      mean_pause_ms: 180,
      source_text: "checagem automatizada",
      timeline_events: [],
      uploaded_file_name: ""
    };

    const t0 = performance.now();

    const resp = await fetch(CRS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const dt = Math.round(performance.now() - t0);

    if (!resp.ok) {
      throw new Error(`CRS retornou HTTP ${resp.status}`);
    }

    const data = await resp.json();
    chkCRS.textContent = `OK (${dt}ms)`;
    log(`CRS OK em ${dt}ms`);
    log(`CRS payload: ${JSON.stringify(payload)}`);
    log(`CRS retorno: ${JSON.stringify(data)}`);

    const summary = data?.user_report?.summary || "Sessão processada com sucesso.";
    setResumo(summary);

    return { ok: true, data, ms: dt, summary };
  }

  function testMicCapability() {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    chkMic.textContent = supported ? "DISPONÍVEL" : "INDISPONÍVEL";
    log(supported ? "Microfone disponível" : "Microfone indisponível");
    return supported;
  }

  function testTTSCapability() {
    const supported = "speechSynthesis" in window;
    chkTTS.textContent = supported ? "DISPONÍVEL" : "INDISPONÍVEL";
    log(supported ? "TTS disponível" : "TTS indisponível");
    return supported;
  }

  function testFront() {
    chkFront.textContent = "OK";
    log("Front carregado");
    return true;
  }

  function testJS() {
    const ok = hasBaseJS();
    chkJS.textContent = ok ? "OK" : "FALHA";
    log(ok ? "JS base ativo" : "JS base indisponível");
    return ok;
  }

  function testConfig() {
    const ok = hasConfig();
    chkConfig.textContent = ok ? "OK" : "AUSENTE";
    log(ok ? "Config carregada" : "Config ausente no lab");
    return ok;
  }

  function testLoopCapability() {
    // Já deixei evidente:
    // aqui estamos validando só a disponibilidade lógica do ciclo mínimo.
    // Não executa o loop, só marca que a base existe para fazê-lo depois.
    chkLoop.textContent = "PRONTO";
    log("Capacidade de loop mínimo disponível");
    return true;
  }

  async function executarVerificacao() {
    setErro("nenhum");
    setEvento("Verificação contínua iniciada");
    setResumo("Executando checks do sistema...");
    statusGeral.textContent = "verificando";

    let falhas = 0;

    try {
      testFront();
    } catch (e) {
      falhas++;
      chkFront.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      testJS();
    } catch (e) {
      falhas++;
      chkJS.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      testConfig();
    } catch (e) {
      falhas++;
      chkConfig.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      const micOk = testMicCapability();
      if (!micOk) falhas++;
    } catch (e) {
      falhas++;
      chkMic.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      const ttsOk = testTTSCapability();
      if (!ttsOk) falhas++;
    } catch (e) {
      falhas++;
      chkTTS.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      await testRender();
    } catch (e) {
      falhas++;
      chkRender.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      await testCRS();
    } catch (e) {
      falhas++;
      chkCRS.textContent = "FALHA";
      setErro(e.message);
    }

    try {
      testLoopCapability();
    } catch (e) {
      falhas++;
      chkLoop.textContent = "FALHA";
      setErro(e.message);
    }

    if (falhas === 0) {
      statusGeral.textContent = "sistema íntegro";
      setEvento("Verificação concluída sem falhas");
    } else {
      statusGeral.textContent = `falhas detectadas (${falhas})`;
      setEvento(`Verificação concluída com ${falhas} falha(s)`);
    }
  }

  btnExecutarVerificacao?.addEventListener("click", executarVerificacao);
  btnResetarTeste?.addEventListener("click", resetPainel);
  btnLimparLog?.addEventListener("click", () => {
    logBox.textContent = "";
    log("Logs limpos");
  });

  resetPainel();
  log("Página carregada. Sistema pronto para verificação contínua.");
})();