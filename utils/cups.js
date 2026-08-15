'use strict';

const { getAllClubs, findClub, getLeague, getNationalClubsForCup } = require('../data/clubs.js');
const { NATIONS, findNation, nationAsClub, nationFlag } = require('../data/nations.js');
const { rand, pick, simulateGenericMatch, penaltyShootout, clubStrength } = require('./simulation.js');

/**
 * Torneos: Copas Nacionales, Copas Continentales (Libertadores, Sudamericana, Champions, etc.) y Mundial.
 *
 * Estructuras soportadas:
 * - Copa Nacional: Knockout directo (dieciseisavos/octavos/cuartos/semi/final) entre todos los clubes del país.
 * - Copa Continental: Fase de grupos (4 equipos, 6 fechas ida y vuelta) -> octavos -> cuartos -> semifinal -> final.
 * - Mundial de Selecciones: Grupos (3 fechas, 1 rueda) -> octavos -> cuartos -> semifinal -> final.
 */

const KNOCKOUT_ORDER = ['dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'];

const PHASE_LABELS = {
  grupos: 'Fase de grupos',
  dieciseisavos: 'Dieciseisavos de final',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinal',
  final: 'FINAL'
};

function cupNameFor(confed) {
  if (confed === 'CONMEBOL') return 'Copa Libertadores';
  if (confed === 'UEFA') return 'UEFA Champions League';
  if (confed === 'CONCACAF') return 'Copa de Campeones CONCACAF';
  if (confed === 'AFC') return 'AFC Champions League Elite';
  return 'Copa Continental';
}

