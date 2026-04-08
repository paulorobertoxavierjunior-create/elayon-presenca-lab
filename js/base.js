(function () {
  function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString("pt-BR", { hour12: false });
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  }

  function appendLog(message, type = "ok") {
    const log = document.getElementById("logBox");
    if (!log) return;

    const line = document.createElement("div");
    line.className = type;
    line.textContent = `[${nowTime()}] ${message}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  function clearLog() {
    const log = document.getElementById("logBox");
    if (log) log.innerHTML = "";
  }

  function setError(error) {
    const msg = error?.message || String(error || "");
    setValue("ultimoErro", msg);
    appendLog(`ERRO: ${msg}`, "err");
  }

  function resetDiagnostics() {
    setValue("statusGeral", "aguardando");
    setValue("emissorAtual", "não acionado");
    setValue("canalAtual", "não definido");
    setValue("receptorAtual", "não definido");
    setValue("payloadAtual", "—");
    setValue("respostaAtual", "—");
    setValue("ultimoEvento", "nenhum");
    setValue("ultimoErro", "nenhum");
  }

  window.ELAYON_LAB = {
    setValue,
    appendLog,
    clearLog,
    setError,
    resetDiagnostics
  };
})();