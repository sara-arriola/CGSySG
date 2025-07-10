let mic, amplitude, fft;
let micReady = false;

let fondo;
let bordes = [];
let rellenos1 = [];

let threshold = 0.010; //mínimo mic sara
let Dibujos = [];
let duracionDibujo = 5000; // 5 segundos

let sonidoActivo = false;
let sonidoActivoDesde = null;
let dibujoActual = null;

function preload() {
  fondo = loadImage("imagenes/fondo.png");

  // Cargar 5 bordes
  bordes.push(loadImage("imagenes/delineado.png")); // primer borde sin número
  for (let i = 1; i <= 4; i++) {
    bordes.push(loadImage(`imagenes/delineado${i}.png`));
  }

  // Colores disponibles
  let colores = ["amarillo", "azul", "bordo", "rojo", "verde"];

  // Cargar rellenos para cada delineado
  for (let i = 0; i <= 4; i++) {
    let grupo = [];
    let baseNombre = i === 0 ? "relleno" : `relleno${i}`;
    for (let color of colores) {
      grupo.push(loadImage(`imagenes/${baseNombre}_${color}.png`));
    }
    rellenos1.push(grupo); // rellenos1 es un array de arrays de imágenes
  }
}

function setup() {
  createCanvas(fondo.width, fondo.height);
  imageMode(CENTER);

  mic = new p5.AudioIn();
  mic.start(() => {
    console.log("✅ Micrófono activado correctamente");
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

  // Dibujar y filtrar dibujos vivos
  Dibujos = Dibujos.filter((d) => d.estaVivo());
  for (let d of Dibujos) {
    d.dibujar();
  }

  if (level > threshold) {
    if (!sonidoActivo) {
      // Se inicia un nuevo sonido
      sonidoActivo = true;
      sonidoActivoDesde = ahora;
      dibujoActual = agregarDibujo(level);
    }

    // Si el sonido continúa por más de 2 segundos, activar rotación
    if (dibujoActual && ahora - sonidoActivoDesde > 1200) {
      dibujoActual.incrementarRotacion();
    }

  } else {
  if (sonidoActivo) {
    if (dibujoActual && dibujoActual.esProlongado) {
      dibujoActual.comenzarCountdown();
    }
  }
  sonidoActivo = false;
  sonidoActivoDesde = null;
}
}

// Clase Dibujo
class Dibujo {
  constructor(x, y, tam, rellenos, borde, rotacionInicial) {
  this.x = x;
  this.y = y;
  this.tam = tam;
  this.rellenos = rellenos;
  this.borde = borde;
  this.rotacion = rotacionInicial;

  this.esProlongado = false;         // ¿está rotando?
  this.tiempoCreacion = millis();    // para sonidos cortos
  this.tiempoMuerte = null;          // cuando termina sonido largo
  this.velRotacion = 0;

  this.colorIndex = 0;
  this.transicionVel = 0.02;
}

estaVivo() {
  if (this.esProlongado) {
    // Para sonidos largos: contar desde que se corta el sonido
    if (this.tiempoMuerte === null) return true;
    return millis() - this.tiempoMuerte < duracionDibujo;
  } else {
    // Para sonidos cortos: contar desde que se creó
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

dibujar() {
  let alpha = 255;

  if (this.esProlongado && this.tiempoMuerte !== null) {
    let vidaDesdeMuerte = millis() - this.tiempoMuerte;
    if (vidaDesdeMuerte > duracionDibujo - 1000) {
      alpha = map(vidaDesdeMuerte, duracionDibujo - 1000, duracionDibujo, 255, 0);
    }
  } else if (!this.esProlongado) {
    let vida = millis() - this.tiempoCreacion;
    if (vida > duracionDibujo - 1000) {
      alpha = map(vida, duracionDibujo - 1000, duracionDibujo, 255, 0);
    }
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

function obtenerFrecuenciaDominante() {
  let spectrum = fft.analyze();
  let maxIndex = 0;
  let maxEnergy = 0;

  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > maxEnergy) {
      maxEnergy = spectrum[i];
      maxIndex = i;
    }
  }

  // índice -> frecuencia (frecuencia = i * nyquist / spectrum.length)
  let nyquist = sampleRate() / 2; 
  let freq = maxIndex * nyquist / spectrum.length;
  return freq;
}

function agregarDibujo(level) {
  let freq = obtenerFrecuenciaDominante();
  let tipo = floor(random(0, bordes.length));
  let tam = map(level, threshold, 0.3, 50, 200, true);
  let x = random(100, width - 100);
  let y = random(100, height - 100);
  let rotacion = random(-PI, PI);

  // Mismo orden que en preload
  const todosLosColores = ["amarillo", "azul", "bordo", "rojo", "verde"];

  // Elegir índices de colores según frecuencia
  let indicesDeseados;
  if (freq < 400) {
    // Grave → verde, azul, bordo
    indicesDeseados = [1, 2, 4];
  } else {
    // Agudo → rojo, amarillo
    indicesDeseados = [0, 3];
  }

  // Obtener imágenes correspondientes
  let rellenoSetCompleto = rellenos1[tipo];
  let rellenosFiltrados = indicesDeseados.map(i => rellenoSetCompleto[i]);

  let rellenosClon = shuffle(rellenosFiltrados.slice());
  let borde = bordes[tipo];

  let nuevoDibujo = new Dibujo(x, y, tam, rellenosClon, borde, rotacion);
  Dibujos.push(nuevoDibujo);
  return nuevoDibujo;
}