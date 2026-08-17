'use strict';

const { rand } = require('./simulation.js');

/**
 * ADN futbolístico: características ocultas que diferencian a dos jugadores
 * con el mismo OVR. No se ven en /atributos (ahí están los atributos técnicos),
 * pero influyen en los partidos importantes, la regularidad y los penales.
 */
const DNA_TRAITS = {
  mentalidad: 'Mentalidad',
  clutch: 'Clutch',
  regularidad: 'Regularidad',
  presion: 'Presión',
  liderazgo: 'Liderazgo',
  adaptabilidad: 'Adaptabilidad',
  disciplina: 'Disciplina'
};

function newFootballDNA(seed = {}) {
  const dna = {};
  for (const key of Object.keys(DNA_TRAITS)) {
    dna[key] = typeof seed[key] === 'number' ? seed[key] : rand(40, 99);
  }
  return dna;
}

/** Garantiza que el jugador tenga ADN (para guardados viejos). */
function normalizeDNA(player) {
  if (!player.footballDNA || typeof player.footballDNA !== 'object') {
    player.footballDNA = newFootballDNA(player.footballDNA || {});
  } else {
    for (const key of Object.keys(DNA_TRAITS)) {
      if (typeof player.footballDNA[key] !== 'number') {
        player.footballDNA[key] = rand(40, 99);
      }
    }
  }
  return player.footballDNA;
}

function dnaLabel(key) {
  return DNA_TRAITS[key] || key;
}

/** Lista visual de las características ocultas. */
function describeDNA(dna) {
  const d = dna || {};
  return Object.keys(DNA_TRAITS)
    .map(key => `\`${String(d[key] ?? 50).padStart(2, ' ')}\` ${DNA_TRAITS[key]}`)
    .join('\n');
}

/** Resumen: la característica dominante y la que más lo traiciona. */
function dnaProfile(dna) {
  const d = dna || {};
  const entries = Object.entries(d).map(([key, val]) => ({ key, val: Number(val) || 50 }));
  const sorted = [...entries].sort((a, b) => b.val - a.val);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return {
    best,
    worst,
    average: Math.round(entries.reduce((s, e) => s + e.val, 0) / entries.length)
  };
}

/**
 * Bonus de rating en partidos importantes según el "clutch" del jugador.
 * Un jugador clutch (90+) brilla en finales; uno con clutch bajo se achica.
 */
function clutchRatingBonus(player, { isBigMatch = false, isClassic = false } = {}) {
  if (!isBigMatch && !isClassic) return 0;
  normalizeDNA(player);
  const clutch = player.footballDNA.clutch ?? 50;
  const pressure = player.footballDNA.presion ?? 50;
  const raw = (clutch - 60) / 30 + (pressure - 60) / 60;
  return Math.max(-0.6, Math.min(0.6, Math.round(raw * 10) / 10));
}

/** Influencia en los penales (presión). */
function penaltyBoost(player) {
  normalizeDNA(player);
  const pressure = player.footballDNA.presion ?? 50;
  return Math.max(-0.2, Math.min(0.2, (pressure - 60) / 150));
}

module.exports = {
  DNA_TRAITS,
  newFootballDNA,
  normalizeDNA,
  dnaLabel,
  describeDNA,
  dnaProfile,
  clutchRatingBonus,
  penaltyBoost
};
