const inputImagem = document.getElementById("inputImagem");
const inputContexto = document.getElementById("inputContexto");
const preview = document.getElementById("previewImagem");
const payloadBox = document.getElementById("payloadBox");
const status = document.getElementById("status");

const btnProcessar = document.getElementById("btnProcessar");
const btnResetar = document.getElementById("btnResetar");
const btnLimparLog = document.getElementById("btnLimparLog");

let imagemBase64 = null;

function log(msg){
  const el = document.getElementById("log");
  const hora = new Date().toLocaleTimeString();
  el.textContent += `[${hora}] ${msg}\n`;
}

inputImagem.addEventListener("change", () => {
  const file = inputImagem.files[0];
  if(!file){
    log("Nenhuma imagem selecionada");
    return;
  }

  log("Imagem selecionada");

  const reader = new FileReader();

  reader.onload = () => {
    imagemBase64 = reader.result;

    preview.src = imagemBase64;

    log("Imagem convertida para base64");
  };

  reader.readAsDataURL(file);
});

btnProcessar.addEventListener("click", () => {

  log("Emissor acionado: botão processar");

  if(!imagemBase64){
    log("ERRO: nenhuma imagem carregada");
    status.textContent = "erro";
    return;
  }

  const contexto = inputContexto.value || "";

  const payload = {
    tipo: "imagem_contexto",
    contexto: contexto,
    imagem_base64: imagemBase64.slice(0, 100) + "...",
    ts: new Date().toISOString()
  };

  payloadBox.textContent = JSON.stringify(payload, null, 2);

  status.textContent = "processado";

  log("Payload montado com sucesso");
  log("Receptor: DOM local");
  log("Teste 9 concluído");
});

btnResetar.addEventListener("click", () => {
  preview.src = "";
  payloadBox.textContent = "";
  status.textContent = "aguardando";
  imagemBase64 = null;
  inputImagem.value = "";
  inputContexto.value = "";

  log("Diagnóstico resetado");
});

btnLimparLog.addEventListener("click", () => {
  document.getElementById("log").textContent = "";
});