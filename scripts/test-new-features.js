'use strict';

/**
 * Test de regresión de las features nuevas:
 *  1. getReputationSummary funciona (sin undefined en /perfil y /reputacion).
 *  2. Energía del plantel DT definida y consistente tras los partidos.
 *  3. /dt tactica y /dt charla sin "undefined".
 *  4. /vitrina para jugador y para DT.
 *  5. Declive de media garantizado desde los 34 años.
 *  6. Ofertas de clubes peores para veteranos (34+).
 */

process.env.DATABASE_URL = '';

const storage = require('../data/storage.js');
const engine = require('../game/engine.js');
const { newManager } = require('../utils/manager.js');
const { newPlayer, developPlayer, generateOffers } = require('../utils/player.js');
const { getReputationSummary } = require('../utils/reputation.js');

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
console.log('TEST 1: getReputationSummary y vistas sin undefined');
{
  const p = newPlayer({ name: 'Testino', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  storage.setPlayer('test-r', p);

  const summary = getReputationSummary(p);
  assert(typeof summary.reputation === 'number', 'reputation no es número');
  assert(typeof summary.popularity === 'number', 'popularity no es número');
  assert(typeof summary.prestige === 'number', 'prestige no es número');
  assert(typeof summary.tierLabel === 'string' && summary.tierLabel.length > 0, 'tierLabel vacío');
  assert(typeof summary.pressQuote === 'string' && summary.pressQuote.length > 0, 'pressQuote vacío');

  const prof = engine.profileView('test-r');
  assert(prof.ok && !hasUndefined(prof.embeds.map(e => e.data)), 'profileView con undefined');
  const rep = engine.reputationView('test-r');
  assert(rep.ok && !hasUndefined(rep.embeds.map(e => e.data)), 'reputationView con undefined');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 2: Energía del plantel DT');
{
  const uid = 'test-energy';
  const m = newManager({ name: 'Tester', clubName: 'Colo-Colo', userId: uid });
  storage.setManager(uid, m);

  assert((m.squad || []).every(p => typeof p.energy === 'number'), 'plantel sin energía inicial');

  const sv = engine.dtSquadView(uid);
  assert(sv.ok && !hasUndefined(sv.embeds.map(e => e.data)), 'dtSquadView con energía undefined');

  // Simular un partido y ver que la energía cambia
  engine.dtSimulateStep(uid);
  const after = storage.getManager(uid);
  const starters = after.squad.filter(p => after.startingXI.includes(p.id));
  assert(starters.every(p => typeof p.energy === 'number' && p.energy <= 100), 'energía titular inválida tras partido');
  assert(after.squad.every(p => typeof p.energy === 'number'), 'energía undefined en algún jugador tras partido');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 3: /dt tactica y /dt charla sin undefined');
{
  const uid = 'test-dt-views';
  const m = newManager({ name: 'Tester', clubName: 'Colo-Colo', userId: uid });
  storage.setManager(uid, m);

  const tacList = engine.dtTacticView(uid);
  assert(tacList.ok && !hasUndefined(tacList.embeds.map(e => e.data)), '/dt tactica (lista) con undefined');

  const tacChange = engine.dtTacticView(uid, '4-4-2', 'cerrojo');
  assert(tacChange.ok && !hasUndefined(tacChange.embeds.map(e => e.data)), '/dt tactica (cambio) con undefined');

  const charlaList = engine.dtTeamTalkView(uid);
  assert(charlaList.ok && !hasUndefined(charlaList.embeds.map(e => e.data)), '/dt charla (lista) con undefined');

  const charlaApply = engine.dtTeamTalkView(uid, 'tactica');
  assert(charlaApply.ok && !hasUndefined(charlaApply.embeds.map(e => e.data)), '/dt charla (aplicar) con undefined');

  // La charla guardada se consume en el próximo partido
  const m2 = storage.getManager(uid);
  assert(!!m2.lastTeamTalk, 'la charla no quedó guardada para el próximo partido');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 4: /vitrina para jugador y DT');
{
  const p = newPlayer({ name: 'Vitrina', position: 'MED', nationalityLeagueKey: 'CHILE' });
  p.career.trophies.push('Campeón Primera División (Temporada 1)');
  p.career.awards.push('Balón de Oro (Temporada 1)');
  storage.setPlayer('test-vitrina', p);
  const vp = engine.vitrinaView('test-vitrina');
  assert(vp.ok && !hasUndefined(vp.embeds.map(e => e.data)), '/vitrina jugador con undefined');

  const m = newManager({ name: 'Tester', clubName: 'Colo-Colo', userId: 'test-vitrina-dt' });
  m.trophies.push('Campeón Primera División (Temporada 1)');
  storage.setManager('test-vitrina-dt', m);
  const vm = engine.vitrinaView('test-vitrina-dt');
  assert(vm.ok && !hasUndefined(vm.embeds.map(e => e.data)), '/vitrina DT con undefined');

  const none = engine.vitrinaView('test-vitrina-nadie');
  assert(none && none.ok === false, '/vitrina sin carrera no devuelve error controlado');
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 5: Declive de media desde los 34');
{
  const p = newPlayer({ name: 'Veterano', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  p.age = 34;
  p.overall = 84;
  p.potential = 90;
  for (const k of ['ritmo', 'tiro', 'pase', 'regate', 'defensa', 'fisico']) p.attributes[k] = 84;
  p.trainerPurchased = false;
  p.chefPurchased = false;

  let prev = p.overall;
  for (let i = 0; i < 8; i++) {
    p.seasonStats = { apps: 30, goals: 25, assists: 8, avgRatingSum: 30 * 8.5 };
    p.morale = 85;
    developPlayer(p);
    assert(p.overall < prev, `la media no bajó a los ${p.age} (${prev} → ${p.overall})`);
    prev = p.overall;
  }
  assert(p.overall < 84, 'tras 8 temporadas la media debería ser claramente menor a la inicial');
  console.log(`  → Media final a los 42: ${p.overall} (arrancó en 84)`);
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 6: Ofertas de clubes peores para veteranos');
{
  const joven = newPlayer({ name: 'Joven', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  joven.age = 24;
  joven.overall = 78;
  const ofertasJoven = generateOffers(joven);
  const mediaJoven = Math.max(...ofertasJoven.map(c => c.media));

  const veterano = newPlayer({ name: 'Viejo', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  veterano.age = 36;
  veterano.overall = 78;
  const ofertasViejo = generateOffers(veterano);
  const mediaViejo = Math.max(...ofertasViejo.map(c => c.media));

  assert(ofertasViejo.length > 0, 'el veterano no recibió ofertas');
  assert(mediaViejo < mediaJoven, `las ofertas del veterano (${mediaViejo}) no son peores que las del joven (${mediaJoven})`);
  assert(mediaViejo < veterano.overall, `las ofertas del veterano (${mediaViejo}) no están por debajo de su media (${veterano.overall})`);
  console.log(`  → Joven (${joven.overall}): oferta máx ${mediaJoven} · Veterano (${veterano.overall}): oferta máx ${mediaViejo}`);
}

console.log('');
if (failures) {
  console.error(`❌ ${failures} verificaciones fallaron`);
  process.exit(1);
} else {
  console.log('✅ TODOS LOS TESTS DE FEATURES NUEVAS PASARON');
}
