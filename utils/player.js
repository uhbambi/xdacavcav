'use strict';

const { getAllClubs, getLeague, LEAGUES, startingLeagueKeyFor } = require('../data/clubs.js');
const { rand, pick } = require('./simulation.js');
const { newAttributes, overallFrom, distributeGrowth } = require('./attributes.js');
const { calculateMarketValue, calculateReleaseClause, calculateWages, normalizeEconomy, calculateNetWorth, calculateWeeklyExpenses, formatMoney } = require('./economy.js');
const { normalizeReputationStats } = require('./reputation.js');
const { normalizePersonality } = require('./personality.js');
const { updateDynamicPotential } = require('./dynamicPotential.js');
const { evaluateSeasonAwards } = require('./awards.js');
const { recordSeasonInTimeline } = require('./careerTimeline.js');

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

const SHOP_ITEMS = {
  mansion: {
    id: 'mansion',
    name: 'Mansión con Centro de Alto Rendimiento',
    price: 800000,
    emoji: '🏡',
    desc: 'Reduce un 50% las lesiones y acelera la recuperación de moral.'
  },
  trainer: {
    id: 'trainer',
    name: 'Preparador Físico & Fisio VIP',
    price: 350000,
    emoji: '🏋️‍♂️',
    desc: 'Bono de desarrollo en Ritmo/Físico y menor declive en veteranos.'
  },
  chef: {
    id: 'chef',
    name: 'Chef & Nutricionista de Élite',
    price: 150000,
    emoji: '🥗',
    desc: 'Excelente rendimiento físico y mayor estabilidad de moral.'
  },
  superagent: {
    id: 'superagent',
    name: 'Superagente Internacional',
    price: 500000,
    emoji: '🤝',
    desc: 'Atrae ofertas de clubes de élite y mejores contratos salariales.'
  },
  realestate: {
    id: 'realestate',
    name: 'Inversión Inmobiliaria y Negocios',
    price: 1200000,
    emoji: '🏢',
    desc: 'Genera $200,000 en ganancias pasivas al cierre de cada temporada.'
  },
  supercar: {
    id: 'supercar',
    name: 'Superdeportivo de Colección',
    price: 250000,
    emoji: '🏎️',
    desc: 'Aumenta la fama mediática y la reputación en el mercado.'
  }
};

function calculateSalary(player) {
  const { annualWage } = calculateWages(player);
  return annualWage;
}

