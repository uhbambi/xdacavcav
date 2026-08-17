'use strict';

const storage = require('../data/storage.js');
const { rand, pick } = require('./simulation.js');
const { getAllClubs, findClub } = require('../data/clubs.js');
const { NATIONS } = require('../data/nations.js');
const { newFootballDNA } = require('./dna.js');

/**
 * Simulación completa del universo NPC (el "mundo persistente" llevado al siguiente nivel):
 *  - Pool de jugadores NPC que nacen de las inferiores, crecen, se transfieren,
 *    quedan libres, expiran contrato y se retiran.
 *  - Mercado de fichajes dinámico: compras/ventas, rumores, precios que suben/bajan.
 *  - Generaciones de promesas cada temporada (wonderkids procedimentales).
 *
 * Todo se persiste en records.worldState.npcWorld.
 */

const FIRST_NAMES = ['Lucas', 'Mateo', 'Thiago', 'Enzo', 'Benjamín', 'Bruno', 'Facundo', 'Lautaro', 'Nicolás', 'Santiago', 'Julián', 'Valentín', 'Matías', 'Tomás', 'Agustín', 'Felipe', 'Diego', 'Emiliano', 'Gonzalo', 'Maximiliano', 'Kevin', 'Yeremi', 'Ibrahim', 'Karim', 'Jamal', 'Hiroshi', 'Min-jae', 'Pedro', 'João', 'Vitor'];
const LAST_NAMES = ['Fernández', 'Silva', 'González', 'Martínez', 'Pérez', 'Rodríguez', 'Souza', 'Oliveira', 'Costa', 'Díaz', 'Herrera', 'Vidal', 'Ramírez', 'Torres', 'Reyes', 'Núñez', 'Aguirre', 'Correa', 'Mendes', 'Rocha', 'Sarr', 'Diallo', 'Kovač', 'Yamada', 'Kim', 'Park'];

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL'];

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomNationality() {
  return pick(NATIONS).country;
}

function randomPosition() {
  const roll = Math.random();
  if (roll < 0.10) return 'POR';
  if (roll < 0.38) return 'DEF';
  if (roll < 0.72) return 'MED';
  return 'DEL';
}

/** Edad de siembra sesgada a lo joven para que el mundo dure varias temporadas. */
function randomSeedAge() {
  const r = Math.random();
  if (r < 0.45) return rand(17, 22);
  if (r < 0.78) return rand(23, 27);
  return rand(28, 32);
}

function marketValueFor(ovr, age, potential) {
  const youthBonus = age <= 22 ? Math.pow(Math.max(1, potential - ovr) + 1, 0.8) : 1;
  const raw = Math.pow(ovr / 10, 3.6) * 900000 * youthBonus;
  return Math.max(150000, Math.round(raw / 100000) * 100000);
}

function wageFor(value) {
  return Math.max(1500, Math.round((value * 0.05) / 52 / 100) * 100);
}

/** Genera un NPC con la edad y el club indicados. */
function createNpc({ age, club, idSeed }) {
  const clubObj = typeof club === 'string' ? (findClub(club) || { name: club, media: 65 }) : club;
  const position = randomPosition();
  const overall = Math.max(45, Math.min(93, Math.round((clubObj.media || 65) + rand(-8, 6))));
  const potential = Math.max(overall, Math.min(99, overall + rand(0, age <= 21 ? 18 : 8)));
  const value = marketValueFor(overall, age, potential);

  return {
    id: `npc_${idSeed}_${rand(10000, 99999)}`,
    name: randomName(),
    nationality: randomNationality(),
    position,
    age,
    overall,
    potential,
    club: clubObj.name || club,
    value,
    wage: wageFor(value),
    contractYears: rand(1, 5),
    dna: newFootballDNA(),
    seasonStats: { apps: 0, goals: 0, assists: 0, cleanSheets: 0 },
    career: { apps: 0, goals: 0, assists: 0, trophies: 0 },
    trophies: 0,
    history: [],
    status: 'active',
    retiredAt: null,
    peakOverall: overall
  };
}

function getWorldState() {
  const records = storage.getRecords();
  if (!records.worldState) {
    records.worldState = {
      currentYear: 2026,
      worldCupYear: 2026,
      lastTransferWindow: 2026,
      recentWorldTransfers: [],
      championsLeagueWinner: 'Real Madrid',
      libertadoresWinner: 'Flamengo',
      worldCupWinner: 'Argentina'
    };
    storage.setRecords(records);
  }
  return records.worldState;
}

function getNpcWorld() {
  const records = storage.getRecords();
  const state = getWorldState();
  if (!state.npcWorld) {
    state.npcWorld = {
      year: state.currentYear || 2026,
      players: [],
      lastWindow: { transfers: [], rumors: [], newPromises: [], freeAgentsSigned: [] }
    };
  }
  if (!state.npcWorld.players || !state.npcWorld.players.length) {
    seedNpcWorld();
  }
  records.worldState = state;
  return state.npcWorld;
}

