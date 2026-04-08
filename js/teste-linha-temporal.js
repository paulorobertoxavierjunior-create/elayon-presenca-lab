const logBox = document.getElementById("logBox");
const statusUI = document.getElementById("status");
const ultimoPontoUI = document.getElementById("ultimoPonto");
const leituraAtualUI = document.getElementById("leituraAtual");
const serieUI = document.getElementById("serieUI");

const canvas = document.getElementById("timelineCanvas");
const ctx = canvas.getContext("2d");

const KEY_SERIE = "elayon_timeline_v101";

let autoTimer = null;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

function fitCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(320 * devicePixelRatio);
}
fitCanvas();
window.addEventListener("resize", () => {
  fitCanvas();
  desenharSerie();
});

function clamp(n) {
  return Math.max(0, Math.min(100, Number(n || 0)));
}

function lerSerie() {
  try {
    return JSON.parse(localStorage.getItem(KEY_SERIE) || "[]");
  } catch {
    return [];
  }
}

function salvarSerie(serie) {
  localStorage.setItem(KEY_SERIE, JSON.stringify(serie));
}

function atualizarSerieUI() {
  serieUI.innerText = JSON.stringify(lerSerie(), null, 2);
}

function montarPonto() {
  return {
    silencio_pct: clamp(document.getElementById("inputSilencio").value),
    pause_count: clamp(document.getElementById("inputPausas").value),
    energia_pct: clamp(document.getElementById("inputEnergia").value),
    continuidade_pct: clamp(document.getElementById("inputContinuidade").value),
    timestamp: new Date().toISOString()
  };
}

function gerarLeitura(ponto) {
  if (ponto.silencio_pct > 40) return "ritmo mais recolhido / possível dispersão";
  if (ponto.pause_count > 6) return "pensamento mais fragmentado";
  if (ponto.energia_pct > 70 && ponto.continuidade_pct > 70) return "boa presença com continuidade";
  if (ponto.energia_pct < 35) return "energia mais baixa / possível desaceleração";
  return "estado moderado com continuidade parcial";
}

function registrarPonto() {
  const ponto = montarPonto();
  const serie = lerSerie();

  serie.push(ponto);
  const serieCurta = serie.slice(-20);
  salvarSerie(serieCurta);

  ultimoPontoUI.innerText = JSON.stringify(ponto);
  leituraAtualUI.innerText = gerarLeitura(ponto);
  statusUI.innerText = "ponto registrado";

  atualizarSerieUI();
  desenharSerie();

  log("ponto temporal registrado");
}

function desenharSerie() {
  const serie = lerSerie();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // fundo
  ctx.fillStyle = "#f7fbfc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grade
  ctx.strokeStyle = "rgba(18,52,59,0.08)";
  ctx.lineWidth = 1 * devicePixelRatio;
  for (let i = 1; i < 5; i++) {
    const y = (canvas.height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  if (serie.length === 0) return;

  const series = [
    { key: "silencio_pct", color: "rgba(183,72,90,0.95)", label: "silêncio" },
    { key: "energia_pct", color: "rgba(105,188,195,0.95)", label: "energia" },
    { key: "continuidade_pct", color: "rgba(44,107,116,0.95)", label: "continuidade" }
  ];

  function drawLine(key, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * devicePixelRatio;
    ctx.beginPath();

    serie.forEach((ponto, i) => {
      const x = serie.length === 1
        ? canvas.width / 2
        : (i / (serie.length - 1)) * canvas.width;

      const y = canvas.height - ((ponto[key] / 100) * canvas.height);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  series.forEach(s => drawLine(s.key, s.color));

  // legenda
  ctx.font = `${14 * devicePixelRatio}px Arial`;
  let lx = 16 * devicePixelRatio;
  const ly = 24 * devicePixelRatio;

  series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, ly - 10 * devicePixelRatio, 18 * devicePixelRatio, 6 * devicePixelRatio);
    ctx.fillStyle = "#12343b";
    ctx.fillText(s.label, lx + 26 * devicePixelRatio, ly);
    lx += 170 * devicePixelRatio;
  });
}

function autoSimular() {
  if (autoTimer) return;

  statusUI.innerText = "simulação ativa";
  log("simulação automática iniciada");

  autoTimer = setInterval(() => {
    document.getElementById("inputSilencio").value = clamp(Math.round(10 + Math.random() * 45));
    document.getElementById("inputPausas").value = clamp(Math.round(1 + Math.random() * 8));
    document.getElementById("inputEnergia").value = clamp(Math.round(25 + Math.random() * 65));
    document.getElementById("inputContinuidade").value = clamp(Math.round(20 + Math.random() * 75));
    registrarPonto();
  }, 1200);
}

function pararSimulacao() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    statusUI.innerText = "simulação parada";
    log("simulação automática parada");
  }
}

function resetarTudo() {
  pararSimulacao();
  localStorage.removeItem(KEY_SERIE);

  statusUI.innerText = "aguardando";
  ultimoPontoUI.innerText = "—";
  leituraAtualUI.innerText = "—";
  serieUI.innerText = "[]";
  logBox.innerText = "";

  desenharSerie();
  log("linha temporal resetada");
}

document.getElementById("btnRegistrarPonto").onclick = registrarPonto;
document.getElementById("btnAutoSimular").onclick = autoSimular;
document.getElementById("btnPararSimulacao").onclick = pararSimulacao;
document.getElementById("btnResetar").onclick = resetarTudo;
document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

atualizarSerieUI();
desenharSerie();
log("sistema pronto para teste 10.1");