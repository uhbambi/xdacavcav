'use strict';

const { getAllClubs, getLeague, LEAGUES, startingLeagueKeyFor } = require('../data/clubs.js');
const { rand, pick } = require('./simulation.js');
const { newAttributes, overallFrom, distributeGrowth } = require('./attributes.js');

/** Club de inicio: siempre uno chico de la division mas baja disponible de tu pais */
function startingClub(countryKey) {
  const leagueKey = startingLeagueKeyFor(countryKey);
  const league = LEAGUES[leagueKey] || LEAGUES[`${countryKey}_A`];
  const sorted = [...league.clubs].sort((a, b) => a.media - b.media);
  const smallest = sorted.slice(0, Math.max(4, Math.ceil(sorted.length / 2)));
  const club = pick(smallest);
  return {
    ...club,
    leagueKey: league.key,
    leagueName: league.name,
    country: league.country,
    confed: league.confed,
    level: league.level
  };
}

function emptySeasonStats() {
  return { apps: 0, goals: 0, assists: 0, yellow: 0, red: 0, motm: 0, avgRatingSum: 0, cleanSheets: 0 };
}

function newPlayer({ name, position, nationalityLeagueKey }) {
  const club = startingClub(nationalityLeagueKey);
  const attributes = newAttributes(position);
  const overall = overallFrom(attributes, position);

  return {
    name,
    position,
    nationality: club.country,
    age: 17,
    attributes,
    overall,
    potential: Math.max(overall + 8, rand(72, 94)),
    trainingFocus: null,
    morale: 65,
    club: club.name,
    clubMedia: club.media,
    clubTier: club.tier,
    leagueKey: club.leagueKey,
    leagueName: club.leagueName,
    season: 1,
    matchdayIndex: 0,
    fixture: [],
    roundSchedule: [],
    leagueClubs: [],
    injuredMatches: 0,
    stage: 'liga', // 'liga' | 'copa' | 'mundial' | 'entretemporada'
    table: {},
    cup: null,
    worldCup: null,
    seasonStats: emptySeasonStats(),
    career: {
      apps: 0,
      goals: 0,
      assists: 0,
      caps: 0,
      nationalGoals: 0,
      trophies: [],
      awards: [],
      seasonHistory: []
    },
    pendingMinigame: null,
    pendingMomento: null,
    pendingCareerEvent: null,
    offers: [],
    retired: false,
    createdAt: Date.now()
  };
}

/**
 * Adapta carreras viejas (guardadas antes de los atributos, las copas y los minijuegos)
 * para que sigan funcionando sin perder la temporada en curso.
 */
function normalizePlayer(player) {
  if (!player || typeof player !== 'object') return player;

  if (!player.attributes) {
    player.attributes = newAttributes(player.position || 'MED');
    const target = player.overall || 60;
    // Escala los atributos nuevos para que respeten la media que ya tenia
    const current = overallFrom(player.attributes, player.position || 'MED');
    const delta = target - current;
    for (const key of Object.keys(player.attributes)) {
      player.attributes[key] = Math.max(20, Math.min(99, player.attributes[key] + delta));
    }
  }
  if (typeof player.overall !== 'number') player.overall = overallFrom(player.attributes, player.position || 'MED');
  if (typeof player.potential !== 'number') player.potential = Math.max(player.overall + 5, 75);
  if (player.trainingFocus === undefined) player.trainingFocus = null;

  if (!player.leagueKey || !getLeague(player.leagueKey)) {
    const club = getAllClubs().find(c => c.name === player.club);
    if (club) {
      player.leagueKey = club.leagueKey;
      player.leagueName = getLeague(club.leagueKey).name;
      player.clubMedia = club.media;
      player.clubTier = club.tier;
    } else {
      const fallback = startingClub('CHILE');
      player.club = fallback.name;
      player.clubMedia = fallback.media;
      player.clubTier = fallback.tier;
      player.leagueKey = fallback.leagueKey;
      player.leagueName = fallback.leagueName;
      player.fixture = [];
      player.roundSchedule = [];
      player.table = {};
      player.matchdayIndex = 0;
    }
  }
  if (typeof player.clubMedia !== 'number') {
    const club = getAllClubs().find(c => c.name === player.club);
    player.clubMedia = club ? club.media : 62;
  }

  if (!player.stage) player.stage = 'liga';
  if (player.cup === undefined) player.cup = null;
  if (player.worldCup === undefined) player.worldCup = null;
  if (player.pendingMinigame === undefined) player.pendingMinigame = null;
  if (player.pendingMomento === undefined) player.pendingMomento = null;
  if (player.pendingCareerEvent === undefined) player.pendingCareerEvent = null;
  if (player.pendingTactic === undefined) player.pendingTactic = null;
  if (!Array.isArray(player.offers)) player.offers = [];
  if (!Array.isArray(player.fixture)) player.fixture = [];
  if (!Array.isArray(player.roundSchedule)) player.roundSchedule = [];
  if (!player.table || typeof player.table !== 'object') player.table = {};
  if (typeof player.injuredMatches !== 'number') player.injuredMatches = 0;
  if (typeof player.extraOffers !== 'number') player.extraOffers = 0;
  if (!player.nationality) {
    const league = getLeague(player.leagueKey);
    player.nationality = league ? league.country : 'Chile';
  }

  player.career = player.career || {};
  player.career.apps = player.career.apps || 0;
  player.career.goals = player.career.goals || 0;
  player.career.assists = player.career.assists || 0;
  player.career.caps = player.career.caps || 0;
  player.career.nationalGoals = player.career.nationalGoals || 0;
  player.career.trophies = player.career.trophies || [];
  player.career.awards = player.career.awards || [];
  player.career.seasonHistory = player.career.seasonHistory || [];
  player.seasonStats = { ...emptySeasonStats(), ...(player.seasonStats || {}) };

  return player;
}

