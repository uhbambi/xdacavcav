'use strict';

const { getLeague, findClub } = require('../data/clubs.js');
const { rand, simulateGenericMatch, simulateMatchWithoutPlayer } = require('./simulation.js');
const { developPlayer, generateOffers, emptySeasonStats, seasonAwards } = require('./player.js');

/**
 * Calendario de todos-contra-todos (una vuelta) por el metodo del circulo.
 * Todas las ligas tienen cantidad par de clubes.
 */
function buildRoundRobin(clubNames) {
  const n = clubNames.length;
  const rounds = [];
  let list = clubNames.slice();
  const half = n / 2;

  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < half; i++) {
      round.push({ home: list[i], away: list[n - 1 - i] });
    }
    rounds.push(round);
    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop());
    list = [fixed, ...rest];
  }
  return rounds;
}

/**
 * Clubes que juegan la liga del jugador esta temporada. Si el jugador ascendio o descendio
 * con su club, ese club ocupa el lugar del equipo mas debil (o mas fuerte) de la division.
 */
function leagueClubsFor(player) {
  const league = getLeague(player.leagueKey);
  if (!league) return [];
  const clubs = league.clubs.map(c => ({ ...c }));
  if (clubs.some(c => c.name === player.club)) return clubs;

  const myClub = findClub(player.club);
  if (!myClub) return clubs;

  const sorted = [...clubs].sort((a, b) => a.media - b.media);
  const replaced = league.level === 1 ? sorted[0] : sorted[sorted.length - 1];
  return clubs.map(c => (c.name === replaced.name ? { ...myClub } : c));
}

/** Prepara la temporada de liga: fixture completo, tabla en cero y clubes de la division */
function ensureFixture(player) {
  if (player.fixture && player.fixture.length) return;
  const clubs = leagueClubsFor(player);
  if (!clubs.length) return;

  const names = clubs.map(c => c.name);
  const rounds = buildRoundRobin(names);
  for (let i = rounds.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
  }

  player.leagueClubs = names;
  player.roundSchedule = rounds;
  player.fixture = rounds.map(round => {
    const pairing = round.find(p => p.home === player.club || p.away === player.club);
    return pairing.home === player.club ? pairing.away : pairing.home;
  });
  player.matchdayIndex = 0;
  player.table = {};
  for (const name of names) {
    player.table[name] = { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
  }
}

/** Simula los partidos de la fecha que no involucran al jugador */
function simulateOtherRoundMatches(player, roundIndex) {
  const round = player.roundSchedule && player.roundSchedule[roundIndex];
  if (!round) return;
  for (const pairing of round) {
    if (pairing.home === player.club || pairing.away === player.club) continue;
    const homeClub = findClub(pairing.home);
    const awayClub = findClub(pairing.away);
    if (!homeClub || !awayClub) continue;
    const { aGoals, bGoals } = simulateGenericMatch(homeClub, awayClub);
    updateTable(player.table, pairing.home, aGoals, bGoals);
    updateTable(player.table, pairing.away, bGoals, aGoals);
  }
}

/**
 * El jugador esta lesionado: su equipo igual juega la fecha (sin el) y la liga avanza.
 * Devuelve el resultado del partido de su club, o null si ya no quedan fechas.
 */
function playMatchdayWithoutPlayer(player) {
  ensureFixture(player);
  if (!(player.matchdayIndex < player.fixture.length)) return null;

  const roundIndex = player.matchdayIndex;
  const opponentName = player.fixture[roundIndex];
  const club = findClub(player.club);
  const opponentClub = findClub(opponentName) || { name: opponentName, media: 65 };

  const result = simulateMatchWithoutPlayer(club, opponentClub, player.overall);
  updateTable(player.table, player.club, result.myGoals, result.oppGoals);
  updateTable(player.table, opponentName, result.oppGoals, result.myGoals);
  simulateOtherRoundMatches(player, roundIndex);
  player.matchdayIndex += 1;

  return { ...result, matchday: player.matchdayIndex, total: player.fixture.length };
}

function updateTable(table, clubName, gf, gc) {
  if (!table[clubName]) table[clubName] = { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
  const t = table[clubName];
  t.pj += 1;
  t.gf += gf;
  t.gc += gc;
  if (gf > gc) { t.g += 1; t.pts += 3; }
  else if (gf === gc) { t.e += 1; t.pts += 1; }
  else { t.p += 1; }
}

function standingsSorted(table) {
  return Object.entries(table)
    .map(([club, t]) => ({ club, ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

/**
 * Ascensos y descensos al terminar la liga. Solo cambia de division al jugador
 * (con su club); el resto del movimiento es narrativo.
 * Devuelve { moved: 'ascenso'|'descenso'|null, newLeague }.
 */
function applyPromotionRelegation(player, position, totalClubs) {
  const league = getLeague(player.leagueKey);
  if (!league) return { moved: null };

  if (league.level === 2 && league.promotesTo && position <= 2) {
    player.leagueKey = league.promotesTo;
    const target = getLeague(league.promotesTo);
    player.leagueName = target.name;
    return { moved: 'ascenso', newLeague: target };
  }

  if (league.level === 1 && league.relegatesTo && position > totalClubs - 2) {
    player.leagueKey = league.relegatesTo;
    const target = getLeague(league.relegatesTo);
    player.leagueName = target.name;
    return { moved: 'descenso', newLeague: target };
  }

  return { moved: null };
}

/** Cierra la temporada: premios, progresion, historial, ofertas y paso a entretemporada */
function finishSeason(player) {
  const awards = seasonAwards(player);
  for (const award of awards) player.career.awards.push(award);

  const development = developPlayer(player);

  player.career.seasonHistory.push({
    season: player.season,
    club: player.club,
    league: player.leagueName,
    goals: player.seasonStats.goals,
    assists: player.seasonStats.assists,
    apps: player.seasonStats.apps,
    growth: development.growth,
    awards
  });

  player.seasonStats = emptySeasonStats();
  player.fixture = [];
  player.roundSchedule = [];
  player.leagueClubs = [];
  player.matchdayIndex = 0;
  player.table = {};
  player.cup = null;
  player.worldCup = null;
  player.injuredMatches = 0;
  player.offers = generateOffers(player).map(c => c.name);
  player.stage = 'entretemporada';

  return { development, awards };
}

module.exports = {
  buildRoundRobin,
  leagueClubsFor,
  ensureFixture,
  simulateOtherRoundMatches,
  playMatchdayWithoutPlayer,
  updateTable,
  standingsSorted,
  applyPromotionRelegation,
  finishSeason
};
