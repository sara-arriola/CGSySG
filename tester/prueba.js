let mic, amplitude, fft;
let micReady = false;

let fondo;
let bordes = [];
let rellenos1 = [];

let threshold = 0.010;
let Dibujos = [];
let duracionDibujo = 10000;

let sonidoActivo = false;
let sonidoActivoDesde = null;
let dibujosActuales = [];

let tipoNotaSostenida = null;
let tiempoNotaSostenida = null;

const UMBRAL_GRAVE = 200;
const UMBRAL_AGUDO = 350;

function preload() {
  fondo = loadImage("imagenes/fondo.png");

  bordes.push(loadImage("imagenes/delineado.png"));
  for (let i = 1; i <= 4; i++) {
    bordes.push(loadImage(`imagenes/delineado${i}.png`));
  }

  let colores = ["amarillo", "azul", "bordo", "rojo", "verde"];

  for (let i = 0; i <= 4; i++) {
    let grupo = [];
    let baseNombre = i === 0 ? "relleno" : `relleno${i}`;
    for (let color of colores) {
      grupo.push(loadImage(`imagenes/${baseNombre}_${color}.png`));
    }
    rellenos1.push(grupo);
  }
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

  background(230, 244, 254);
  image(fondo, width / 2, height / 2);

  let ahora = millis();
  let level = amplitude.getLevel();
  let freq = obtenerFrecuenciaDominante();

  // Mostrar info
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("🎚 Volumen: " + nf(level, 1, 3), 20, 20);
  text("🎵 Frecuencia: " + nf(freq, 1, 2) + " Hz", 20, 40);

  // Clasificación del tipo de nota sostenida
  if (freq < UMBRAL_GRAVE) {
    if (tipoNotaSostenida !== "grave") {
      tipoNotaSostenida = "grave";
      tiempoNotaSostenida = millis();
    }
  } else if (freq > UMBRAL_AGUDO) {
    if (tipoNotaSostenida !== "aguda") {
      tipoNotaSostenida = "aguda";
      tiempoNotaSostenida = millis();
    }
  } else {
    tipoNotaSostenida = null;
    tiempoNotaSostenida = null;
  }

  // Actualizar dibujos
  Dibujos = Dibujos.filter((d) => d.estaVivo());
  for (let d of Dibujos) {
    d.aplicarMovimientoExtra(tipoNotaSostenida);
    d.dibujar();
  }

  // Detección de sonido
  if (level > threshold) {
    if (!sonidoActivo) {
      sonidoActivo = true;
      sonidoActivoDesde = ahora;
      dibujosActuales = agregarDibujos(level);
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
  }
}

// ------------------------
// Clase Dibujo
// ------------------------
class Dibujo {
  constructor(x, y, tam, rellenos, borde, rotacionInicial) {
    this.x = x;
    this.y = y;
    this.tam = tam;
    this.rellenos = rellenos;
    this.borde = borde;
    this.rotacion = rotacionInicial;

    this.esProlongado = false;
    this.tiempoCreacion = millis();
    this.tiempoMuerte = null;
    this.velRotacion = 0;

    this.colorIndex = 0;
    this.transicionVel = 0.02;

    // Movimiento para agudo
    this.vx = 1.5;
    this.vy = 1.5;
  }

  estaVivo() {
    if (this.esProlongado) {
      if (this.tiempoMuerte === null) return true;
      return millis() - this.tiempoMuerte < duracionDibujo;
    } else {
      return millis() - this.tiempoCreacion < duracionDibujo;
    }
  }

  incrementarRotacion() {
    this.esProlongado = true;
    this.velRotacion += 0.01;
    this.colorIndex += this.transicionVel;
    if (this.colorIndex >= this.rellenos.length) {
      this.colorIndex = 0;
    }
  }

  aplicarMovimientoExtra(tipo) {
    if (!this.esProlongado) return;

    if (tipo === "grave") {
      this.x += random(-2, 2);
      this.y += random(-2, 2);
    } else if (tipo === "aguda") {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < this.tam / 2 || this.x > width - this.tam / 2) this.vx *= -1;
      if (this.y < this.tam / 2 || this.y > height - this.tam / 2) this.vy *= -1;
    }
  }

  dibujar() {
    let alpha = 255;
    let vida = millis() - (this.tiempoMuerte ?? this.tiempoCreacion);
    if (vida > duracionDibujo - 1000) {
      alpha = map(vida, duracionDibujo - 1000, duracionDibujo, 255, 0);
    }

    let idxA = floor(this.colorIndex) % this.rellenos.length;
    let idxB = (idxA + 1) % this.rellenos.length;
    let inter = this.colorIndex % 1;
    let imagenInterpolada = inter < 0.5 ? this.rellenos[idxA] : this.rellenos[idxB];

    push();
    translate(this.x, this.y);
    rotate(this.rotacion + this.velRotacion);
    tint(255, alpha);
    image(imagenInterpolada, 0, 0, this.tam, this.tam);
    image(this.borde, 0, 0, this.tam, this.tam);
    pop();
  }

  comenzarCountdown() {
    if (this.tiempoMuerte === null) {
      this.tiempoMuerte = millis();
    }
  }
}

// ------------------------
// Utilidades
// ------------------------
function obtenerFrecuenciaDominante() {
  let spectrum = fft.analyze();
  let maxIndex = spectrum.reduce((maxIdx, val, idx, arr) =>
    val > arr[maxIdx] ? idx : maxIdx, 0);
  return (maxIndex * (sampleRate() / 2)) / spectrum.length;
}

function agregarDibujos(level) {
  let freq = obtenerFrecuenciaDominante();
  const colores = ["amarillo", "azul", "bordo", "rojo", "verde"];

  let indicesDeseados;
  if (freq < UMBRAL_GRAVE) {
    indicesDeseados = [1, 4, 2]; // azul, verde, bordo
  } else if (freq > UMBRAL_AGUDO) {
    indicesDeseados = [3, 0]; // rojo, amarillo
  } else {
    indicesDeseados = [0, 1, 2, 3, 4];
  }

  let nuevos = [];

  for (let i = 0; i < 5; i++) {
    let tipo = floor(random(bordes.length));
    let tam = map(level, threshold, 0.2, 80, 300, true);
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    let rotacion = random(-PI, PI);

    let rellenoSet = rellenos1[tipo];
    let rellenosFiltrados = indicesDeseados.map(i => rellenoSet[i]);
    let rellenosClon = shuffle(rellenosFiltrados.slice());
    let borde = bordes[tipo];

    let nuevo = new Dibujo(x, y, tam, rellenosClon, borde, rotacion);
    Dibujos.push(nuevo);
    nuevos.push(nuevo);
  }

  return nuevos;
}
