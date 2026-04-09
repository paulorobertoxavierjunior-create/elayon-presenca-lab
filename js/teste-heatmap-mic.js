const logBox = document.getElementById("logBox");
const statusUI = document.getElementById("status");
const leituraAtualUI = document.getElementById("leituraAtual");
const volumeAtualUI = document.getElementById("volumeAtual");
const faixaAtualUI = document.getElementById("faixaAtual");
const silencioEstimadoUI = document.getElementById("silencioEstimado");
const energiaEstimadaUI = document.getElementById("energiaEstimada");
const oscilacaoEstimadoUI = document.getElementById("oscilacaoEstimada");

const canvas = document.getElementById("heatmapCanvas");
const ctx = canvas.getContext("2d");

let stream = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let freqArray = null;
let animId = null;
let running = false;

let frameCount = 0;
let silenceFrames = 0;
let energyAccum = 0;
let lastVolume = 0;
let oscillationAccum = 0;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  logBox.innerText += `[${t}] ${msg}\n`;
}

function fitCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(360 * devicePixelRatio);
}
fitCanvas();

window.addEventListener("resize", () => {
  fitCanvas();
  clearCanvas();
});

function clearCanvas() {
  ctx.fillStyle = "#050c12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
clearCanvas();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rmsFromTimeDomain(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = (arr[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / arr.length);
}

function averageBand(arr, start, end) {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i++) {
    sum += arr[i];
    count++;
  }
  return count ? sum / count : 0;
}

async function ligarMic() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    source.connect(analyser);

    dataArray = new Uint8Array(analyser.fftSize);
    freqArray = new Uint8Array(analyser.frequencyBinCount);

    statusUI.innerText = "microfone ligado";
    log("microfone ligado com sucesso");
  } catch (err) {
    statusUI.innerText = "erro no microfone";
    log("ERRO: " + err.message);
  }
}

function leituraAtual(volume, graves, medios, agudos) {
  if (volume < 8) return "silêncio ou fala muito baixa";
  if (agudos > medios + 25) return "agudos destacados / possível tensão";
  if (graves > medios + 20) return "presença grave mais encorpada";
  if (medios > 65 && volume > 18) return "boa presença vocal com continuidade";
  return "estado vocal moderado";
}

function faixaDominante(graves, medios, agudos) {
  if (graves >= medios && graves >= agudos) return "graves";
  if (medios >= graves && medios >= agudos) return "médios";
  return "agudos";
}

function colorForValue(v) {
  const n = clamp(v, 0, 100) / 100;

  const r = Math.floor(255 * n);
  const g = Math.floor(80 + (170 * n));
  const b = Math.floor(255 - (160 * n));

  return `rgb(${r},${g},${b})`;
}

function drawColumn(graves, medios, agudos, ruido) {
  const image = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
  ctx.putImageData(image, 0, 0);

  const bands = [
    { value: agudos, yStart: 0.00, yEnd: 0.25 },
    { value: medios, yStart: 0.25, yEnd: 0.55 },
    { value: graves, yStart: 0.55, yEnd: 0.82 },
    { value: ruido,  yStart: 0.82, yEnd: 1.00 }
  ];

  bands.forEach((band) => {
    const y1 = Math.floor(canvas.height * band.yStart);
    const y2 = Math.floor(canvas.height * band.yEnd);

    ctx.fillStyle = colorForValue(band.value);
    ctx.fillRect(canvas.width - 1, y1, 1, y2 - y1);
  });
}

function loop() {
  if (!running || !analyser) return;

  analyser.getByteTimeDomainData(dataArray);
  analyser.getByteFrequencyData(freqArray);

  const rms = rmsFromTimeDomain(dataArray);
  const volume = Math.round(clamp(rms * 140, 0, 100));

  const graves = Math.round(clamp(averageBand(freqArray, 2, 12) / 2.55, 0, 100));
  const medios = Math.round(clamp(averageBand(freqArray, 12, 40) / 2.55, 0, 100));
  const agudos = Math.round(clamp(averageBand(freqArray, 40, 90) / 2.55, 0, 100));
  const ruido = Math.round(clamp(averageBand(freqArray, 90, freqArray.length) / 2.55, 0, 100));

  const faixa = faixaDominante(graves, medios, agudos);
  const leitura = leituraAtual(volume, graves, medios, agudos);

  frameCount++;
  energyAccum += volume;
  if (volume < 8) silenceFrames++;
  oscillationAccum += Math.abs(volume - lastVolume);
  lastVolume = volume;

  volumeAtualUI.innerText = `${volume}%`;
  faixaAtualUI.innerText = faixa;
  leituraAtualUI.innerText = leitura;

  silencioEstimadoUI.innerText = `${Math.round((silenceFrames / frameCount) * 100)}%`;
  energiaEstimadaUI.innerText = `${Math.round(energyAccum / frameCount)}%`;
  oscilacaoEstimadoUI.innerText = `${Math.round(oscillationAccum / frameCount)}%`;

  drawColumn(graves, medios, agudos, ruido);

  animId = requestAnimationFrame(loop);
}

function iniciarHeatmap() {
  if (!analyser) {
    log("ERRO: ligue o microfone antes");
    statusUI.innerText = "microfone necessário";
    return;
  }

  if (running) return;

  running = true;
  statusUI.innerText = "heatmap ativo";
  log("heatmap iniciado");
  loop();
}

function pararHeatmap() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  statusUI.innerText = "heatmap parado";
  log("heatmap parado");
}

async function resetarTudo() {
  pararHeatmap();

  frameCount = 0;
  silenceFrames = 0;
  energyAccum = 0;
  lastVolume = 0;
  oscillationAccum = 0;

  volumeAtualUI.innerText = "—";
  faixaAtualUI.innerText = "—";
  leituraAtualUI.innerText = "—";
  silencioEstimadoUI.innerText = "—";
  energiaEstimadaUI.innerText = "—";
  oscilacaoEstimadoUI.innerText = "—";

  clearCanvas();
  logBox.innerText = "";

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  if (audioContext && audioContext.state !== "closed") {
    try {
      await audioContext.close();
    } catch {}
  }

  audioContext = null;
  analyser = null;
  dataArray = null;
  freqArray = null;

  statusUI.innerText = "aguardando";
  log("sistema resetado");
}

document.getElementById("btnLigarMic").onclick = ligarMic;
document.getElementById("btnIniciarHeatmap").onclick = iniciarHeatmap;
document.getElementById("btnPararHeatmap").onclick = pararHeatmap;
document.getElementById("btnResetar").onclick = resetarTudo;
document.getElementById("btnLimparLog").onclick = () => {
  logBox.innerText = "";
};

log("sistema pronto para teste 10.3");