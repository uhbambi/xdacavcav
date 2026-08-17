'use strict';

const { getAllCareerEntries } = require('./universe.js');
const { FLAGS } = require('../data/clubs.js');

function flagFor(country) {
  return FLAGS[country] || '🌍';
}

/**
 * Índice GOAT: puntuación histórica que pondera títulos, goles, asistencias,
 * premios, selección, torneos continentales, longevidad y rendimiento.
 * (0-100+, a mayor número, más cerca del Olimpo.)
 */
function goatScore(e) {
  const goals = e.goals || 0;
  const assists = e.assists || 0;
  const apps = e.apps || 0;
  const trophies = e.trophies || 0;
  const awards = e.awards || 0;
  const caps = e.caps || 0;
  const seasons = e.seasons || 1;
  const peak = e.peakOverall || e.overall || 60;

  let score = 0;
  score += goals * 0.5;            // goles
  score += assists * 0.3;          // asistencias
  score += trophies * 12;          // títulos (incl. Champions/Libertadores/Mundial)
  score += awards * 8;             // premios individuales
  score += caps * 0.4;             // selección
  score += Math.max(0, peak - 70) * 1.2; // nivel técnico de elite
  score += Math.min(20, seasons * 1.5);   // longevidad
  score += Math.min(15, apps * 0.05);     // regularidad
  // Bonus por ser estrella total
  if (peak >= 88 && trophies >= 5) score += 15;
  return Math.round(score * 10) / 10;
}

function getGoatRanking(limit = 10) {
  const entries = getAllCareerEntries()
    .map(e => ({ ...e, score: goatScore(e) }))
    .sort((a, b) => b.score - a.score);

  return entries.slice(0, limit);
}

function formatGoatRanking(limit = 10) {
  const list = getGoatRanking(limit);
  if (!list.length) return '🐐 *Aún no hay leyendas en el ranking histórico.*';

  return list.map((e, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
    return `${medal} **${e.name}** ${flagFor(e.nationality)} — **${e.score}** pts\n` +
      `└ ${e.position} · ${e.isUser ? '⭐ Servidor' : '🤖 NPC'} · 🏆 ${e.trophies} títulos · ⚽ ${e.goals} goles · ${e.retired ? `Retirado (${e.age})` : `${e.age} años`}`;
  }).join('\n\n');
}

module.exports = {
  goatScore,
  getGoatRanking,
  formatGoatRanking
};
