'use strict';

/**
 * Test de regresión de los nuevos sistemas:
 *  1. Estadios (capacidad, asistencia, ambiente, taquilla, clásico vs rival débil).
 *  2. Hinchada (relación, tier, barra, eventos).
 *  3. ADN futbolístico (normalización, perfil, clutch, penales).
 *  4. Objetivos personales (generación, evaluación, premios/castigos).
 *  5. Mundo NPC (siembra, ingreso de juveniles, crecimiento, retiros, traspasos, libres).
 *  6. Récords mundiales.
 *  7. Ranking GOAT.
 *  8. Drama futbolístico (momentos nuevos integrados a decisions.js).
 *  9. Vistas nuevas sin "undefined".
 */

process.env.DATABASE_URL = '';

const storage = require('../data/storage.js');
const engine = require('../game/engine.js');
const { newPlayer, developPlayer } = require('../utils/player.js');
const { newManager } = require('../utils/manager.js');
const stadium = require('../utils/stadium.js');
const fans = require('../utils/fans.js');
const dna = require('../utils/dna.js');
const objectives = require('../utils/personalObjectives.js');
const npcWorld = require('../utils/npcWorld.js');
const records = require('../utils/records.js');
const goat = require('../utils/goat.js');
const { MOMENTOS } = require('../utils/decisions.js');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('  ❌ FALLO:', msg);
  }
}
function hasUndefined(obj) {
  return /undefined/i.test(JSON.stringify(obj));
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 1: Sistema de estadios');
{
  const colo = stadium.getStadium('Colo-Colo');
  assert(typeof colo.capacity === 'number' && colo.capacity > 10000, 'capacidad inválida');
  assert(typeof colo.avgAttendance === 'number' && colo.avgAttendance <= colo.capacity, 'asistencia > capacidad');
  assert(colo.atmosphere >= 20 && colo.atmosphere <= 100, 'ambiente fuera de rango');

  const classicAtt = stadium.attendanceFor(colo, { isClassic: true });
  const weakAtt = stadium.attendanceFor(colo, { opponentMedia: 50 });
  assert(classicAtt > weakAtt, `un clásico (${classicAtt}) no llena más que un partido contra el último (${weakAtt})`);
  const revenue = stadium.revenueFor(colo, classicAtt);
  assert(revenue > 0, 'recaudación inválida');
  assert(stadium.stadiumLine('Colo-Colo', { isClassic: true }).includes('Asistencia'), 'stadiumLine sin asistencia');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 2: Hinchada y relación con el club');
{
  const p = newPlayer({ name: 'Fans', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  const before = fans.normalizeFanRelation(p);
  assert(before >= 0 && before <= 100, 'relación inicial fuera de rango');

  const afterWin = fans.recordFanMatch(p, 'V', { goals: 2, isClassic: true, motm: true });
  assert(afterWin > before, 'la relación no subió tras ganar un clásico con doblete');

  const status = fans.describeFanStatus(p);
  assert(status.bar.length === 20, 'barra de hinchada con largo incorrecto');
  assert(status.tier && status.emoji, 'tier/emoji vacío');

  p.fanRelation = 90;
  const t = fans.fanTier(90);
  assert(t.emoji === '🔥' || t.emoji === '👑', 'un 90 de relación no es ídolo');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 3: ADN futbolístico');
{
  const p = newPlayer({ name: 'ADN', position: 'MED', nationalityLeagueKey: 'CHILE' });
  const d = dna.normalizeDNA(p);
  assert(Object.keys(dna.DNA_TRAITS).every(k => typeof d[k] === 'number'), 'ADN incompleto');

  const prof = dna.dnaProfile(d);
  assert(prof.best.val >= prof.worst.val, 'perfil de ADN inconsistente');

  const clutchHigh = dna.clutchRatingBonus({ footballDNA: { clutch: 95, presion: 90 } }, { isBigMatch: true });
  const clutchLow = dna.clutchRatingBonus({ footballDNA: { clutch: 35, presion: 30 } }, { isBigMatch: true });
  assert(clutchHigh > 0 && clutchLow < 0, 'clutch no diferencia jugadores');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 4: Objetivos personales');
{
  const p = newPlayer({ name: 'Obj', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  const objs = objectives.generatePersonalObjectives(p);
  assert(objs.length >= 3 && objs.length <= 4, 'cantidad de objetivos inválida');
  assert(objs.some(o => o.type === 'goles'), 'un DEL no tiene objetivo de goles');

  p.seasonStats = { apps: 30, goals: 25, assists: 12, avgRatingSum: 30 * 8.0, cleanSheets: 0 };
  const beforeMorale = p.morale;
  const res = objectives.evaluateAndApplyPersonalObjectives(p, { position: 1, qualifiedContinentalCup: true });
  assert(res.met.length > 0, 'no se cumplió ningún objetivo pese al gran año');
  assert(res.text.length > 0, 'sin texto de resultado');
  assert(p.morale > beforeMorale, 'la moral no subió por cumplir objetivos');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 5: Mundo NPC (generaciones, traspasos, retiros)');
{
  const world = npcWorld.getNpcWorld();
  assert(world.players.length > 100, `mundo NPC con pocos jugadores (${world.players.length})`);

  const before = world.players.length;
  const beforeActive = world.players.filter(p => p.status === 'active').length;
  npcWorld.advanceNpcWorld();
  const after = npcWorld.getNpcWorld();
  assert(after.players.length > before, 'no entraron juveniles nuevos');
  assert(after.lastWindow.newPromises.length >= 1, 'no se generaron promesas');
  assert(Array.isArray(after.lastWindow.transfers), 'sin lista de traspasos');
  assert(Array.isArray(after.lastWindow.rumors), 'sin lista de rumores');

  const kids = npcWorld.getNpcWonderkids(5);
  assert(kids.every(k => k.age <= 21), 'wonderkid mayor de 21');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 6: Récords mundiales y GOAT');
{
  const r = records.computeWorldRecords();
  assert(r.goles && r.asistencias && r.titulos && r.media && r.longevidad, 'récords incompletos');
  const text = records.formatWorldRecords();
  assert(text.includes('goles') || text.includes('Goles'), 'formato de récords sin goles');

  const ranking = goat.getGoatRanking(10);
  assert(ranking.length > 0, 'ranking GOAT vacío');
  for (let i = 1; i < ranking.length; i++) {
    assert(ranking[i - 1].score >= ranking[i].score, 'ranking GOAT mal ordenado');
  }
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 7: Drama futbolístico integrado');
{
  const dramaIds = ['pelea_dt', 'pelea_companero', 'conflicto_contractual', 'filtracion_chat',
    'entrevista_polemica', 'suplencia_inesperada', 'capitan_lesionado', 'oferta_rival',
    'hinchada_salida', 'companero_puesto'];
  const ids = MOMENTOS.map(m => m.id);
  for (const id of dramaIds) {
    assert(ids.includes(id), `falta el drama "${id}" en MOMENTOS`);
  }
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 8: Vistas nuevas sin undefined');
{
  const p = newPlayer({ name: 'Vistas', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  p.career.trophies.push('Campeón Primera Division de Chile (Temporada 1)');
  p.career.trophies.push('Campeón Primera Division de Chile (Temporada 2)');
  storage.setPlayer('test-vistas', p);
  const m = newManager({ name: 'DT', clubName: 'Colo-Colo', userId: 'test-vistas-dt' });
  storage.setManager('test-vistas-dt', m);

  const views = ['stadiumView', 'fansView', 'dnaView', 'objectivesView', 'recordsView', 'goatView', 'marketView', 'wonderkidsView', 'vitrinaView'];
  for (const v of views) {
    const r = engine[v]('test-vistas');
    assert(r && r.ok, `${v} no devolvió ok`);
    assert(!hasUndefined(r.embeds.map(e => e.data)), `${v} con undefined`);
  }
  // DT
  assert(engine.stadiumView('test-vistas-dt').ok, 'stadiumView DT falló');
  assert(engine.fansView('test-vistas-dt').ok, 'fansView DT falló');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 9: Temporada completa integra objetivos y universo');
{
  const uid = 'test-season';
  const p = newPlayer({ name: 'Temporada', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  storage.setPlayer(uid, p);
  const res = engine.simulateEntireSeason(uid);
  assert(res && res.ok, 'simulateEntireSeason falló');
  const pl = storage.getPlayer(uid);
  assert(Array.isArray(pl.personalObjectives) && pl.personalObjectives.length >= 3, 'sin objetivos personales tras temporada');
  assert(typeof pl.fanRelation === 'number', 'sin relación con hinchada tras temporada');
  assert(pl.footballDNA && typeof pl.footballDNA.clutch === 'number', 'sin ADN tras temporada');
}

console.log('');
if (failures) {
  console.error(`❌ ${failures} verificaciones fallaron`);
  process.exit(1);
} else {
  console.log('✅ TODOS LOS TESTS DEL MUNDO/FEATURES NUEVAS PASARON');
}