function emptyRow() {
  return { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
}

function addResult(table, team, gf, gc) {
  if (!table[team]) table[team] = emptyRow();
  const t = table[team];
  t.pj += 1;
  t.gf += gf;
  t.gc += gc;
  if (gf > gc) { t.g += 1; t.pts += 3; }
  else if (gf === gc) { t.e += 1; t.pts += 1; }
  else { t.p += 1; }
}

function groupStandings(table) {
  return Object.entries(table)
    .map(([team, t]) => ({ team, ...t, dg: t.gf - t.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

/** Rivales de copa continental según el torneo al que clasificó */
function continentalPool(player, qualification = null, exclude = []) {
  const league = getLeague(player.leagueKey);
  const confed = league ? league.confed : 'CONMEBOL';
  const type = qualification ? qualification.type : (confed === 'CONMEBOL' ? 'libertadores' : 'champions');
  const all = getAllClubs().filter(c => c.confed === confed && c.name !== player.club && !exclude.includes(c.name));

  let filtered = [];
  if (type === 'libertadores') {
    filtered = all.filter(c => c.level === 1 && c.media >= 63);
  } else if (type === 'sudamericana') {
    filtered = all.filter(c => (c.level === 1 || c.media >= 56) && c.media <= 78);
  } else if (type === 'champions') {
    filtered = all.filter(c => c.level === 1 && c.media >= 75);
  } else if (type === 'europa') {
    filtered = all.filter(c => c.media >= 68 && c.media <= 83);
  } else if (type === 'conference') {
    filtered = all.filter(c => c.media >= 60 && c.media <= 77);
  } else {
    filtered = all.filter(c => c.level === 1);
  }

  if (filtered.length >= 3) return filtered;
  return all.length ? all : [{ name: 'Rival Continental', media: 70, tier: 3 }];
}

/** Calendario de grupo: 4 equipos, ida y vuelta (6 fechas) o 1 vuelta (3 fechas) */
function buildGroupSchedule(teams, doubleRound) {
  const [a, b, c, d] = teams;
  const single = [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]]
  ];
  const rounds = single.map(r => r.map(([home, away]) => ({ home, away })));
  if (!doubleRound) return rounds;
  const back = single.map(r => r.map(([home, away]) => ({ home: away, away: home })));
  return [...rounds, ...back];
}

function createTournament({ kind, name, myTeam, participants = [], doubleRound = false, knockoutPool = [], startingPhase = 'grupos' }) {
  const teams = startingPhase === 'grupos' ? [myTeam, ...participants] : [myTeam];
  const table = {};
  for (const t of teams) table[t] = emptyRow();

  const tourney = {
    kind,                 // 'copa_nacional' | 'copa' | 'mundial'
    name,
    myTeam,
    phase: startingPhase,
    groupTeams: teams,
    groupSchedule: startingPhase === 'grupos' ? buildGroupSchedule(teams, doubleRound) : [],
    groupIndex: 0,
    groupTable: table,
    knockoutOpponent: null,
    knockoutPool: knockoutPool || [],
    usedOpponents: [...participants],
    history: []
  };

  if (startingPhase !== 'grupos') {
    drawKnockoutOpponent(tourney);
  }

  return tourney;
}

/** Copa Nacional (Copa del Rey, Copa Chile, Copa Argentina, FA Cup, Copa do Brasil, etc.) */
function createNationalCup(player) {
  const league = getLeague(player.leagueKey);
  const country = league ? league.country : player.nationality;
  const cupName = (league && league.cupName) ? league.cupName : `Copa de ${country}`;

  const allNationalClubs = getNationalClubsForCup(country);
  const pool = allNationalClubs.filter(c => c.name !== player.club).map(c => c.name);

  // Determinar fase inicial según cantidad de participantes disponibles
  let startingPhase = 'octavos';
  if (pool.length >= 15) {
    startingPhase = 'dieciseisavos';
  } else if (pool.length >= 7) {
    startingPhase = 'octavos';
  } else if (pool.length >= 3) {
    startingPhase = 'cuartos';
  } else {
    startingPhase = 'semifinal';
  }

  return createTournament({
    kind: 'copa_nacional',
    name: cupName,
    myTeam: player.club,
    participants: [],
    doubleRound: false,
    knockoutPool: pool.length ? pool : ['Club Rival'],
    startingPhase
  });
}

/** Copa continental del club del jugador (Libertadores, Sudamericana, Champions, Europa, etc.) */
function createContinentalCup(player, qualification = null) {
  const league = getLeague(player.leagueKey);
  const confed = league ? league.confed : 'CONMEBOL';
  const cupName = qualification ? qualification.name : cupNameFor(confed);
  const pool = continentalPool(player, qualification);

  const groupRivals = [];
  const used = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const candidates = pool.filter(c => !used.includes(c.name) && !groupRivals.includes(c.name));
    if (!candidates.length) break;
    const chosen = pick(candidates);
    groupRivals.push(chosen.name);
    used.push(chosen.name);
  }

  return createTournament({
    kind: 'copa',
    name: cupName,
    myTeam: player.club,
    participants: groupRivals,
    doubleRound: true,
    knockoutPool: continentalPool(player, qualification, groupRivals).map(c => c.name),
    startingPhase: 'grupos'
  });
}

/** Mundial con la seleccion del jugador */
function createWorldCup(player) {
  const nation = findNation(player.nationality);
  if (!nation) return null;

  const others = NATIONS.filter(n => n.name !== nation.name);
  const rivals = [];
  while (rivals.length < 3 && others.length) {
    const chosen = pick(others.filter(n => !rivals.includes(n.name)));
    if (!chosen) break;
    rivals.push(chosen.name);
  }

  return createTournament({
    kind: 'mundial',
    name: 'Copa del Mundo',
    myTeam: nation.name,
    participants: rivals,
    doubleRound: false,
    knockoutPool: others.filter(n => !rivals.includes(n.name)).map(n => n.name),
    startingPhase: 'grupos'
  });
}

/** Torneo Continental de Selecciones (Copa América, Eurocopa, etc.) */
function createContinentalNationalTournament(player) {
  const nation = findNation(player.nationality);
  if (!nation) return null;

  let tourneyName = 'Copa América';
  let poolNations = [];

  if (nation.confed === 'CONMEBOL' || nation.confed === 'CONCACAF') {
    tourneyName = 'Copa América';
    poolNations = NATIONS.filter(n => n.name !== nation.name && (n.confed === 'CONMEBOL' || n.confed === 'CONCACAF'));
  } else if (nation.confed === 'UEFA') {
    tourneyName = 'UEFA Eurocopa';
    poolNations = NATIONS.filter(n => n.name !== nation.name && n.confed === 'UEFA');
  } else if (nation.confed === 'AFC') {
    tourneyName = 'Copa Asiática AFC';
    poolNations = NATIONS.filter(n => n.name !== nation.name && n.confed === 'AFC');
  } else {
    tourneyName = 'Copa de Naciones';
    poolNations = NATIONS.filter(n => n.name !== nation.name && n.confed === 'CAF');
  }

  if (poolNations.length < 3) {
    poolNations = NATIONS.filter(n => n.name !== nation.name);
  }

  const rivals = [];
  while (rivals.length < 3 && poolNations.length) {
    const chosen = pick(poolNations.filter(n => !rivals.includes(n.name)));
    if (!chosen) break;
    rivals.push(chosen.name);
  }

  return createTournament({
    kind: 'copa_seleccion',
    name: tourneyName,
    myTeam: nation.name,
    participants: rivals,
    doubleRound: false,
    knockoutPool: poolNations.filter(n => !rivals.includes(n.name)).map(n => n.name),
    startingPhase: 'grupos'
  });
}

/** Convierte el nombre de un rival en algo simulable (club o seleccion) */
function teamAsOpponent(tournament, name) {
  if (tournament.kind === 'mundial' || tournament.kind === 'copa_seleccion') {
    const nation = NATIONS.find(n => n.name === name);
    return nation ? nationAsClub(nation) : { name, media: 72, tier: 4 };
  }
  const club = findClub(name);
  return club || { name, media: 68, tier: 3 };
}

/** Proximo rival del jugador en el torneo (o null si ya termino) */
function nextOpponent(tournament) {
  if (!tournament) return null;
  if (tournament.phase === 'grupos') {
    const round = tournament.groupSchedule[tournament.groupIndex];
    if (!round) return null;
    const pairing = round.find(p => p.home === tournament.myTeam || p.away === tournament.myTeam);
    if (!pairing) return null;
    const oppName = pairing.home === tournament.myTeam ? pairing.away : pairing.home;
    return teamAsOpponent(tournament, oppName);
  }
  if (KNOCKOUT_ORDER.includes(tournament.phase)) {
    if (!tournament.knockoutOpponent) {
      drawKnockoutOpponent(tournament);
    }
    return teamAsOpponent(tournament, tournament.knockoutOpponent);
  }
  return null;
}

function phaseLabel(tournament) {
  if (!tournament) return '';
  if (tournament.phase === 'grupos') {
    return `Fase de grupos · Fecha ${tournament.groupIndex + 1}/${tournament.groupSchedule.length}`;
  }
  return PHASE_LABELS[tournament.phase] || tournament.phase;
}

/** ¿Es un partido de los importantes (minijuego garantizado)? */
function isBigMatch(tournament) {
  if (!tournament) return false;
  if (tournament.kind === 'copa_nacional') {
    return tournament.phase === 'semifinal' || tournament.phase === 'final';
  }
  return tournament.phase !== 'grupos' || tournament.groupIndex >= tournament.groupSchedule.length - 2;
}

function drawKnockoutOpponent(tournament) {
  const available = tournament.knockoutPool.filter(n => !tournament.usedOpponents.includes(n));
  const name = available.length
    ? pick(available)
    : pick(tournament.knockoutPool.length ? tournament.knockoutPool : ['Rival']);
  tournament.usedOpponents.push(name);
  tournament.knockoutOpponent = name;
  return name;
}

/**
 * Aplica el resultado del partido del jugador y avanza el torneo.
 * Devuelve { status, text } con status 'continue' | 'campeon' | 'eliminado'.
 */
function applyTournamentResult(tournament, myGoals, oppGoals) {
  if (tournament.phase === 'grupos') {
    const round = tournament.groupSchedule[tournament.groupIndex];
    const pairing = round.find(p => p.home === tournament.myTeam || p.away === tournament.myTeam);
    const oppName = pairing.home === tournament.myTeam ? pairing.away : pairing.home;

    addResult(tournament.groupTable, tournament.myTeam, myGoals, oppGoals);
    addResult(tournament.groupTable, oppName, oppGoals, myGoals);

    // El otro partido del grupo
    for (const p of round) {
      if (p.home === tournament.myTeam || p.away === tournament.myTeam) continue;
      const home = teamAsOpponent(tournament, p.home);
      const away = teamAsOpponent(tournament, p.away);
      const { aGoals, bGoals } = simulateGenericMatch(home, away);
      addResult(tournament.groupTable, p.home, aGoals, bGoals);
      addResult(tournament.groupTable, p.away, bGoals, aGoals);
      tournament.history.push(`${p.home} ${aGoals}-${bGoals} ${p.away}`);
    }

    tournament.groupIndex += 1;

    if (tournament.groupIndex < tournament.groupSchedule.length) {
      return { status: 'continue', text: null };
    }

    const standings = groupStandings(tournament.groupTable);
    const myPos = standings.findIndex(r => r.team === tournament.myTeam) + 1;
    if (myPos <= 2) {
      tournament.phase = 'octavos';
      const opponent = drawKnockoutOpponent(tournament);
      return {
        status: 'continue',
        text: `✅ **${tournament.myTeam}** termina ${myPos}° del grupo y clasifica a octavos de final. Rival: **${opponent}**.`
      };
    }
    tournament.phase = 'eliminado';
    return {
      status: 'eliminado',
      text: `❌ **${tournament.myTeam}** quedó ${myPos}° del grupo y se despide de la ${tournament.name}.`
    };
  }

  // Mata-mata (Knockout)
  const oppName = tournament.knockoutOpponent;
  let won = myGoals > oppGoals;
  let penaltiesText = '';

  if (myGoals === oppGoals) {
    const me = tournament.kind === 'mundial'
      ? teamAsOpponent(tournament, tournament.myTeam)
      : (findClub(tournament.myTeam) || { name: tournament.myTeam, media: 70 });
    const shootout = penaltyShootout(me, teamAsOpponent(tournament, oppName));
    won = shootout.winner === 'A';
    penaltiesText = `\n🎯 Definición por penales: **${myGoals}(${shootout.a}) - ${oppGoals}(${shootout.b}) ${oppName}**.`;
  }

  const label = PHASE_LABELS[tournament.phase] || tournament.phase;

  if (!won) {
    tournament.phase = 'eliminado';
    return { status: 'eliminado', text: `❌ **${tournament.myTeam}** queda eliminado en ${label} de la ${tournament.name}.${penaltiesText}` };
  }

  if (tournament.phase === 'final') {
    tournament.phase = 'campeon';
    return { status: 'campeon', text: `🏆 ¡**${tournament.myTeam}** es CAMPEÓN de la ${tournament.name}!${penaltiesText}` };
  }

  const currentIndex = KNOCKOUT_ORDER.indexOf(tournament.phase);
  const nextPhase = KNOCKOUT_ORDER[currentIndex + 1];
  tournament.phase = nextPhase;
  const opponent = drawKnockoutOpponent(tournament);
  return {
    status: 'continue',
    text: `✅ **${tournament.myTeam}** avanza a ${PHASE_LABELS[nextPhase]} de la ${tournament.name}. Rival: **${opponent}**.${penaltiesText}`
  };
}

/** ¿Es la gran final del torneo? */
function isFinal(tournament) {
  return tournament && tournament.phase === 'final';
}

/**
 * Cierra un mata-mata que se definió por penales interactivos (shootout),
 * sin volver a tirar una moneda. `wonByMe` viene del resultado de la tanda.
 */
function finalizeShootout(tournament, wonByMe, penaltiesText) {
  const label = PHASE_LABELS[tournament.phase] || tournament.phase;

  if (!wonByMe) {
    tournament.phase = 'eliminado';
    return { status: 'eliminado', text: `❌ **${tournament.myTeam}** cae por penales en ${label} de la ${tournament.name}.${penaltiesText || ''}` };
  }

  if (tournament.phase === 'final') {
    tournament.phase = 'campeon';
    return { status: 'campeon', text: `🏆 ¡**${tournament.myTeam}** es CAMPEÓN de la ${tournament.name} tras ganar la definición por penales!${penaltiesText || ''}` };
  }

  const currentIndex = KNOCKOUT_ORDER.indexOf(tournament.phase);
  const nextPhase = KNOCKOUT_ORDER[currentIndex + 1];
  tournament.phase = nextPhase;
  const opponent = drawKnockoutOpponent(tournament);
  return {
    status: 'continue',
    text: `✅ **${tournament.myTeam}** avanza por penales a ${PHASE_LABELS[nextPhase]} de la ${tournament.name}. Rival: **${opponent}**.${penaltiesText || ''}`
  };
}

/** Texto de la tabla del grupo, listo para un embed */
function groupTableText(tournament) {
  if (!tournament.groupTable || !Object.keys(tournament.groupTable).length) {
    return `Cuadro de eliminación directa: **${phaseLabel(tournament)}** vs **${tournament.knockoutOpponent || 'Rival'}**`;
  }
  return groupStandings(tournament.groupTable)
    .map((r, i) => {
      const marker = r.team === tournament.myTeam ? '👉' : `${i + 1}.`;
      const flag = tournament.kind === 'mundial' ? `${nationFlag(r.team)} ` : '';
      return `${marker} ${flag}**${r.team}** — Pts:${r.pts} PJ:${r.pj} DG:${r.dg >= 0 ? '+' : ''}${r.dg}`;
    })
    .join('\n');
}

/** ¿Le toca torneo de Selección esta temporada y está convocado? */
function nationalTeamCallUp(player) {
  const nation = findNation(player.nationality);
  if (!nation) return { called: false, reason: 'sin_seleccion' };

  const required = Math.max(60, nation.media - 12);
  const meetsLevel = player.overall >= required;

  // Temporada % 4 === 0: Mundial
  if (player.season % 4 === 0) {
    if (!meetsLevel) return { called: false, reason: 'nivel', required, nation, type: 'mundial', cupName: 'Copa del Mundo' };
    return { called: true, nation, type: 'mundial', cupName: 'Copa del Mundo' };
  }

  // Temporada % 4 === 2: Torneo Continental de Selecciones (Copa América, Eurocopa, etc.)
  if (player.season % 4 === 2) {
    let cupName = 'Copa América';
    if (nation.confed === 'UEFA') cupName = 'UEFA Eurocopa';
    else if (nation.confed === 'AFC') cupName = 'Copa Asiática AFC';
    else if (nation.confed === 'CAF') cupName = 'Copa Africana de Naciones';

    if (!meetsLevel) return { called: false, reason: 'nivel', required, nation, type: 'continental', cupName };
    return { called: true, nation, type: 'continental', cupName };
  }

  return { called: false, reason: 'no_year' };
}

/** Compatibilidad */
function worldCupCallUp(player) {
  return nationalTeamCallUp(player);
}

module.exports = {
  KNOCKOUT_ORDER,
  PHASE_LABELS,
  cupNameFor,
  createNationalCup,
  createContinentalCup,
  createWorldCup,
  createContinentalNationalTournament,
  nextOpponent,
  phaseLabel,
  isBigMatch,
  isFinal,
  applyTournamentResult,
  finalizeShootout,
  groupTableText,
  groupStandings,
  worldCupCallUp,
  nationalTeamCallUp,
  teamAsOpponent
};

