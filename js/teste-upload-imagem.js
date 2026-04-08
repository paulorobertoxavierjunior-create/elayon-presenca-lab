console.log("JS CARREGADO 🔥");

let logBox = document.getElementById("log");
let statusBox = document.getElementById("status");
let payloadBox = document.getElementById("payloadBox");
let previewImagem = document.getElementById("previewImagem");

let inputImagem = document.getElementById("inputImagem");
let inputContexto = document.getElementById("inputContexto");

let btnProcessar = document.getElementById("btnProcessar");
let btnResetar = document.getElementById("btnResetar");
let btnLimparLog = document.getElementById("btnLimparLog");

let imagemBase64 = null;

// 🔹 LOG PADRÃO
function log(msg) {
  const ts = new Date().toLocaleTimeString();
  logBox.textContent += `[${ts}] ${msg}\n`;
  logBox.scrollTop = logBox.scrollHeight;
}

// 🔹 RESET
function resetar() {
  inputImagem.value = "";
  inputContexto.value = "";
  previewImagem.src = "";
  payloadBox.textContent = "—";
  statusBox.textContent = "aguardando";
  imagemBase64 = null;

  log("Diagnóstico resetado");
}

// 🔹 LIMPAR LOG
function limparLog() {
  logBox.textContent = "";
}

// 🔹 CONVERTER IMAGEM → BASE64
function lerImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// 🔹 EVENTO: SELEÇÃO DE IMAGEM
inputImagem.addEventListener("change", async () => {
  const file = inputImagem.files[0];

  if (!file) {
    log("Nenhuma imagem selecionada");
    return;
  }

  log(`Imagem selecionada: ${file.name}`);

  try {
    imagemBase64 = await lerImagem(file);

    previewImagem.src = imagemBase64;

    log("Imagem convertida para base64");
    log("Preview renderizado");

  } catch (err) {
    log("ERRO ao ler imagem");
    console.error(err);
  }
});

// 🔹 PROCESSAR
btnProcessar.addEventListener("click", () => {

  log("Emissor acionado: botão #btnProcessar");

  if (!imagemBase64) {
    log("ERRO: nenhuma imagem carregada");
    statusBox.textContent = "erro";
    return;
  }

  const contexto = inputContexto.value || "";

  const payload = {
    tipo: "imagem_input",
    contexto: contexto,
    imagem_preview: "[base64 reduzido]",
    timestamp: new Date().toISOString()
  };

  log("Canal aberto: DOM → JavaScript");
  log("Payload montado com sucesso");
  log("Imagem anexada ao payload");

  payloadBox.textContent = JSON.stringify(payload, null, 2);

  // 🔹 SIMULAÇÃO DE PROCESSAMENTO (por enquanto local)
  setTimeout(() => {
    statusBox.textContent = "processado local";

    log("Receptor: processamento local simulado");
    log("Resposta gerada com sucesso");
    log("Teste 9 concluído");

  }, 400);
});

// 🔹 RESET
btnResetar.addEventListener("click", resetar);

// 🔹 LIMPAR LOG
btnLimparLog.addEventListener("click", limparLog);

// 🔹 INIT
log("Página carregada. Sistema pronto para teste de imagem.");