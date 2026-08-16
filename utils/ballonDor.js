'use strict';

/**
 * Sistema de Votación de Balón de Oro en Tiempo Real
 * 
 * Los usuarios votan con reacciones al final de cada temporada
 * El ganador recibe premios especiales y badge permanente
 */

const { POSITIONS } = require('./simulation.js');

/**
 * Crear una votación de Balón de Oro para el servidor
 * Se debe invocar al cerrar cada temporada
 */
function initializeBallonDOrVote(season, candidates) {
  // candidates = array de { userId, playerName, club, stats }
  
  return {
    season,
    candidates,
    votes: {}, // userId -> votes
    startedAt: Date.now(),
    endsAt: Date.now() + 86400000, // 24 horas
    status: 'active', // 'active' | 'closed' | 'decided'
    winner: null
  };
}

/**
 * Registrar voto con reacción
 * emoji puede ser '🥇', '🥈', '🥉'
 */
function registerBallonDOrVote(vote, voterId, candidateUserId, emoji) {
  if (!vote.votes[candidateUserId]) {
    vote.votes[candidateUserId] = {
      gold: 0,   // 🥇 = 3 puntos
      silver: 0, // 🥈 = 2 puntos
      bronze: 0  // 🥉 = 1 punto
    };
  }

  if (emoji === '🥇') vote.votes[candidateUserId].gold++;
  else if (emoji === '🥈') vote.votes[candidateUserId].silver++;
  else if (emoji === '🥉') vote.votes[candidateUserId].bronze++;

  vote.lastVote = Date.now();
}

/**
 * Calcular puntos del Balón de Oro (sistema FIFA/Ballon d'Or)
 */
function calculateBallonDOrScore(voteData) {
  const score = (voteData.gold * 3) + (voteData.silver * 2) + (voteData.bronze * 1);
  return score;
}

/**
 * Cerrar votación y determinar ganador
 */
function closeBallonDOrVote(vote) {
  vote.status = 'closed';

  let winner = null;
  let maxScore = 0;

  for (const [userId, voteData] of Object.entries(vote.votes)) {
    const score = calculateBallonDOrScore(voteData);
    if (score > maxScore) {
      maxScore = score;
      winner = userId;
    }
  }

  vote.winner = winner;
  vote.status = 'decided';
  vote.finalScore = maxScore;

  return { winner, score: maxScore };
}

/**
 * Aplicar premios al ganador del Balón de Oro
 */
function applyBallonDOrRewards(player) {
  if (!player) return null;

  player.morale = Math.min(100, (player.morale || 70) + 15);
  player.attributes.ritmo = Math.min(99, (player.attributes.ritmo || 50) + 2);
  player.attributes.tiro = Math.min(99, (player.attributes.tiro || 50) + 2);

  if (!player.career.awards) player.career.awards = [];
  player.career.awards.push(`🏆 Balón de Oro Real (Votación del Servidor - Temporada ${player.season})`);

  return {
    morale: 15,
    attrBonus: { ritmo: 2, tiro: 2 },
    award: player.career.awards[player.career.awards.length - 1]
  };
}

/**
 * Formatear resultado de votación para mostrar en Discord
 */
function formatBallonDOrResults(vote, candidates) {
  if (vote.status !== 'decided' || !vote.winner) {
    return '⏳ Votación aún en curso...';
  }

  let result = `🏆 **BALÓN DE ORO - TEMPORADA ${vote.season}** 🏆\n\n`;

  const ranked = Object.entries(vote.votes)
    .map(([userId, votes]) => ({
      userId,
      score: calculateBallonDOrScore(votes),
      votes
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];
  
  ranked.forEach((entry, idx) => {
    const candidate = candidates.find(c => c.userId === entry.userId);
    if (candidate) {
      result += `${medals[idx]} **${candidate.playerName}** (${candidate.club})\n`;
      result += `   Puntos: ${entry.score} (🥇×${entry.votes.gold} 🥈×${entry.votes.silver} 🥉×${entry.votes.bronze})\n\n`;
    }
  });

  return result;
}

/**
 * Listar candidatos elegibles (jugadores con partidos jugados esa temporada)
 */
function getEligibleCandidates(players, season) {
  return players.filter(p => {
    return p.season === season && 
           p.seasonStats && 
           p.seasonStats.apps >= 5 &&
           !p.retired;
  }).map(p => ({
    userId: p.userId,
    playerName: p.name,
    club: p.club,
    position: p.position,
    apps: p.seasonStats.apps,
    goals: p.seasonStats.goals,
    assists: p.seasonStats.assists,
    rating: p.seasonStats.avgRatingSum / p.seasonStats.apps || 0
  }));
}

module.exports = {
  initializeBallonDOrVote,
  registerBallonDOrVote,
  calculateBallonDOrScore,
  closeBallonDOrVote,
  applyBallonDOrRewards,
  formatBallonDOrResults,
  getEligibleCandidates
};
