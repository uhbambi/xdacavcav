'use strict';

const { getAllCareerEntries } = require('./universe.js');
const { FLAGS } = require('../data/clubs.js');

function flagFor(country) {
  return FLAGS[country] || '🌍';
}

/**
 * Récords históricos mundiales: todos los jugadores del servidor y del universo
 * NPC compiten por batir estos registros.
 */
function computeWorldRecords() {
  const entries = getAllCareerEntries();

  const best = (key) => {
    let top = null;
    for (const e of entries) {
      const val = e[key] || 0;
      if (!top || val > top.value) top = { name: e.name, flag: flagFor(e.nationality), value: val, nationality: e.nationality };
    }
    return top;
  };

  return {
    goles: best('goals'),
    asistencias: best('assists'),
    titulos: best('trophies'),
    premios: best('awards'),
    media: best('peakOverall'),
    longevidad: best('seasons'),
    partidos: best('apps')
  };
}

function formatWorldRecords() {
  const r = computeWorldRecords();
  const line = (label, emoji, rec, suffix = '') =>
    `${emoji} **${label}**\n${rec ? `\`${rec.name}${rec.flag ? ' ' + rec.flag : ''}\` — **${rec.value}${suffix}**` : '—'}`;

  return [
    line('Más goles en carrera', '⚽', r.goles),
    line('Más asistencias', '🎯', r.asistencias),
    line('Más títulos', '🏆', r.titulos),
    line('Más premios individuales', '🏅', r.premios),
    line('Mayor media (OVR)', '⭐', r.media, ' OVR'),
    line('Carrera más larga', '👴', r.longevidad, ' temporadas'),
    line('Más partidos jugados', '🕒', r.partidos, ' PJ')
  ].join('\n');
}

module.exports = {
  computeWorldRecords,
  formatWorldRecords
};
