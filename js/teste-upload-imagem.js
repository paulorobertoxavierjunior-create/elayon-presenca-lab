document.addEventListener("DOMContentLoaded", () => {

  alert("JS CARREGADO 🔥"); // 👈 se não aparecer, o problema é o caminho

  const logBox = document.getElementById("logBox");
  const status = document.getElementById("statusGeral");
  const emissor = document.getElementById("emissorAtual");
  const canal = document.getElementById("canalAtual");
  const receptor = document.getElementById("receptorAtual");
  const payloadView = document.getElementById("payloadAtual");
  const respostaView = document.getElementById("respostaAtual");
  const evento = document.getElementById("ultimoEvento");
  const erro = document.getElementById("ultimoErro");

  const preview = document.getElementById("previewImagem");

  const inputImg = document.getElementById("inputImagem");
  const inputCtx = document.getElementById("inputContexto");

  const btnProcessar = document.getElementById("btnProcessar");
  const btnResetar = document.getElementById("btnResetar");
  const btnLimpar = document.getElementById("btnLimparLog");

  let base64 = null;

  function log(msg) {
    const ts = new Date().toLocaleTimeString();
    logBox.textContent += `[${ts}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
  }

  function reset() {
    base64 = null;
    inputImg.value = "";
    inputCtx.value = "";
    preview.src = "";

    status.textContent = "aguardando";
    emissor.textContent = "não acionado";
    canal.textContent = "não definido";
    receptor.textContent = "não definido";
    payloadView.textContent = "—";
    respostaView.textContent = "—";
    evento.textContent = "nenhum";
    erro.textContent = "nenhum";

    log("reset executado");
  }

  function limpar() {
    logBox.textContent = "";
  }

  function toBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  // 📸 Seleção de imagem
  inputImg.addEventListener("change", async () => {

    const file = inputImg.files[0];
    if (!file) return;

    emissor.textContent = "inputImagem";
    canal.textContent = "FileReader";
    receptor.textContent = "previewImagem";

    log("imagem selecionada");

    base64 = await toBase64(file);

    preview.src = base64;

    evento.textContent = "preview exibido";

    log("imagem convertida base64");
  });

  // 🚀 PROCESSAR (AGORA COM ENVIO REAL)
  btnProcessar.addEventListener("click", async () => {

    alert("BOTÃO FUNCIONOU 🔥"); // 👈 debug

    emissor.textContent = "btnProcessar";
    canal.textContent = "fetch → Render";
    receptor.textContent = "backend";

    if (!base64) {
      erro.textContent = "sem imagem";
      log("ERRO: sem imagem");
      return;
    }

    const payload = {
      context: inputCtx.value || "sem contexto",
      image_base64: base64.substring(0, 200), // reduzido pra não travar UI
      timestamp: new Date().toISOString()
    };

    payloadView.textContent = JSON.stringify(payload, null, 2);

    log("enviando pro backend...");

    const t0 = performance.now();

    try {

      const res = await fetch("https://nucleo-crs-elayon.onrender.com/health");

      const data = await res.json();

      const t1 = performance.now();

      respostaView.textContent = JSON.stringify(data, null, 2);

      status.textContent = `ok (${Math.round(t1 - t0)}ms)`;
      evento.textContent = "resposta recebida";

      log("resposta recebida do render");
      log(JSON.stringify(data));

    } catch (e) {

      erro.textContent = "falha fetch";
      status.textContent = "erro";

      log("ERRO FETCH");
      console.error(e);

    }

  });

  btnResetar.addEventListener("click", reset);
  btnLimpar.addEventListener("click", limpar);

  log("sistema pronto");

});