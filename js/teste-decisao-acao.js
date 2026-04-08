const logBox = document.getElementById("logBox");
const statusUI = document.getElementById("status");
const payloadUI = document.getElementById("payloadUI");
const acaoCalculadaUI = document.getElementById("acaoCalculada");

const outResumo = document.getElementById("outResumo");
const outInterpretacao = document.getElementById("outInterpretacao");
const outAcao = document.getElementById("outAcao");

let ultimaAcao = null;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

function normalizar(txt) {
  return (txt || "").trim().toLowerCase();
}

function gerarDecisao() {
  const ambiente = document.getElementById("inputAmbiente").value.trim();
  const estado = document.getElementById("inputEstado").value.trim();
  const intencao = document.getElementById("inputIntencao").value.trim();
  const silencio = Number(document.getElementById("inputSilencio").value || 0);
  const pausas = Number(document.getElementById("inputPausas").value || 0);

  const payload = { ambiente, estado, intencao, silencio_pct: silencio, pause_count: pausas };
  payloadUI.innerText = JSON.stringify(payload, null, 2);

  const ambienteN = normalizar(ambiente);
  const estadoN = normalizar(estado);
  const intencaoN = normalizar(intencao);

  let estadoTemporal = "fluxo contínuo";
  if (silencio > 40) estadoTemporal = "mente dispersa";
  else if (pausas > 6) estadoTemporal = "pensamento fragmentado";

  let resumo = "Decisão gerada com sucesso.";
  let interpretacao = `Ambiente: ${ambiente || "não informado"}. Estado declarado: ${estado || "não informado"}. Estado temporal: ${estadoTemporal}. Intenção: ${intencao || "não informada"}.`;
  let acao = "Registrar contexto e aguardar próxima instrução.";
  let tipoAcao = "nenhuma";

  if (ambienteN.includes("televis") && intencaoN.includes("ligar")) {
    acao = "Abrir apoio para ligar a televisão.";
    tipoAcao = "abrir_tv";
  } else if (intencaoN.includes("dormir") || estadoN.includes("não consigo dormir")) {
    acao = "Ativar protocolo de desaceleração e descanso.";
    tipoAcao = "modo_descanso";
  } else if (estadoN.includes("focar") || intencaoN.includes("criação")) {
    acao = "Ativar modo foco e reduzir distrações.";
    tipoAcao = "modo_foco";
  }

  ultimaAcao = tipoAcao;

  statusUI.innerText = "decisão pronta";
  acaoCalculadaUI.innerText = tipoAcao;
  outResumo.innerText = resumo;
  outInterpretacao.innerText = interpretacao;
  outAcao.innerText = acao;

  log("payload montado");
  log(`decisão gerada: ${tipoAcao}`);
}

function executarAcao() {
  if (!ultimaAcao) {
    log("nenhuma ação pronta para executar");
    return;
  }

  log(`executando ação: ${ultimaAcao}`);

  if (ultimaAcao === "abrir_tv") {
    window.open("https://www.google.com/search?q=controle+remoto+tv", "_blank");
  } else if (ultimaAcao === "modo_descanso") {
    alert("Modo descanso: reduzir luz, sair de telas e desacelerar respiração.");
  } else if (ultimaAcao === "modo_foco") {
    alert("Modo foco: manter contexto atual, reduzir ruído e sustentar a tarefa.");
  } else {
    alert("Ação registrada, sem execução automática.");
  }

  statusUI.innerText = "ação executada";
}

document.getElementById("btnProcessar").onclick = gerarDecisao;
document.getElementById("btnExecutarAcao").onclick = executarAcao;

document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

document.getElementById("btnResetar").onclick = () => {
  statusUI.innerText = "aguardando";
  payloadUI.innerText = "—";
  acaoCalculadaUI.innerText = "—";
  outResumo.innerText = "—";
  outInterpretacao.innerText = "—";
  outAcao.innerText = "—";
  logBox.innerText = "";
  ultimaAcao = null;
};

log("sistema pronto para teste 9.5");