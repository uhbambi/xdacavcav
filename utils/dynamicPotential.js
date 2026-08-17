'use strict';

const { rand } = require('./simulation.js');

/**
 * Recalcula y actualiza el potencial dinámico del jugador al final de temporada
 */
function updateDynamicPotential(player) {
  const stats = player.seasonStats || { apps: 0, goals: 0, assists: 0, avgRatingSum: 0 };
  const apps = stats.apps || 0;
  const currentPot = player.potential || (player.overall + 5);
  let potDelta = 0;

  if (apps >= 6) {
    const avg = stats.avgRatingSum / apps;

    // Temporada estratosférica
    if (avg >= 7.85) {
      potDelta += rand(2, 4);
    } else if (avg >= 7.30) {
      potDelta += rand(1, 3);
    } else if (avg >= 6.80) {
      potDelta += rand(0, 1);
    } else if (avg <= 6.10) {
      potDelta -= rand(1, 2);
    }
  } else {
    // Muy pocos partidos jugados (falta de minutos o lesiones)
    if (player.injuredMatches >= 5 || (player.injuryHistory || []).some(i => i.type === 'GRAVE')) {
      potDelta -= rand(1, 3);
    } else {
      potDelta -= 1;
    }
  }

  // Títulos ganados dan empuje mental
  const trophiesCount = (player.career?.trophies || []).length;
  if (trophiesCount >= 3 && Math.random() < 0.3) {
    potDelta += 1;
  }

  // Moral alta
  if (player.morale >= 85) potDelta += 1;
  else if (player.morale <= 25) potDelta -= 1;

  // Los veteranos no suben potencial
  if (player.age >= 29) {
    potDelta = Math.min(0, potDelta);
  }

  const newPot = Math.max(player.overall, Math.min(99, currentPot + potDelta));
  const changed = newPot !== currentPot;
  player.potential = newPot;

  return {
    oldPotential: currentPot,
    newPotential: newPot,
    delta: newPot - currentPot,
    changed
  };
}

module.exports = {
  updateDynamicPotential
};