function newPlayer({ name, position, nationalityLeagueKey }) {
  const club = startingClub(nationalityLeagueKey);
  const attributes = newAttributes(position);
  const overall = overallFrom(attributes, position);

  const initialPlayer = {
    name,
    position,
    nationality: club.country,
    age: 17,
    attributes,
    overall,
    potential: Math.max(overall + 10, rand(76, 95)),
    trainingFocus: null,
    trainingsThisWeek: 0,
    morale: 75,
    bank: 60000,
    salary: 25000,
    weeklyWage: 480,
    marketValue: 120000,
    releaseClause: 300000,
    contractYears: 3,
    inventory: [],
    mansionPurchased: false,
    trainerPurchased: false,
    chefPurchased: false,
    superagentPurchased: false,
    realEstateCount: 0,
    supercarPurchased: false,
    club: club.name,
    originClub: club.name,
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
    injury: null,
    injuryHistory: [],
    derbyStats: {},
    suspendedMatches: 0,
    stage: 'liga', // 'liga' | 'copa_nacional' | 'copa' | 'mundial' | 'copa_seleccion' | 'entretemporada'
    table: {},
    nationalCup: null,
    cup: null,
    worldCup: null,
    continentalNationalCup: null,
    qualifiedContinentalCup: null,
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
    pendingShootout: null,
    offers: [],
    retired: false,
    createdAt: Date.now()
  };

  normalizePersonality(initialPlayer);
  normalizeReputationStats(initialPlayer);
  normalizeEconomy(initialPlayer);

  const { annualWage, weeklyWage } = calculateWages(initialPlayer);
  initialPlayer.salary = annualWage;
  initialPlayer.weeklyWage = weeklyWage;
  initialPlayer.marketValue = calculateMarketValue(initialPlayer);
  initialPlayer.releaseClause = calculateReleaseClause(initialPlayer, initialPlayer.marketValue);

  return initialPlayer;
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
  if (player.nationalCup === undefined) player.nationalCup = null;
  if (player.cup === undefined) player.cup = null;
  if (player.worldCup === undefined) player.worldCup = null;
  if (player.qualifiedContinentalCup === undefined) player.qualifiedContinentalCup = null;
  if (player.pendingMinigame === undefined) player.pendingMinigame = null;
  if (player.pendingMomento === undefined) player.pendingMomento = null;
  if (player.pendingCareerEvent === undefined) player.pendingCareerEvent = null;
  if (player.pendingShootout === undefined) player.pendingShootout = null;
  if (player.pendingTactic === undefined) player.pendingTactic = null;
  if (!Array.isArray(player.offers)) player.offers = [];
  if (!Array.isArray(player.fixture)) player.fixture = [];
  if (!Array.isArray(player.roundSchedule)) player.roundSchedule = [];
  if (!player.table || typeof player.table !== 'object') player.table = {};
  if (typeof player.injuredMatches !== 'number') player.injuredMatches = 0;
  if (player.injury === undefined) player.injury = null;
  if (!Array.isArray(player.injuryHistory)) player.injuryHistory = [];
  if (!player.derbyStats || typeof player.derbyStats !== 'object') player.derbyStats = {};
  if (typeof player.suspendedMatches !== 'number') player.suspendedMatches = 0;
  if (typeof player.extraOffers !== 'number') player.extraOffers = 0;
  if (!player.nationality) {
    const league = getLeague(player.leagueKey);
    player.nationality = league ? league.country : 'Chile';
  }

  normalizePersonality(player);
  normalizeReputationStats(player);
  normalizeEconomy(player);

  if (typeof player.bank !== 'number') player.bank = 60000;
  if (typeof player.salary !== 'number') player.salary = calculateSalary(player);
  if (typeof player.weeklyWage !== 'number') player.weeklyWage = Math.round(player.salary / 52);
  if (typeof player.marketValue !== 'number') player.marketValue = calculateMarketValue(player);
  if (typeof player.releaseClause !== 'number') player.releaseClause = calculateReleaseClause(player, player.marketValue);
  if (typeof player.contractYears !== 'number') player.contractYears = rand(2, 4);

  if (!player.originClub) player.originClub = player.club;
  if (!player.inventory) player.inventory = [];
  if (typeof player.trainingsThisWeek !== 'number') player.trainingsThisWeek = 0;
  if (player.mansionPurchased === undefined) player.mansionPurchased = false;
  if (player.trainerPurchased === undefined) player.trainerPurchased = false;
  if (player.chefPurchased === undefined) player.chefPurchased = false;
  if (player.superagentPurchased === undefined) player.superagentPurchased = false;
  if (typeof player.realEstateCount !== 'number') player.realEstateCount = 0;
  if (player.supercarPurchased === undefined) player.supercarPurchased = false;
  if (player.continentalNationalCup === undefined) player.continentalNationalCup = null;

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

  // Curva de edad: crecimiento hasta los 27, estancamiento 28-30 y declive desde los 34
  if (player.age <= 21) points += 3;
  else if (player.age <= 24) points += 2;
  else if (player.age <= 27) points += 1;
  else if (player.age >= 40) points -= 6;
  else if (player.age >= 38) points -= 5;
  else if (player.age >= 36) points -= 4;
  else if (player.age >= 34) points -= 3;
  else if (player.age >= 31) points -= 1;

  // Bonos de inversión personal
  if (player.trainerPurchased) points += 2;
  if (player.chefPurchased) points += 1;

  if (player.morale >= 80) points += 1;
  if (player.morale <= 30) points -= 1;

  // ── DECLIVE DESDE LOS 34 AÑOS ──────────────────────────────────────────────
  // A partir de los 34 la media baja sí o sí cada temporada: se acabó el crecimiento.
  if (player.age >= 34) {
    points = Math.min(points, -1);

    // Intensidad del declive: leve a los 34, brusco a partir de los 40
    let decline = player.age >= 40 ? 3 : player.age >= 38 ? 2 : 1;
    // Inversiones que amortiguan (pero no eliminan) la caída
    if (player.trainerPurchased) decline = Math.max(1, decline - 1);
    if (player.chefPurchased) decline = Math.max(1, decline - 1);

    // Lo primero que se pierde con la edad es lo físico (ritmo, físico) y luego el regate
    if (player.attributes.ritmo != null) player.attributes.ritmo = Math.max(25, player.attributes.ritmo - decline * 3);
    if (player.attributes.fisico != null) player.attributes.fisico = Math.max(25, player.attributes.fisico - decline * 2);
    if (player.attributes.regate != null) player.attributes.regate = Math.max(25, player.attributes.regate - decline);
  }

  // Cuanto mas cerca del techo, mas cuesta subir
  const room = player.potential - player.overall;
  if (points > 0) {
    if (room <= 0) points = 0;
    else if (room <= 3) points = Math.min(points, 2);
    else if (room <= 8) points = Math.min(points, 4);
  }

  // Potencial dinámico antes y después
  const potResult = updateDynamicPotential(player);

  const gained = distributeGrowth(player.attributes, player.position, points, player.trainingFocus);
  const before = player.overall;
  player.overall = Math.min(player.potential, overallFrom(player.attributes, player.position));
  if (player.age >= 34) {
    // El techo ya no sube: el potencial se ancla a la media actual para garantizar el declive.
    player.potential = Math.min(player.potential, player.overall);
  }
  player.age += 1;

  // Actualización de economía
  const { annualWage, weeklyWage } = calculateWages(player);
  player.salary = annualWage;
  player.weeklyWage = weeklyWage;
  player.marketValue = calculateMarketValue(player);
  player.releaseClause = calculateReleaseClause(player, player.marketValue);

  // Contrato restante
  if (typeof player.contractYears === 'number') {
    player.contractYears = Math.max(1, player.contractYears - 1);
  } else {
    player.contractYears = 2;
  }

  // Pago de sueldo, pasivos y deducción de gastos
  const passiveIncome = (player.realEstateCount || 0) * 200000;
  const annualExpenses = calculateWeeklyExpenses(player) * 52;
  const netEarnings = Math.max(0, annualWage + passiveIncome - annualExpenses);
  player.bank = (player.bank || 0) + netEarnings;

  // Límite de retiro mandatorio a los 42 años
  if (player.age >= 42) {
    player.retired = true;
  }

  return {
    points,
    gained,
    growth: player.overall - before,
    annualSalary: annualWage,
    weeklyWage,
    marketValue: player.marketValue,
    passiveIncome,
    annualExpenses,
    netEarnings,
    potentialDelta: potResult.delta,
    newPotential: player.potential
  };
}

