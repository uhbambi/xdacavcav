'use strict';

/**
 * Sistema de Racha de Partidos
 * 
 * Mantiene un registro de resultados recientes para dar bonus/malus
 * de moral y rendimiento cuando el jugador acumula victorias o derrotas.
 */

const MAX_STREAK_HISTORY = 15; // Últimos 15 partidos

function initializeStreak(player) {
  if (!player.streakHistory) {
    player.streakHistory = [];
  }
  if (typeof player.currentStreak === 'undefined') {
    player.currentStreak = 0; // 0 = sin racha, >0 = ganando, <0 = perdiendo
  }
  return player;
}

/**
 * Registra un resultado de partido y actualiza la racha
 * result: 'V' (victoria), 'D' (derrota), 'E' (empate)
 */
function recordMatchResult(player, result) {
  initializeStreak(player);
  
  // Agregar al historial
  player.streakHistory.push(result);
  if (player.streakHistory.length > MAX_STREAK_HISTORY) {
    player.streakHistory.shift();
  }

  // Contar racha actual
  let streak = 0;
  const recent = player.streakHistory.slice(-10); // Últimos 10 partidos max
  
  if (recent.length === 0) {
    player.currentStreak = 0;
    return;
  }

  const lastResult = recent[recent.length - 1];
  
  // Contar hacia atrás
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i] === lastResult) {
      streak++;
    } else {
      break;
    }
  }

  // Positivo para victorias, negativo para derrotas, 0 para empates
  if (lastResult === 'V') {
    player.currentStreak = streak;
  } else if (lastResult === 'D') {
    player.currentStreak = -streak;
  } else {
    player.currentStreak = 0;
  }
}

/**
 * Calcula bonus/malus según la racha actual
 * Devuelve { ratingBonus, moraleBonus, emoji, text }
 */
function getStreakBonuses(player) {
  initializeStreak(player);

  const streak = player.currentStreak || 0;
  let ratingBonus = 0;
  let moraleBonus = 0;
  let emoji = '';
  let text = '';

  if (streak >= 5) {
    ratingBonus = 0.4;
    moraleBonus = 3;
    emoji = '🔥🔥🔥';
    text = `¡En RACHA EXPLOSIVA de ${streak} victorias! (Rating +0.4)`;
  } else if (streak >= 3) {
    ratingBonus = 0.2;
    moraleBonus = 2;
    emoji = '🔥';
    text = `En racha de ${streak} victorias (Rating +0.2)`;
  } else if (streak === 2) {
    ratingBonus = 0.1;
    moraleBonus = 1;
    emoji = '⚡';
    text = 'Ganando seguido (Rating +0.1)';
  }

  if (streak <= -5) {
    ratingBonus = -0.4;
    moraleBonus = -3;
    emoji = '📉📉📉';
    text = `¡En PÁNICO de ${Math.abs(streak)} derrotas! (Rating -0.4)`;
  } else if (streak <= -3) {
    ratingBonus = -0.2;
    moraleBonus = -2;
    emoji = '📉';
    text = `En racha de ${Math.abs(streak)} derrotas (Rating -0.2)`;
  } else if (streak === -2) {
    ratingBonus = -0.1;
    moraleBonus = -1;
    emoji = '⚠️';
    text = 'Perdiendo seguido (Rating -0.1)';
  }

  return { ratingBonus, moraleBonus, emoji, text };
}

/**
 * Retorna emoji visual de la racha para mostrar en /perfil
 */
function getStreakEmoji(player) {
  initializeStreak(player);
  const streak = player.currentStreak || 0;
  
  if (streak >= 5) return '🔥🔥🔥';
  if (streak >= 3) return '🔥';
  if (streak >= 2) return '⚡';
  if (streak <= -5) return '📉📉📉';
  if (streak <= -3) return '📉';
  if (streak === -2) return '⚠️';
  return '➖';
}

/**
 * Resumen de últimos resultados para /perfil
 */
function getRecentResults(player) {
  initializeStreak(player);
  if (!player.streakHistory || player.streakHistory.length === 0) {
    return 'Sin historial de partidos';
  }
  
  const recent = player.streakHistory.slice(-10);
  const formatted = recent.map(r => {
    if (r === 'V') return '✅';
    if (r === 'D') return '❌';
    return '🤝';
  }).join(' ');
  
  return formatted;
}

module.exports = {
  initializeStreak,
  recordMatchResult,
  getStreakBonuses,
  getStreakEmoji,
  getRecentResults,
  MAX_STREAK_HISTORY
};
