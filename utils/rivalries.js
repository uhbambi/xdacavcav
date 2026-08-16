'use strict';

/**
 * Sistema de Rivalidades entre Jugadores del Servidor
 * 
 * Detecta cuando dos jugadores tienen carreras activas en el mismo servidor
 * y crea una "competencia" con bonos de moral y tensión en los clásicos
 */

const { rand } = require('./simulation.js');

/**
 * Head-to-head: historial de enfrentamientos entre dos jugadores
 * Se guarda en: player.headToHead[rivalId] = { wins, draws, losses, goalsFor, goalsAgainst }
 */

function initializeHeadToHead(player) {
  if (!player.headToHead) {
    player.headToHead = {};
  }
  return player;
}

/**
 * Registrar un enfrentamiento en clásico/mismo partido
 */
function recordHeadToHeadMatch(player, rivalId, result, goalsFor, goalsAgainst) {
  initializeHeadToHead(player);

  if (!player.headToHead[rivalId]) {
    player.headToHead[rivalId] = {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      lastMeetingDate: null
    };
  }

  const h2h = player.headToHead[rivalId];
  
  if (result === 'V') h2h.wins++;
  else if (result === 'D') h2h.draws++;
  else if (result === 'D') h2h.losses++;

  h2h.goalsFor += goalsFor;
  h2h.goalsAgainst += goalsAgainst;
  h2h.lastMeetingDate = Date.now();
}

/**
 * Obtener estadísticas H2H formateadas
 */
function getHeadToHeadStats(player, rivalId) {
  initializeHeadToHead(player);

  if (!player.headToHead[rivalId]) {
    return null;
  }

  const h2h = player.headToHead[rivalId];
  const totalMatches = h2h.wins + h2h.draws + h2h.losses;
  const winRate = totalMatches > 0 ? (h2h.wins / totalMatches * 100).toFixed(1) : 0;

  return {
    matches: totalMatches,
    wins: h2h.wins,
    draws: h2h.draws,
    losses: h2h.losses,
    goalsFor: h2h.goalsFor,
    goalsAgainst: h2h.goalsAgainst,
    goalDiff: h2h.goalsFor - h2h.goalsAgainst,
    winRate: parseFloat(winRate)
  };
}

/**
 * Calcular si dos jugadores están en el mismo servidor/liga/país
 * Esto determina si forman una "rivalidad automática"
 */
function detectRivalryStatus(player1, player2) {
  const sameLeague = player1.leagueKey === player2.leagueKey;
  const sameCountry = player1.nationality === player2.nationality;
  const sameClub = player1.club === player2.club;
  const samePosition = player1.position === player2.position;

  let rivalry = {
    level: 0, // 0 = no rival, 1 = misma liga, 2 = mismo país, 3 = mismo club(!), 4 = mismo puesto
    type: 'none',
    intensityMultiplier: 1.0,
    text: ''
  };

  if (sameClub) {
    rivalry.level = 3;
    rivalry.type = 'teammate';
    rivalry.intensityMultiplier = 2.0;
    rivalry.text = `¡Compañeros en ${player1.club}! Lucha interna por ser titular.`;
  } else if (sameLeague && samePosition) {
    rivalry.level = 2;
    rivalry.type = 'domestic_same_position';
    rivalry.intensityMultiplier = 1.5;
    rivalry.text = `Rivales directos en ${player1.leagueName}: ambos ${player1.position}.`;
  } else if (sameLeague) {
    rivalry.level = 2;
    rivalry.type = 'domestic';
    rivalry.intensityMultiplier = 1.3;
    rivalry.text = `Rivales en la misma liga: ${player1.leagueName}.`;
  } else if (sameCountry) {
    rivalry.level = 1;
    rivalry.type = 'national';
    rivalry.intensityMultiplier = 1.1;
    rivalry.text = `Competencia nacional: ambos de ${player1.nationality}.`;
  }

  return rivalry;
}

/**
 * Calcular bonus de moral por rivalidad
 * Se aplica después de un clásico/enfrentamiento directo
 */
function getRivalryMoraleBonus(result, rivalryLevel) {
  let bonus = 0;

  if (result === 'V') {
    if (rivalryLevel === 3) bonus = 8; // Ganar al compañero
    else if (rivalryLevel === 2) bonus = 6; // Ganar en clásico
    else if (rivalryLevel === 1) bonus = 3; // Ganar a rival nacional
  } else if (result === 'D') {
    if (rivalryLevel === 3) bonus = -6;
    else if (rivalryLevel === 2) bonus = -4;
    else if (rivalryLevel === 1) bonus = -2;
  }

  return bonus;
}

/**
 * Formato visual de rivalidad para /perfil
 */
function getRivalryBadge(player, rivalName) {
  if (!player.rivalId) return '';
  
  const h2h = getHeadToHeadStats(player, player.rivalId);
  if (!h2h || h2h.matches === 0) return '';

  if (h2h.wins > h2h.losses) {
    return `⚔️ Rival: ${h2h.wins}V-${h2h.draws}E-${h2h.losses}D vs ${rivalName}`;
  } else if (h2h.losses > h2h.wins) {
    return `⚠️ Rival: ${h2h.wins}V-${h2h.draws}E-${h2h.losses}D vs ${rivalName} (te ganan)`;
  } else {
    return `🤝 Rival Paejo: ${h2h.wins}V-${h2h.draws}E-${h2h.losses}D vs ${rivalName}`;
  }
}

module.exports = {
  initializeHeadToHead,
  recordHeadToHeadMatch,
  getHeadToHeadStats,
  detectRivalryStatus,
  getRivalryMoraleBonus,
  getRivalryBadge
};
