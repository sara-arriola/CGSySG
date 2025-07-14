// se cargan todas las imágenes necesarias y se exportan las variables globales.

let fondo;
let bordesDibujo = [];
let rellenosDibujo = [];

function cargarImagenes() {
  fondo = loadImage("imagenes/fondo.png");

  bordesDibujo.push(loadImage("imagenes/delineado.png"));
  for (let i = 1; i <= 4; i++) {
    bordesDibujo.push(loadImage(`imagenes/delineado${i}.png`));
  }

  const colores = ["amarillo", "azul", "bordo", "rojo", "verde"];

  for (let i = 0; i <= 4; i++) {
    const grupo = [];
    const baseNombre = i === 0 ? "relleno" : `relleno${i}`;
    for (const color of colores) {
      grupo.push(loadImage(`imagenes/${baseNombre}_${color}.png`));
    }
    rellenosDibujo.push(grupo);
  }
}