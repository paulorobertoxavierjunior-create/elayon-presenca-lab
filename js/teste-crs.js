(function () {
  const LAB = window.ELAYON_LAB;
  const URL_CRS = "https://nucleo-crs-elayon.onrender.com/api/crs/analisar";
  const TIMEOUT_MS = 12000;

  function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
  }

  function buildPayload() {
    return {
      context: (document.getElementById("inpContext")?.value || "").trim(),
      transcript_raw: (document.getElementById("inpTranscript")?.value || "").trim(),
      duration_sec: Number(document.getElementById("inpDuration")?.value || 0),
      silence_pct: Number(document.getElementById("inpSilence")?.value || 0),
      pause_count: Number(document.getElementById("inpPauseCount")?.value || 0),
      mean_pause_ms: Number(document.getElementById("inpPauseMean")?.value || 0),
      source_text: "teste laboratorial",
      timeline_events: [],
      uploaded_file_name: ""
    };
  }

  async function enviarCRS() {
    try {
      const payload = buildPayload();

      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnEnviarCRS");
      LAB.setValue("canalAtual", "DOM → JavaScript → fetch → CRS cloud");
      LAB.setValue("receptorAtual", "endpoint /api/crs/analisar");
      LAB.setValue("payloadAtual", JSON.stringify(payload, null, 2));
      LAB.setValue("ultimoEvento", "enviando payload para o CRS");

      LAB.appendLog("Emissor acionado: botão #btnEnviarCRS");
      LAB.appendLog(`Canal aberto: POST ${URL_CRS}`);
      LAB.appendLog(`Payload enviado: ${JSON.stringify(payload)}`);

      const t0 = performance.now();

      const response = await fetchWithTimeout(URL_CRS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const elapsed = Math.round(performance.now() - t0);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("CRS respondeu, mas não retornou JSON válido");
      }

      LAB.setValue("statusGeral", `ok (${elapsed}ms)`);
      LAB.setValue("respostaAtual", JSON.stringify(json, null, 2));
      LAB.setValue("ultimoEvento", "resposta JSON recebida");

      LAB.appendLog(`CRS respondeu em ${elapsed}ms`);
      LAB.appendLog(`Resumo: ${json?.user_report?.summary || "sem summary"}`);
      LAB.appendLog("Resposta JSON recebida com sucesso");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function resetTeste() {
    LAB.resetDiagnostics();
    LAB.setValue("statusGeral", "aguardando");
    LAB.setValue("respostaAtual", "—");
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    LAB.resetDiagnostics();
    LAB.appendLog("Página carregada. Sistema pronto para teste do CRS.");

    document.getElementById("btnEnviarCRS")?.addEventListener("click", enviarCRS);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTeste);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();