/** Pobla el mundo inicial con plantillas NPC (una vez). */
function seedNpcWorld() {
  const state = getWorldState();
  const world = state.npcWorld;
  const clubs = getAllClubs();
  const pool = [];

  // ~140 jugadores repartidos entre clubes de todas las divisiones
  let idSeed = 1;
  for (const club of clubs) {
    const count = (club.media >= 78) ? 3 : (club.media >= 68) ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const age = randomSeedAge();
      pool.push(createNpc({ age, club, idSeed: idSeed++ }));
      if (pool.length >= 160) break;
    }
    if (pool.length >= 160) break;
  }

  world.players = pool;
  storage.setRecords(storage.getRecords());
  return world;
}

function activePlayers(world) {
  return (world.players || []).filter(p => p.status === 'active');
}

/** Crecimiento/declive anual de un NPC. */
function developNpc(p) {
  const room = p.potential - p.overall;
  if (p.age <= 21) {
    p.overall = Math.min(p.potential, p.overall + (room > 0 ? rand(2, 5) : 1));
  } else if (p.age <= 24) {
    p.overall = Math.min(p.potential, p.overall + (room > 0 ? rand(1, 3) : 0));
  } else if (p.age <= 28) {
    p.overall = Math.min(p.potential, p.overall + (room > 3 ? rand(0, 2) : 0));
  } else if (p.age >= 34) {
    p.overall = Math.max(40, p.overall - rand(1, 4));
  } else if (p.age >= 30) {
    p.overall = Math.max(40, p.overall - rand(0, 1));
  }
  p.age += 1;
  p.overall = Math.max(40, Math.min(99, p.overall));
  p.peakOverall = Math.max(p.peakOverall, p.overall);
  p.value = marketValueFor(p.overall, p.age, p.potential);
  p.wage = wageFor(p.value);
  return p;
}

/** Simula una ventana de temporada del mundo NPC. */
function advanceNpcWorld() {
  const records = storage.getRecords();
  const world = getNpcWorld(); // asegura la siembra inicial si el mundo está vacío
  const state = getWorldState();
  world.year = (world.year || state.currentYear || 2026) + 1;
  state.currentYear = world.year;
  state.lastTransferWindow = world.year;

  const clubs = getAllClubs();
  const lastWindow = { transfers: [], rumors: [], newPromises: [], freeAgentsSigned: [] };

  // 1. Ingreso de juveniles: cada temporada nacen promesas (una joya garantizada)
  const intakeCount = rand(3, 5);
  let idSeed = world.players.length + 1;
  for (let i = 0; i < intakeCount; i++) {
    const isWonderkid = i === 0 || Math.random() < 0.3;
    const smallPool = clubs.filter(c => c.media <= 72);
    const baseClub = smallPool.length ? pick(smallPool) : pick(clubs);
    const kid = createNpc({ age: rand(16, 18), club: baseClub, idSeed: idSeed++ });
    if (isWonderkid) {
      kid.potential = rand(88, 96);
      kid.overall = rand(62, 72);
      kid.value = marketValueFor(kid.overall, kid.age, kid.potential);
      kid.wage = wageFor(kid.value);
    }
    kid.isNewPromise = true;
    world.players.push(kid);
    lastWindow.newPromises.push({
      name: kid.name,
      nationality: kid.nationality,
      age: kid.age,
      position: kid.position,
      overall: kid.overall,
      potential: kid.potential,
      club: kid.club,
      value: kid.value
    });
  }

  // 2. Crecimiento, contratos y retiros
  for (const p of activePlayers(world)) {
    developNpc(p);
    p.contractYears = Math.max(0, p.contractYears - 1);
    if (p.contractYears === 0) {
      if (Math.random() < 0.35) {
        p.status = 'free';
        p.club = null;
      } else {
        p.contractYears = rand(1, 3); // renovación silenciosa
      }
    }
    // Retiro por edad (más gradual: los cracks duran hasta los 36-38)
    const retireChance = p.age >= 38 ? 0.6 : p.age >= 36 ? 0.3 : p.age >= 34 ? 0.12 : p.age >= 32 ? 0.04 : 0;
    if (p.age >= 32 && Math.random() < retireChance) {
      p.status = 'retired';
      p.retiredAt = world.year;
      p.club = null;
      // Consolidar estadísticas históricas del NPC al retirarse
      const summary = npcCareerSummary(p);
      p.career = { ...(p.career || {}), ...summary };
    }
  }

  // 3. Mercado de fichajes: los clubes compran a los NPC más cotizados
  const transferable = activePlayers(world).filter(p => p.club && p.age <= 30 && (p.overall >= 74 || p.potential >= 85));
  const buyerClubs = clubs.filter(c => c.media >= 70);
  const moved = new Set();
  const transferCount = Math.min(8, transferable.length);
  for (let i = 0; i < transferCount; i++) {
    const player = pick(transferable.filter(p => !moved.has(p.id)));
    if (!player) break;
    moved.add(player.id);
    const target = pick(buyerClubs.filter(c => c.name !== player.club));
    if (!target) continue;

    const from = player.club;
    const fee = Math.round(player.value * rand(0.9, 1.6) / 100000) * 100000;
    player.club = target.name;
    player.value = Math.round(player.value * 1.15);
    player.wage = wageFor(player.value);
    player.contractYears = rand(3, 5);
    player.history.push({ year: world.year, from, to: target.name, fee });

    lastWindow.transfers.push({
      player: player.name,
      position: player.position,
      from,
      to: target.name,
      fee,
      overall: player.overall
    });
  }

  // 4. Fichajes de agentes libres por clubes humildes (y retiro de libres que no consiguen club)
  const freeAgents = world.players.filter(p => p.status === 'free');
  const smallClubs = clubs.filter(c => c.media <= 70);
  let signed = 0;
  for (const p of freeAgents) {
    // Los libres veteranos que no consiguen club cuelgan los botines
    if (p.age >= 35 || (p.age >= 32 && Math.random() < 0.5)) {
      p.status = 'retired';
      p.retiredAt = world.year;
      p.club = null;
      const summary = npcCareerSummary(p);
      p.career = { ...(p.career || {}), ...summary };
      continue;
    }
    if (signed >= 8) break;
    const target = pick(smallClubs);
    p.club = target.name;
    p.status = 'active';
    p.contractYears = rand(2, 4);
    lastWindow.freeAgentsSigned.push({ player: p.name, club: target.name, position: p.position, overall: p.overall });
    signed++;
  }

  // 5. Fluctuación de precios
  for (const p of activePlayers(world)) {
    if (Math.random() < 0.25) {
      p.value = Math.max(100000, Math.round(p.value * rand(0.85, 1.25) / 10000) * 10000);
    }
  }

  // 6. Rumores de prensa
  const rumorTemplates = [
    (pl, c) => `📰 **${c}** sondea la situación de **${pl.name}** (${pl.position}, ${pl.overall} OVR).`,
    (pl, c) => `💬 El representante de **${pl.name}** se reunió con la directiva de **${c}**.`,
    (pl, c) => `🔥 **${c}** prepara una oferta por **${pl.name}** de cara al próximo mercado.`,
    (pl, c) => `🧨 El futuro de **${pl.name}** en su club pende de un hilo; **${c}** atento.`
  ];
  const hot = activePlayers(world).filter(p => p.club && p.overall >= 72);
  if (hot.length) {
    for (let i = 0; i < 4; i++) {
      const pl = pick(hot);
      const other = clubs.filter(x => x.name !== pl.club);
      const c = other.length ? pick(other) : pick(clubs);
      lastWindow.rumors.push(pick(rumorTemplates)(pl, c.name));
    }
  }

  world.lastWindow = lastWindow;
  state.npcWorld = world;
  storage.setRecords(records);

  // Mantener compatibilidad con persistentWorld.recentWorldTransfers
  state.recentWorldTransfers = lastWindow.transfers.slice(0, 3).map(t => ({
    player: t.player,
    from: t.from,
    to: t.to,
    fee: t.fee,
    year: world.year
  }));

  storage.setRecords(records);
  return world;
}

