(function () {
  const LAB = window.ELAYON_LAB;
  const STORAGE_PREFIX = "elayon_operacao_";
  const KEYS = [
    {
      id: "spacePublicBase",
      label: "Elayon Space — base pública",
      type: "url",
      defaultValue: "https://paulorobertoxavierjunior-create.github.io/elayonspace/",
      layer: "Entrada pública",
      status: "ativo",
      description: "URL pública da camada de entrada e autenticação do Elayon Space.",
      links: [
        { label: "Abrir Space", href: "https://paulorobertoxavierjunior-create.github.io/elayonspace/" },
        { label: "Repositório elayonspace", href: "https://github.com/paulorobertoxavierjunior-create/elayonspace" }
      ]
    },
    {
      id: "supabaseUrl",
      label: "Supabase URL",
      type: "url",
      defaultValue: "https://eudcjihffrfmhzmfwtlg.supabase.co",
      layer: "Auth / dados",
      status: "ativo",
      description: "Projeto Supabase usado no fluxo de autenticação do Space.",
      links: [
        { label: "Teste Auth", href: "teste-auth-cadastro.html" },
        { label: "Diagnóstico Space", href: "teste-elayon-space.html" }
      ]
    },
    {
      id: "supabaseAnonKey",
      label: "Supabase anon key",
      type: "password",
      defaultValue: "",
      layer: "Auth / dados",
      status: "preencher localmente",
      description: "Cole aqui a chave pública do frontend para referência operacional sem commitar.",
      links: [
        { label: "Teste Auth", href: "teste-auth-cadastro.html" }
      ]
    },
    {
      id: "spaceApiBase",
      label: "Space API_BASE",
      type: "url",
      defaultValue: "https://crs-full-api.onrender.com",
      layer: "API operacional",
      status: "alvo",
      description: "Base esperada para a camada API do cockpit e dos pilotos Elayon.",
      links: [
        { label: "Diagnóstico Space", href: "teste-elayon-space.html" }
      ]
    },
    {
      id: "labHealthUrl",
      label: "Lab Render health",
      type: "url",
      defaultValue: "https://nucleo-crs-elayon.onrender.com/health",
      layer: "Lab / validação",
      status: "ativo",
      description: "Health atual usado pelo laboratório para verificar conectividade.",
      links: [
        { label: "Teste Conexões", href: "teste-conexoes.html" }
      ]
    },
    {
      id: "labCrsUrl",
      label: "Lab CRS analisar",
      type: "url",
      defaultValue: "https://nucleo-crs-elayon.onrender.com/api/crs/analisar",
      layer: "Lab / validação",
      status: "ativo",
      description: "Endpoint atual do CRS usado nos testes do laboratório.",
      links: [
        { label: "Teste CRS", href: "teste-crs.html" },
        { label: "Teste Loop", href: "teste-loop.html" }
      ]
    },
    {
      id: "grokApiKey",
      label: "Grok API key",
      type: "password",
      defaultValue: localStorage.getItem("elayon_grok_key") || "",
      layer: "IA / calibração",
      status: "ativo",
      description: "Chave já usada no Presença Lab para calibração e respostas da IA.",
      links: [
        { label: "Presença Lab", href: "presenca-lab.html" }
      ]
    },
    {
      id: "cockpitApiBase",
      label: "Cockpit API base",
      type: "url",
      defaultValue: "",
      layer: "Cockpit de operação",
      status: "futuro",
      description: "Base da API que vai consolidar Space, pilotos e habilitação do PC.",
      links: []
    },
    {
      id: "pilotosToken",
      label: "Token interno dos pilotos Elayon",
      type: "password",
      defaultValue: "",
      layer: "Cockpit de operação",
      status: "futuro",
      description: "Token operacional interno. Não expor em páginas públicas; usar aqui só como referência local.",
      links: []
    },
    {
      id: "elayonPcApiBase",
      label: "Elayon PC API base",
      type: "url",
      defaultValue: "",
      layer: "Habilitação do PC",
      status: "futuro",
      description: "Base reservada para a camada do PC quando a habilitação entrar no cockpit.",
      links: []
    }
  ];

  const FLOW = [
    {
      title: "1. Entrada pública",
      text: "A navegação começa no Elayon Space, com landing, acesso e painel público/autenticado.",
      links: [
        { label: "Abrir Elayon Space", href: "https://paulorobertoxavierjunior-create.github.io/elayonspace/" },
        { label: "Diagnóstico do Space", href: "teste-elayon-space.html" }
      ]
    },
    {
      title: "2. Autenticação e dados",
      text: "Supabase organiza login, cadastro, sessão e retorno controlado ao painel.",
      links: [
        { label: "Teste Auth", href: "teste-auth-cadastro.html" }
      ]
    },
    {
      title: "3. CRS e validação técnica",
      text: "O laboratório valida saúde do backend, payloads e resposta do CRS antes de subir para a operação.",
      links: [
        { label: "Teste Conexões", href: "teste-conexoes.html" },
        { label: "Teste CRS", href: "teste-crs.html" },
        { label: "Teste Loop", href: "teste-loop.html" }
      ]
    },
    {
      title: "4. Cockpit de operação",
      text: "Esta é a camada planejada para concentrar APIs, pilotos Elayon e orquestração privada.",
      links: []
    },
    {
      title: "5. Habilitação Elayon PC",
      text: "A etapa final conecta a experiência do PC ao mesmo cockpit, sem mexer na plataforma simbiótica base.",
      links: []
    }
  ];

  function keyStorageId(id) {
    return `${STORAGE_PREFIX}${id}`;
  }

  function nowText() {
    return new Date().toLocaleString("pt-BR", { hour12: false });
  }

  function getStoredValue(item) {
    return localStorage.getItem(keyStorageId(item.id)) ?? item.defaultValue;
  }

  function setStoredValue(item, value) {
    localStorage.setItem(keyStorageId(item.id), value);
    if (item.id === "grokApiKey") {
      localStorage.setItem("elayon_grok_key", value);
    }
  }

  function clearStoredValue(item) {
    localStorage.removeItem(keyStorageId(item.id));
    if (item.id === "grokApiKey") {
      localStorage.removeItem("elayon_grok_key");
    }
  }

  function maskValue(value, type) {
    if (!value) return "vazio";
    if (type !== "password") return value;
    return `${"•".repeat(Math.min(value.length, 8))} (${value.length} chars)`;
  }

  function renderLinks(links) {
    if (!links.length) {
      const span = document.createElement("span");
      span.className = "value";
      span.textContent = "sem link definido ainda";
      return span;
    }

    const row = document.createElement("div");
    row.className = "row";
    links.forEach((link) => {
      const a = document.createElement("a");
      a.className = "btn secondary";
      a.href = link.href;
      a.textContent = link.label;
      if (/^https?:\/\//i.test(link.href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      row.appendChild(a);
    });
    return row;
  }

  function renderFlow() {
    const flowList = document.getElementById("flowList");
    flowList.innerHTML = "";

    FLOW.forEach((step) => {
      const card = document.createElement("div");
      card.className = "field";

      const title = document.createElement("span");
      title.className = "label";
      title.textContent = step.title;

      const text = document.createElement("div");
      text.className = "value";
      text.style.marginBottom = "10px";
      text.textContent = step.text;

      card.append(title, text, renderLinks(step.links));
      flowList.appendChild(card);
    });
  }

  function renderKeys() {
    const keysList = document.getElementById("keysList");
    keysList.innerHTML = "";

    KEYS.forEach((item) => {
      const card = document.createElement("div");
      card.className = "field";

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = `${item.label} • ${item.layer} • ${item.status}`;

      const input = document.createElement("input");
      input.id = item.id;
      input.type = item.type;
      input.placeholder = item.description;
      input.value = getStoredValue(item);
      input.style.marginBottom = "10px";

      const meta = document.createElement("div");
      meta.className = "value";
      meta.style.marginBottom = "10px";
      meta.textContent = item.description;

      const preview = document.createElement("div");
      preview.className = "value";
      preview.id = `${item.id}Preview`;
      preview.style.marginBottom = "10px";
      preview.textContent = `Atual: ${maskValue(input.value, item.type)}`;

      input.addEventListener("input", () => {
        preview.textContent = `Atual: ${maskValue(input.value, item.type)}`;
      });

      card.append(label, input, meta, preview, renderLinks(item.links));
      keysList.appendChild(card);
    });
  }

  function buildSummary() {
    const data = KEYS.map((item) => {
      const value = document.getElementById(item.id)?.value.trim() || "";
      return {
        chave: item.label,
        camada: item.layer,
        status: item.status,
        preenchido: Boolean(value),
        valor: item.type === "password" ? maskValue(value, item.type) : value || ""
      };
    });

    const filled = data.filter((item) => item.preenchido).length;
    document.getElementById("coverageStatus").textContent = `${filled}/${data.length} itens preenchidos localmente`;
    document.getElementById("summaryBox").textContent = JSON.stringify({
      atualizado_em: nowText(),
      fluxo: FLOW.map((item) => item.title),
      chaves: data
    }, null, 2);
  }

  function saveAll() {
    KEYS.forEach((item) => {
      const value = document.getElementById(item.id)?.value.trim() || "";
      setStoredValue(item, value);
    });

    const timestamp = nowText();
    localStorage.setItem(`${STORAGE_PREFIX}lastSaved`, timestamp);
    document.getElementById("lastSaved").textContent = timestamp;
    buildSummary();
    LAB.appendLog("Hub operacional salvo localmente neste navegador.");
  }

  function clearAll() {
    KEYS.forEach((item) => clearStoredValue(item));
    localStorage.removeItem(`${STORAGE_PREFIX}lastSaved`);
    renderKeys();
    hydrateMeta();
    buildSummary();
    LAB.appendLog("Valores locais removidos deste navegador.", "warn");
  }

  async function exportSummary() {
    buildSummary();
    const text = document.getElementById("summaryBox").textContent;
    try {
      await navigator.clipboard.writeText(text);
      LAB.appendLog("Resumo copiado para a área de transferência.");
    } catch (error) {
      LAB.appendLog(`Falha ao copiar resumo: ${error.message}`, "err");
    }
  }

  function hydrateMeta() {
    document.getElementById("lastSaved").textContent = localStorage.getItem(`${STORAGE_PREFIX}lastSaved`) || "nunca";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderFlow();
    renderKeys();
    hydrateMeta();
    buildSummary();
    document.getElementById("btnSalvarTudo")?.addEventListener("click", saveAll);
    document.getElementById("btnLimparTudo")?.addEventListener("click", clearAll);
    document.getElementById("btnExportar")?.addEventListener("click", exportSummary);
    LAB.appendLog("Hub de chaves e fluxo carregado.");
  });
})();
