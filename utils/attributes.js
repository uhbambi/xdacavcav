'use strict';

/**
 * Atributos estilo FIFA por jugador: ritmo, tiro, pase, regate, defensa y fisico.
 * El overall se calcula como promedio ponderado segun la posicion, asi que subir
 * los atributos que importan en tu puesto sube mas rapido tu media.
 */

const ATTRS = ['ritmo', 'tiro', 'pase', 'regate', 'defensa', 'fisico'];

const ATTR_LABELS = {
  ritmo: 'Ritmo',
  tiro: 'Tiro',
  pase: 'Pase',
  regate: 'Regate',
  defensa: 'Defensa',
  fisico: 'Fisico'
};

/** Peso de cada atributo en el overall, por posicion (suman 1) */
const POSITION_WEIGHTS = {
  DEL: { ritmo: 0.22, tiro: 0.32, pase: 0.10, regate: 0.20, defensa: 0.02, fisico: 0.14 },
  MED: { ritmo: 0.14, tiro: 0.16, pase: 0.30, regate: 0.22, defensa: 0.08, fisico: 0.10 },
  DEF: { ritmo: 0.14, tiro: 0.04, pase: 0.12, regate: 0.08, defensa: 0.42, fisico: 0.20 },
  POR: { ritmo: 0.06, tiro: 0.04, pase: 0.12, regate: 0.06, defensa: 0.52, fisico: 0.20 }
};

/** Rango base de cada atributo al crear el jugador, por posicion */
const STARTING_RANGES = {
  DEL: { ritmo: [58, 70], tiro: [55, 66], pase: [42, 55], regate: [52, 65], defensa: [24, 38], fisico: [48, 62] },
  MED: { ritmo: [50, 63], tiro: [45, 58], pase: [55, 68], regate: [52, 66], defensa: [40, 55], fisico: [46, 60] },
  DEF: { ritmo: [48, 62], tiro: [28, 42], pase: [42, 55], regate: [36, 50], defensa: [55, 68], fisico: [55, 70] },
  POR: { ritmo: [38, 50], tiro: [20, 34], pase: [38, 52], regate: [28, 42], defensa: [56, 70], fisico: [52, 66] }
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newAttributes(position) {
  const ranges = STARTING_RANGES[position] || STARTING_RANGES.MED;
  const attrs = {};
  for (const key of ATTRS) {
    const [min, max] = ranges[key];
    attrs[key] = rand(min, max);
  }
  return attrs;
}

/** Overall = promedio ponderado de los atributos segun la posicion */
function overallFrom(attributes, position) {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.MED;
  let total = 0;
  for (const key of ATTRS) total += (attributes[key] || 0) * weights[key];
  return Math.max(40, Math.min(99, Math.round(total)));
}

/**
 * Reparte puntos de crecimiento entre atributos. `focus` (opcional) es el atributo
 * que el jugador eligio entrenar: se lleva la mayor parte de los puntos.
 */
function distributeGrowth(attributes, position, points, focus) {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.MED;
  const gained = {};
  const step = points >= 0 ? 1 : -1;
  const rounds = Math.abs(points);

  for (let i = 0; i < rounds; i++) {
    let key;
    if (focus && ATTRS.includes(focus) && Math.random() < 0.55) {
      key = focus;
    } else {
      // sorteo ponderado: los atributos importantes del puesto suben mas seguido
      let roll = Math.random();
      key = ATTRS[ATTRS.length - 1];
      for (const attr of ATTRS) {
        roll -= weights[attr];
        if (roll <= 0) { key = attr; break; }
      }
    }
    const next = Math.max(20, Math.min(99, (attributes[key] || 40) + step));
    if (next !== attributes[key]) {
      gained[key] = (gained[key] || 0) + step;
      attributes[key] = next;
    }
  }
  return gained;
}

/** Barra visual tipo FIFA para mostrar un atributo en Discord */
function attrBar(value) {
  const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function describeAttributes(attributes) {
  return ATTRS.map(key => {
    const value = attributes[key] ?? 0;
    return `\`${String(value).padStart(2, ' ')}\` ${attrBar(value)} ${ATTR_LABELS[key]}`;
  }).join('\n');
}

module.exports = {
  ATTRS,
  ATTR_LABELS,
  POSITION_WEIGHTS,
  newAttributes,
  overallFrom,
  distributeGrowth,
  attrBar,
  describeAttributes
};
