const logBox = document.getElementById("logBox");
const statusUI = document.getElementById("status");
const payloadAtualUI = document.getElementById("payloadAtual");
const leituraContinuidadeUI = document.getElementById("leituraContinuidade");
const proximaDirecaoUI = document.getElementById("proximaDirecao");
const memoriaCurtaUI = document.getElementById("memoriaCurta");

const KEY_MEMORIA = "elayon_memoria_curta_v96";

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

function normalizar(txt) {
  return (txt || "").trim().toLowerCase();
}

function lerMemoria() {
  try {
    return JSON.parse(localStorage.getItem(KEY_MEMORIA) || "[]");
  } catch {
    return [];
  }
}

function salvarMemoria(memoria) {
  localStorage.setItem(KEY_MEMORIA, JSON.stringify(memoria));
}

function atualizarMemoriaUI() {
  const memoria = lerMemoria();
  memoriaCurtaUI.innerText = JSON.stringify(memoria, null, 2);
}

function montarPayload() {
  return {
    ambiente: document.getElementById("inputAmbiente").value.trim(),
    estado: document.getElementById("inputEstado").value.trim(),
    intencao: document.getElementById("inputIntencao").value.trim(),
    silencio_pct: Number(document.getElementById("inputSilencio").value || 0),
    pause_count: Number(document.getElementById("inputPausas").value || 0),
    timestamp: new Date().toISOString()
  };
}

function registrarInteracao() {
  const payload = montarPayload();
  const memoria = lerMemoria();

  memoria.push(payload);

  const memoriaCurta = memoria.slice(-3);
  salvarMemoria(memoriaCurta);

  payloadAtualUI.innerText = JSON.stringify(payload, null, 2);
  statusUI.innerText = "interação registrada";
  leituraContinuidadeUI.innerText = "registro salvo, pronto para comparação";
  proximaDirecaoUI.innerText = "registre mais interações para gerar leitura curta";

  atualizarMemoriaUI();

  log("payload montado");
  log("interação adicionada à memória curta");
}

function compararMemoria() {
  const memoria = lerMemoria();

  if (memoria.length < 2) {
    statusUI.innerText = "memória insuficiente";
    leituraContinuidadeUI.innerText = "é preciso pelo menos 2 interações";
    proximaDirecaoUI.innerText = "registre nova interação";
    log("comparação não executada: memória insuficiente");
    return;
  }

  const atual = memoria[memoria.length - 1];
  const anterior = memoria[memoria.length - 2];

  const ambienteAtual = normalizar(atual.ambiente);
  const ambienteAnterior = normalizar(anterior.ambiente);

  const estadoAtual = normalizar(atual.estado);
  const estadoAnterior = normalizar(anterior.estado);

  const intencaoAtual = normalizar(atual.intencao);
  const intencaoAnterior = normalizar(anterior.intencao);

  let continuidade = [];
  let direcao = "manter observação";

  if (ambienteAtual === ambienteAnterior && ambienteAtual !== "") {
    continuidade.push("ambiente mantido");
  } else {
    continuidade.push("ambiente alterado");
  }

  if (estadoAtual === estadoAnterior && estadoAtual !== "") {
    continuidade.push("estado declarado estável");
  } else {
    continuidade.push("estado declarado mudou");
  }

  if (intencaoAtual === intencaoAnterior && intencaoAtual !== "") {
    continuidade.push("intenção mantida");
  } else {
    continuidade.push("intenção ajustada");
  }

  const deltaSilencio = atual.silencio_pct - anterior.silencio_pct;
  const deltaPausas = atual.pause_count - anterior.pause_count;

  if (deltaSilencio < 0 && deltaPausas <= 0) {
    direcao = "há sinal de maior fluidez; vale sustentar o ritmo";
  } else if (deltaSilencio > 10 || deltaPausas > 2) {
    direcao = "há oscilação crescente; vale revisar contexto e reduzir carga";
  } else {
    direcao = "continuidade moderada; seguir observando antes de agir";
  }

  statusUI.innerText = "comparação concluída";
  leituraContinuidadeUI.innerText = continuidade.join(" • ");
  proximaDirecaoUI.innerText = direcao;

  log("memória curta comparada");
  log(`continuidade: ${continuidade.join(" | ")}`);
  log(`direção: ${direcao}`);
}

function resetar() {
  localStorage.removeItem(KEY_MEMORIA);

  statusUI.innerText = "aguardando";
  payloadAtualUI.innerText = "—";
  leituraContinuidadeUI.innerText = "—";
  proximaDirecaoUI.innerText = "—";
  memoriaCurtaUI.innerText = "[]";
  logBox.innerText = "";

  log("memória curta resetada");
}

document.getElementById("btnRegistrar").onclick = registrarInteracao;
document.getElementById("btnComparar").onclick = compararMemoria;
document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};
document.getElementById("btnResetar").onclick = resetar;

atualizarMemoriaUI();
log("sistema pronto para teste 9.6");