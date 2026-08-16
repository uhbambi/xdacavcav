'use strict';

const { rand } = require('./simulation.js');

/**
 * Sistema de Rachas de Partidos
 * Registra victorias/derrotas consecutivas y aplica bonos/malus a moral y rating
 */

function initializeStreaks(player) {
  if (!player.streaks) {
    player.streaks = {
      recentResults: [],
      currentWinStreak: 0,
      currentLossStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0
    };
  }
  return player.streaks;
}

function recordMatchResult(player, result) {
  const streaks = initializeStreaks(player);
  
  streaks.recentResults.unshift(result);
  
  if (streaks.recentResults.length > 10) {
    streaks.recentResults.pop();
  }
  
  if (result === 'V') {
    streaks.currentWinStreak = (streaks.currentWinStreak || 0) + 1;
    streaks.currentLossStreak = 0;
    streaks.longestWinStreak = Math.max(streaks.longestWinStreak || 0, streaks.currentWinStreak);
  } else if (result === 'D') {
    streaks.currentLossStreak = (streaks.currentLossStreak || 0) + 1;
    streaks.currentWinStreak = 0;
    streaks.longestLossStreak = Math.max(streaks.longestLossStreak || 0, streaks.currentLossStreak);
  } else if (result === 'E') {
    streaks.currentWinStreak = 0;
    streaks.currentLossStreak = 0;
  }
  
  return streaks;
}

function getStreakBonuses(player) {
  const streaks = player.streaks || initializeStreaks(player);
  let ratingBonus = 0;
  let moraleBonus = 0;
  
  if (streaks.currentWinStreak >= 5) {
    ratingBonus = 0.4;
    moraleBonus = rand(2, 4);
  } else if (streaks.currentWinStreak >= 3) {
    ratingBonus = 0.2;
    moraleBonus = rand(1, 3);
  }
  
  if (streaks.currentLossStreak >= 5) {
    ratingBonus = -0.4;
    moraleBonus = rand(-4, -2);
  } else if (streaks.currentLossStreak >= 3) {
    ratingBonus = -0.2;
    moraleBonus = rand(-3, -1);
  }
  
  return {
    ratingBonus,
    moraleBonus,
    winStreak: streaks.currentWinStreak || 0,
    lossStreak: streaks.currentLossStreak || 0
  };
}

function getStreakEmoji(player) {
  const streaks = player.streaks || initializeStreaks(player);
  
  if (streaks.currentWinStreak >= 5) return '🔥🔥🔥';
  if (streaks.currentWinStreak >= 3) return '🔥';
  if (streaks.currentLossStreak >= 5) return '📉📉📉';
  if (streaks.currentLossStreak >= 3) return '📉';
  return '➖';
}

function getRecentResults(player) {
  const streaks = player.streaks || initializeStreaks(player);
  const emojis = {
    'V': '✅',
    'D': '❌',
    'E': '⚪'
  };
  return streaks.recentResults.map(r => emojis[r] || '?').join('');
}

function getStreakStats(player) {
  const streaks = player.streaks || initializeStreaks(player);
  return {
    currentWinStreak: streaks.currentWinStreak || 0,
    currentLossStreak: streaks.currentLossStreak || 0,
    longestWinStreak: streaks.longestWinStreak || 0,
    longestLossStreak: streaks.longestLossStreak || 0,
    recentResults: streaks.recentResults || []
  };
}

function getStreakStatus(player) {
  const streaks = player.streaks || initializeStreaks(player);
  return {
    emoji: getStreakEmoji(player),
    currentWinStreak: streaks.currentWinStreak || 0,
    currentLossStreak: streaks.currentLossStreak || 0,
    longestWinStreak: streaks.longestWinStreak || 0,
    longestLossStreak: streaks.longestLossStreak || 0,
    recentResults: streaks.recentResults || []
  };
}

module.exports = {
  initializeStreaks,
  recordMatchResult,
  getStreakBonuses,
  getStreakEmoji,
  getRecentResults,
  getStreakStats,
  getStreakStatus
};
