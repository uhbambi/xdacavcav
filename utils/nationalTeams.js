'use strict';

const { NATIONS, findNation, nationFlag } = require('../data/nations.js');

/**
 * Calcula la jerarquía del jugador dentro de su selección nacional
 */
function getNationalHierarchy(player) {
  const caps = player.career?.caps || 0;
  const nationalGoals = player.career?.nationalGoals || 0;
  const ovr = player.overall || 60;
  const trophies = (player.career?.trophies || []).filter(t =>
    t.includes('Mundial') || t.includes('Copa América') || t.includes('Eurocopa') || t.includes('Nations League')
  );

  const nation = findNation(player.nationality) || { media: 72, name: player.nationality };

  if (caps >= 60 || trophies.length >= 2 || (caps >= 30 && nationalGoals >= 25)) {
    return {
      tier: 'LEYENDA',
      label: '👑 Leyenda Histórica de la Selección',
      captain: true,
      description: 'Ídolo nacional indiscutible. La hinchada corea tu nombre en cada partido.'
    };
  }

  if (caps >= 30 || (ovr >= nation.media + 6 && caps >= 15)) {
    return {
      tier: 'CAPITAN',
      label: '🎖️ Capitán y Referente',
      captain: true,
      description: 'Líder del vestuario y referente dentro del campo de juego.'
    };
  }

  if (caps >= 12 || ovr >= nation.media + 2) {
    return {
      tier: 'TITULAR',
      label: '⭐ Titular Indiscutible',
      captain: false,
      description: 'Fijo en el once inicial para los partidos oficiales y eliminatorias.'
    };
  }

  if (caps >= 1 || ovr >= nation.media - 3) {
    return {
      tier: 'CONVOCADO',
      label: '🇨🇱 Convocado Habitual / Recambio',
      captain: false,
      description: 'Forma parte de la nómina nacional en cada fecha FIFA.'
    };
  }

  return {
    tier: 'NO_CONVOCADO',
    label: '⏳ En la mira del Seleccionador',
    captain: false,
    description: 'Aún esperando el ansiado debut con la camiseta absoluta.'
  };
}

/**
 * Retorna el Ranking FIFA dinámico
 */
function getFIFARanking() {
  const sorted = [...NATIONS].sort((a, b) => b.media - a.media);
  return sorted.map((n, index) => ({
    rank: index + 1,
    name: n.name,
    flag: nationFlag(n.name),
    confed: n.confed,
    points: Math.round(n.media * 21.5 + (40 - index) * 3)
  }));
}

/**
 * Evalúa si el jugador es convocado en la fecha internacional
 */
function evaluateCallUp(player) {
  const nation = findNation(player.nationality) || { media: 72, name: player.nationality };
  const minOvr = Math.max(62, nation.media - 5);

  const stats = player.seasonStats || {};
  const avg = stats.apps > 0 ? stats.avgRatingSum / stats.apps : 6.5;

  // Si está lesionado no es convocado
  if (player.injuredMatches > 0) {
    return { called: false, reason: 'Baja por lesión médica' };
  }

  if (player.overall >= minOvr || (player.overall >= minOvr - 2 && avg >= 7.3)) {
    return {
      called: true,
      nation: nation.name,
      flag: nationFlag(nation.name),
      role: getNationalHierarchy(player)
    };
  }

  return {
    called: false,
    reason: `Tu media (${player.overall}) aún no alcanza el nivel exigido por ${nation.name} (media corte ~${minOvr}).`
  };
}

module.exports = {
  getNationalHierarchy,
  getFIFARanking,
  evaluateCallUp
};
