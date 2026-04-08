document.addEventListener("DOMContentLoaded", () => {
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
  const textoResumo = document.getElementById("textoResumo");
  const textoHipotese = document.getElementById("textoHipotese");
  const textoProximo = document.getElementById("textoProximo");

  const inpImagem = document.getElementById("inpImagem");
  const inpContext = document.getElementById("inpContext");

  const btnEnviar = document.getElementById("btnEnviarImagemLeitura");
  const btnResetar = document.getElementById("btnResetarTeste");
  const btnLimpar = document.getElementById("btnLimparLog");

  let base64 = null;

  function log(msg) {
    const ts = new Date().toLocaleTimeString();
    logBox.textContent += `[${ts}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
  }

  function reset() {
    base64 = null;
    inpImagem.value = "";
    preview.src = "";

    status.textContent = "aguardando";
    emissor.textContent = "não acionado";
    canal.textContent = "não definido";
    receptor.textContent = "não definido";
    payloadView.textContent = "—";
    respostaView.textContent = "—";
    evento.textContent = "nenhum";
    erro.textContent = "nenhum";
    textoResumo.textContent = "—";
    textoHipotese.textContent = "—";
    textoProximo.textContent = "—";

    log("diagnóstico resetado");
  }

  function limparLog() {
    logBox.textContent = "";
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  inpImagem.addEventListener("change", async () => {
    const file = inpImagem.files[0];
    if (!file) return;

    emissor.textContent = "inpImagem";
    canal.textContent = "FileReader";
    receptor.textContent = "previewImagem";

    log(`imagem selecionada: ${file.name}`);

    try {
      base64 = await toBase64(file);
      preview.src = base64;
      evento.textContent = "preview exibido";
      log("imagem convertida para base64");
    } catch (e) {
      erro.textContent = "falha ao converter imagem";
      log("ERRO: falha ao converter imagem");
      console.error(e);
    }
  });

  btnEnviar.addEventListener("click", async () => {
    emissor.textContent = "btnEnviarImagemLeitura";
    canal.textContent = "fetch → /api/image/ler";
    receptor.textContent = "endpoint de leitura operacional";

    if (!base64) {
      status.textContent = "erro";
      erro.textContent = "sem imagem";
      log("ERRO: nenhuma imagem carregada");
      return;
    }

    const payload = {
      context: inpContext.value || "sem contexto",
      image_base64: base64,
      timestamp: new Date().toISOString()
    };

    payloadView.textContent = JSON.stringify({
      context: payload.context,
      image_base64: `[base64 tamanho ${payload.image_base64.length}]`,
      timestamp: payload.timestamp
    }, null, 2);

    const t0 = performance.now();
    log("enviando imagem para leitura operacional...");

    try {
      const res = await fetch("https://nucleo-crs-elayon.onrender.com/api/image/ler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const t1 = performance.now();

      respostaView.textContent = JSON.stringify(data, null, 2);
      status.textContent = `ok (${Math.round(t1 - t0)}ms)`;
      evento.textContent = "leitura operacional recebida";
      erro.textContent = "nenhum";

      textoResumo.textContent = data.summary || "sem resumo";
      textoHipotese.textContent = data.hypothesis || "sem hipótese";
      textoProximo.textContent = data.next_step || "sem próximo passo";

      log(`endpoint respondeu em ${Math.round(t1 - t0)}ms`);
      log(`summary: ${data.summary || "sem summary"}`);
    } catch (e) {
      status.textContent = "erro";
      erro.textContent = "falha no envio";
      evento.textContent = "erro no fetch";
      log("ERRO: falha ao enviar imagem para leitura operacional");
      console.error(e);
    }
  });

  btnResetar.addEventListener("click", reset);
  btnLimpar.addEventListener("click", limparLog);

  log("sistema pronto para teste 9.2");
});