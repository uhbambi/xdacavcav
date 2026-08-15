'use strict';

const { getLeagueOf } = require('../data/clubs.js');
const { ATTRS } = require('./attributes.js');

const NPC_NAMES = [
  'Rodriguez', 'Silva', 'Gonzalez', 'Fernandez', 'Martinez', 'Souza', 'Perez',
  'Almeida', 'Herrera', 'Vidal', 'Costa', 'Diaz', 'Oliveira', 'Sanchez',
  'Torres', 'Ramirez', 'Castro', 'Reyes', 'Nunez', 'Vega', 'Aguirre', 'Correa'
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function npcName() {
  return pick(NPC_NAMES);
}

const POSITIONS = {
  POR: { label: 'Portero', goalWeight: 0.02, assistWeight: 0.02 },
  DEF: { label: 'Defensa', goalWeight: 0.14, assistWeight: 0.18 },
  MED: { label: 'Mediocampista', goalWeight: 0.32, assistWeight: 0.48 },
  DEL: { label: 'Delantero', goalWeight: 0.7, assistWeight: 0.32 }
};

const TACTICS = {
  ofensivo: { label: 'Ofensivo', emoji: '⚔️', myAtk: 7, oppAtk: 5, desc: 'Te tiras mas al ataque: mas chance de gol, pero te exponis atras.' },
  equilibrado: { label: 'Equilibrado', emoji: '⚖️', myAtk: 0, oppAtk: 0, desc: 'Jugas normal, sin arriesgar de mas.' },
  defensivo: { label: 'Defensivo', emoji: '🛡️', myAtk: -5, oppAtk: -7, desc: 'Te replegas: al rival le cuesta mas hacerte goles, pero a ti tambien te cuesta atacar.' }
};

/** Fuerza base de un club: su media directa (los clubes ya vienen con media 45-91) */
function clubStrength(club) {
  if (!club) return 60;
  if (typeof club.media === 'number') return club.media;
  return 40 + (club.tier || 2) * 12;
}

/** Compatibilidad con el codigo viejo que pensaba en tiers */
function clubBaseStrength(tier) {
  return 40 + tier * 12;
}

function attrOf(player, key) {
  return (player.attributes && player.attributes[key]) || 50;
}

/** Fuerza total del equipo del jugador: club + aporte del jugador + moral + tactica */
function playerTeamStrength(club, player, tacticKey) {
  const base = clubStrength(club);
  const overallBoost = (player.overall - base) * 0.16; // cuanto por encima/debajo del plantel estas
  const moraleBoost = (player.morale - 50) * 0.05;
  const tactic = TACTICS[tacticKey] || TACTICS.equilibrado;
  return base + overallBoost + moraleBoost + tactic.myAtk;
}

function opponentStrength(club, tacticKey) {
  const base = clubStrength(club);
  const tactic = TACTICS[tacticKey] || TACTICS.equilibrado;
  return base + rand(-5, 5) + tactic.oppAtk;
}

/** Distribucion de goles tipo Poisson ponderada por la diferencia de fuerza */
function rollGoals(myStrength, oppStrength) {
  const diff = myStrength - oppStrength;
  const lambda = Math.min(3.4, Math.max(0.25, 1.3 + diff / 18));
  let goals = 0;
  let p = Math.exp(-lambda);
  let cumProb = p;
  const r = Math.random();
  while (r > cumProb && goals < 8) {
    goals++;
    p *= lambda / goals;
    cumProb += p;
  }
  return goals;
}

/**
 * Simula un partido del equipo del jugador.
 *
 * options:
 *   tacticKey   'ofensivo' | 'equilibrado' | 'defensivo'
 *   bonusGoals  goles extra del jugador ganados en un minijuego (se suman al marcador)
 *   bonusText   texto del evento del minijuego, para intercalarlo en la cronica
 *   importance  0 liga normal, 1 partido importante, 2 final (afecta moral y rating)
 */
function simulateMatch(player, club, opponentClub, tacticKey = 'equilibrado', options = {}) {
  const { bonusGoals = 0, bonusText = null, bonusMinute = null } = options;

  const myStrength = playerTeamStrength(club, player, tacticKey);
  const oppStrength = opponentStrength(opponentClub, tacticKey);

  let myGoals = rollGoals(myStrength, oppStrength);
  const oppGoals = rollGoals(oppStrength, myStrength);

  const pos = POSITIONS[player.position];
  const events = [];

  let playerGoals = 0;
  let playerAssists = 0;

  // Los atributos deciden cuanto del ataque pasa por vos
  const shooting = attrOf(player, 'tiro');
  const passing = attrOf(player, 'pase');
  const dribbling = attrOf(player, 'regate');
  const physical = attrOf(player, 'fisico');
  const pace = attrOf(player, 'ritmo');

  const goalChance = Math.min(0.55, pos.goalWeight * (0.3 + shooting / 240) * (0.9 + dribbling / 500));
  const assistChance = Math.min(0.5, pos.assistWeight * (0.3 + passing / 240) * (0.9 + pace / 500));

  for (let i = 0; i < myGoals; i++) {
    const minute = rand(1, 90);
    if (Math.random() < goalChance) {
      playerGoals++;
      events.push({ minute, type: 'gol', text: `⚽ Gol de **${player.name}**!` });
    } else if (Math.random() < assistChance) {
      playerAssists++;
      events.push({ minute, type: 'gol_asistencia', text: `⚽ Gol de ${npcName()}, asistencia de **${player.name}**.` });
    } else {
      events.push({ minute, type: 'gol_npc', text: `⚽ Gol de ${npcName()}.` });
    }
  }

  // Goles ganados en el minijuego: son tuyos si, y se suman al marcador
  if (bonusGoals > 0) {
    myGoals += bonusGoals;
    playerGoals += bonusGoals;
    events.push({
      minute: bonusMinute ?? rand(60, 88),
      type: 'gol',
      text: bonusText || `⚽ Gol de **${player.name}** en la jugada clave!`
    });
  } else if (bonusText) {
    events.push({ minute: bonusMinute ?? rand(60, 88), type: 'fallo', text: bonusText });
  }

  for (let i = 0; i < oppGoals; i++) {
    events.push({ minute: rand(1, 90), type: 'gol_rival', text: `⚽ Gol de ${opponentClub.name} (${npcName()}).` });
  }

  // Tarjetas: los defensas ven mas amarillas
  const cardBase = player.position === 'DEF' ? 0.2 : player.position === 'MED' ? 0.16 : 0.11;
  let yellow = false;
  let red = false;
  if (Math.random() < cardBase) {
    yellow = true;
    events.push({ minute: rand(10, 88), type: 'amarilla', text: `🟨 Tarjeta amarilla para **${player.name}**.` });
  }
  if (Math.random() < 0.02) {
    red = true;
    events.push({ minute: rand(10, 88), type: 'roja', text: `🟥 ¡Tarjeta roja para **${player.name}**!` });
  }

  // Lesion: mientras mas fisico, menos chance y menos partidos de baja
  let injuredMatches = 0;
  const injuryChance = Math.max(0.012, 0.06 - physical / 2200) * (player.age >= 32 ? 1.4 : 1);
  if (Math.random() < injuryChance) {
    const severity = Math.random();
    injuredMatches = severity < 0.55 ? rand(1, 2) : severity < 0.88 ? rand(3, 5) : rand(6, 9);
    events.push({
      minute: rand(15, 85),
      type: 'lesion',
      text: `🚑 **${player.name}** sale lesionado del campo (${injuredMatches} partidos de baja).`
    });
  }

  events.sort((a, b) => a.minute - b.minute);

  let rating = 6.0;
  rating += playerGoals * 1.05;
  rating += playerAssists * 0.7;
  if (myGoals > oppGoals) rating += 0.4;
  if (myGoals < oppGoals) rating -= 0.4;
  if (player.position === 'DEF' || player.position === 'POR') {
    if (oppGoals === 0) rating += 0.8;
    else rating -= Math.min(1.2, oppGoals * 0.25);
  }
  if (yellow) rating -= 0.2;
  if (red) rating -= 1.5;
  rating += (Math.random() - 0.5) * 0.8;
  rating = Math.max(1, Math.min(10, Math.round(rating * 10) / 10));

  const motm = rating >= 7.8 || playerGoals >= 2;

  return {
    myGoals,
    oppGoals,
    opponent: opponentClub.name,
    events,
    playerGoals,
    playerAssists,
    rating,
    yellow,
    red,
    injuredMatches,
    motm,
    result: myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E'
  };
}

/** Partido "de fondo" entre dos clubes sin el jugador (tabla de posiciones, copas ajenas) */
function simulateGenericMatch(clubA, clubB) {
  const aStrength = clubStrength(clubA) + rand(-6, 6);
  const bStrength = clubStrength(clubB) + rand(-6, 6);
  return {
    aGoals: rollGoals(aStrength, bStrength),
    bGoals: rollGoals(bStrength, aStrength)
  };
}

/** El equipo del jugador juega sin el (lesionado o suspendido) — es un poco mas debil */
function simulateMatchWithoutPlayer(club, opponentClub, playerOverall = 0) {
  const penalty = playerOverall > clubStrength(club) ? 2.5 : 1;
  const myStrength = clubStrength(club) - penalty + rand(-6, 6);
  const oppStrength = clubStrength(opponentClub) + rand(-6, 6);
  const myGoals = rollGoals(myStrength, oppStrength);
  const oppGoals = rollGoals(oppStrength, myStrength);
  return {
    myGoals,
    oppGoals,
    opponent: opponentClub.name,
    result: myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E'
  };
}

/** Tanda de penales: se usa cuando un mata-mata termina empatado y no hubo minijuego */
function penaltyShootout(clubA, clubB) {
  let a = 0;
  let b = 0;
  const strengthDiff = (clubStrength(clubA) - clubStrength(clubB)) / 200;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < 0.75 + strengthDiff) a++;
    if (Math.random() < 0.75 - strengthDiff) b++;
  }
  while (a === b) {
    const scoredA = Math.random() < 0.75 + strengthDiff;
    const scoredB = Math.random() < 0.75 - strengthDiff;
    if (scoredA) a++;
    if (scoredB) b++;
    if (a !== b) break;
  }
  return { a, b, winner: a > b ? 'A' : 'B' };
}

/** Legacy: fixture simple de rivales (ya no se usa para la tabla) */
function buildFixture(clubName) {
  const league = getLeagueOf(clubName);
  if (!league) return { league: null, opponents: [] };
  const opponents = league.clubs.filter(c => c.name.toLowerCase() !== clubName.toLowerCase());
  for (let i = opponents.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [opponents[i], opponents[j]] = [opponents[j], opponents[i]];
  }
  return { league, opponents };
}

module.exports = {
  simulateMatch,
  simulateGenericMatch,
  simulateMatchWithoutPlayer,
  penaltyShootout,
  buildFixture,
  clubStrength,
  clubBaseStrength,
  rollGoals,
  TACTICS,
  POSITIONS,
  ATTRS,
  rand,
  pick,
  npcName
};
