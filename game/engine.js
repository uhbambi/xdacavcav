'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const storage = require('../data/storage.js');
const { findClub, getLeague, getContinentalQualification, FLAGS } = require('../data/clubs.js');
const { nationFlag, findNation } = require('../data/nations.js');
const { simulateMatch, simulateMatchWithoutPlayer, TACTICS, POSITIONS, rand } = require('../utils/simulation.js');
const { describeAttributes, ATTR_LABELS } = require('../utils/attributes.js');
const {
  ensureFixture, simulateOtherRoundMatches, playMatchdayWithoutPlayer,
  updateTable, standingsSorted, applyPromotionRelegation, finishSeason
} = require('../utils/season.js');
const {
  createNationalCup, createContinentalCup, createWorldCup, nextOpponent, phaseLabel,
  isBigMatch, applyTournamentResult, groupTableText, worldCupCallUp, cupNameFor
} = require('../utils/cups.js');
const { createMinigame, minigameDef, resolveMinigame } = require('../utils/minigames.js');
const { maybePickMomento, maybePickCareerEvent, applyEffect, MOMENTOS, EVENTOS_CARRERA } = require('../utils/decisions.js');
const { reputation } = require('../utils/player.js');

function flagFor(country) {
  return FLAGS[country] || '';
}

function getMomentoById(id) {
  return MOMENTOS.find(m => m.id === id) || null;
}

function getCareerEventById(id) {
  return EVENTOS_CARRERA.find(e => e.id === id) || null;
}

function noPlayer() {
  return { ok: false, ephemeral: true, content: 'Todavia no tenis jugador. Usa `/crear-jugador` para empezar.' };
}

// ─────────────────────────────── Botones ───────────────────────────────

function continueRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`sim:${userId}`).setLabel('▶️ Siguiente partido').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`tabla:${userId}`).setLabel('📊 Tabla').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`perfil:${userId}`).setLabel('🪪 Perfil').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`atributos:${userId}`).setLabel('📈 Atributos').setStyle(ButtonStyle.Secondary)
  );
}

function tacticRow(userId) {
  return new ActionRowBuilder().addComponents(
    Object.entries(TACTICS).map(([key, t]) =>
      new ButtonBuilder().setCustomId(`tactic:${userId}:${key}`).setLabel(`${t.emoji} ${t.label}`).setStyle(ButtonStyle.Primary)
    )
  );
}

function minigameRow(userId, def) {
  return new ActionRowBuilder().addComponents(
    def.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`mini:${userId}:${i}`)
        .setLabel(`${opt.emoji} ${opt.label}`.slice(0, 80))
        .setStyle(ButtonStyle.Danger)
    )
  );
}

function offersRows(userId, offers) {
  const buttons = offers.slice(0, 20).map((clubName, i) =>
    new ButtonBuilder()
      .setCustomId(`transfer:${userId}:${i}`)
      .setLabel(clubName.length > 75 ? `${clubName.slice(0, 72)}...` : clubName)
      .setStyle(ButtonStyle.Primary)
  );
  buttons.push(new ButtonBuilder().setCustomId(`transfer:${userId}:stay`).setLabel('Quedarme').setStyle(ButtonStyle.Secondary));
  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }
  return rows;
}

function momentoRow(userId, momento) {
  return new ActionRowBuilder().addComponents(
    momento.options.map((opt, i) =>
      new ButtonBuilder().setCustomId(`momento:${userId}:${i}`).setLabel(opt.label.slice(0, 80)).setStyle(ButtonStyle.Secondary)
    )
  );
}

function careerEventRow(userId, event) {
  return new ActionRowBuilder().addComponents(
    event.options.map((opt, i) =>
      new ButtonBuilder().setCustomId(`career:${userId}:${i}`).setLabel(opt.label.slice(0, 80)).setStyle(ButtonStyle.Secondary)
    )
  );
}

// ─────────────────────────────── Embeds ───────────────────────────────

function competitionHeader(player) {
  if (player.stage === 'copa_nacional' && player.nationalCup) {
    return `🏆 ${player.nationalCup.name} · ${phaseLabel(player.nationalCup)}`;
  }
  if (player.stage === 'copa' && player.cup) {
    return `🌎 ${player.cup.name} · ${phaseLabel(player.cup)}`;
  }
  if (player.stage === 'mundial' && player.worldCup) {
    return `🌍 ${player.worldCup.name} · ${phaseLabel(player.worldCup)}`;
  }
  const league = getLeague(player.leagueKey);
  const jornada = Math.min(player.matchdayIndex + 1, (player.fixture || []).length || 1);
  return `${flagFor(league ? league.country : '')} ${league ? league.name : 'Liga'} · Fecha ${jornada}/${(player.fixture || []).length}`;
}

function myTeamName(player) {
  return player.stage === 'mundial' && player.worldCup ? player.worldCup.myTeam : player.club;
}

