'use strict';

const { pick } = require('./simulation.js');

/**
 * Sistema de Votación Balón de Oro
 * Votación por reacciones del servidor (🥇 🥈 🥉)
 */

function getEligibleCandidates(players, season) {
  return players.filter(p => {
    if (p.retired) return false;
    if ((p.seasonStats?.apps || 0) < 5) return false;
    if (p.season !== season) return false;
    const avgRating = p.seasonStats.apps > 0 ? p.seasonStats.avgRatingSum / p.seasonStats.apps : 0;
    return avgRating >= 6.5 || p.seasonStats.goals >= 5;
  });
}

function initializeBallonDOrVote(season, candidates) {
  return {
    season,
    candidates: candidates.slice(0, 10).map(c => ({
      playerId: c.userId || c.id,
      name: c.name,
      overall: c.overall,
      goals: c.seasonStats?.goals || 0,
      assists: c.seasonStats?.assists || 0,
      apps: c.seasonStats?.apps || 0,
      gold: 0,
      silver: 0,
      bronze: 0
    })),
    votes: {},
    status: 'open'
  };
}

function registerVote(vote, userId, candIndex, position) {
  if (vote.status !== 'open') return false;
  if (!vote.votes[userId]) vote.votes[userId] = {};
  
  if (vote.votes[userId][position]) return false;
  
  const candidate = vote.candidates[candIndex];
  if (!candidate) return false;
  
  if (position === 'gold') candidate.gold += 3;
  else if (position === 'silver') candidate.silver += 2;
  else if (position === 'bronze') candidate.bronze += 1;
  
  vote.votes[userId][position] = candIndex;
  return true;
}

function closeBallonDOrVote(vote) {
  vote.status = 'closed';
  
  vote.candidates.sort((a, b) => {
    const scoreA = a.gold * 5 + a.silver * 3 + a.bronze * 1;
    const scoreB = b.gold * 5 + b.silver * 3 + b.bronze * 1;
    return scoreB - scoreA;
  });
  
  const winner = vote.candidates[0];
  const score = winner.gold * 5 + winner.silver * 3 + winner.bronze * 1;
  
  return {
    winner: winner.playerId,
    winnerName: winner.name,
    score,
    all: vote.candidates
  };
}

function applyBallonDOrRewards(player) {
  player.morale = Math.min(100, (player.morale || 70) + 15);
  player.attributes.ritmo = Math.min(99, (player.attributes.ritmo || 50) + 2);
  player.attributes.tiro = Math.min(99, (player.attributes.tiro || 50) + 2);
  
  if (!player.career.awards) player.career.awards = [];
  player.career.awards.push(`🌟 Balón de Oro (Temporada ${player.season})`);
  
  return {
    moraleGain: 15,
    ritmoGain: 2,
    tiroGain: 2,
    award: `🌟 Balón de Oro (Temporada ${player.season})`
  };
}

function formatBallonDOrResults(vote) {
  let text = `🏆 **Resultados Balón de Oro - Temporada ${vote.season}**\n\n`;
  
  vote.candidates.slice(0, 5).forEach((c, i) => {
    const score = c.gold * 5 + c.silver * 3 + c.bronze * 1;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    text += `${medal} **${c.name}** (${c.overall}) — ${score} puntos\n   📊 ${c.apps}PJ | ${c.goals}G | ${c.assists}A\n`;
  });
  
  return text;
}

module.exports = {
  getEligibleCandidates,
  initializeBallonDOrVote,
  registerVote,
  closeBallonDOrVote,
  applyBallonDOrRewards,
  formatBallonDOrResults
};