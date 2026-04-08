const logBox = document.getElementById("logBox");
const statusUI = document.getElementById("status");
const leituraAtualUI = document.getElementById("leituraAtual");
const ultimoQuadroUI = document.getElementById("ultimoQuadro");
const serieUI = document.getElementById("serieUI");

const barGravesUI = document.getElementById("barGraves");
const barMediosUI = document.getElementById("barMedios");
const barAgudosUI = document.getElementById("barAgudos");
const barRuidoUI = document.getElementById("barRuido");

const canvas = document.getElementById("spectrumCanvas");
const ctx = canvas.getContext("2d");

const KEY_SERIE = "elayon_spectrum_v102";
let autoTimer = null;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

function clamp(n) {
  return Math.max(0, Math.min(100, Number(n || 0)));
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

function randDelta(amplitude) {
  return (Math.random() * amplitude * 2) - amplitude;
}

function gerarQuadro() {
  const silencioBase = clamp(document.getElementById("inputSilencioBase").value);
  const energiaBase = clamp(document.getElementById("inputEnergiaBase").value);
  const estabilidadeBase = clamp(document.getElementById("inputEstabilidadeBase").value);
  const variacaoBase = clamp(document.getElementById("inputVariacaoBase").value);

  const ruido = clamp(silencioBase + randDelta(variacaoBase * 0.6));
  const graves = clamp((energiaBase * 0.75) + randDelta(variacaoBase));
  const medios = clamp(energiaBase + randDelta(variacaoBase * 0.8));
  const agudos = clamp((energiaBase * 0.65) + randDelta(variacaoBase * 1.2));
  const estabilidade = clamp(estabilidadeBase + randDelta(variacaoBase * 0.5));

  return {
    graves: Math.round(graves),
    medios: Math.round(medios),
    agudos: Math.round(agudos),
    ruido: Math.round(ruido),
    estabilidade: Math.round(estabilidade),
    timestamp: new Date().toISOString()
  };
}

function gerarLeitura(quadro) {
  if (quadro.ruido > 40) return "ruído mais alto / possível interferência";
  if (quadro.estabilidade < 45) return "oscilação relevante no sinal";
  if (quadro.medios > 70 && quadro.estabilidade > 65) return "boa presença espectral e continuidade";
  if (quadro.graves > quadro.agudos + 20) return "predomínio de base / voz mais encorpada";
  if (quadro.agudos > quadro.medios + 15) return "agudos destacados / possível tensão";
  return "estado espectral moderado";
}

function registrarQuadro() {
  const quadro = gerarQuadro();
  const serie = lerSerie();

  serie.push(quadro);
  const curta = serie.slice(-24);
  salvarSerie(curta);

  statusUI.innerText = "quadro registrado";
  leituraAtualUI.innerText = gerarLeitura(quadro);
  ultimoQuadroUI.innerText = JSON.stringify(quadro);

  barGravesUI.innerText = `${quadro.graves}%`;
  barMediosUI.innerText = `${quadro.medios}%`;
  barAgudosUI.innerText = `${quadro.agudos}%`;
  barRuidoUI.innerText = `${quadro.ruido}%`;

  atualizarSerieUI();
  desenharSerie();

  log("quadro espectral registrado");
}

function desenharSerie() {
  const serie = lerSerie();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#06141b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1 * devicePixelRatio;

  for (let i = 1; i < 6; i++) {
    const y = (canvas.height / 6) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  if (serie.length === 0) return;

  const linhas = [
    { key: "graves", color: "rgba(255,80,120,0.95)", label: "graves" },
    { key: "medios", color: "rgba(255,220,80,0.95)", label: "médios" },
    { key: "agudos", color: "rgba(80,220,255,0.95)", label: "agudos" },
    { key: "ruido", color: "rgba(180,180,180,0.75)", label: "ruído" }
  ];

  function drawLine(key, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * devicePixelRatio;
    ctx.beginPath();

    serie.forEach((quadro, i) => {
      const x = serie.length === 1
        ? canvas.width / 2
        : (i / (serie.length - 1)) * canvas.width;

      const y = canvas.height - ((quadro[key] / 100) * canvas.height);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  linhas.forEach(l => drawLine(l.key, l.color));

  ctx.font = `${13 * devicePixelRatio}px Arial`;
  let lx = 18 * devicePixelRatio;
  const ly = 24 * devicePixelRatio;

  linhas.forEach((l) => {
    ctx.fillStyle = l.color;
    ctx.fillRect(lx, ly - 10 * devicePixelRatio, 16 * devicePixelRatio, 6 * devicePixelRatio);
    ctx.fillStyle = "#f4fbfc";
    ctx.fillText(l.label, lx + 24 * devicePixelRatio, ly);
    lx += 150 * devicePixelRatio;
  });
}

function autoSimular() {
  if (autoTimer) return;

  statusUI.innerText = "simulação ativa";
  log("simulação espectral iniciada");

  autoTimer = setInterval(() => {
    registrarQuadro();
  }, 900);
}

function pararSimulacao() {
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  statusUI.innerText = "simulação parada";
  log("simulação espectral parada");
}

function resetarTudo() {
  pararSimulacao();
  localStorage.removeItem(KEY_SERIE);

  statusUI.innerText = "aguardando";
  leituraAtualUI.innerText = "—";
  ultimoQuadroUI.innerText = "—";
  serieUI.innerText = "[]";
  barGravesUI.innerText = "—";
  barMediosUI.innerText = "—";
  barAgudosUI.innerText = "—";
  barRuidoUI.innerText = "—";
  logBox.innerText = "";

  desenharSerie();
  log("espectro resetado");
}

document.getElementById("btnGerarQuadro").onclick = registrarQuadro;
document.getElementById("btnAutoSimular").onclick = autoSimular;
document.getElementById("btnParar").onclick = pararSimulacao;
document.getElementById("btnResetar").onclick = resetarTudo;
document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

atualizarSerieUI();
desenharSerie();
log("sistema pronto para teste 10.2");