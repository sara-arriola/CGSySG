// Funciones auxiliares para analizar audio y crear dibujos

function obtenerFrecuenciaDominante() {
  const spectrum = fft.analyze();
  let maxIndex = 0;
  let maxEnergy = 0;

  for (let i = 0; i < spectrum.length; i++) {
    if (spectrum[i] > maxEnergy) {
      maxEnergy = spectrum[i];
      maxIndex = i;
    }
  }

  const nyquist = sampleRate() / 2;
  return maxIndex * nyquist / spectrum.length;
}

/**
 * Crea múltiples dibujos nuevos según el nivel y la frecuencia actual.
 * Aplica filtro de colores según frecuencia.
 */
function agregarDibujos(level) {
  const freq = obtenerFrecuenciaDominante();

  // Índices colores: 0=amarillo,1=azul,2=bordo,3=rojo,4=verde
  let indicesDeseados;
  if (freq < 200) {
    indicesDeseados = [1, 4, 2]; // grave: azul, verde, bordo
  } else if (freq > 350) {
    indicesDeseados = [3, 0]; // agudo: rojo, amarillo
  } else {
    indicesDeseados = [0, 1, 2, 3, 4]; // medio: todos
  }

  const nuevos = [];
  for (let i = 0; i < 5; i++) {
    const tipo = floor(random(0, bordesDibujo.length));
    const tam = map(level, threshold, 0.2, 100, 300, true);
    const x = random(100, width - 100);
    const y = random(100, height - 100);
    const rotacion = random(-PI, PI);

    const rellenoSetCompleto = rellenosDibujo[tipo];
    const rellenosFiltrados = indicesDeseados.map(i => rellenoSetCompleto[i]);
    const rellenosClon = shuffle(rellenosFiltrados.slice());
    const borde = bordesDibujo[tipo];

    const nuevo = new Dibujo(x, y, tam, rellenosClon, borde, rotacion);
    Dibujos.push(nuevo);
    nuevos.push(nuevo);
  }
  return nuevos;
}