/** Comprar artículo de la tienda */
function buyItem(player, itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return { success: false, reason: 'Artículo no encontrado.' };

  const currentBank = player.bank || 0;
  if (currentBank < item.price) {
    return { success: false, reason: `Fondos insuficientes. Necesitas ${item.price.toLocaleString('es-CL')} y tienes ${currentBank.toLocaleString('es-CL')}.` };
  }

  if (itemId === 'mansion') {
    if (player.mansionPurchased) return { success: false, reason: 'Ya eres dueño de una mansión de alto rendimiento.' };
    player.mansionPurchased = true;
  } else if (itemId === 'trainer') {
    if (player.trainerPurchased) return { success: false, reason: 'Ya tienes contratado al preparador físico VIP.' };
    player.trainerPurchased = true;
  } else if (itemId === 'chef') {
    if (player.chefPurchased) return { success: false, reason: 'Ya tienes contratado a tu chef personal.' };
    player.chefPurchased = true;
    player.morale = Math.min(100, (player.morale || 70) + 15);
  } else if (itemId === 'superagent') {
    if (player.superagentPurchased) return { success: false, reason: 'Ya tienes representación de un superagente internacional.' };
    player.superagentPurchased = true;
    player.salary = calculateSalary(player);
  } else if (itemId === 'realestate') {
    player.realEstateCount = (player.realEstateCount || 0) + 1;
  } else if (itemId === 'supercar') {
    if (player.supercarPurchased) return { success: false, reason: 'Ya tienes un superdeportivo en tu garaje.' };
    player.supercarPurchased = true;
    player.morale = Math.min(100, (player.morale || 70) + 10);
  }

  player.bank -= item.price;
  if (!player.inventory.includes(itemId) && itemId !== 'realestate') {
    player.inventory.push(itemId);
  }
  return { success: true, item, remainingBank: player.bank };
}

/** Sesión de entrenamiento interactivo */
function trainSkill(player, skillKey) {
  const allowed = ['ritmo', 'tiro', 'pase', 'regate', 'defensa', 'fisico'];
  if (!allowed.includes(skillKey)) {
    return { success: false, reason: 'Habilidad inválida para entrenar.' };
  }

  const successChance = 0.85;
  const isGreat = Math.random() < 0.35;
  const currentVal = player.attributes[skillKey] || 50;

  if (currentVal >= 99) {
    return { success: false, reason: `Tu atributo de **${skillKey.toUpperCase()}** ya está al nivel máximo (99)!` };
  }

  let boost = isGreat ? 2 : 1;
  player.attributes[skillKey] = Math.min(99, currentVal + boost);
  player.trainingsThisWeek = (player.trainingsThisWeek || 0) + 1;

  const beforeOvr = player.overall;
  player.overall = Math.min(player.potential, overallFrom(player.attributes, player.position));
  const ovrChanged = player.overall > beforeOvr;

  return {
    success: true,
    skillKey,
    boost,
    newVal: player.attributes[skillKey],
    isGreat,
    ovrChanged,
    newOverall: player.overall
  };
}

