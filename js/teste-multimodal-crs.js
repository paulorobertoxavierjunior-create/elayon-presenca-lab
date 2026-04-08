const logBox = document.getElementById("logBox");

function log(msg){
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

document.getElementById("btnProcessar").onclick = () => {

  const contexto = document.getElementById("inputContexto").value.trim();
  const texto = document.getElementById("inputTexto").value.trim();

  const duracao = Number(document.getElementById("inputDuracao").value);
  const silencio = Number(document.getElementById("inputSilencio").value);
  const pausas = Number(document.getElementById("inputPausas").value);

  const payload = {
    context: contexto,
    user_text: texto,
    duration_sec: duracao,
    silence_pct: silencio,
    pause_count: pausas
  };

  document.getElementById("payloadUI").innerText =
    JSON.stringify(payload, null, 2);

  log("payload multimodal + CRS montado");

  // 🔥 leitura combinada simples (mock inteligente)
  let estado;

  if(silencio > 40) estado = "mente dispersa";
  else if(pausas > 6) estado = "pensamento fragmentado";
  else estado = "fluxo contínuo";

  const resposta = {
    summary: "Leitura integrada realizada com sucesso.",
    interpretation:
      `Ambiente: ${contexto}. Estado: ${estado}. Intenção: ${texto}`,
    action:
      "Sugerir ajuste no ambiente ou comportamento para melhorar o estado atual."
  };

  document.getElementById("status").innerText = "ok";
  document.getElementById("outResumo").innerText = resposta.summary;
  document.getElementById("outInterpretacao").innerText = resposta.interpretation;
  document.getElementById("outAcao").innerText = resposta.action;

  log("decisão integrada gerada");
};

document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

document.getElementById("btnResetar").onclick = () => {
  document.getElementById("status").innerText = "aguardando";
  document.getElementById("payloadUI").innerText = "—";
  document.getElementById("outResumo").innerText = "—";
  document.getElementById("outInterpretacao").innerText = "—";
  document.getElementById("outAcao").innerText = "—";
  logBox.innerText = "";
};