/** Resumen de carrera sintético de un NPC (para récords y GOAT). */
function npcCareerSummary(p) {
  const seasons = Math.max(1, p.age - 16);
  const apps = Math.round(seasons * rand(18, 30));
  const goalRate = { POR: 0, DEF: 0.04, MED: 0.14, DEL: 0.42 }[p.position] || 0.12;
  const assistRate = { POR: 0.01, DEF: 0.06, MED: 0.26, DEL: 0.16 }[p.position] || 0.12;
  const goals = Math.round(apps * goalRate);
  const assists = Math.round(apps * assistRate);
  const trophies = p.overall >= 80 ? rand(4, 12) : p.overall >= 70 ? rand(1, 6) : rand(0, 2);
  const awards = p.overall >= 85 ? rand(2, 6) : p.overall >= 78 ? rand(0, 2) : 0;
  return { apps, goals, assists, trophies, awards, seasons };
}

// ───────────────────────── Consultas para comandos ─────────────────────────

function getNpcWonderkids(limit = 8) {
  const world = getNpcWorld();
  return activePlayers(world)
    .filter(p => p.age <= 21)
    .sort((a, b) => b.potential - a.potential || b.overall - a.overall)
    .slice(0, limit);
}

function getLastWindow() {
  const world = getNpcWorld();
  return world.lastWindow || { transfers: [], rumors: [], newPromises: [], freeAgentsSigned: [] };
}

function getNpcFreeAgents(limit = 8) {
  const world = getNpcWorld();
  return world.players.filter(p => p.status === 'free').sort((a, b) => b.overall - a.overall).slice(0, limit);
}

function getNpcTop(limit = 10) {
  const world = getNpcWorld();
  return activePlayers(world).sort((a, b) => b.overall - a.overall).slice(0, limit);
}

/** Leyendas NPC retiradas (para récords y ranking GOAT). */
function getNpcLegends() {
  const world = getNpcWorld();
  return world.players.filter(p => p.status === 'retired');
}

module.exports = {
  getNpcWorld,
  advanceNpcWorld,
  getNpcWonderkids,
  getLastWindow,
  getNpcFreeAgents,
  getNpcTop,
  getNpcLegends,
  createNpc,
  npcCareerSummary
};
