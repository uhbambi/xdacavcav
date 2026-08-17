'use strict';

/**
 * Test de regresión del Modo DT:
 *  1. La tabla de liga solo contiene a los clubes de la liga (los rivales de copa no se cuelan).
 *  2. La liga no se duplica (PJ nunca supera la cantidad de fechas).
 *  3. Los guardados corruptos por versiones anteriores se auto-reparan.
 */

process.env.DATABASE_URL = '';

const storage = require('../data/storage.js');
const engine = require('../game/engine.js');
const { newManager, ensureDTFixture, dtTableSorted } = require('../utils/manager.js');
const { getAllClubs } = require('../data/clubs.js');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('  ❌ FALLO:', msg);
  }
}

const CHILE_A = getAllClubs().filter(c => c.leagueKey === 'CHILE_A').map(c => c.name);

function checkTable(m, tag, allowed, totalRounds, expectedLen) {
  const t = m.table || [];
  const foreign = t.filter(r => !allowed.has(r.club));
  assert(foreign.length === 0, `${tag}: clubes ajenos en la tabla → ${foreign.map(r => r.club).join(', ')}`);
  assert(t.length === expectedLen, `${tag}: la tabla tiene ${t.length} filas (esperadas ${expectedLen})`);
  const maxPJ = Math.max(0, ...t.map(r => r.pj || 0));
  assert(maxPJ <= totalRounds, `${tag}: hay un club con PJ ${maxPJ} > ${totalRounds} fechas`);
  const my = t.find(r => r.club === m.club);
  assert(!!my, `${tag}: el club del DT no está en la tabla`);
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 1: DT con club personalizado ("roblox fc") · 3 temporadas paso a paso');
{
  const uid = 'test-dt-custom';
  const m0 = newManager({ name: 'Tester', clubName: 'roblox fc', userId: uid });
  ensureDTFixture(m0);
  storage.setManager(uid, m0);

  // roblox fc reemplaza al club más débil → 16 equipos exactos
  const allowed = new Set([...CHILE_A, 'roblox fc']);
  checkTable(m0, 'inicio', allowed, 15, 16);
  assert(m0.fixture.length === 15, `fixture inicial de ${m0.fixture.length} fechas (esperadas 15)`);

  let finishedSeasons = 0;
  let lastSeason = m0.season;
  for (let i = 0; i < 600 && finishedSeasons < 3; i++) {
    const res = engine.dtSimulateStep(uid);
    assert(res && res.ok !== false, `paso ${i}: dtSimulateStep devolvió error → ${res && res.content}`);
    const m = storage.getManager(uid);
    checkTable(m, `paso ${i} (etapa ${m.stage}, T${m.season})`, allowed, 15, 16);
    assert((m.matchdayIndex || 0) <= m.fixture.length, `paso ${i}: matchdayIndex ${m.matchdayIndex} > fixture ${m.fixture.length}`);
    if (m.season !== lastSeason) {
      finishedSeasons++;
      lastSeason = m.season;
    }
    if (failures) break;
  }
  assert(finishedSeasons >= 3, `solo se completaron ${finishedSeasons} temporadas en 600 pasos`);
  const mEnd = storage.getManager(uid);
  console.log(`  → Temporadas jugadas: ${mEnd.season} · Tabla final: ${mEnd.table.length} equipos · PJ máx: ${Math.max(...mEnd.table.map(r => r.pj))}`);
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 2: DT con club real (Colo-Colo) · simulación de temporada completa (⏩)');
{
  const uid = 'test-dt-colo';
  const m0 = newManager({ name: 'Tester2', clubName: 'Colo-Colo', userId: uid });
  ensureDTFixture(m0);
  storage.setManager(uid, m0);
  const allowed = new Set(CHILE_A);

  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 40; i++) {
      const res = engine.dtSimulateEntireSeason(uid);
      assert(res && res.ok !== false, `T${s}: dtSimulateEntireSeason error → ${res && res.content}`);
      const m = storage.getManager(uid);
      checkTable(m, `T${s} sim completa (etapa ${m.stage})`, allowed, 15, 16);
      if (m.stage === 'entretemporada') break;
      // Si quedó pausado en una final, se juega con el paso a paso
      engine.dtSimulateStep(uid);
      const m2 = storage.getManager(uid);
      checkTable(m2, `T${s} tras final (etapa ${m2.stage})`, allowed, 15, 16);
      if (m2.stage === 'entretemporada') break;
      if (failures) break;
    }
    if (failures) break;
    const m = storage.getManager(uid);
    const my = m.table.find(r => r.club === m.club);
    assert(my && my.pj === 15, `T${s}: el club del DT terminó la liga con PJ ${my && my.pj} (esperado 15)`);
    console.log(`  → T${m.season}: liga completa (PJ ${my.pj}/15), tabla ${m.table.length} equipos, etapa final: ${m.stage}`);
    // Avanzar a la siguiente temporada
    engine.dtSimulateStep(uid);
  }
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 3: Auto-reparación de un guardado corrupto (tabla con 25 clubes mezclados)');
{
  const uid = 'test-dt-corrupt';
  const m0 = newManager({ name: 'Tester3', clubName: 'roblox fc', userId: uid });
  ensureDTFixture(m0);

  // Reproducir el estado del bug reportado: rivales de Libertadores/Copa Chile metidos
  // en la tabla, PJ inflados a 30 y filas con clubes de otras ligas.
  const corruptRows = [
    ['roblox fc', 30], ['Union La Calera', 29], ['Coquimbo Unido', 30], ['Huachipato', 30],
    ['Audax Italiano', 30], ['Colo-Colo', 30], ["O'Higgins", 30], ['Palestino', 30],
    ['Union Espanola', 30], ['Universidad Catolica', 30], ['Everton de Vina del Mar', 30],
    ['Deportes Limache', 30], ['Deportes La Serena', 30], ['Cobresal', 30], ['Nublense', 16],
    ['Universidad de Chile', 30], ['Deportes Iquique', 27], ['Deportes Copiapo', 10],
    ['Lanus', 8], ['Cerro Porteno', 7], ['Emelec', 9], ['Talleres', 3], ['Botafogo', 1],
    ['San Marcos de Arica', 9], ['Sao Paulo', 1]
  ];
  m0.table = corruptRows.map(([club, pj]) => ({ club, pj, g: Math.floor(pj / 3), e: Math.floor(pj / 3), p: pj - 2 * Math.floor(pj / 3), gf: pj, gc: pj, dg: 0, pts: pj }));
  m0.matchdayIndex = 15;
  m0.fixture = m0.fixture.slice();
  m0.stage = 'liga';
  storage.setManager(uid, m0);

  const view = engine.dtTableView(uid);
  assert(view && view.ok, 'dtTableView falló sobre el guardado corrupto');
  const m = storage.getManager(uid);
  const allowed = new Set([...CHILE_A, 'roblox fc']);
  checkTable(m, 'tras reparación', allowed, 15, 16);
  assert(m.matchdayIndex === 0, `matchdayIndex tras reparación = ${m.matchdayIndex} (esperado 0)`);
  const foreignNames = ['Lanus', 'Cerro Porteno', 'Emelec', 'Talleres', 'Botafogo', 'Sao Paulo', 'San Marcos de Arica', 'Deportes Copiapo'];
  assert(!m.table.some(r => foreignNames.includes(r.club)), 'siguen clubes de copa en la tabla reparada');
  console.log(`  → Tabla reparada: ${m.table.length} equipos, todos de la liga, PJ en 0 para reiniciar la temporada limpia.`);

  // Y desde ese estado la carrera sigue funcionando:
  for (let i = 0; i < 50; i++) {
    engine.dtSimulateStep(uid);
    const mm = storage.getManager(uid);
    checkTable(mm, `post-reparación paso ${i} (etapa ${mm.stage})`, allowed, 15, 16);
    if (failures) break;
  }
}

// ─────────────────────────────────────────────────────────────────
console.log('TEST 4: Modo jugador · la tabla de liga tampoco se contamina');
{
  const uid = 'test-player-1';
  const { newPlayer } = require('../utils/player.js');
  const p = newPlayer({ name: 'Testino', position: 'DEL', nationalityLeagueKey: 'CHILE' });
  storage.setPlayer(uid, p);
  const { getLeague } = require('../data/clubs.js');

  for (let i = 0; i < 300; i++) {
    const res = engine.simulateEntireSeason(uid);
    const pl = storage.getPlayer(uid);
    if (pl.retired) break;
    if (pl.stage === 'liga' && pl.table && Object.keys(pl.table).length) {
      const league = getLeague(pl.leagueKey);
      const names = new Set([...league.clubs.map(c => c.name), pl.club]);
      const foreign = Object.keys(pl.table).filter(n => !names.has(n));
      assert(foreign.length === 0, `jugador: clubes ajenos en tabla de ${league.name} → ${foreign.join(', ')}`);
      const maxPJ = Math.max(...Object.values(pl.table).map(r => r.pj));
      assert(maxPJ <= league.clubs.length - 1, `jugador: PJ ${maxPJ} > ${league.clubs.length - 1} fechas`);
    }
    // Resolver pausas (finales, mercado de pases): elegir quedarse / continuar
    if (pl.stage === 'entretemporada') engine.performTransfer && engine.performTransfer(uid, 'stay');
    if (pl.pendingTactic !== undefined) { /* noop */ }
    if (failures) break;
    if (pl.season > 6) break;
  }
  const pl = storage.getPlayer(uid);
  console.log(`  → Carrera del jugador avanzó hasta la temporada ${pl.season} sin contaminación de tabla.`);
}

console.log('');
if (failures) {
  console.error(`❌ ${failures} verificaciones fallaron`);
  process.exit(1);
} else {
  console.log('✅ TODOS LOS TESTS PASARON');
}