function matchEmbed(title, color, teamName, result, extraDesc) {
  const eventsText = result.events && result.events.length
    ? result.events.map(e => `\`${e.minute}'\` ${e.text}`).join('\n')
    : 'Partido sin muchas emociones.';

  const description = [
    `**${teamName} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**`,
    extraDesc || null,
    '',
    eventsText
  ].filter(x => x !== null).join('\n').slice(0, 4000);

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(
      { name: 'Tu rating', value: `${result.rating}${result.motm ? ' ⭐ Figura del partido' : ''}`, inline: true },
      { name: 'Resultado', value: result.result === 'V' ? '✅ Victoria' : result.result === 'E' ? '🟡 Empate' : '❌ Derrota', inline: true },
      { name: 'Tus numeros', value: `⚽ ${result.playerGoals} · 🅰️ ${result.playerAssists}`, inline: true }
    );
}

function tacticEmbed(player, opponentName, headerTitle) {
  const oppClub = findClub(opponentName);
  const oppLeague = oppClub ? getLeague(oppClub.leagueKey) : null;
  const oppFlag = player.stage === 'mundial' ? nationFlag(opponentName) : (oppLeague ? flagFor(oppLeague.country) : '');
  const oppMedia = oppClub ? ` (media ${oppClub.media})` : '';

  return new EmbedBuilder()
    .setColor(0x34495e)
    .setTitle(headerTitle)
    .setDescription(
      `**${myTeamName(player)}** vs **${oppFlag} ${opponentName}**${oppMedia}\n\n¿Con qué idea salís a jugar?\n\n` +
      Object.values(TACTICS).map(t => `${t.emoji} **${t.label}** — ${t.desc}`).join('\n')
    );
}

