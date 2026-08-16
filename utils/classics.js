'use strict';

/**
 * Sistema de Clásicos Históricos y Rivalidades del Fútbol
 * 
 * Gestiona miles de rivalidades entre los 392 clubes del juego y Selecciones Nacionales,
 * con detección instantánea (O(1)), indexación bidireccional, lore histórico,
 * bonus de sueldo, moral, rendimiento y minijuegos garantizados.
 */

const { EXPLICIT_CLASSICS } = require('../data/classicsDatabase.js');
const { findClub, getLeagueOf } = require('../data/clubs.js');
const { findNation } = require('../data/nations.js');

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const COMMON_ALIASES = {
  'fc barcelona': 'Barcelona',
  'barca': 'Barcelona',
  'barcelona fc': 'Barcelona',
  'real madrid cf': 'Real Madrid',
  'madrid': 'Real Madrid',
  'man utd': 'Manchester United',
  'manchester united fc': 'Manchester United',
  'man city': 'Manchester City',
  'manchester city fc': 'Manchester City',
  'inter de milan': 'Inter Milan',
  'inter': 'Inter Milan',
  'milan': 'AC Milan',
  'ac milan': 'AC Milan',
  'chivas': 'Chivas Guadalajara',
  'guadalajara': 'Chivas Guadalajara',
  'chivas de guadalajara': 'Chivas Guadalajara',
  'club america': 'America',
  'america': 'America',
  'u de chile': 'Universidad de Chile',
  'la u': 'Universidad de Chile',
  'u catolica': 'Universidad Catolica',
  'la catolica': 'Universidad Catolica',
  'colo colo': 'Colo-Colo',
  'atleti': 'Atletico de Madrid',
  'atletico madrid': 'Atletico de Madrid',
  'sporting lisboa': 'Sporting CP',
  'psg': 'Paris Saint-Germain',
  'bvb': 'Borussia Dortmund',
  'bayern': 'Bayern Munich',
  'bayern de munich': 'Bayern Munich'
};

function resolveCanonicalName(name) {
  if (!name) return '';
  const norm = normalizeKey(name);
  if (COMMON_ALIASES[norm]) return COMMON_ALIASES[norm];

  const club = findClub(name);
  if (club) return club.name;

  const nation = findNation(name);
  if (nation) return nation.name;

  return name;
}

function makePairKey(club1, club2) {
  const k1 = normalizeKey(resolveCanonicalName(club1));
  const k2 = normalizeKey(resolveCanonicalName(club2));
  return k1 < k2 ? `${k1}:::${k2}` : `${k2}:::${k1}`;
}

// Índice de búsqueda rápida O(1)
const CLASSICS_MAP = new Map();
const CLUB_CLASSICS_MAP = new Map();

function indexClassic(item) {
  const pairKey = makePairKey(item.home, item.away);
  CLASSICS_MAP.set(pairKey, item);

  const k1 = normalizeKey(item.home);
  const k2 = normalizeKey(item.away);

  if (!CLUB_CLASSICS_MAP.has(k1)) CLUB_CLASSICS_MAP.set(k1, []);
  CLUB_CLASSICS_MAP.get(k1).push(item);

  if (!CLUB_CLASSICS_MAP.has(k2)) CLUB_CLASSICS_MAP.set(k2, []);
  CLUB_CLASSICS_MAP.get(k2).push(item);
}

// Poblar índice inicial
for (const item of EXPLICIT_CLASSICS) {
  indexClassic(item);
}

/**
 * Generador de rivalidades dinámicas e inteligentes para clubes de la misma liga,
 * misma ciudad, duelo de potencias continentales o copas nacionales.
 */
