let mic, amplitude;
let micReady = false;

function setup() {
  createCanvas(400, 200);

  mic = new p5.AudioIn();

  mic.start(
    () => {
      console.log("âœ… MicrÃ³fono activado correctamente");

      // Muy importante: conectar al output
      mic.connect();

      // Crear amplitude despuÃ©s de que mic estÃ¡ activo
      amplitude = new p5.Amplitude();
      amplitude.setInput(mic);
      micReady = true;
    },
    (err) => {
      console.error("âŒ Error al activar el micrÃ³fono:", err);
    }
  );
}

function draw() {
  background(255);

  if (!micReady) {
    fill(0);
    textSize(16);
    text("Esperando al micrÃ³fono...", 20, 30);
    return;
  }

  let level = amplitude.getLevel();

  fill(0);
  textSize(16);
  text("Nivel de sonido: " + nf(level, 1, 3), 20, 30);

  fill(100, 200, 255);
  rect(20, 50, level * 500, 20);
}
