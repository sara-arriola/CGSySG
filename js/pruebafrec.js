let mic, fft;
let micReady = false;
let sampleRate = 44100;

function setup() {
  createCanvas(500, 300);
  textAlign(CENTER, CENTER);
  textSize(20);

  mic = new p5.AudioIn();
  mic.start(
    () => {
      console.log("✅ Micrófono activado correctamente");
      mic.connect();

      fft = new p5.FFT();
      fft.setInput(mic);

      micReady = true;
    },
    (err) => {
      console.error("❌ Error al activar el micrófono:", err);
    }
  );
}

function draw() {
  background(240);

  if (!micReady) {
    text("Esperando al micrófono...", width / 2, height / 2);
    return;
  }

  let spectrum = fft.analyze();
  let nyquist = sampleRate / 2;
  let freqPerBin = nyquist / spectrum.length;

  // Calcular frecuencia media ponderada (por amplitud)
  let sumAmp = 0;
  let weightedSum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    let freq = i * freqPerBin;
    let amp = spectrum[i];
    weightedSum += freq * amp;
    sumAmp += amp;
  }

  let meanFreq = sumAmp > 0 ? weightedSum / sumAmp : 0;

  // Clasificación según la frecuencia promedio
  let tipo;
  if (meanFreq <= 190) {
    tipo = "🎵 Grave";
  } else if (meanFreq <= 600) {
    tipo = "🎚️ Intermedio";
  } else {
    tipo = "🎶 Agudo";
  }

  // Mostrar información
  fill(0);
  textSize(24);
  text("Frecuencia media: " + nf(meanFreq, 0, 1) + " Hz", width / 2, 60);
  text("Tipo: " + tipo, width / 2, 100);

  // Visualización del espectro
  noStroke();
  for (let i = 0; i < spectrum.length; i++) {
    let x = map(i, 0, spectrum.length, 0, width);
    let h = -spectrum[i];
    fill("gray");
    rect(x, height, width / spectrum.length, h);
  }
}