function generateDynamicRivalry(clubName1, clubName2) {
  if (!clubName1 || !clubName2 || normalizeKey(clubName1) === normalizeKey(clubName2)) {
    return null;
  }

  const c1 = findClub(clubName1);
  const c2 = findClub(clubName2);

  // Si son selecciones nacionales
  const n1 = findNation(clubName1);
  const n2 = findNation(clubName2);

  if (n1 && n2) {
    if (n1.confed === n2.confed) {
      return {
        home: clubName1,
        away: clubName2,
        name: `Clásico Continental · ${n1.confed}`,
        category: 'internacional',
        country: n1.confed,
        desc: `Duelo de alto voltaje continental entre ${clubName1} y ${clubName2}.`,
        chant: `¡El honor nacional y la gloria de ${n1.confed} en juego!`,
        intensity: 4,
        ratingBonus: 0.28,
        salaryBonus: 1.25,
        moraleWinBonus: 6,
        moraleLossBonus: -5,
        minigameGuaranteed: true,
        isClassic: true
      };
    } else {
      return {
        home: clubName1,
        away: clubName2,
        name: `Duelo Intercontinental de Selecciones`,
        category: 'internacional',
        country: 'Mundo',
        desc: `Choque de confederaciones entre ${clubName1} (${n1.confed}) y ${clubName2} (${n2.confed}).`,
        chant: `¡Los mejores del planeta frente a frente!`,
        intensity: 4,
        ratingBonus: 0.25,
        salaryBonus: 1.20,
        moraleWinBonus: 5,
        moraleLossBonus: -4,
        minigameGuaranteed: true,
        isClassic: true
      };
    }
  }

  if (!c1 || !c2) return null;

  // 1. Choque de Potencias Continentales (Elite Champions / Libertadores: media >= 80)
  if (c1.media >= 80 && c2.media >= 80 && c1.confed === c2.confed) {
    const tourneyName = c1.confed === 'UEFA' ? 'Champions League' : 'Copa Libertadores';
    return {
      home: c1.name,
      away: c2.name,
      name: `Choque de Titanes de ${tourneyName}`,
      category: 'historico',
      country: c1.confed,
      desc: `Duelo de gigantes de élite mundial: ${c1.name} (media ${c1.media}) contra ${c2.name} (media ${c2.media}).`,
      chant: `¡El trono continental no tiene espacio para dos reyes!`,
      intensity: 5,
      ratingBonus: 0.32,
      salaryBonus: 1.30,
      moraleWinBonus: 6,
      moraleLossBonus: -6,
      minigameGuaranteed: true,
      isClassic: true
    };
  }

  // 2. Mismo país y misma liga
  if (c1.country === c2.country && c1.leagueKey === c2.leagueKey) {
    const diff = Math.abs(c1.media - c2.media);

    // Duelo por el Título de Liga (Clubes de punta)
    if (c1.media >= 72 && c2.media >= 72 && diff <= 4) {
      return {
        home: c1.name,
        away: c2.name,
        name: `Duelo Directo por el Título de ${c1.leagueName}`,
        category: 'regional',
        country: c1.country,
        desc: `Candidatos al campeonato cara a cara. Puntos de oro en la cima de la tabla.`,
        chant: `¡Este partido define al futuro campeón!`,
        intensity: 4,
        ratingBonus: 0.26,
        salaryBonus: 1.22,
        moraleWinBonus: 5,
        moraleLossBonus: -5,
        minigameGuaranteed: true,
        isClassic: true
      };
    }

    // Duelo de la Segunda División (Lucha por el Ascenso)
    if (c1.level === 2 && diff <= 5) {
      return {
        home: c1.name,
        away: c2.name,
        name: `Batalla por el Ascenso a Primera División`,
        category: 'regional',
        country: c1.country,
        desc: `Lucha sin tregua en ${c1.leagueName} por el boleto de ascenso.`,
        chant: `¡A dejar el alma por el ascenso a la gloria!`,
        intensity: 4,
        ratingBonus: 0.24,
        salaryBonus: 1.20,
        moraleWinBonus: 5,
        moraleLossBonus: -4,
        minigameGuaranteed: true,
        isClassic: true
      };
    }

    // Rivalidad Divisional estándar
    return {
      home: c1.name,
      away: c2.name,
      name: `Rivalidad de ${c1.leagueName}`,
      category: 'regional',
      country: c1.country,
      desc: `Enfrentamiento directo en el campeonato de ${c1.country}.`,
      chant: `¡Puntos clave para la tabla general!`,
      intensity: 3,
      ratingBonus: 0.20,
      salaryBonus: 1.15,
      moraleWinBonus: 4,
      moraleLossBonus: -3,
      minigameGuaranteed: false,
      isClassic: true
    };
  }

  // 3. Mismo país, distinta división (Copa Nacional: David contra Goliat o choque histórico)
  if (c1.country === c2.country && c1.leagueKey !== c2.leagueKey) {
    return {
      home: c1.name,
      away: c2.name,
      name: `Duelo de Copa Nacional de ${c1.country}`,
      category: 'copa',
      country: c1.country,
      desc: `Cruce eliminatorio entre ${c1.name} (${c1.leagueName}) y ${c2.name} (${c2.leagueName}).`,
      chant: `¡En la copa todo puede pasar, a matar o morir!`,
      intensity: 4,
      ratingBonus: 0.25,
      salaryBonus: 1.20,
      moraleWinBonus: 5,
      moraleLossBonus: -4,
      minigameGuaranteed: true,
      isClassic: true
    };
  }

  // 4. Misma confederación (Copa Continental genérica)
  if (c1.confed === c2.confed) {
    return {
      home: c1.name,
      away: c2.name,
      name: `Duelo Internacional ${c1.confed}`,
      category: 'internacional',
      country: c1.confed,
      desc: `Encuentro continental entre ${c1.name} (${c1.country}) y ${c2.name} (${c2.country}).`,
      chant: `¡Pasión continental de clubes!`,
      intensity: 3,
      ratingBonus: 0.22,
      salaryBonus: 1.18,
      moraleWinBonus: 4,
      moraleLossBonus: -4,
      minigameGuaranteed: false,
      isClassic: true
    };
  }

  return null;
}