/** Reputacion acumulada: cuenta para que clubes grandes se fijen en vos */
function reputation(player) {
  const c = player.career;
  const value =
    c.trophies.length * 3 +
    (c.awards ? c.awards.length * 2 : 0) +
    c.goals * 0.08 +
    c.assists * 0.05 +
    (c.caps || 0) * 0.15;
  return Math.min(30, Math.round(value));
}

/**
 * Progresion de temporada: puntos de crecimiento repartidos entre los atributos.
 * Depende del rendimiento, la edad, los minutos, la moral y el nivel del club donde entrenas.
 */
function developPlayer(player) {
  const perf = player.seasonStats;
  let points = 0;

  if (perf.apps > 0) {
    const avgRating = perf.avgRatingSum / perf.apps;
    if (avgRating >= 7.8) points = rand(7, 11);
    else if (avgRating >= 7.2) points = rand(5, 8);
    else if (avgRating >= 6.7) points = rand(3, 6);
    else if (avgRating >= 6.2) points = rand(2, 4);
    else if (avgRating >= 5.8) points = rand(0, 2);
    else points = rand(-2, 1);
  } else {
    points = -2; // temporada en blanco (lesionado casi todo el año)
  }

  // Entrenar en un club grande te hace mejor
  const clubMedia = player.clubMedia || 60;
  if (clubMedia >= 82) points += 2;
  else if (clubMedia >= 74) points += 1;

  // Curva de edad
  if (player.age <= 21) points += 3;
  else if (player.age <= 24) points += 2;
  else if (player.age <= 27) points += 1;
  else if (player.age >= 36) points -= 7;
  else if (player.age >= 33) points -= 4;
  else if (player.age >= 30) points -= 2;

  if (player.morale >= 80) points += 1;
  if (player.morale <= 30) points -= 1;

  // Cuanto mas cerca del techo, mas cuesta subir
  const room = player.potential - player.overall;
  if (points > 0) {
    if (room <= 0) points = 0;
    else if (room <= 3) points = Math.min(points, 2);
    else if (room <= 8) points = Math.min(points, 4);
  }

  const gained = distributeGrowth(player.attributes, player.position, points, player.trainingFocus);
  const before = player.overall;
  player.overall = Math.min(player.potential, overallFrom(player.attributes, player.position));
  player.age += 1;

  return { points, gained, growth: player.overall - before };
}

/**
 * Ofertas del mercado: clubes cuyo plantel esta a tu altura (nunca un grande de media 84
 * cuando vos tenis 53), sorteados al azar entre todas las ligas y divisiones.
 */
