(function () {
  const SUPABASE_URL = "https://eudcjihffrfmhzmfwtlg.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZGNqaWhmZnJmbWh6bWZ3dGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDE3MjUsImV4cCI6MjA5MDMxNzcyNX0.2tod6vvl_4SAXzSmW1wU8Mk9pLn8fvhF2xrAZOysUu0";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // EXPÕE GLOBALMENTE PARA O TÚNEL
  window.ELAYON_SUPABASE = supabase;

  const logBox = document.getElementById("logBox");
  const statusGeral = document.getElementById("statusGeral");
  const ultimoEvento = document.getElementById("ultimoEvento");
  const ultimoErro = document.getElementById("ultimoErro");
  const respostaAtual = document.getElementById("respostaAtual");

  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupPasswordConfirm = document.getElementById("signupPasswordConfirm");

  const btnCriarConta = document.getElementById("btnCriarConta");
  const btnResetar = document.getElementById("btnResetar");
  const btnLimparLog = document.getElementById("btnLimparLog");

  function log(msg) {
    const t = new Date().toLocaleTimeString();
    logBox.innerText += `[${t}] ${msg}\n`;
  }

  function setStatus(text) {
    statusGeral.innerText = text;
  }

  function setEvento(text) {
    ultimoEvento.innerText = text;
  }

  function setErro(text) {
    ultimoErro.innerText = text;
  }

  function setResposta(obj) {
    respostaAtual.innerText =
      typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  }

  function resetarUI() {
    signupName.value = "";
    signupEmail.value = "";
    signupPassword.value = "";
    signupPasswordConfirm.value = "";

    setStatus("aguardando");
    setEvento("nenhum");
    setErro("nenhum");
    setResposta("—");
    log("formulário resetado");
  }

  function bindTogglePassword() {
    const buttons = document.querySelectorAll(".toggle-password");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "🙈" : "👁";
      });
    });
  }

  async function criarConta() {
    const nome = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirm = signupPasswordConfirm.value;

    setErro("nenhum");
    setResposta("—");

    if (!nome || !email || !password || !confirm) {
      setStatus("campos incompletos");
      setErro("preencha todos os campos");
      log("ERRO: campos incompletos");
      return;
    }

    if (password !== confirm) {
      setStatus("senha inconsistente");
      setErro("as senhas não coincidem");
      log("ERRO: senhas diferentes");
      return;
    }

    if (password.length < 6) {
      setStatus("senha curta");
      setErro("a senha deve ter ao menos 6 caracteres");
      log("ERRO: senha curta");
      return;
    }

    setStatus("criando conta...");
    setEvento("enviando cadastro");
    log(`tentando criar conta para ${email}`);

    const redirectTo =
      "https://paulorobertoxavierjunior-create.github.io/elayon-presenca/login.html";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { nome }
      }
    });

    if (error) {
      setStatus("falha no cadastro");
      setErro(error.message);
      setEvento("cadastro recusado");
      setResposta(error.message);
      log(`ERRO: ${error.message}`);
      return;
    }

    setStatus("cadastro criado");
    setEvento("redirecionando para agradecimento");
    setResposta({
      ok: true,
      user_id: data?.user?.id || null,
      email: data?.user?.email || email,
      needs_confirmation: true
    });

    log("cadastro criado com sucesso");
    log("indo para tela de agradecimento");

    window.location.href = "obrigado-cadastro.html";
  }

  btnCriarConta?.addEventListener("click", criarConta);
  btnResetar?.addEventListener("click", resetarUI);
  btnLimparLog?.addEventListener("click", () => {
    logBox.innerText = "";
  });

  bindTogglePassword();
  log("sistema pronto para teste de cadastro");
})();