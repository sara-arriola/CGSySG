// controla la ejecución de p5

let mic, amplitude, fft;
let micReady = false;

let threshold = 0.012;
let Dibujos = [];
let duracionDibujo = 10000;

let sonidoActivo = false;
let sonidoActivoDesde = null;
let dibujosActuales = [];

// variables para la opacidad del fondo
let alphaFondo = 255;        // valor inicial -> se interpola para hacer el fade
let alphaMin = 168;          // 66% aprox de opacidad
let alphaRecuperacion = 3;   // velocidad de recuperación
let alphaOscurecimiento = 3; // qué tan rápido baja la opacidad
let alphaFondoObjetivo = 255; // el alpha deseado (la opacidad del fondo tiende a esto


function preload() {
  cargarImagenes(); // desde gestor.js
}

function setup() {
  createCanvas(fondo.width, fondo.height);
  imageMode(CENTER);

  mic = new p5.AudioIn();
  mic.start(() => {
    mic.connect();
    amplitude = new p5.Amplitude();
    amplitude.setInput(mic);
    fft = new p5.FFT();
    fft.setInput(mic);
    micReady = true;
  }, (err) => {
    console.error("❌ Error al activar el micrófono:", err);
  });
}

function draw() {
  if (!micReady || !amplitude) {
    background(200);
    fill(0);
    text("Esperando al micrófono...", 20, 30);
    return;
  }

  // Fondo: imagen con opacidad variable sobre negro
  background(0); 
  tint(255, alphaFondo);
  image(fondo, width / 2, height / 2);
  tint(255, 255); // reset para otros elementos

  let ahora = millis();
  let level = amplitude.getLevel();

  // Dibujos activos
  Dibujos = Dibujos.filter(d => d.estaVivo());
  for (const d of Dibujos) {
    d.dibujar();
  }

  // Info visual
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`🎚 Volumen: ${nf(level, 1, 3)}`, 20, 20);

  const freq = obtenerFrecuenciaDominante();
  const tipoSonido = freq < 400 ? "Grave" : "Agudo";
  text(`🎵 Frecuencia: ${nf(freq, 1, 2)} Hz (${tipoSonido})`, 20, 40);

  // --- Interacción por sonido ---
   if (level > threshold) {
    if (!sonidoActivo) {
      sonidoActivo = true;
      sonidoActivoDesde = ahora;
      dibujosActuales = agregarDibujos(level);

      // 👉 En vez de bajar de golpe, seteamos el objetivo
      alphaFondoObjetivo = alphaMin;
    }

    if (ahora - sonidoActivoDesde > 1200) {
      for (let d of dibujosActuales) {
        d.incrementarRotacion();
      }
    }
  } else {
    if (sonidoActivo) {
      for (let d of dibujosActuales) {
        if (d.esProlongado) d.comenzarCountdown();
      }
    }
    sonidoActivo = false;
    sonidoActivoDesde = null;

    // 👉 Recuperar suavemente el fondo
    alphaFondoObjetivo = 255;
  }

  // ✨ Interpolación suave del alphaFondo hacia su objetivo
  if (alphaFondo < alphaFondoObjetivo) {
    alphaFondo = min(alphaFondo + alphaRecuperacion, alphaFondoObjetivo);
  } else if (alphaFondo > alphaFondoObjetivo) {
    alphaFondo = max(alphaFondo - alphaOscurecimiento, alphaFondoObjetivo);
  }
}