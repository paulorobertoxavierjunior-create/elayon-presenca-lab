// 🔥 GARANTIR QUE TUDO CARREGOU
window.addEventListener("DOMContentLoaded", () => {

  console.log("JS Teste 9 carregado 🔥");

  // 🔹 ELEMENTOS
  const logBox = document.getElementById("logBox");
  const statusGeral = document.getElementById("statusGeral");
  const emissorAtual = document.getElementById("emissorAtual");
  const canalAtual = document.getElementById("canalAtual");
  const receptorAtual = document.getElementById("receptorAtual");
  const payloadAtual = document.getElementById("payloadAtual");
  const respostaAtual = document.getElementById("respostaAtual");
  const ultimoEvento = document.getElementById("ultimoEvento");
  const ultimoErro = document.getElementById("ultimoErro");

  const previewImagem = document.getElementById("previewImagem");

  const inputImagem = document.getElementById("inputImagem");
  const inputContexto = document.getElementById("inputContexto");

  const btnProcessar = document.getElementById("btnProcessar");
  const btnResetar = document.getElementById("btnResetar");
  const btnLimparLog = document.getElementById("btnLimparLog");

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

    statusGeral.textContent = "aguardando";
    emissorAtual.textContent = "não acionado";
    canalAtual.textContent = "não definido";
    receptorAtual.textContent = "não definido";
    payloadAtual.textContent = "—";
    respostaAtual.textContent = "—";
    ultimoEvento.textContent = "nenhum";
    ultimoErro.textContent = "nenhum";

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

    emissorAtual.textContent = "inputImagem";
    canalAtual.textContent = "DOM → FileReader";
    receptorAtual.textContent = "previewImagem";

    log(`Imagem selecionada: ${file.name}`);

    try {
      imagemBase64 = await lerImagem(file);

      previewImagem.src = imagemBase64;

      ultimoEvento.textContent = "imagem carregada e preview exibido";

      log("Imagem convertida para base64");
      log("Preview renderizado");

    } catch (err) {
      ultimoErro.textContent = "erro ao ler imagem";
      log("ERRO ao converter imagem");
      console.error(err);
    }
  });

  // 🔹 PROCESSAR
  btnProcessar.addEventListener("click", () => {

    emissorAtual.textContent = "botão #btnProcessar";
    canalAtual.textContent = "DOM → JavaScript";
    receptorAtual.textContent = "painel de diagnóstico";

    log("Emissor acionado: botão #btnProcessar");

    if (!imagemBase64) {
      statusGeral.textContent = "erro";
      ultimoErro.textContent = "nenhuma imagem carregada";

      log("ERRO: nenhuma imagem carregada");

      return;
    }

    const contexto = inputContexto.value || "";

    const payload = {
      tipo: "imagem_input",
      contexto: contexto,
      imagem_base64: "[omitido para log]",
      timestamp: new Date().toISOString()
    };

    payloadAtual.textContent = JSON.stringify(payload, null, 2);

    log("Payload montado com sucesso");

    // 🔹 SIMULAÇÃO DE PROCESSAMENTO
    setTimeout(() => {

      const resposta = {
        ok: true,
        mensagem: "Imagem recebida e processada localmente",
        contexto: contexto
      };

      respostaAtual.textContent = JSON.stringify(resposta, null, 2);

      statusGeral.textContent = "processado local";
      ultimoEvento.textContent = "resposta renderizada";

      log("Resposta simulada gerada");
      log("Teste 9 concluído com sucesso");

    }, 400);
  });

  // 🔹 BOTÕES
  btnResetar.addEventListener("click", resetar);
  btnLimparLog.addEventListener("click", limparLog);

  // 🔹 INIT
  log("Página carregada. Sistema pronto para teste de imagem.");

});