function minigameEmbed(player, pending) {
  const def = minigameDef(pending.type);
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${def.title} — ${pending.competition}`)
    .setDescription(
      `${def.prompt(pending)}\n\n` +
      `Solo **uno** de los 3 botones termina en gol. Tu **${ATTR_LABELS[def.attr]}** (${player.attributes[def.attr]}) decide si la metés igual cuando el arquero adivina.`
    );
}

function momentoEmbed(player, momento) {
  return new EmbedBuilder().setColor(0xe67e22).setTitle('🎙️ Momento decisivo').setDescription(momento.text(player));
}

function careerEventEmbed(player, event) {
  return new EmbedBuilder().setColor(0x8e44ad).setTitle('📰 Decisión de carrera').setDescription(event.text(player));
}

function offersEmbed(player) {
  const offersList = (player.offers && player.offers.length)
    ? player.offers.map(name => {
      const club = findClub(name);
      const league = club ? getLeague(club.leagueKey) : null;
      return `• ${league ? flagFor(league.country) : ''} **${name}** — media ${club ? club.media : '?'} · ${league ? league.name : ''}`;
    }).join('\n')
    : 'Nadie te ofreció nada esta ventana. Podés quedarte en tu club.';

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('📋 Mercado de pases')
    .setDescription(
      `Club actual: **${player.club}** (media ${player.clubMedia})\n` +
      `Tu media: **${player.overall}** · Reputación: **${reputation(player)}**\n\nOfertas:\n${offersList}`
    );
}

// ─────────────────────────── Flujo principal ───────────────────────────

function applyMatchToPlayer(player, result, { national = false } = {}) {
  player.seasonStats.apps += 1;
  player.seasonStats.goals += result.playerGoals;
  player.seasonStats.assists += result.playerAssists;
  player.seasonStats.avgRatingSum += result.rating;
  if (result.yellow) player.seasonStats.yellow += 1;
  if (result.red) {
    player.seasonStats.red += 1;
    player.suspendedMatches = (player.suspendedMatches || 0) + 1;
  }
  if (result.motm) player.seasonStats.motm += 1;
  if (result.oppGoals === 0 && (player.position === 'POR' || player.position === 'DEF')) {
    player.seasonStats.cleanSheets += 1;
  }

  player.career.apps += 1;
  player.career.goals += result.playerGoals;
  player.career.assists += result.playerAssists;
  if (national) {
    player.career.caps += 1;
    player.career.nationalGoals += result.playerGoals;
  }

  player.morale = Math.max(10, Math.min(100,
    player.morale + (result.result === 'V' ? 4 : result.result === 'E' ? 0 : -5) + result.playerGoals * 3));

  if (result.injuredMatches > 0) {
    player.injuredMatches = Math.max(player.injuredMatches, result.injuredMatches);
  }
}

/** Punto de entrada de cada paso de la carrera */
function simulateStep(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  if (player.retired) {
    return { ok: false, ephemeral: true, content: 'Este jugador ya está retirado. Usa `/crear-jugador` para empezar una carrera nueva.' };
  }

  // Cosas pendientes primero
  if (player.pendingMinigame) {
    const def = minigameDef(player.pendingMinigame.type);
    if (def) {
      return { ok: true, ephemeral: false, embeds: [minigameEmbed(player, player.pendingMinigame)], components: [minigameRow(userId, def)] };
    }
    player.pendingMinigame = null;
    storage.setPlayer(userId, player);
  }

  if (player.pendingMomento) {
    const momento = getMomentoById(player.pendingMomento);
    if (momento) {
      return { ok: true, ephemeral: false, embeds: [momentoEmbed(player, momento)], components: [momentoRow(userId, momento)] };
    }
  }

  if (player.stage === 'entretemporada') {
    if (player.pendingCareerEvent) {
      const event = getCareerEventById(player.pendingCareerEvent);
      if (event) {
        return { ok: true, ephemeral: false, embeds: [careerEventEmbed(player, event)], components: [careerEventRow(userId, event)] };
      }
      player.pendingCareerEvent = null;
      storage.setPlayer(userId, player);
    }
    return {
      ok: true,
      ephemeral: false,
      content: `Mercado de pases: elegí club para la temporada ${player.season + 1}.`,
      embeds: [offersEmbed(player)],
      components: offersRows(userId, player.offers || [])
    };
  }

  // Sanciones por tarjeta roja
  if (player.suspendedMatches > 0) {
    return playWhileSuspended(userId, player);
  }

  // Lesiones
  if (player.injuredMatches > 0) {
    return playWhileInjured(userId, player);
  }

  if (player.stage === 'liga') {
    ensureFixture(player);
    storage.setPlayer(userId, player);
    if (player.matchdayIndex < player.fixture.length) {
      return { ok: true, ephemeral: false, embeds: [tacticEmbed(player, player.fixture[player.matchdayIndex], competitionHeader(player))], components: [tacticRow(userId)] };
    }
    return resolveLeagueEnd(userId, player);
  }

  if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : player.worldCup);
    const opponent = tournament ? nextOpponent(tournament) : null;
    if (!opponent) return closeTournament(userId, player);
    return { ok: true, ephemeral: false, embeds: [tacticEmbed(player, opponent.name, competitionHeader(player))], components: [tacticRow(userId)] };
  }

  return { ok: false, ephemeral: true, content: 'Estado de carrera desconocido, usa /perfil para revisar tu situación.' };
}

/**
 * El jugador está suspendido (tarjeta roja): el partido SE JUEGA igual (sin él) y la suspensión se descuenta.
 */
function playWhileSuspended(userId, player) {
  player.suspendedMatches = Math.max(0, (player.suspendedMatches || 1) - 1);
  const restantes = player.suspendedMatches;

  if (player.stage === 'liga') {
    const result = playMatchdayWithoutPlayer(player);
    storage.setPlayer(userId, player);

    if (!result) return resolveLeagueEnd(userId, player);

    const league = getLeague(player.leagueKey);
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`🟥 ${flagFor(league ? league.country : '')} ${league ? league.name : 'Liga'} · Fecha ${result.matchday}/${result.total} (Suspendido)`)
      .setDescription(
        `**${player.club} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**\n\n` +
        `🟥 **${player.name}** cumplió su sanción disciplinaria desde la tribuna.\n` +
        (restantes > 0 ? `Te quedan **${restantes}** partido(s) de suspensión.` : '✅ ¡Sanción cumplida! Quedas habilitado para el próximo partido.')
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  const tournament = player.stage === 'copa_nacional'
    ? player.nationalCup
    : (player.stage === 'copa' ? player.cup : player.worldCup);
  const opponent = tournament ? nextOpponent(tournament) : null;
  if (!opponent) {
    storage.setPlayer(userId, player);
    return closeTournament(userId, player);
  }

  const myTeam = player.stage === 'mundial'
    ? { name: tournament.myTeam, media: (findNation(player.nationality) || { media: 72 }).media }
    : findClub(player.club);
  const result = simulateMatchWithoutPlayer(myTeam, opponent, player.overall);
  const outcome = applyTournamentResult(tournament, result.myGoals, result.oppGoals);

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`🟥 ${tournament.name} · ${phaseLabel(tournament)} (Suspendido)`)
    .setDescription(
      `**${tournament.myTeam} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**\n\n` +
      `🟥 **${player.name}** vio el partido desde la tribuna por suspensión.\n` +
      (outcome.text ? `\n${outcome.text}\n` : '') +
      (restantes > 0 ? `Te quedan **${restantes}** partido(s) de suspensión.` : '✅ ¡Sanción cumplida! Habilitado para la próxima fecha.')
    );

  storage.setPlayer(userId, player);

  if (outcome.status !== 'continue') {
    const closing = closeTournament(userId, player, outcome);
    closing.embeds = [embed, ...(closing.embeds || [])];
    return closing;
  }

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

/**
 * El jugador está lesionado: el partido SE JUEGA igual (sin él) y la carrera avanza.
 */
function playWhileInjured(userId, player) {
  player.injuredMatches -= 1;
  const restantes = player.injuredMatches;

  if (player.stage === 'liga') {
    const result = playMatchdayWithoutPlayer(player);
    storage.setPlayer(userId, player);

    if (!result) return resolveLeagueEnd(userId, player);

    const league = getLeague(player.leagueKey);
    const embed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle(`🚑 ${flagFor(league.country)} ${league.name} · Fecha ${result.matchday}/${result.total} (lesionado)`)
      .setDescription(
        `**${player.club} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**\n\n` +
        `**${player.name}** vio el partido desde la tribuna.\n` +
        (restantes > 0 ? `Te quedan **${restantes}** partidos de baja.` : '✅ ¡Te recuperaste! El próximo partido lo jugás.')
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  const tournament = player.stage === 'copa_nacional'
    ? player.nationalCup
    : (player.stage === 'copa' ? player.cup : player.worldCup);
  const opponent = tournament ? nextOpponent(tournament) : null;
  if (!opponent) {
    storage.setPlayer(userId, player);
    return closeTournament(userId, player);
  }

  const myTeam = player.stage === 'mundial'
    ? { name: tournament.myTeam, media: (findNation(player.nationality) || { media: 72 }).media }
    : findClub(player.club);
  const result = simulateMatchWithoutPlayer(myTeam, opponent, player.overall);
  const outcome = applyTournamentResult(tournament, result.myGoals, result.oppGoals);

  const embed = new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle(`🚑 ${tournament.name} · ${phaseLabel(tournament)} (lesionado)`)
    .setDescription(
      `**${tournament.myTeam} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**\n\n` +
      `**${player.name}** se perdió el partido por lesión.\n` +
      (outcome.text ? `\n${outcome.text}\n` : '') +
      (restantes > 0 ? `Te quedan **${restantes}** partidos de baja.` : '✅ ¡Te recuperaste!')
    );

  storage.setPlayer(userId, player);

  if (outcome.status !== 'continue') {
    const closing = closeTournament(userId, player, outcome);
    closing.embeds = [embed, ...(closing.embeds || [])];
    return closing;
  }

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

/** ¿Este partido merece minijuego? Copas, Mundial, clásicos y definiciones de liga */
function shouldTriggerMinigame(player, opponentName) {
  if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : player.worldCup);
    return isBigMatch(tournament) || Math.random() < 0.35;
  }

  const total = (player.fixture || []).length;
  const remaining = total - player.matchdayIndex;
  const opponent = findClub(opponentName);
  const rivalGrande = opponent && opponent.media >= (player.clubMedia || 60) + 4;
  const definicion = remaining <= 3;

  if (definicion || rivalGrande) return Math.random() < 0.7;
  return Math.random() < 0.18;
}

function resolveTactic(userId, tacticKey) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  if (!TACTICS[tacticKey]) tacticKey = 'equilibrado';
  if (player.pendingMinigame) {
    const def = minigameDef(player.pendingMinigame.type);
    return { ok: true, ephemeral: false, embeds: [minigameEmbed(player, player.pendingMinigame)], components: [minigameRow(userId, def)] };
  }

  let opponentName;
  if (player.stage === 'liga') {
    ensureFixture(player);
    if (!(player.matchdayIndex < (player.fixture || []).length)) return resolveLeagueEnd(userId, player);
    opponentName = player.fixture[player.matchdayIndex];
  } else if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : player.worldCup);
    const opponent = tournament ? nextOpponent(tournament) : null;
    if (!opponent) return closeTournament(userId, player);
    opponentName = opponent.name;
  } else {
    return { ok: false, ephemeral: true, content: 'No hay partido para jugar ahora mismo.' };
  }

  player.pendingTactic = tacticKey;

  if (shouldTriggerMinigame(player, opponentName)) {
    player.pendingMinigame = createMinigame(player, {
      club: myTeamName(player),
      opponent: opponentName,
      competition: competitionHeader(player)
    });
    storage.setPlayer(userId, player);
    const def = minigameDef(player.pendingMinigame.type);
    return { ok: true, ephemeral: false, embeds: [minigameEmbed(player, player.pendingMinigame)], components: [minigameRow(userId, def)] };
  }

  storage.setPlayer(userId, player);
  return playPendingMatch(userId, player, {});
}

/** Resuelve el botón apretado en el minijuego y después juega el partido */
function resolveMinigameChoice(userId, choiceIndex) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  const pending = player.pendingMinigame;
  if (!pending) {
    return { ok: false, ephemeral: true, content: 'Esa jugada ya se resolvió.' };
  }

  const outcome = resolveMinigame(player, pending, choiceIndex);
  player.pendingMinigame = null;
  player.morale = Math.max(10, Math.min(100, player.morale + outcome.moraleDelta));

  return playPendingMatch(userId, player, {
    bonusGoals: outcome.reward === 'gol' ? 1 : 0,
    bonusAssists: outcome.reward === 'asistencia' ? 1 : 0,
    bonusText: outcome.text,
    bonusMinute: pending.minute,
    savedGoal: outcome.reward === 'atajada'
  });
}

/** Simula el partido pendiente (liga, copa nacional, copa continental o Mundial) aplicando lo del minijuego */
function playPendingMatch(userId, player, bonus) {
  const tacticKey = player.pendingTactic || 'equilibrado';
  player.pendingTactic = null;

  if (player.stage === 'liga') return playLeagueMatch(userId, player, tacticKey, bonus);
  return playTournamentMatch(userId, player, tacticKey, bonus);
}

function playLeagueMatch(userId, player, tacticKey, bonus) {
  ensureFixture(player);
  const roundIndex = player.matchdayIndex;
  const opponentName = player.fixture[roundIndex];
  const opponentClub = findClub(opponentName);
  const club = findClub(player.club);

  const result = simulateMatch(player, club, opponentClub, tacticKey, bonus);
  if (bonus.bonusAssists) {
    result.playerAssists += bonus.bonusAssists;
    result.myGoals += bonus.bonusAssists;
    result.result = result.myGoals > result.oppGoals ? 'V' : result.myGoals < result.oppGoals ? 'D' : 'E';
  }
  if (bonus.savedGoal && result.oppGoals > 0) {
    result.oppGoals -= 1;
    result.result = result.myGoals > result.oppGoals ? 'V' : result.myGoals < result.oppGoals ? 'D' : 'E';
  }

  applyMatchToPlayer(player, result);
  updateTable(player.table, player.club, result.myGoals, result.oppGoals);
  updateTable(player.table, opponentName, result.oppGoals, result.myGoals);
  simulateOtherRoundMatches(player, roundIndex);
  player.matchdayIndex += 1;

  const league = getLeague(player.leagueKey);
  const embed = matchEmbed(
    `${flagFor(league.country)} ${league.name} · Fecha ${player.matchdayIndex}/${player.fixture.length}`,
    result.result === 'V' ? 0x2ecc71 : result.result === 'E' ? 0xf1c40f : 0xe74c3c,
    player.club,
    result
  );

  const momento = maybePickMomento();
  if (momento) {
    player.pendingMomento = momento.id;
    storage.setPlayer(userId, player);
    return { ok: true, ephemeral: false, embeds: [embed, momentoEmbed(player, momento)], components: [momentoRow(userId, momento)] };
  }

  player.pendingMomento = null;
  storage.setPlayer(userId, player);
  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

function playTournamentMatch(userId, player, tacticKey, bonus) {
  const tournament = player.stage === 'copa_nacional'
    ? player.nationalCup
    : (player.stage === 'copa' ? player.cup : player.worldCup);
  const opponent = nextOpponent(tournament);
  if (!opponent) return closeTournament(userId, player);

  const isNational = player.stage === 'mundial';
  const myTeam = isNational
    ? { name: tournament.myTeam, media: (findNation(player.nationality) || { media: 72 }).media, tier: 5 }
    : findClub(player.club);

  const result = simulateMatch(player, myTeam, opponent, tacticKey, bonus);
  if (bonus.bonusAssists) {
    result.playerAssists += bonus.bonusAssists;
    result.myGoals += bonus.bonusAssists;
  }
  if (bonus.savedGoal && result.oppGoals > 0) result.oppGoals -= 1;
  result.result = result.myGoals > result.oppGoals ? 'V' : result.myGoals < result.oppGoals ? 'D' : 'E';

  applyMatchToPlayer(player, result, { national: isNational });

  const label = phaseLabel(tournament);
  const outcome = applyTournamentResult(tournament, result.myGoals, result.oppGoals);

  const icon = player.stage === 'copa_nacional' ? '🏆' : (isNational ? '🌍' : '🌎');
  const embed = matchEmbed(
    `${icon} ${tournament.name} · ${label}`,
    outcome.status === 'eliminado' ? 0xe74c3c : outcome.status === 'campeon' ? 0xf1c40f : 0x9b59b6,
    tournament.myTeam,
    result,
    outcome.text
  );

  storage.setPlayer(userId, player);

  if (outcome.status === 'continue') {
    const extras = [embed];
    if (tournament.phase === 'grupos' || (tournament.groupSchedule && tournament.groupIndex === tournament.groupSchedule.length)) {
      extras.push(new EmbedBuilder().setColor(0x3498db).setTitle('📊 Grupo').setDescription(groupTableText(tournament)));
    }
    return { ok: true, ephemeral: false, embeds: extras, components: [continueRow(userId)] };
  }

  const closing = closeTournament(userId, player, outcome);
  closing.embeds = [embed, ...(closing.embeds || [])];
  return closing;
}

/** Cierra copa nacional, copa continental o Mundial y avanza en el calendario */
function closeTournament(userId, player, outcome = null) {
  if (player.stage === 'copa_nacional') {
    const tourney = player.nationalCup;
    if (tourney && (tourney.phase === 'campeon' || (outcome && outcome.status === 'campeon'))) {
      player.career.trophies.push(`Campeón ${tourney.name} (Temporada ${player.season})`);
    }
    const leading = outcome && outcome.text ? outcome.text : `Finalizó la ${tourney ? tourney.name : 'Copa Nacional'}.`;
    player.nationalCup = null;
    storage.setPlayer(userId, player);
    return maybeContinentalCup(userId, player, leading);
  }

  if (player.stage === 'copa') {
    const tourney = player.cup;
    if (tourney && (tourney.phase === 'campeon' || (outcome && outcome.status === 'campeon'))) {
      player.career.trophies.push(`Campeón ${tourney.name} (Temporada ${player.season})`);
    }
    const leading = outcome && outcome.text ? outcome.text : `Finalizó la ${tourney ? tourney.name : 'Copa Continental'}.`;
    player.cup = null;
    storage.setPlayer(userId, player);
    return maybeWorldCup(userId, player, leading);
  }

  if (player.stage === 'mundial') {
    const tourney = player.worldCup;
    if (tourney && (tourney.phase === 'campeon' || (outcome && outcome.status === 'campeon'))) {
      player.career.trophies.push(`Campeón Copa del Mundo (Temporada ${player.season})`);
    }
    const leading = outcome && outcome.text ? outcome.text : 'Finalizó la Copa del Mundo.';
    player.worldCup = null;
    player.stage = 'liga';
    storage.setPlayer(userId, player);
    return finishSeasonFlow(userId, player, leading);
  }

  player.stage = 'liga';
  storage.setPlayer(userId, player);
  return finishSeasonFlow(userId, player, 'Fin de temporada.');
}

/** Al terminar la liga: campeón, ascenso/descenso, cupos continentales y arranca la Copa Nacional */
function resolveLeagueEnd(userId, player) {
  const league = getLeague(player.leagueKey);
  const table = standingsSorted(player.table);
  const posIndex = table.findIndex(t => t.club === player.club);
  const posicion = posIndex + 1;
  const total = table.length;

  const lines = [`🏁 **Liga terminada.** ${player.club} terminó **${posicion}° de ${total}** en ${league.name}.`];

  if (posicion === 1) {
    player.career.trophies.push(`Campeón ${league.name} (Temporada ${player.season})`);
    lines.push('🏆 ¡Campeones de liga! Título agregado a la vitrina.');
  }

  const movement = applyPromotionRelegation(player, posicion, total);
  if (movement.moved === 'ascenso') {
    lines.push(`⬆️ **¡ASCENSO!** ${player.club} sube a ${movement.newLeague.name}.`);
    player.morale = Math.min(100, player.morale + 10);
  } else if (movement.moved === 'descenso') {
    lines.push(`⬇️ **Descenso.** ${player.club} se va a ${movement.newLeague.name}.`);
    player.morale = Math.max(10, player.morale - 10);
  }

  // Determinar si clasificó a copa continental (Libertadores, Sudamericana, Champions, Europa, Conference, etc.)
  const qual = (league.level === 1 && movement.moved !== 'descenso')
    ? getContinentalQualification(player.leagueKey, posicion)
    : null;

  player.qualifiedContinentalCup = qual;
  if (qual) {
    lines.push(`✨ **Clasificación internacional:** ${player.club} obtuvo cupo a la **${qual.name}**.`);
  }

  // Ahora arranca la Copa Nacional (Copa Chile, Copa del Rey, FA Cup, Copa Argentina, Copa do Brasil, etc.)
  player.stage = 'copa_nacional';
  player.nationalCup = createNationalCup(player);
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('🏁 Fin de la liga · ¡Arranca la Copa Nacional!')
    .setDescription(
      `${lines.join('\n')}\n\n🏆 Comienza la **${player.nationalCup.name}** (${phaseLabel(player.nationalCup)}).\n` +
      `Próximo rival: **${player.nationalCup.knockoutOpponent || 'Club Rival'}**.`
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

/** Si el club clasificó a copa continental, la juega aquí */
function maybeContinentalCup(userId, player, leadingDesc) {
  if (player.qualifiedContinentalCup) {
    const qual = player.qualifiedContinentalCup;
    player.qualifiedContinentalCup = null;
    player.stage = 'copa';
    player.cup = createContinentalCup(player, qual);
    storage.setPlayer(userId, player);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`🌎 ¡COPA CONTINENTAL: ${player.cup.name.toUpperCase()}!`)
      .setDescription(
        `${leadingDesc}\n\n**${player.club}** juega la **${player.cup.name}** en fase de grupos.\n` +
        `Grupo: ${player.cup.groupTeams.map(t => (t === player.club ? `**${t}**` : t)).join(' · ')}`
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  return maybeWorldCup(userId, player, leadingDesc);
}

/** Después del año de club: Mundial si toca y estás convocado */
function maybeWorldCup(userId, player, leadingDesc) {
  const callUp = worldCupCallUp(player);
  if (!callUp.called) {
    if (callUp.reason === 'nivel') {
      leadingDesc += `\n\n🌍 Hay Mundial esta temporada pero **no te convocaron**: necesitás media ${callUp.required} para entrar en ${callUp.nation.name} (tenés ${player.overall}).`;
    }
    return finishSeasonFlow(userId, player, leadingDesc);
  }

  player.stage = 'mundial';
  player.worldCup = createWorldCup(player);
  player.injuredMatches = 0;
  player.suspendedMatches = 0;
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle('🌍 ¡CONVOCADO AL MUNDIAL!')
    .setDescription(
      `${leadingDesc}\n\n**${player.name}** va al Mundial con ${nationFlag(player.worldCup.myTeam)} **${player.worldCup.myTeam}**.\n` +
      `Grupo: ${player.worldCup.groupTeams.map(t => (t === player.worldCup.myTeam ? `**${t}**` : t)).join(' · ')}`
    );
  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

/** Cierra la temporada: progresión, premios y mercado de pases */
function finishSeasonFlow(userId, player, leadingDesc) {
  const { development, awards } = finishSeason(player);

  const event = maybePickCareerEvent();
  player.pendingCareerEvent = event ? event.id : null;
  storage.setPlayer(userId, player);

  const growthText = development.growth >= 0
    ? `📈 Media: **${player.overall}** (${development.growth >= 0 ? '+' : ''}${development.growth}) · Edad: ${player.age}`
    : `📉 Media: **${player.overall}** (${development.growth}) · Edad: ${player.age}`;

  const gainedText = Object.entries(development.gained || {})
    .map(([key, value]) => `${ATTR_LABELS[key]} ${value >= 0 ? '+' : ''}${value}`)
    .join(' · ');

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🏁 Fin de temporada')
    .setDescription(
      `${leadingDesc}\n\n${growthText}` +
      (gainedText ? `\n${gainedText}` : '') +
      (awards.length ? `\n\n🏅 Premios: ${awards.join(' · ')}` : '')
    );

  if (event) {
    return { ok: true, ephemeral: false, embeds: [embed, careerEventEmbed(player, event)], components: [careerEventRow(userId, event)] };
  }
  return { ok: true, ephemeral: false, embeds: [embed, offersEmbed(player)], components: offersRows(userId, player.offers || []) };
}

// ─────────────────────────── Decisiones ───────────────────────────

function resolveMomento(userId, choiceIndex) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const momento = getMomentoById(player.pendingMomento);
  player.pendingMomento = null;
  if (!momento) {
    storage.setPlayer(userId, player);
    return { ok: true, ephemeral: false, content: 'Esa decisión ya no está disponible.', components: [continueRow(userId)] };
  }

  const option = momento.options[Number(choiceIndex)] || momento.options[0];
  const notes = applyEffect(player, option.effect);
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle('🎙️ Decidiste')
    .setDescription(`${option.resultText}${notes ? `\n\n${notes}` : ''}\n\nMedia: ${player.overall} · Moral: ${player.morale}/100`);

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

function resolveCareerEvent(userId, choiceIndex) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const event = getCareerEventById(player.pendingCareerEvent);
  player.pendingCareerEvent = null;
  if (!event) {
    storage.setPlayer(userId, player);
    return offersView(userId);
  }

  const option = event.options[Number(choiceIndex)] || event.options[0];
  const notes = applyEffect(player, option.effect);

  // Las decisiones que mueven el mercado se aplican sobre las ofertas de este mismo año
  const { generateOffers } = require('../utils/player.js');
  if (option.effect && (option.effect.extraOffers || option.effect.saudiOffer)) {
    player.offers = generateOffers(player).map(c => c.name);
  }
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0x8e44ad)
    .setTitle('📰 Decidiste')
    .setDescription(`${option.resultText}${notes ? `\n\n${notes}` : ''}\n\nMedia: ${player.overall} · Potencial: ${player.potential} · Moral: ${player.morale}/100`);

  return { ok: true, ephemeral: false, embeds: [embed, offersEmbed(player)], components: offersRows(userId, player.offers || []) };
}

// ─────────────────────────── Mercado ───────────────────────────

function performTransfer(userId, choice) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  if (player.stage !== 'entretemporada') {
    return { ok: false, ephemeral: true, content: 'Solo podés transferirte durante el mercado de pases.' };
  }
  if (player.pendingCareerEvent) {
    return { ok: false, ephemeral: true, content: 'Primero resolvé la decisión de carrera pendiente.' };
  }

  const startSeason = () => {
    player.stage = 'liga';
    player.season += 1;
    player.offers = [];
    player.extraOffers = 0;
    player.saudiOffer = false;
    player.fixture = [];
    player.roundSchedule = [];
    player.matchdayIndex = 0;
    player.table = {};
    player.nationalCup = null;
    player.cup = null;
    player.worldCup = null;
    player.qualifiedContinentalCup = null;
    player.suspendedMatches = 0;
  };

  if (choice === 'stay') {
    startSeason();
    storage.setPlayer(userId, player);
    return {
      ok: true,
      ephemeral: false,
      content: `Te quedás en **${player.club}** para la temporada ${player.season}.`,
      components: [continueRow(userId)]
    };
  }

  const clubName = (player.offers || [])[Number(choice)];
  if (!clubName) return { ok: false, ephemeral: true, content: 'Esa oferta ya no está disponible.' };

  const newClub = findClub(clubName);
  const newLeague = getLeague(newClub.leagueKey);
  player.club = newClub.name;
  player.clubMedia = newClub.media;
  player.clubTier = newClub.tier;
  player.leagueKey = newClub.leagueKey;
  player.leagueName = newLeague.name;
  startSeason();
  player.morale = Math.min(100, player.morale + 10);
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('✍️ ¡Fichaje confirmado!')
    .setDescription(
      `**${player.name}** ficha por ${flagFor(newLeague.country)} **${newClub.name}** (media ${newClub.media}) ` +
      `para jugar ${newLeague.name} en la temporada ${player.season}.`
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

function offersView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  if (player.stage !== 'entretemporada') {
    return { ok: false, ephemeral: true, content: 'No hay mercado de pases abierto ahora mismo.' };
  }
  if (player.pendingCareerEvent) {
    const event = getCareerEventById(player.pendingCareerEvent);
    if (event) {
      return { ok: true, ephemeral: false, embeds: [careerEventEmbed(player, event)], components: [careerEventRow(userId, event)] };
    }
  }
  return { ok: true, ephemeral: false, embeds: [offersEmbed(player)], components: offersRows(userId, player.offers || []) };
}

// ─────────────────────────── Vistas ───────────────────────────

function profileView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const s = player.seasonStats;
  const avg = s.apps > 0 ? (s.avgRatingSum / s.apps).toFixed(2) : '—';
  const league = getLeague(player.leagueKey);
  const stageLabel = player.stage === 'copa_nacional' ? `🏆 Copa Nacional (${player.nationalCup ? player.nationalCup.name : 'En curso'})`
    : player.stage === 'copa' ? `🌎 Copa continental (${player.cup ? player.cup.name : 'En curso'})`
    : player.stage === 'mundial' ? '🌍 Mundial de Selecciones'
    : player.stage === 'entretemporada' ? 'Mercado de pases' : 'Liga en curso';

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`${player.retired ? '🏅 ' : '⚽ '}${player.name} — media ${player.overall}`)
    .setDescription(player.retired ? 'Jugador retirado.' : `Temporada ${player.season} · ${stageLabel}${player.injuredMatches > 0 ? ` · 🚑 ${player.injuredMatches} partidos de baja` : ''}${player.suspendedMatches > 0 ? ` · 🟥 ${player.suspendedMatches} partido(s) suspendido` : ''}`)
    .addFields(
      { name: 'Club', value: `${league ? flagFor(league.country) : ''} ${player.club} (media ${player.clubMedia})`, inline: true },
      { name: 'Liga', value: `${league ? league.name : '—'}`, inline: true },
      { name: 'Posicion', value: POSITIONS[player.position].label, inline: true },
      { name: 'Edad', value: `${player.age}`, inline: true },
      { name: 'Potencial', value: `${player.potential}`, inline: true },
      { name: 'Moral', value: `${player.morale}/100`, inline: true },
      { name: '📊 Esta temporada', value: `PJ: ${s.apps} | Goles: ${s.goals} | Asist: ${s.assists} | 🟨 ${s.yellow} | 🟥 ${s.red} | Rating: ${avg}` },
      { name: '🏆 Carrera', value: `PJ: ${player.career.apps} | Goles: ${player.career.goals} | Asist: ${player.career.assists} | Selección: ${player.career.caps} PJ / ${player.career.nationalGoals} goles` },
      { name: '⚡ Atributos', value: describeAttributes(player.attributes) }
    );

  if (player.career.trophies.length) {
    embed.addFields({ name: 'Vitrina', value: player.career.trophies.map(t => `🏆 ${t}`).join('\n').slice(0, 1000) });
  }
  if ((player.career.awards || []).length) {
    embed.addFields({ name: 'Premios', value: player.career.awards.map(a => `🏅 ${a}`).join('\n').slice(0, 1000) });
  }

  const components = (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [];
  return { ok: true, ephemeral: false, embeds: [embed], components };
}

function attributesView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle(`📈 Atributos de ${player.name}`)
    .setDescription(
      `Media **${player.overall}** · Potencial **${player.potential}** · ${POSITIONS[player.position].label}\n\n` +
      `${describeAttributes(player.attributes)}\n\n` +
      (player.trainingFocus
        ? `🎯 Foco de entrenamiento: **${ATTR_LABELS[player.trainingFocus]}**`
        : 'Sin foco de entrenamiento (te puede tocar elegirlo en una decisión de pretemporada).')
    );

  const components = (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [];
  return { ok: true, ephemeral: false, embeds: [embed], components };
}

function tableView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  if (player.stage === 'copa_nacional' && player.nationalCup) {
    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle(`🏆 ${player.nationalCup.name} · ${phaseLabel(player.nationalCup)}`)
      .setDescription(groupTableText(player.nationalCup));
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  if (player.stage === 'copa' && player.cup) {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`🌎 ${player.cup.name} · ${phaseLabel(player.cup)}`)
      .setDescription(groupTableText(player.cup) + (player.cup.history.length ? `\n\nÚltimos resultados del grupo:\n${player.cup.history.slice(-4).join('\n')}` : ''));
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  if (player.stage === 'mundial' && player.worldCup) {
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle(`🌍 ${player.worldCup.name} · ${phaseLabel(player.worldCup)}`)
      .setDescription(groupTableText(player.worldCup));
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  if (player.stage !== 'liga' || !player.table || !Object.keys(player.table).length) {
    return { ok: false, ephemeral: true, content: 'No hay una tabla de liga en curso ahora mismo (estás en copa, Mundial o mercado de pases).' };
  }

  const rows = standingsSorted(player.table);
  const league = getLeague(player.leagueKey);
  const total = rows.length;

  const lines = rows.map((r, i) => {
    const pos = i + 1;
    const marker = r.club === player.club ? '👉' : `${pos}.`;
    const qual = league.level === 1 ? getContinentalQualification(player.leagueKey, pos) : null;
    let zone = '';
    if (qual) {
      zone = (qual.type === 'libertadores' || qual.type === 'champions') ? ' 🌎' : ' 🌐';
    }
    if (league.level === 2 && pos <= 2) zone = ' ⬆️';
    if (league.level === 1 && league.relegatesTo && pos > total - 2) zone = ' ⬇️';
    return `${marker} **${r.club}**${zone} — Pts:${r.pts} PJ:${r.pj} G:${r.g} E:${r.e} P:${r.p} DG:${r.dg >= 0 ? '+' : ''}${r.dg}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`📊 ${flagFor(league.country)} ${league.name} — Temporada ${player.season}`)
    .setDescription(lines.join('\n').slice(0, 4000))
    .setFooter({ text: league.level === 1 ? '🌎 / 🌐 Clasifica a copa continental · ⬇️ Desciende' : '⬆️ Asciende a primera' });

  return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
}

module.exports = {
  simulateStep,
  resolveTactic,
  resolveMinigameChoice,
  resolveMomento,
  resolveCareerEvent,
  performTransfer,
  offersView,
  profileView,
  attributesView,
  tableView,
  continueRow,
  offersRows,
  offersEmbed,
  flagFor,
  cupNameFor
};
