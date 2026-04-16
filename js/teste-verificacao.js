(function () {

  const el = (id) => document.getElementById(id);

  const statusGeral = el("statusGeral");
  const logBox = el("logBox");
  const respostaAtual = el("respostaAtual");

  function log(msg) {
    const t = new Date().toLocaleTimeString("pt-BR");
    logBox.textContent += `[${t}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
    console.log("[LAB]", msg);
  }

  function setStatus(msg) {
    statusGeral.textContent = msg;
    log("STATUS: " + msg);
  }

  function setResumo(msg) {
    respostaAtual.textContent = msg || "—";
  }

  function limpar() {
    logBox.textContent = "";
    setStatus("aguardando");
    setResumo("—");
  }

  // =====================================
  // TESTE TÚNEL (PADRÃO FINAL)
  // =====================================

  async function testTunnel() {
    log("🔌 testando túnel...");

    const health = await window.ELAYON_TUNNEL.healthcheck();

    log(JSON.stringify(health, null, 2));

    if (!health.crs) throw new Error("CRS offline");
    if (!health.mic) throw new Error("Microfone indisponível");
    if (!health.tts) throw new Error("TTS indisponível");

    log("✔ túnel íntegro");
    return health;
  }

  // =====================================
  // TESTE CRS (REAL)
  // =====================================

  async function testCRS() {
    log("📡 testando CRS...");

    const payload = window.ELAYON_TUNNEL.crs.buildPayload(
      "teste de verificação do sistema"
    );

    const res = await window.ELAYON_TUNNEL.crs.analyze(payload);

    log("✔ CRS respondeu");

    const resumo =
      res?.user_report?.summary || "CRS respondeu sem resumo";

    setResumo(resumo);

    return res;
  }

  // =====================================
  // TESTE LOOP REAL
  // =====================================

  async function testLoop() {
    log("🔁 testando loop real...");

    const result = await window.ELAYON_TUNNEL.loop.runStep({
      instruction: "Diga algo para teste",
      context: "teste loop"
    });

    log("✔ loop executado");

    setResumo(result.analysis?.user_report?.summary || "Loop OK");

    return result;
  }

  // =====================================
  // EXECUÇÃO PRINCIPAL
  // =====================================

  async function executar() {
    limpar();
    setStatus("verificando");

    try {
      await testTunnel();
      await testCRS();

      setStatus("sistema íntegro");

    } catch (e) {
      setStatus("falha detectada");
      log("ERRO: " + e.message);
    }
  }

  // =====================================
  // BOTÕES
  // =====================================

  document.getElementById("btnExecutarVerificacao")
    ?.addEventListener("click", executar);

  document.getElementById("btnResetarTeste")
    ?.addEventListener("click", limpar);

  log("Sistema pronto para verificação.");

})();