/**
 * Ofertas del mercado: clubes cuyo plantel esta a tu altura (nunca un grande de media 84
 * cuando vos tenis 53), sorteados al azar entre todas las ligas y divisiones.
 */
function generateOffers(player, { count = null } = {}) {
  const isVeteran = player.age >= 34;
  const level = isVeteran ? (player.overall - 3) : (player.overall + reputation(player) * 0.5);
  const currentLeague = getLeague(player.leagueKey);
  const currentLevel = currentLeague ? currentLeague.level : 1;

  const eligible = getAllClubs().filter(c => {
    if (c.name === player.club) return false;
    
    // Si eres veterano (34+ años), los clubes gigantes prefieren no ficharte salvo que seas súper estrella
    if (isVeteran) {
      // La élite (media 82+) solo arriesga por verdaderas leyendas
      if (c.media >= 82 && player.overall < 88) return false;
      if (c.media >= 78 && player.overall < 78) return false;
      // Con la edad las ofertas son de clubes peores que tu media actual:
      // a los 34-37 te buscan un paso por debajo, y desde los 38 claramente más abajo.
      const mediaCap = player.age >= 38 ? player.overall - 3 : player.overall - 1;
      if (c.media > mediaCap) return false;
      // Pero tampoco clubes ridículamente chicos: no te vas a jubilar en el sótano.
      if (c.media < player.overall - 10) return false;
      return true;
    }

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

  const chosen = [];

  // Oferta especial del CLUB FORMADOR / ORIGEN para veteranos de 34+
  if (isVeteran && player.originClub && player.originClub !== player.club) {
    const originClubObj = getAllClubs().find(c => c.name === player.originClub);
    if (originClubObj) {
      chosen.push({
        ...originClubObj,
        isOriginClub: true,
        originNote: '🏠 ¡Tu club formador sueña con tu regreso para que te retires como ídolo!'
      });
    }
  }

  if (!eligible.length && !chosen.length) return [];

  // Sorteo aleatorio: si es veterano, se le da mayor peso a clubes más humildes y formativos
  const pool = eligible.map(c => {
    let weight;
    if (isVeteran) {
      // Favorece clubes un escalón por debajo de tu media (peores, pero no ridículos)
      weight = Math.pow(Math.max(1, (player.overall - 4) - c.media), 1.1) * Math.random();
    } else {
      weight = Math.pow(Math.max(1, c.media - (level - 15)), 1.6) * Math.random();
    }
    return { club: c, weight };
  });
  pool.sort((a, b) => b.weight - a.weight);

  const wanted = (count || rand(3, 5)) + (player.extraOffers || 0) + (player.superagentPurchased ? 1 : 0);

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
  return evaluateSeasonAwards(player);
}

/** Veredicto final al retirarse */
function retirementVerdict(player) {
  const c = player.career;
  const trophies = c.trophies.length;
  const awards = (c.awards || []).length;
  const score = c.goals * 1 + c.assists * 0.6 + trophies * 15 + awards * 10 + c.apps * 0.1 + (c.caps || 0) * 0.5;

  let titulo;
  if (trophies >= 10 && score >= 280 && player.overall >= 88) titulo = 'Leyenda Absoluta del Fútbol Mundial';
  else if (trophies >= 6 && score >= 180) titulo = 'Ídolo Copero Histórico';
  else if (trophies >= 3 || awards >= 4) titulo = 'Campeón Querido e Inolvidable';
  else if (score >= 90) titulo = 'Crack de Primera División';
  else if (score >= 40) titulo = 'Profesional Ejemplar y Respetado';
  else titulo = 'Guerrero de las Canchas';

  return {
    titulo,
    score: Math.round(score),
    trophies,
    awards,
    goals: c.goals,
    assists: c.assists,
    apps: c.apps,
    caps: c.caps || 0,
    age: player.age,
    bank: player.bank || 0
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
  seasonAwards,
  calculateSalary,
  buyItem,
  trainSkill,
  SHOP_ITEMS
};