function generateOffers(player, { count = null } = {}) {
  const level = player.overall + reputation(player) * 0.5;
  const currentLeague = getLeague(player.leagueKey);
  const currentLevel = currentLeague ? currentLeague.level : 1;

  const eligible = getAllClubs().filter(c => {
    if (c.name === player.club) return false;
    // No te ficha un club cuyo plantel es mucho mejor que vos...
    if (c.media > level + 3) return false;
    // ...ni uno mucho peor (no vas a bajar 15 puntos de media por gusto)
    if (c.media < level - 13) return false;
    // Los clubes de elite ademas piden nombre hecho
    if (c.media >= 84 && (player.overall < 80 || reputation(player) < 10)) return false;
    if (c.media >= 78 && player.overall < 72) return false;
    // Desde segunda division no saltas directo a un grande de otro pais
    if (currentLevel === 2 && c.media > level - 1 && c.country !== player.nationality && c.media >= 76) return false;
    return true;
  });

  if (!eligible.length) return [];

  // Sorteo aleatorio con sesgo hacia los clubes mas grandes que te pueden fichar
  const pool = eligible.map(c => ({ club: c, weight: Math.pow(Math.max(1, c.media - (level - 15)), 1.6) * Math.random() }));
  pool.sort((a, b) => b.weight - a.weight);

  const wanted = (count || rand(3, 5)) + (player.extraOffers || 0);
  const chosen = [];

  // Si pediste escuchar a Arabia, siempre entra un club saudi a la lista
  if (player.saudiOffer) {
    const saudi = getAllClubs().filter(c => c.confed === 'AFC' && c.media >= player.overall - 12);
    if (saudi.length) chosen.push(pick(saudi));
  }

  const perLeague = {};
  for (const { club } of pool) {
    if (chosen.some(c => c.name === club.name)) continue;
    perLeague[club.leagueKey] = perLeague[club.leagueKey] || 0;
    if (perLeague[club.leagueKey] >= 2) continue;
    perLeague[club.leagueKey] += 1;
    chosen.push(club);
    if (chosen.length >= wanted) break;
  }
  return chosen;
}

/** Premios individuales al cierre de temporada */
function seasonAwards(player) {
  const awards = [];
  const s = player.seasonStats;
  const avg = s.apps > 0 ? s.avgRatingSum / s.apps : 0;

  if (s.goals >= 25) awards.push(`Bota de Oro (Temporada ${player.season})`);
  else if (s.goals >= 18) awards.push(`Goleador del torneo (Temporada ${player.season})`);
  if (s.assists >= 15) awards.push(`Rey de las asistencias (Temporada ${player.season})`);
  if (avg >= 7.9 && s.apps >= 8) awards.push(`MVP de la temporada ${player.season}`);
  if (player.position === 'POR' && s.cleanSheets >= 10) awards.push(`Guante de Oro (Temporada ${player.season})`);
  if (avg >= 8.2 && player.career.trophies.length >= 2 && s.apps >= 10) awards.push(`Balon de Oro (Temporada ${player.season})`);

  return awards;
}

/** Veredicto final al retirarse */
function retirementVerdict(player) {
  const c = player.career;
  const trophies = c.trophies.length;
  const awards = (c.awards || []).length;
  const score = c.goals * 1 + c.assists * 0.6 + trophies * 15 + awards * 10 + c.apps * 0.1 + (c.caps || 0) * 0.5;

  let titulo;
  if (trophies >= 8 && score >= 260 && player.overall >= 88) titulo = 'Leyenda Absoluta';
  else if (trophies >= 5 && score >= 160) titulo = 'Idolo Copero';
  else if (trophies >= 3) titulo = 'Campeon Querido';
  else if (score >= 90) titulo = 'Crack de Liga';
  else if (score >= 40) titulo = 'Jugador Correcto';
  else titulo = 'Nombre Olvidado';

  return {
    titulo,
    score: Math.round(score),
    trophies,
    awards,
    goals: c.goals,
    assists: c.assists,
    apps: c.apps,
    caps: c.caps || 0
  };
}

module.exports = {
  newPlayer,
  normalizePlayer,
  emptySeasonStats,
  developPlayer,
  generateOffers,
  retirementVerdict,
  startingClub,
  reputation,
  seasonAwards
};