/**
 * Verifica si un partido entre dos clubes es un clásico o rivalidad
 */
function isClassicMatch(myClub, opponentClub) {
  if (!myClub || !opponentClub) return false;
  const pairKey = makePairKey(myClub, opponentClub);
  if (CLASSICS_MAP.has(pairKey)) return true;

  // Evaluar dinámico
  const dyn = generateDynamicRivalry(myClub, opponentClub);
  return dyn !== null;
}

/**
 * Obtiene los datos detallados del clásico o rivalidad
 */
function getClassicData(myClub, opponentClub) {
  if (!myClub || !opponentClub) return null;
  const pairKey = makePairKey(myClub, opponentClub);

  let data = CLASSICS_MAP.get(pairKey);
  if (!data) {
    data = generateDynamicRivalry(myClub, opponentClub);
  }

  if (!data) return null;

  return {
    isClassic: true,
    name: data.name,
    category: data.category || 'historico',
    country: data.country || '',
    desc: data.desc || '',
    chant: data.chant || '',
    intensity: data.intensity || 4,
    ratingBonus: data.ratingBonus || 0.3,
    goalsMultiplier: 1.3,
    moraleWinBonus: data.moraleWinBonus || 5,
    moraleLossBonus: data.moraleLossBonus || -5,
    salaryBonus: data.salaryBonus || 1.3,
    minigameGuaranteed: data.minigameGuaranteed !== false
  };
}

/**
 * Obtiene la lista completa de todos los clásicos explícitos con filtros
 */
function getAllClassics({ country, category, query, limit = 100 } = {}) {
  let list = [...EXPLICIT_CLASSICS];

  if (country && country !== 'all') {
    list = list.filter(c => String(c.country).toLowerCase() === String(country).toLowerCase());
  }

  if (category && category !== 'all') {
    list = list.filter(c => String(c.category).toLowerCase() === String(category).toLowerCase());
  }

  if (query && query.trim()) {
    const q = normalizeKey(query);
    list = list.filter(c =>
      normalizeKey(c.name).includes(q) ||
      normalizeKey(c.home).includes(q) ||
      normalizeKey(c.away).includes(q) ||
      normalizeKey(c.country).includes(q)
    );
  }

  return list.slice(0, limit);
}

/**
 * Obtiene todos los clásicos y rivales de un club específico
 */
function getClubRivalries(clubName) {
  if (!clubName) return [];
  const k = normalizeKey(clubName);
  const explicit = CLUB_CLASSICS_MAP.get(k) || [];

  const rivals = explicit.map(c => {
    const isHome = normalizeKey(c.home) === k;
    const rivalName = isHome ? c.away : c.home;
    return {
      ...c,
      myClub: clubName,
      rivalName
    };
  });

  return rivals;
}

/**
 * Comparador Head-to-Head y análisis táctico entre dos clubes cualesquiera
 */
function compareClubsHeadToHead(club1Name, club2Name) {
  const c1 = findClub(club1Name) || findNation(club1Name) || { name: club1Name, media: 70, country: '' };
  const c2 = findClub(club2Name) || findNation(club2Name) || { name: club2Name, media: 70, country: '' };

  const classicData = getClassicData(c1.name, c2.name);
  const mediaDiff = (c1.media || 70) - (c2.media || 70);

  let favorite = 'Parejo';
  let winProb1 = 35;
  let drawProb = 30;
  let winProb2 = 35;

  if (mediaDiff > 0) {
    const shift = Math.min(30, mediaDiff * 3);
    winProb1 += shift;
    winProb2 -= shift * 0.8;
    drawProb = 100 - winProb1 - winProb2;
    favorite = c1.name;
  } else if (mediaDiff < 0) {
    const shift = Math.min(30, Math.abs(mediaDiff) * 3);
    winProb2 += shift;
    winProb1 -= shift * 0.8;
    drawProb = 100 - winProb1 - winProb2;
    favorite = c2.name;
  }

  return {
    club1: c1,
    club2: c2,
    classicData,
    odds: {
      winProb1: Math.round(winProb1),
      drawProb: Math.round(drawProb),
      winProb2: Math.round(winProb2),
      favorite
    }
  };
}

module.exports = {
  CLASSICS: EXPLICIT_CLASSICS,
  isClassicMatch,
  getClassicData,
  getAllClassics,
  getClubRivalries,
  compareClubsHeadToHead,
  generateDynamicRivalry
};
