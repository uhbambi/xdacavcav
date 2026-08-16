'use strict';

const { rand } = require('./simulation.js');

/**
 * Sistema de Rivalidades entre jugadores del mismo servidor
 */

function initializeHeadToHead(player) {
  if (!player.headToHead) {
    player.headToHead = {};
  }
  return player.headToHead;
}

function recordHeadToHeadMatch(player, rivalUserId, result, goalsFor, goalsAgainst) {
  const h2h = initializeHeadToHead(player);
  
  if (!h2h[rivalUserId]) {
    h2h[rivalUserId] = { matches: 0, wins: 0, draws: 0, losses: 0, goalDiff: 0 };
  }
  
  const record = h2h[rivalUserId];
  record.matches += 1;
  record.goalDiff += (goalsFor - goalsAgainst);
  
  if (result === 'V') record.wins += 1;
  else if (result === 'E') record.draws += 1;
  else if (result === 'D') record.losses += 1;
  
  return record;
}

function getHeadToHeadStats(player, rivalUserId) {
  const h2h = (player.headToHead || {})[rivalUserId];
  if (!h2h) return null;
  
  return {
    matches: h2h.matches,
    wins: h2h.wins,
    draws: h2h.draws,
    losses: h2h.losses,
    goalDiff: h2h.goalDiff,
    winRate: h2h.matches > 0 ? Math.round((h2h.wins / h2h.matches) * 100) : 0
  };
}

function detectRivalryStatus(player1, player2) {
  let level = 0;
  let type = 'none';
  let intensityMultiplier = 1.0;
  let text = '';
  
  if (player1.club === player2.club) {
    level = 3;
    type = 'teammate';
    intensityMultiplier = 2.0;
    text = `⚔️ **Compañeros de Equipo** en ${player1.club}`;
  }
  else if (player1.position === player2.position && player1.leagueKey === player2.leagueKey) {
    level = 2;
    type = 'sameposition';
    intensityMultiplier = 1.5;
    text = `🏆 **Misma posición** en ${player1.leagueName}`;
  }
  else if (player1.leagueKey === player2.leagueKey) {
    level = 2;
    type = 'sameleague';
    intensityMultiplier = 1.3;
    text = `🥊 **Rival de liga** en ${player1.leagueName}`;
  }
  else if (player1.nationality === player2.nationality) {
    level = 1;
    type = 'samecountry';
    intensityMultiplier = 1.1;
    text = `🇦🇷 **Rival de ${player1.nationality}**`;
  }
  
  return { level, type, intensityMultiplier, text };
}

function getRivalryMoraleBonus(result, rivalLevel) {
  let bonus = 0;
  const baseMultiplier = rivalLevel * 2;
  
  if (result === 'V') {
    bonus = rand(2, 5) * baseMultiplier;
  } else if (result === 'D') {
    bonus = rand(-5, -2) * baseMultiplier;
  }
  
  return bonus;
}

function getRivalryBadge(player, rivalName) {
  const h2h = player.headToHead || {};
  const stats = Object.values(h2h)[0];
  
  if (!stats) return '';
  
  const record = `${stats.wins}V-${stats.draws}E-${stats.losses}D`;
  const trend = stats.wins > stats.losses ? '(te ganamos)' : stats.losses > stats.wins ? '(nos ganas)' : '(parejos)';
  
  return `⚔️ **Rival:** ${record} vs ${rivalName} ${trend}`;
}

module.exports = {
  initializeHeadToHead,
  recordHeadToHeadMatch,
  getHeadToHeadStats,
  detectRivalryStatus,
  getRivalryMoraleBonus,
  getRivalryBadge
};