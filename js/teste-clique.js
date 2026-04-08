(function () {
  const LAB = window.ELAYON_LAB;

  function runTest() {
    try {
      const payload = {
        acao: "teste_clique",
        origem: "botao_html",
        ts: new Date().toISOString()
      };

      LAB.setValue("statusGeral", "executando");
      LAB.setValue("emissorAtual", "botão #btnExecutarTeste");
      LAB.setValue("canalAtual", "DOM → JavaScript");
      LAB.setValue("receptorAtual", "elementos da própria página");
      LAB.setValue("payloadAtual", JSON.stringify(payload, null, 2));
      LAB.setValue("ultimoEvento", "evento click disparado");

      LAB.appendLog("Emissor acionado: botão #btnExecutarTeste");
      LAB.appendLog("Canal aberto: DOM → JavaScript");
      LAB.appendLog("Payload montado com sucesso");
      LAB.appendLog("Receptor definido: campos de diagnóstico da página");

      const response = {
        ok: true,
        mensagem: "Teste de clique executado com sucesso.",
        destino: "painel DOM local"
      };

      LAB.setValue("respostaAtual", JSON.stringify(response, null, 2));
      LAB.setValue("statusGeral", "aprovado");
      LAB.setValue("ultimoEvento", "resposta renderizada no DOM");

      LAB.appendLog("Resposta recebida do código local");
      LAB.appendLog("Feedback renderizado no receptor");
      LAB.appendLog("Teste 1 concluído com sucesso", "ok");
    } catch (error) {
      LAB.setValue("statusGeral", "falhou");
      LAB.setError(error);
    }
  }

  function resetTest() {
    LAB.resetDiagnostics();
    LAB.appendLog("Diagnóstico resetado", "warn");
  }

  document.addEventListener("DOMContentLoaded", () => {
    LAB.resetDiagnostics();
    LAB.appendLog("Página carregada. Sistema pronto para teste.");

    document.getElementById("btnExecutarTeste")?.addEventListener("click", runTest);
    document.getElementById("btnResetarTeste")?.addEventListener("click", resetTest);
    document.getElementById("btnLimparLog")?.addEventListener("click", LAB.clearLog);
  });
})();