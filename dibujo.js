// Clase Dibujo que representa cada figura y su comportamiento

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