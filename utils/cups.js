'use strict';

const { getAllClubs, findClub, getLeague } = require('../data/clubs.js');
const { NATIONS, findNation, nationAsClub, nationFlag } = require('../data/nations.js');
const { rand, pick, simulateGenericMatch, penaltyShootout, clubStrength } = require('./simulation.js');

/**
 * Torneos con fase de grupos + mata-mata.
 *
 * Un torneo (`tournament`) sirve tanto para las copas continentales como para el Mundial:
 *   grupos (4 equipos, ida y vuelta en copas / una rueda en el Mundial)
 *   -> octavos -> cuartos -> semifinal -> final
 *
 * Se guarda entero dentro del jugador (player.cup / player.worldCup) para que la carrera
 * siga donde quedo aunque se reinicie el bot.
 */

const CUP_NAMES = {
  CONMEBOL: 'Copa Libertadores',
  UEFA: 'UEFA Champions League',
  CONCACAF: 'Concachampions',
  AFC: 'AFC Champions League'
};

const KNOCKOUT_ORDER = ['octavos', 'cuartos', 'semifinal', 'final'];

const PHASE_LABELS = {
  grupos: 'Fase de grupos',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinal',
  final: 'FINAL'
};

function cupNameFor(confed) {
  return CUP_NAMES[confed] || 'Copa Continental';
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

/** Rivales posibles de copa continental: clubes fuertes de la misma confederacion */
function continentalPool(player, exclude = []) {
  const league = getLeague(player.leagueKey);
  const confed = league ? league.confed : 'CONMEBOL';
  const myMedia = player.clubMedia || 65;
  const pool = getAllClubs().filter(c =>
    c.confed === confed &&
    c.level === 1 &&
    c.name !== player.club &&
    !exclude.includes(c.name) &&
    c.media >= Math.min(70, myMedia - 6)
  );
  return pool.length ? pool : getAllClubs().filter(c => c.confed === confed && c.name !== player.club);
}

/** Calendario de grupo: 4 equipos, ida y vuelta (6 fechas) */
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

function createTournament({ kind, name, myTeam, participants, doubleRound, knockoutPool }) {
  const teams = [myTeam, ...participants];
  const table = {};
  for (const t of teams) table[t] = emptyRow();

  return {
    kind,                 // 'copa' | 'mundial'
    name,
    myTeam,
    phase: 'grupos',
    groupTeams: teams,
    groupSchedule: buildGroupSchedule(teams, doubleRound),
    groupIndex: 0,
    groupTable: table,
    knockoutOpponent: null,
    knockoutPool: knockoutPool || [],
    usedOpponents: [...participants],
    history: []
  };
}

/** Copa continental del club del jugador, arrancando en fase de grupos */
function createContinentalCup(player) {
  const league = getLeague(player.leagueKey);
  const confed = league ? league.confed : 'CONMEBOL';
  const pool = continentalPool(player);

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
    name: cupNameFor(confed),
    myTeam: player.club,
    participants: groupRivals,
    doubleRound: true,
    knockoutPool: continentalPool(player, groupRivals).map(c => c.name)
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
    knockoutPool: others.filter(n => !rivals.includes(n.name)).map(n => n.name)
  });
}

/** Convierte el nombre de un rival en algo simulable (club o seleccion) */
function teamAsOpponent(tournament, name) {
  if (tournament.kind === 'mundial') {
    const nation = NATIONS.find(n => n.name === name);
    return nation ? nationAsClub(nation) : { name, media: 72, tier: 4 };
  }
  const club = findClub(name);
  return club || { name, media: 72, tier: 4 };
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
  if (KNOCKOUT_ORDER.includes(tournament.phase) && tournament.knockoutOpponent) {
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
  return tournament.phase !== 'grupos' || tournament.groupIndex >= tournament.groupSchedule.length - 2;
}

function drawKnockoutOpponent(tournament) {
  const available = tournament.knockoutPool.filter(n => !tournament.usedOpponents.includes(n));
  const name = available.length ? pick(available) : pick(tournament.knockoutPool.length ? tournament.knockoutPool : ['Rival Continental']);
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

  // Mata-mata
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

  const nextPhase = KNOCKOUT_ORDER[KNOCKOUT_ORDER.indexOf(tournament.phase) + 1];
  tournament.phase = nextPhase;
  const opponent = drawKnockoutOpponent(tournament);
  return {
    status: 'continue',
    text: `✅ **${tournament.myTeam}** avanza a ${PHASE_LABELS[nextPhase]} de la ${tournament.name}. Rival: **${opponent}**.${penaltiesText}`
  };
}

/** Texto de la tabla del grupo, listo para un embed */
function groupTableText(tournament) {
  return groupStandings(tournament.groupTable)
    .map((r, i) => {
      const marker = r.team === tournament.myTeam ? '👉' : `${i + 1}.`;
      const flag = tournament.kind === 'mundial' ? `${nationFlag(r.team)} ` : '';
      return `${marker} ${flag}**${r.team}** — Pts:${r.pts} PJ:${r.pj} DG:${r.dg >= 0 ? '+' : ''}${r.dg}`;
    })
    .join('\n');
}

/** ¿Le toca Mundial esta temporada y esta convocado? */
function worldCupCallUp(player) {
  if (player.season % 4 !== 0) return { called: false, reason: 'no_year' };
  const nation = findNation(player.nationality);
  if (!nation) return { called: false, reason: 'sin_seleccion' };
  const required = Math.max(62, nation.media - 12);
  if (player.overall < required) {
    return { called: false, reason: 'nivel', required, nation };
  }
  return { called: true, nation };
}

module.exports = {
  CUP_NAMES,
  PHASE_LABELS,
  cupNameFor,
  createContinentalCup,
  createWorldCup,
  nextOpponent,
  phaseLabel,
  isBigMatch,
  applyTournamentResult,
  groupTableText,
  groupStandings,
  worldCupCallUp,
  teamAsOpponent
};
