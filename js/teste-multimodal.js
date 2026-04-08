const btn = document.getElementById("btnProcessar");
const logBox = document.getElementById("logBox");

const status = document.getElementById("statusGeral");
const canal = document.getElementById("canalAtual");
const payloadUI = document.getElementById("payloadAtual");
const respostaUI = document.getElementById("respostaAtual");

const preview = document.getElementById("previewImagem");

const outResumo = document.getElementById("outResumo");
const outInterpretacao = document.getElementById("outInterpretacao");
const outAcao = document.getElementById("outAcao");

function log(msg){
  const time = new Date().toLocaleTimeString();
  logBox.innerText += `[${time}] ${msg}\n`;
}

btn.onclick = async () => {
  try {
    const file = document.getElementById("inputImagem").files[0];
    const contexto = document.getElementById("inputContexto").value.trim();
    const texto = document.getElementById("inputTexto").value.trim();

    if(!file){
      log("ERRO: sem imagem");
      return;
    }

    const reader = new FileReader();

    reader.onload = async function(){
      const base64 = reader.result.split(",")[1];

      preview.src = reader.result;

      const payload = {
        context: contexto,
        user_text: texto,
        image_size: base64.length,
        timestamp: new Date().toISOString()
      };

      payloadUI.innerText = JSON.stringify(payload, null, 2);
      canal.innerText = "multimodal local";

      log("payload montado");

      const start = Date.now();

      // 🔥 SIMULAÇÃO DE DECISÃO (depois entra IA real)
      const resposta = {
        ok: true,
        summary: "Entrada multimodal recebida com sucesso.",
        interpretation: `Contexto: ${contexto || "não informado"} + intenção: ${texto || "não informada"}`,
        action: "Sugerir ação baseada no objeto identificado (ex: ligar dispositivo, interagir ou analisar)."
      };

      const tempo = Date.now() - start;

      status.innerText = `ok (${tempo}ms)`;
      respostaUI.innerText = JSON.stringify(resposta, null, 2);

      outResumo.innerText = resposta.summary;
      outInterpretacao.innerText = resposta.interpretation;
      outAcao.innerText = resposta.action;

      log("decisão multimodal gerada");
    };

    reader.readAsDataURL(file);

  } catch(e){
    log("ERRO: " + e.message);
  }
};

document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

document.getElementById("btnResetar").onclick = () => {
  status.innerText = "aguardando";
  canal.innerText = "—";
  payloadUI.innerText = "—";
  respostaUI.innerText = "—";
  preview.src = "";
  outResumo.innerText = "—";
  outInterpretacao.innerText = "—";
  outAcao.innerText = "—";
  logBox.innerText = "";
};