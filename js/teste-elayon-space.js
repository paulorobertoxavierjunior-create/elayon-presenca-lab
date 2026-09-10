(function () {
  const LAB = window.ELAYON_LAB;
  const TARGET_BASE = "https://paulorobertoxavierjunior-create.github.io/elayonspace/";
  const FALLBACK_RENDER_BASE = "https://crs-full-api.onrender.com";
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  const FETCH_TIMEOUT_MS = 15000;
  const URLS = [
    { id: "url-root", path: "", label: "/" },
    { id: "url-index", path: "index.html", label: "index.html" },
    { id: "url-acesso", path: "acesso.html", label: "acesso.html" },
    { id: "url-painel", path: "painel.html", label: "painel.html" },
    { id: "url-confirmacao", path: "confirmacao.html", label: "confirmacao.html" },
    { id: "url-index-check", path: "index-check.html", label: "index-check.html" }
  ];

  const state = {
    html: {},
    statuses: {},
    issues: [],
    renderBase: FALLBACK_RENDER_BASE
  };

  function setValue(id, value) {
    LAB.setValue(id, value);
  }

  function log(message, type = "ok") {
    LAB.appendLog(message, type);
  }

  function resetValues() {
    [
      "url-root", "url-index", "url-acesso", "url-painel", "url-confirmacao", "url-index-check",
      "acessoSupabaseUrl", "acessoAnonKey", "acessoApiBase", "acessoFallback", "acessoSupabaseScript", "acessoHtml",
      "painelAuth", "painelFlow", "painelHealth", "painelSessionCall",
      "supabaseCdn", "supabaseSession", "renderCore", "renderLab", "renderTokens",
      "flowLanding", "flowSupabaseJs", "flowSession", "flowHealth"
    ].forEach((id) => setValue(id, "aguardando"));
    setValue("renderPost", "não executado");

    state.html = {};
    state.statuses = {};
    state.issues = [];
    state.renderBase = FALLBACK_RENDER_BASE;
    renderIssues();
  }

  function addIssue(message) {
    if (!state.issues.includes(message)) state.issues.push(message);
    renderIssues();
  }

  function renderIssues() {
    const container = document.getElementById("issuesList");
    if (!container) return;

    container.innerHTML = "";
    const issues = state.issues.length ? state.issues : ["Nenhum problema consolidado até agora."];

    issues.forEach((message) => {
      const card = document.createElement("div");
      card.className = "field";
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = "Achado";
      const value = document.createElement("div");
      value.className = "value";
      value.textContent = message;
      card.append(label, value);
      container.appendChild(card);
    });
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        cache: "no-store",
        ...options,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  }

  function formatHeaders(headers) {
    return [headers.get("content-type"), headers.get("cache-control")].filter(Boolean).join(" • ");
  }

  function asStatus(response, elapsedMs) {
    return `HTTP ${response.status} • ${elapsedMs}ms${formatHeaders(response.headers) ? ` • ${formatHeaders(response.headers)}` : ""}`;
  }

  async function checkPagesUrl(item) {
    const url = new URL(item.path, TARGET_BASE).toString();
    log(`GET ${url}`);
    const t0 = performance.now();

    try {
      const response = await fetchWithTimeout(url, { method: "GET" });
      const elapsed = Math.round(performance.now() - t0);
      const body = await response.text();
      state.statuses[item.path || "/"] = { ok: response.ok, status: response.status, elapsed, url };
      state.html[item.path || "/"] = body;
      setValue(item.id, asStatus(response, elapsed));

      if (!response.ok) {
        addIssue(`${item.label} retornou HTTP ${response.status}.`);
        log(`${item.label} falhou com HTTP ${response.status}`, "err");
      } else {
        log(`${item.label} respondeu em ${elapsed}ms`);
      }

      return { response, body, elapsed };
    } catch (error) {
      const message = error.name === "AbortError"
        ? `${item.label} excedeu ${FETCH_TIMEOUT_MS}ms`
        : `${item.label} falhou: ${error.message}`;
      setValue(item.id, message);
      addIssue(message);
      log(message, "err");
      return null;
    }
  }

  function extractCreateClientConfig(scriptText) {
    const match = scriptText.match(/createClient\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/s);
    if (!match) return null;
    return { url: match[1], anonKey: match[2] };
  }

  function analyzeHtml(htmlText) {
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const scripts = Array.from(doc.scripts);
    const inlineScript = scripts.map((script) => script.textContent || "").join("\n");
    const createClientConfig = extractCreateClientConfig(inlineScript);
    const apiBaseMatch = inlineScript.match(/(?:(?:const|let|var)\s+)?(?:window\.)?API_BASE\s*=\s*['"]([^'"]+)['"]/i);
    const healthMatches = inlineScript.match(/\/health\/(core|lab|tokens)/g) || [];
    const redirectsToAccess = /(?:window\.)?location(?:\.href)?\s*=\s*['"][^'"]*acesso\.html['"]/i.test(inlineScript)
      || /(?:window\.)?location\.(?:assign|replace)\(\s*['"][^'"]*acesso\.html['"]\s*\)/i.test(inlineScript)
      || (/auth\.getSession\s*\(/i.test(inlineScript) && /acesso\.html/i.test(inlineScript));

    return {
      validHtml: Boolean(doc.querySelector("html") && doc.querySelector("head") && doc.querySelector("body")),
      hasSupabaseScript: scripts.some((script) => /supabase-js@2/i.test(script.src || "")),
      createClientConfig,
      hasFallbackToken: inlineScript.includes("TOKEN-GRATIS-TESTE"),
      requiresAuthRedirect: /auth\.getSession\s*\(/i.test(inlineScript) && redirectsToAccess,
      callsGetSession: /auth\.getSession\s*\(/i.test(inlineScript),
      flowDefined: /\bflow\b/.test(inlineScript),
      apiBase: apiBaseMatch ? apiBaseMatch[1] : "",
      healthEndpoints: Array.from(new Set(healthMatches))
    };
  }

  function reportAccessChecks(report) {
    setValue("acessoSupabaseUrl", report.createClientConfig?.url || "ausente");
    setValue(
      "acessoAnonKey",
      report.createClientConfig
        ? report.createClientConfig.anonKey.includes("*")
          ? "configurada, mas redigida"
          : `configurada (${Math.min(report.createClientConfig.anonKey.length, 12)}+ chars)`
        : "ausente"
    );
    setValue("acessoApiBase", report.apiBase || "não configurado");
    setValue("acessoFallback", report.hasFallbackToken ? "presente" : "ausente");
    setValue("acessoSupabaseScript", report.hasSupabaseScript ? "carregado no HTML" : "ausente");
    setValue("acessoHtml", report.validHtml ? "estrutura básica válida" : "estrutura inválida");

    if (!report.createClientConfig?.url) addIssue("acesso.html não expõe configuração de URL do Supabase.");
    if (!report.createClientConfig?.anonKey) addIssue("acesso.html não expõe anon key do Supabase.");
    if (!report.apiBase) addIssue("acesso.html não define API_BASE.");
    if (!report.hasFallbackToken) addIssue("acesso.html não contém fallback TOKEN-GRATIS-TESTE.");
    if (!report.hasSupabaseScript) addIssue("acesso.html não carrega supabase-js@2.");
  }

  function reportPainelChecks(report) {
    setValue("painelAuth", report.requiresAuthRedirect ? "sim, redireciona para acesso.html" : "não detectado");
    setValue("painelFlow", report.flowDefined ? "sim" : "não");
    setValue("painelHealth", report.healthEndpoints.length ? report.healthEndpoints.join(", ") : "não configurados");
    setValue("painelSessionCall", report.callsGetSession ? "usa sb.auth.getSession()" : "não detectado");

    if (!report.requiresAuthRedirect) addIssue("painel.html não mostra guarda clara de autenticação para acesso.html.");
    if (!report.flowDefined) addIssue("painel.html não define constantes FLOW.");
    if (!report.healthEndpoints.length) addIssue("painel.html não referencia endpoints de health.");
  }

  function getRenderBase(accessReport, painelReport) {
    return accessReport.apiBase || painelReport.apiBase || FALLBACK_RENDER_BASE;
  }

  function loadSupabaseSdk() {
    if (window.supabase?.createClient) {
      setValue("supabaseCdn", "já disponível no navegador");
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SUPABASE_CDN}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error("Falha ao carregar SDK Supabase")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = SUPABASE_CDN;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar SDK Supabase"));
      document.head.appendChild(script);
    });
  }

  async function checkSupabaseSession(accessReport) {
    try {
      await loadSupabaseSdk();
      setValue("supabaseCdn", "carregado com sucesso");
      setValue("flowSupabaseJs", "carregado");
      log("SDK Supabase carregado no navegador");
    } catch (error) {
      setValue("supabaseCdn", error.message);
      setValue("flowSupabaseJs", error.message);
      addIssue(error.message);
      log(error.message, "err");
      return;
    }

    const config = accessReport.createClientConfig;
    if (!config?.url || !config?.anonKey || config.anonKey.includes("*")) {
      const message = "Não foi possível validar sb.auth.getSession(): chave indisponível ou redigida.";
      setValue("supabaseSession", message);
      setValue("flowSession", message);
      addIssue(message);
      return;
    }

    try {
      const client = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const sessionState = data?.session ? "sessão existente" : "sem sessão (esperado sem login)";
      setValue("supabaseSession", sessionState);
      setValue("flowSession", sessionState);
      log(`sb.auth.getSession() → ${sessionState}`);
    } catch (error) {
      const message = `sb.auth.getSession() falhou: ${error.message}`;
      setValue("supabaseSession", message);
      setValue("flowSession", message);
      addIssue(message);
      log(message, "err");
    }
  }

  async function runPostProbe() {
    const postTarget = `${state.renderBase.replace(/\/+$/, "")}/_diagnostic_probe`;
    const t0 = performance.now();
    try {
      const response = await fetchWithTimeout(postTarget, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: "elayon-presenca-lab", tipo: "fake-post" })
      });
      const elapsed = Math.round(performance.now() - t0);
      const body = await response.text();
      setValue("renderPost", `HTTP ${response.status} • ${elapsed}ms`);
      log(`POST fake ${postTarget} → HTTP ${response.status} em ${elapsed}ms`);
      if (!response.ok) addIssue(`POST fake para API_BASE respondeu HTTP ${response.status}: ${body.slice(0, 120)}`);
    } catch (error) {
      const message = `POST fake API_BASE falhou: ${error.message}`;
      setValue("renderPost", message);
      addIssue(message);
      log(message, "err");
    }
  }

  async function checkRender(renderBase) {
    state.renderBase = renderBase;
    const checks = [
      { id: "renderCore", path: "/health/core" },
      { id: "renderLab", path: "/health/lab" },
      { id: "renderTokens", path: "/health/tokens" }
    ];

    let anyOk = false;

    for (const item of checks) {
      const url = `${renderBase}${item.path}`;
      const t0 = performance.now();
      try {
        const response = await fetchWithTimeout(url, { method: "GET" });
        const elapsed = Math.round(performance.now() - t0);
        const body = await response.text();
        setValue(item.id, `HTTP ${response.status} • ${elapsed}ms`);
        log(`${item.path} → HTTP ${response.status} em ${elapsed}ms`);
        if (!response.ok) {
          addIssue(`${item.path} retornou HTTP ${response.status}: ${body.slice(0, 120)}`);
        } else {
          anyOk = true;
        }
      } catch (error) {
        const message = `${item.path} falhou: ${error.message}`;
        setValue(item.id, message);
        addIssue(message);
        log(message, "err");
      }
    }

    setValue("flowHealth", anyOk ? "health acessível" : "health indisponível");
  }

  async function run() {
    resetValues();
    LAB.clearLog();
    log("Iniciando diagnóstico do Elayon Space");
    log(`Base alvo: ${TARGET_BASE}`);

    for (const item of URLS) {
      await checkPagesUrl(item);
    }

    const landing = state.statuses["/"] || state.statuses["index.html"];
    setValue("flowLanding", landing?.ok ? `ok (${landing.status})` : "falhou");

    const accessStatus = state.statuses["acesso.html"];
    const painelStatus = state.statuses["painel.html"];
    const accessHtml = accessStatus?.ok ? state.html["acesso.html"] : "";
    const painelHtml = painelStatus?.ok ? state.html["painel.html"] : "";
    const painelReport = painelHtml ? analyzeHtml(painelHtml) : { apiBase: "", healthEndpoints: [] };

    if (accessHtml) {
      const accessReport = analyzeHtml(accessHtml);
      reportAccessChecks(accessReport);
      if (painelHtml) {
        reportPainelChecks(painelReport);
      } else {
        setValue("painelAuth", "arquivo indisponível");
        setValue("painelFlow", "arquivo indisponível");
        setValue("painelHealth", "arquivo indisponível");
        setValue("painelSessionCall", "arquivo indisponível");
      }

      await checkSupabaseSession(accessReport);
      await checkRender(getRenderBase(accessReport, painelReport));
    } else {
      setValue("acessoSupabaseUrl", "arquivo indisponível");
      setValue("acessoAnonKey", "arquivo indisponível");
      setValue("acessoApiBase", "arquivo indisponível");
      setValue("acessoFallback", "arquivo indisponível");
      setValue("acessoSupabaseScript", "arquivo indisponível");
      setValue("acessoHtml", "arquivo indisponível");
      if (painelHtml) {
        reportPainelChecks(painelReport);
      } else {
        setValue("painelAuth", "arquivo indisponível");
        setValue("painelFlow", "arquivo indisponível");
        setValue("painelHealth", "arquivo indisponível");
        setValue("painelSessionCall", "arquivo indisponível");
      }
      addIssue("Sem acesso ao HTML real de acesso.html; análises de Supabase e API_BASE não puderam ser completadas.");
      await checkRender(getRenderBase({ apiBase: "" }, painelReport));
    }

    log("Diagnóstico finalizado");
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderIssues();
    document.getElementById("btnRun")?.addEventListener("click", run);
    document.getElementById("btnPostProbe")?.addEventListener("click", runPostProbe);
    document.getElementById("btnClear")?.addEventListener("click", LAB.clearLog);
  });
})();
