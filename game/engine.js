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
  createNationalCup, createContinentalCup, createWorldCup, createContinentalNationalTournament, nextOpponent, phaseLabel,
  isBigMatch, isFinal, applyTournamentResult, finalizeShootout, KNOCKOUT_ORDER, groupTableText, worldCupCallUp, nationalTeamCallUp, cupNameFor
} = require('../utils/cups.js');
const { createMinigame, minigameDef, resolveMinigame } = require('../utils/minigames.js');
const { maybePickMomento, maybePickCareerEvent, applyEffect, MOMENTOS, EVENTOS_CARRERA } = require('../utils/decisions.js');
const { reputation, SHOP_ITEMS, buyItem, trainSkill, retirementVerdict, calculateSalary } = require('../utils/player.js');
const { recordMatchResult, getStreakBonuses, getStreakStatus } = require('../utils/streaks.js');
const { isClassicMatch, getClassicData } = require('../utils/classics.js');
const { generateSeasonObjective, checkSeasonObjective } = require('../utils/seasonObjectives.js');
const { initializeBallonDOrVote, registerVote, closeBallonDOrVote, applyBallonDOrRewards } = require('../utils/ballonDor.js');
const { checkRetirementAge, setupRetirementCeremony, applyRetirementCeremonyBonuses, generateRetirementEmbed } = require('../utils/retirement.js');
const {
  newManager, transitionPlayerToManager, simulateDTMatch, calculateTeamChemistryAndRating,
  generatePressConference, ensureDTFixture, advanceDTLeague, dtTableSorted,
  generateManagerOffers, acceptManagerJobOffer, getManagerRetirementVerdict, retireManager, simulateEntireDTSeason
} = require('../utils/manager.js');

// 15 Deep Simulation Systems
const { checkForInjury, applyInjury, advanceInjury, treatInjury, formatInjuryStatus, getInjuryRiskProfile } = require('../utils/injuries.js');
const { normalizeEconomy, calculateMarketValue, calculateReleaseClause, calculateWages, calculateWeeklyExpenses, calculateNetWorth, formatMoney } = require('../utils/economy.js');
const { normalizeReputationStats, recordMatchReputation, getReputationSummary } = require('../utils/reputation.js');
const { formatCareerTimeline, recordSeasonInTimeline } = require('../utils/careerTimeline.js');
const { getNationalTeamStatus, getFIFARankings } = require('../utils/nationalTeams.js');
const { generateSocialFeed, formatSocialFeedEmbed } = require('../utils/socialMedia.js');
const { generateNewsFeed, generateNewsHeadline, formatNewsFeedEmbed } = require('../utils/newsEngine.js');
const { getClubAcademy, promoteProspect, generateYouthAcademy } = require('../utils/academy.js');
const { inductIntoHallOfFame, formatHallOfFameEmbed } = require('../utils/hallOfFame.js');
const { getTopOverall, getTopMarketValue, getTopWonderkids, getTopByCountry } = require('../utils/worldRankings.js');
const { getWorldState, simulateGlobalWorldWindow } = require('../utils/persistentWorld.js');
const { normalizePersonality } = require('../utils/personality.js');

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
    new ButtonBuilder().setCustomId(`fastseason:${userId}`).setLabel('⏩ Simular Temporada').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tabla:${userId}`).setLabel('📊 Tabla').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`perfil:${userId}`).setLabel('🪪 Perfil').setStyle(ButtonStyle.Secondary)
  );
}

function dtContinueRow(userId, manager) {
  const isSeasonEnded = manager && manager.matchdayIndex >= (manager.matchdayTotal || 16);
  const row = new ActionRowBuilder();
  
  if (!isSeasonEnded) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`dt_sim:${userId}`).setLabel('▶️ Siguiente partido').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dt_fastseason:${userId}`).setLabel('⏩ Simular Temporada').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dt_tabla:${userId}`).setLabel('📊 Tabla').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dt_panel:${userId}`).setLabel('👔 Panel DT').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dt_ofertas:${userId}`).setLabel('💼 Ofertas').setStyle(ButtonStyle.Secondary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId(`dt_sim:${userId}`).setLabel('▶️ Próxima Temporada').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`dt_ofertas:${userId}`).setLabel('💼 Ver Ofertas').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`dt_tabla:${userId}`).setLabel('📊 Tabla Final').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dt_panel:${userId}`).setLabel('👔 Panel DT').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`dt_retirar:${userId}`).setLabel('🏅 Retirarse').setStyle(ButtonStyle.Danger)
    );
  }
  return row;
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

function shootoutRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`penal:${userId}:0`).setLabel('Izquierda').setEmoji('⬅️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`penal:${userId}:1`).setLabel('Centro').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`penal:${userId}:2`).setLabel('Derecha').setEmoji('➡️').setStyle(ButtonStyle.Primary)
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
  if (player.stage === 'copa_seleccion' && player.continentalNationalCup) {
    return `🌎 ${player.continentalNationalCup.name} · ${phaseLabel(player.continentalNationalCup)}`;
  }
  if (player.stage === 'mundial' && player.worldCup) {
    return `🌍 ${player.worldCup.name} · ${phaseLabel(player.worldCup)}`;
  }
  const league = getLeague(player.leagueKey);
  const jornada = Math.min(player.matchdayIndex + 1, (player.fixture || []).length || 1);
  return `${flagFor(league ? league.country : '')} ${league ? league.name : 'Liga'} · Fecha ${jornada}/${(player.fixture || []).length}`;
}

function myTeamName(player) {
  if (player.stage === 'mundial' && player.worldCup) return player.worldCup.myTeam;
  if (player.stage === 'copa_seleccion' && player.continentalNationalCup) return player.continentalNationalCup.myTeam;
  return player.club;
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

  const statField = result.playerSaves !== undefined && result.playerSaves > 0
    ? { name: 'Tus numeros', value: `🧤 ${result.playerSaves} Atajadas ${result.cleanSheet ? '· 🛡️ Arco en Cero' : ''}`, inline: true }
    : { name: 'Tus numeros', value: `⚽ ${result.playerGoals} · 🅰️ ${result.playerAssists}`, inline: true };

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(
      { name: 'Tu rating', value: `${result.rating}${result.motm ? ' ⭐ Figura del partido' : ''}`, inline: true },
      { name: 'Resultado', value: result.result === 'V' ? '✅ Victoria' : result.result === 'E' ? '🟡 Empate' : '❌ Derrota', inline: true },
      statField
    );
}

function tacticEmbed(player, opponentName, headerTitle) {
  const oppClub = findClub(opponentName);
  const oppLeague = oppClub ? getLeague(oppClub.leagueKey) : null;
  const isNationalMatch = player.stage === 'mundial' || player.stage === 'copa_seleccion';
  const oppFlag = isNationalMatch ? nationFlag(opponentName) : (oppLeague ? flagFor(oppLeague.country) : '');
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
  const clueText = pending.tacticalClue ? `\n\n${pending.tacticalClue}\n` : '';
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`${def.title} — ${pending.competition}`)
    .setDescription(
      `${def.prompt(pending)}${clueText}\n` +
      `⚡ **Decisión Táctica:** ¡Lee la jugada y elige el movimiento correcto!\n` +
      `Tu nivel de **${ATTR_LABELS[def.attr]}** (${player.attributes[def.attr] || 50}) define la precisión y potencia final.`
    );
}

function shootoutEmbed(player, pending) {
  const isGoalkeeper = player.position === 'POR';
  const roleText = isGoalkeeper ? '🧤 Sos el arquero: elegí adónde tirarte a tapar.' : '⚽ Vas a patear: elegí adónde cruzar el remate.';
  const historyText = pending.history && pending.history.length ? pending.history.join('\n') : 'Tanda por comenzar...';

  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle(`🎯 Definición por penales · ${pending.tournamentName}`)
    .setDescription(
      `**${myTeamName(player)} ${pending.myScore} - ${pending.oppScore} ${pending.oppName}**\n` +
      `Penal n° ${pending.round} (de ${pending.maxRounds})\n\n` +
      `${roleText}\n\n` +
      `**Historial:**\n${historyText}`
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
      const offeredSalary = club ? calculateSalary({ ...player, clubTier: club.tier }) : (player.salary || 25000);
      return `• ${league ? flagFor(league.country) : ''} **${name}** — media ${club ? club.media : '?'} · ${league ? league.name : ''} · 💰 **$${offeredSalary.toLocaleString('en-US')}**/año`;
    }).join('\n')
    : 'Nadie te ofreció nada esta ventana. Podés quedarte en tu club.';

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('📋 Mercado de pases')
    .setDescription(
      `Club actual: **${player.club}** (media ${player.clubMedia}) · Sueldo actual: **$${(player.salary || 25000).toLocaleString('en-US')}**/año\n` +
      `Tu media: **${player.overall}** · Reputación: **${reputation(player)}**\n\n**Ofertas de contrato:**\n${offersList}`
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

  // 1. Sistema de Lesiones en Partido
  const injuryCheck = checkForInjury(player, { isDerby: Boolean(result.isClassic) });
  if (injuryCheck.injured) {
    applyInjury(player, injuryCheck.injury);
    result.matchInjury = injuryCheck.injury;
    if (result.events) {
      result.events.push({ minute: 88, text: `🚑 **${player.name}** sufre una molestia física y abandona el campo: *${injuryCheck.injury.name}* (${injuryCheck.injury.matches} partidos de baja).` });
    }
  } else if (result.injuredMatches > 0) {
    player.injuredMatches = Math.max(player.injuredMatches, result.injuredMatches);
  }

  // 2. Sistema de Reputación Dinámica
  recordMatchReputation(player, {
    rating: result.rating,
    goals: result.playerGoals,
    assists: result.playerAssists,
    motm: result.motm,
    cleanSheet: result.cleanSheet,
    isClassic: Boolean(result.isClassic)
  });

  // 3. Sistema de Redes Sociales y Noticias Dinámicas
  const socialPosts = generateSocialFeed(player, result);
  player.lastSocialFeed = formatSocialFeedEmbed(socialPosts);
  player.lastNewsFeed = generateNewsFeed(player, { matchResult: result });
}

/** Punto de entrada de cada paso de la carrera */
function simulateStep(userId) {
  const player = storage.getPlayer(userId);
  if (!player) {
    const manager = storage.getManager(userId);
    if (manager && !manager.retired) {
      return dtSimulateStep(userId);
    }
    return noPlayer();
  }
  if (player.retired) {
    const manager = storage.getManager(userId);
    if (manager && !manager.retired) {
      return dtSimulateStep(userId);
    }
    return { ok: false, ephemeral: true, content: 'Este jugador ya está retirado. Usa `/crear-jugador` para empezar una carrera nueva o `/dt crear` para ser DT.' };
  }

  // Cosas pendientes primero
  if (player.pendingShootout) {
    return { ok: true, ephemeral: false, embeds: [shootoutEmbed(player, player.pendingShootout)], components: [shootoutRow(userId)] };
  }

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

  if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'copa_seleccion' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
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
    : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
  const opponent = tournament ? nextOpponent(tournament) : null;
  if (!opponent) {
    storage.setPlayer(userId, player);
    return closeTournament(userId, player);
  }

  const isNationalMatch = player.stage === 'mundial' || player.stage === 'copa_seleccion';
  const myTeam = isNationalMatch
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
  const recovery = advanceInjury(player);
  const restantes = player.injuredMatches;
  const injuryInfo = player.injury ? ` (${player.injury.name})` : '';

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
        `**${player.name}** vio el partido desde la tribuna por lesión${injuryInfo}.\n` +
        (restantes > 0 ? `Te quedan **${restantes}** partidos de baja médica.` : '✅ ¡Alta médica conseguida! El próximo partido ya puedes volver a la cancha.')
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  const tournament = player.stage === 'copa_nacional'
    ? player.nationalCup
    : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
  const opponent = tournament ? nextOpponent(tournament) : null;
  if (!opponent) {
    storage.setPlayer(userId, player);
    return closeTournament(userId, player);
  }

  const isNationalMatch = player.stage === 'mundial' || player.stage === 'copa_seleccion';
  const myTeam = isNationalMatch
    ? { name: tournament.myTeam, media: (findNation(player.nationality) || { media: 72 }).media }
    : findClub(player.club);
  const result = simulateMatchWithoutPlayer(myTeam, opponent, player.overall);
  const outcome = applyTournamentResult(tournament, result.myGoals, result.oppGoals);

  const embed = new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle(`🚑 ${tournament.name} · ${phaseLabel(tournament)} (lesionado)`)
    .setDescription(
      `**${tournament.myTeam} ${result.myGoals} - ${result.oppGoals} ${result.opponent}**\n\n` +
      `**${player.name}** se perdió el partido por lesión${injuryInfo}.\n` +
      (outcome.text ? `\n${outcome.text}\n` : '') +
      (restantes > 0 ? `Te quedan **${restantes}** partidos de baja médica.` : '✅ ¡Alta médica! Habilitado para la próxima ronda.')
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
  if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'copa_seleccion' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
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
  if (player.pendingShootout) {
    return { ok: true, ephemeral: false, embeds: [shootoutEmbed(player, player.pendingShootout)], components: [shootoutRow(userId)] };
  }
  if (player.pendingMinigame) {
    const def = minigameDef(player.pendingMinigame.type);
    return { ok: true, ephemeral: false, embeds: [minigameEmbed(player, player.pendingMinigame)], components: [minigameRow(userId, def)] };
  }

  let opponentName;
  if (player.stage === 'liga') {
    ensureFixture(player);
    if (!(player.matchdayIndex < (player.fixture || []).length)) return resolveLeagueEnd(userId, player);
    opponentName = player.fixture[player.matchdayIndex];
  } else if (player.stage === 'copa_nacional' || player.stage === 'copa' || player.stage === 'copa_seleccion' || player.stage === 'mundial') {
    const tournament = player.stage === 'copa_nacional'
      ? player.nationalCup
      : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
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

  // Bonus de Clásico Histórico
  const classicData = getClassicData(player.club, opponentName);
  if (classicData) {
    bonus = {
      ...bonus,
      ratingBonus: (bonus.ratingBonus || 0) + classicData.ratingBonus,
      isClassic: true
    };
  }

  // Bonus de Rachas (🔥 Racha ganadora o 📉 Pánico)
  const streakBonuses = getStreakBonuses(player);
  if (streakBonuses && streakBonuses.ratingBonus) {
    bonus = {
      ...bonus,
      ratingBonus: (bonus.ratingBonus || 0) + streakBonuses.ratingBonus
    };
  }

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
  recordMatchResult(player, result.result);
  updateTable(player.table, player.club, result.myGoals, result.oppGoals);
  updateTable(player.table, opponentName, result.oppGoals, result.myGoals);
  simulateOtherRoundMatches(player, roundIndex);
  player.matchdayIndex += 1;

  const league = getLeague(player.leagueKey);
  const streakInfo = getStreakStatus(player);
  const classicTag = classicData ? `🔥 ¡${classicData.name}! ` : '';
  const streakTag = streakInfo && streakInfo.emoji !== '➖' ? ` ${streakInfo.emoji}` : '';

  const embed = matchEmbed(
    `${classicTag}${flagFor(league.country)} ${league.name} · Fecha ${player.matchdayIndex}/${player.fixture.length}${streakTag}`,
    result.result === 'V' ? 0x2ecc71 : result.result === 'E' ? 0xf1c40f : 0xe74c3c,
    player.club,
    result,
    classicData ? `⚔️ **Clásico Histórico**: ${result.result === 'V' ? '¡Victoria épica que alegra a toda la hinchada! (+30% sueldo y +5 moral)' : result.result === 'D' ? 'Dolorosa derrota en el clásico (-5 moral).' : 'Empate con cuchillo entre los dientes.'}` : null
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
    : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));
  const opponent = nextOpponent(tournament);
  if (!opponent) return closeTournament(userId, player);

  const isNational = player.stage === 'mundial' || player.stage === 'copa_seleccion';
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

  // Si hay empate en fase de eliminación directa (mata-mata), se juega la tanda de penales interactiva
  if (result.myGoals === result.oppGoals && KNOCKOUT_ORDER.includes(tournament.phase)) {
    player.pendingShootout = {
      myGoals: result.myGoals,
      oppGoals: result.oppGoals,
      myScore: 0,
      oppScore: 0,
      round: 1,
      maxRounds: 5,
      history: [],
      stage: player.stage,
      tournamentPhase: tournament.phase,
      tournamentName: tournament.name,
      oppName: opponent.name
    };
    storage.setPlayer(userId, player);
    const icon = player.stage === 'copa_nacional' ? '🏆' : (isNational ? '🌍' : '🌎');
    const initialEmbed = matchEmbed(
      `${icon} ${tournament.name} · ${label}`,
      0xf1c40f,
      tournament.myTeam,
      result,
      '⏱️ ¡Empate tras los 90 minutos! El partido se define por PENALES.'
    );
    return {
      ok: true,
      ephemeral: false,
      embeds: [initialEmbed, shootoutEmbed(player, player.pendingShootout)],
      components: [shootoutRow(userId)]
    };
  }

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
    return maybeNationalTournament(userId, player, leading);
  }

  if (player.stage === 'copa_seleccion') {
    const tourney = player.continentalNationalCup;
    if (tourney && (tourney.phase === 'campeon' || (outcome && outcome.status === 'campeon'))) {
      player.career.trophies.push(`Campeón ${tourney.name} (Temporada ${player.season})`);
    }
    const leading = outcome && outcome.text ? outcome.text : `Finalizó la ${tourney ? tourney.name : 'Copa Continental de Selecciones'}.`;
    player.continentalNationalCup = null;
    player.stage = 'liga';
    storage.setPlayer(userId, player);
    return finishSeasonFlow(userId, player, leading);
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

  return maybeNationalTournament(userId, player, leadingDesc);
}

/** Después del año de club: Copa América/Eurocopa o Mundial si toca y estás convocado */
function maybeNationalTournament(userId, player, leadingDesc) {
  const callUp = nationalTeamCallUp(player);
  if (!callUp.called) {
    if (callUp.reason === 'nivel') {
      leadingDesc += `\n\n🌍 Hay torneo de selecciones (**${callUp.cupName || 'Torneo'}**) esta temporada pero **no te convocaron**: necesitás media ${callUp.required} para entrar en ${callUp.nation.name} (tenés ${player.overall}).`;
    }
    return finishSeasonFlow(userId, player, leadingDesc);
  }

  if (callUp.type === 'mundial') {
    player.stage = 'mundial';
    player.worldCup = createWorldCup(player);
    player.injuredMatches = 0;
    player.suspendedMatches = 0;
    storage.setPlayer(userId, player);

    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle('🌍 ¡CONVOCADO A LA COPA DEL MUNDO!')
      .setDescription(
        `${leadingDesc}\n\n**${player.name}** va al Mundial con ${nationFlag(player.worldCup.myTeam)} **${player.worldCup.myTeam}**.\n` +
        `Grupo: ${player.worldCup.groupTeams.map(t => (t === player.worldCup.myTeam ? `**${t}**` : t)).join(' · ')}`
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  if (callUp.type === 'continental') {
    player.stage = 'copa_seleccion';
    player.continentalNationalCup = createContinentalNationalTournament(player);
    player.injuredMatches = 0;
    player.suspendedMatches = 0;
    storage.setPlayer(userId, player);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🌎 ¡CONVOCADO A LA ${player.continentalNationalCup.name.toUpperCase()}!`)
      .setDescription(
        `${leadingDesc}\n\n**${player.name}** disputará la **${player.continentalNationalCup.name}** con ${nationFlag(player.continentalNationalCup.myTeam)} **${player.continentalNationalCup.myTeam}**.\n` +
        `Grupo: ${player.continentalNationalCup.groupTeams.map(t => (t === player.continentalNationalCup.myTeam ? `**${t}**` : t)).join(' · ')}`
      );
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  return finishSeasonFlow(userId, player, leadingDesc);
}

/** Cierra la temporada: progresión, premios y mercado de pases */
function finishSeasonFlow(userId, player, leadingDesc) {
  // Evaluación de objetivos de temporada y posición en liga antes de limpiar tabla
  const currentTable = standingsSorted(player.table || {});
  const posIndex = currentTable.findIndex(t => t.club === player.club);
  const position = posIndex >= 0 ? posIndex + 1 : 1;

  if (player.currentObjective) {
    const isCompleted = checkSeasonObjective(player, player.currentObjective, currentTable, position);
    if (isCompleted) {
      const bonusPay = Math.round((player.salary || 50000) * 0.2);
      player.bank = (player.bank || 0) + bonusPay;
      player.morale = Math.min(100, (player.morale || 75) + 8);
      const rewardMsg = typeof player.currentObjective.rewardText === 'function'
        ? player.currentObjective.rewardText(player)
        : (player.currentObjective.rewardText || '¡Objetivo de la directiva cumplido con éxito!');
      leadingDesc += `\n\n🎯 **Objetivo de la Directiva CUMPLIDO:** ${rewardMsg} (+💰 $${bonusPay.toLocaleString('en-US')} bonus)`;
    } else {
      player.morale = Math.max(10, (player.morale || 75) - 4);
      leadingDesc += `\n\n⚠️ **Objetivo de la Directiva NO alcanzado:** La dirigencia esperaba mayor protagonismo.`;
    }
  }

  const { development, awards } = finishSeason(player);

  // 4. Registrar temporada en Timeline Histórico
  recordSeasonInTimeline(player, {
    trophiesWon: player.career.trophies || [],
    awardsWon: awards || []
  });

  // 16. Mover el mercado del universo persistente
  simulateGlobalWorldWindow();

  const growthText = development.growth >= 0
    ? `📈 Media: **${player.overall}** (${development.growth >= 0 ? '+' : ''}${development.growth}) · Edad: ${player.age} · Potencial: **${player.potential}**`
    : `📉 Media: **${player.overall}** (${development.growth}) · Edad: ${player.age} · Potencial: **${player.potential}**`;

  const gainedText = Object.entries(development.gained || {})
    .map(([key, value]) => `${ATTR_LABELS[key]} ${value >= 0 ? '+' : ''}${value}`)
    .join(' · ');

  const econSummary = `💰 Sueldo neto anual: **${formatMoney(development.annualSalary || player.salary)}** · Patrimonio: **${formatMoney(player.bank || 0)}** · Valor de Mercado: **${formatMoney(player.marketValue || 1000000)}**`;

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🏁 Fin de temporada')
    .setDescription(
      `${leadingDesc}\n\n${growthText}` +
      (gainedText ? `\n${gainedText}` : '') +
      (awards.length ? `\n\n🏅 Premios de la temporada:\n${awards.map(a => `• ${a}`).join('\n')}` : '') +
      `\n\n${econSummary}`
    );

  // Generar nuevo objetivo para la siguiente temporada
  const currentLeague = getLeague(player.leagueKey);
  if (currentLeague) {
    player.currentObjective = generateSeasonObjective(player, currentLeague);
  }

  // Retiro a los 42 años o voluntario
  if (player.retired || player.age >= 42) {
    player.retired = true;
    const verdict = retirementVerdict(player);
    
    // 13. Consagrar en el Salón de la Fama
    const legend = inductIntoHallOfFame(player, verdict);

    storage.setPlayer(userId, player);

    const retireEmbed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`👑 ¡CARRERA FINALIZADA A LOS ${player.age} AÑOS! — ${player.name}`)
      .setDescription(
        `🏆 **Rango de Leyenda:** ${verdict.titulo || verdict.title}\n\n` +
        `*"${verdict.summary || 'Una trayectoria grabada con letras de oro en los anales del fútbol.'}"*\n\n` +
        `🏛️ **¡Consagrado en el Salón de la Fama Oficial!** Consulta tu lugar con \`/salon-fama\`.\n\n` +
        `📊 **Estadísticas Finales de Carrera:**\n` +
        `• Partidos Jugados: **${player.career.apps}**\n` +
        `• Goles: **${player.career.goals}** · Asistencias: **${player.career.assists}**\n` +
        `• Selección Nacional: **${player.career.caps}** PJ / **${player.career.nationalGoals}** goles\n` +
        `• Títulos Ganados: **${player.career.trophies.length}**\n` +
        `• Premios Individuales: **${player.career.awards.length}**\n` +
        `• Fortuna Acumulada: **${formatMoney(player.bank || 0)}**\n\n` +
        (player.career.trophies.length ? `🏆 **Títulos:**\n${player.career.trophies.slice(0, 10).map(t => `• ${t}`).join('\n')}\n\n` : '') +
        (player.career.awards.length ? `🏅 **Premios:**\n${player.career.awards.slice(0, 10).map(a => `• ${a}`).join('\n')}\n\n` : '') +
        `👔 **¿Cuál es tu siguiente paso?**\n` +
        `• Puedes asumir como **Director Técnico (DT)** en tu club con \`/dt\`.\n` +
        `• O iniciar una nueva dinastía con \`/crear-jugador\`.`
      );
    return { ok: true, ephemeral: false, embeds: [embed, retireEmbed], components: [] };
  }

  const event = maybePickCareerEvent();
  player.pendingCareerEvent = event ? event.id : null;
  storage.setPlayer(userId, player);

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
  player.salary = calculateSalary(player);
  startSeason();
  player.morale = Math.min(100, player.morale + 10);
  storage.setPlayer(userId, player);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('✍️ ¡Fichaje confirmado!')
    .setDescription(
      `**${player.name}** ficha por ${flagFor(newLeague.country)} **${newClub.name}** (media ${newClub.media}) ` +
      `para jugar ${newLeague.name} en la temporada ${player.season}.\n\n` +
      `💰 **Nuevo Sueldo Anual:** $${player.salary.toLocaleString('en-US')}/año`
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
    : player.stage === 'copa_seleccion' ? `🌎 Torneo Continental (${player.continentalNationalCup ? player.continentalNationalCup.name : 'En curso'})`
    : player.stage === 'mundial' ? '🌍 Mundial de Selecciones'
    : player.stage === 'entretemporada' ? 'Mercado de pases' : 'Liga en curso';

  const inventorySummary = [];
  if (player.mansionPurchased) inventorySummary.push('🏡 Mansión Deportiva');
  if (player.trainerPurchased) inventorySummary.push('🏋️‍♂️ Fisio VIP');
  if (player.chefPurchased) inventorySummary.push('🥗 Chef Élite');
  if (player.superagentPurchased) inventorySummary.push('🤝 Superagente');
  if (player.supercarPurchased) inventorySummary.push('🏎️ Superdeportivo');
  if (player.realEstateCount > 0) inventorySummary.push(`🏢 Inmuebles (x${player.realEstateCount})`);

  const repSummary = getReputationSummary(player);
  const personalityEmoji = player.personality?.emoji || '⚽';
  const personalityName = player.personality?.name || 'Profesional Equilibrado';
  const injuryStatus = formatInjuryStatus(player);

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`${player.retired ? '🏅 ' : '⚽ '}${player.name} — Media ${player.overall}`)
    .setDescription(
      (player.retired ? 'Jugador retirado.' : `Temporada ${player.season} · ${stageLabel}${player.injuredMatches > 0 ? ` · 🚑 ${player.injuredMatches} partidos de baja` : ''}${player.suspendedMatches > 0 ? ` · 🟥 ${player.suspendedMatches} partido(s) suspendido` : ''}`) +
      `\n🎭 **Personalidad:** ${personalityEmoji} **${personalityName}**\n` +
      `📈 **Estatus:** Reputación: **${repSummary.reputation}** | Popularidad: **${repSummary.popularity}** | Prestigio: **${repSummary.prestige}** (${repSummary.tierLabel})`
    )
    .addFields(
      { name: 'Club', value: `${league ? flagFor(league.country) : ''} ${player.club} (media ${player.clubMedia})`, inline: true },
      { name: 'Liga', value: `${league ? league.name : '—'}`, inline: true },
      { name: 'Posición', value: POSITIONS[player.position].label, inline: true },
      { name: 'Edad', value: `${player.age} años (Máx: 42)`, inline: true },
      { name: 'Potencial', value: `${player.potential}`, inline: true },
      { name: 'Moral', value: `${player.morale}/100`, inline: true },
      {
        name: '💰 Economía',
        value: `Valor: **${formatMoney(player.marketValue || 1000000)}**\nSueldo: **${formatMoney(player.weeklyWage || 500)}/sem**\nContrato: **${player.contractYears || 2} años** (Cláusula: ${formatMoney(player.releaseClause || 3000000)})`,
        inline: true
      },
      {
        name: '🏦 Patrimonio',
        value: `Banco: **${formatMoney(player.bank || 0)}**\nRepresentante: **${player.agent?.name || 'Familiar / Local'}**`,
        inline: true
      },
      {
        name: '🩺 Estado Físico',
        value: injuryStatus,
        inline: true
      },
      {
        name: '📊 Esta temporada',
        value: `PJ: ${s.apps} | Goles: ${s.goals} | Asist: ${s.assists}${player.position === 'POR' ? ` | Vallas Invictas: ${s.cleanSheets || 0}` : ''} | 🟨 ${s.yellow} | 🟥 ${s.red} | Rating: ${avg}`,
        inline: false
      },
      {
        name: '🏆 Carrera',
        value: `PJ: ${player.career.apps} | Goles: ${player.career.goals} | Asist: ${player.career.assists} | Selección: ${player.career.caps} PJ / ${player.career.nationalGoals} goles`,
        inline: false
      },
      {
        name: '⚡ Atributos',
        value: describeAttributes(player.attributes),
        inline: false
      }
    );

  if (inventorySummary.length) {
    embed.addFields({ name: '🎒 Propiedades e Inversiones', value: inventorySummary.join(' · ') });
  }
  if (player.career.trophies.length) {
    embed.addFields({ name: 'Vitrina de Títulos', value: player.career.trophies.map(t => `🏆 ${t}`).join('\n').slice(0, 1000) });
  }
  if ((player.career.awards || []).length) {
    embed.addFields({ name: 'Premios Individuales', value: player.career.awards.map(a => `🏅 ${a}`).join('\n').slice(0, 1000) });
  }

  const components = (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [];
  return { ok: true, ephemeral: false, embeds: [embed], components };
}

// ─────────────────────────── Nuevas Vistas y Acciones ───────────────────────────

/** 1. Vista de Lesiones y Gestión Médica */
function injuryView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const risk = getInjuryRiskProfile(player);
  const status = formatInjuryStatus(player);
  const history = player.injuryHistory || [];

  const embed = new EmbedBuilder()
    .setColor(player.injuredMatches > 0 ? 0xe74c3c : 0x2ecc71)
    .setTitle(`🩺 Departamento Médico & Fisioterapia — ${player.name}`)
    .setDescription(
      `**Estado Actual:** ${status}\n\n` +
      `📊 **Perfil de Riesgo Físico:**\n` +
      `• Nivel de Riesgo: **${risk.riskLevel}** (${risk.riskScore}%)\n` +
      `• Edad: **${risk.age} años** | Físico: **${risk.physicalScore}/99**\n` +
      `• Instalaciones: ${player.mansionPurchased ? '🏡 Centro Alto Rendimiento (-50% riesgo)' : 'Estándar'}\n` +
      `• Equipo Médico: ${player.trainerPurchased ? '🏋️‍♂️ Fisio VIP Activo' : 'Cuerpo Médico del Club'}\n\n` +
      (player.injuredMatches > 0
        ? `💉 **Tratamientos Disponibles:**\n` +
          `1️⃣ **Fisioterapia Intensiva:** Reduce 1-2 partidos por **$40,000**\n` +
          `2️⃣ **Clínica Quirúrgica Suiza:** Reduce 3-5 partidos por **$120,000**\n`
        : '✅ Estás al 100% de tus capacidades físicas para competir.')
    );

  if (history.length > 0) {
    const historyLines = history.slice(-5).map(h =>
      `• **${h.name}** (${h.type}): ${h.matches} partidos de baja (Temp. ${h.season || 1})`
    );
    embed.addFields({ name: '📋 Historial Médico Reciente', value: historyLines.join('\n') });
  }

  const components = [];
  if (player.injuredMatches > 0 && !player.retired) {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`treat:${userId}:physio`).setLabel('Fisioterapia ($40k)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`treat:${userId}:surgery`).setLabel('Clínica Suiza ($120k)').setStyle(ButtonStyle.Success)
      )
    );
  }

  return { ok: true, ephemeral: false, embeds: [embed], components };
}

/** Acción de tratamiento médico */
function injuryTreatAction(userId, treatmentType) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const res = treatInjury(player, treatmentType);
  if (!res.success) {
    return { ok: false, ephemeral: true, content: `❌ ${res.reason}` };
  }

  storage.setPlayer(userId, player);
  return injuryView(userId);
}

/** 2. Vista de Economía Detallada */
function economyView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const netWorth = calculateNetWorth(player);
  const weeklyExpenses = calculateWeeklyExpenses(player);
  const { annualWage, weeklyWage, goalBonus, trophyBonus } = calculateWages(player);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`💰 Finanzas, Contrato y Patrimonio — ${player.name}`)
    .setDescription(
      `🏛️ **Patrimonio Neto Total:** **${formatMoney(netWorth)}**\n` +
      `🏦 **Liquidez Bancaria:** **${formatMoney(player.bank || 0)}**\n\n` +
      `📄 **Contrato Actual:**\n` +
      `• Club: **${player.club}**\n` +
      `• Sueldo Semanal: **${formatMoney(weeklyWage)}/sem**\n` +
      `• Sueldo Anual: **${formatMoney(annualWage)}/año**\n` +
      `• Duración restante: **${player.contractYears || 2} años**\n` +
      `• Valor de Mercado: **${formatMoney(player.marketValue || 1000000)}**\n` +
      `• Cláusula de Rescisión: **${formatMoney(player.releaseClause || 3000000)}**\n\n` +
      `🎁 **Bonos por Rendimiento:**\n` +
      `• Prima por Gol/Asistencia: **${formatMoney(goalBonus)}**\n` +
      `• Prima por Título Oficial: **${formatMoney(trophyBonus)}**\n\n` +
      `🤝 **Representante Deportivo:**\n` +
      `• Agente: **${player.agent?.name || 'Familiar / Local'}** (${player.agent?.specialty || 'Representación básica'})\n` +
      `• Comisión por transferencia: **${player.agent?.commission || 10}%**\n\n` +
      `💸 **Gastos y Mantenimiento:**\n` +
      `• Gastos de vida y estilo: **${formatMoney(weeklyExpenses)}/sem** (~${formatMoney(weeklyExpenses * 52)}/año)`
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 3. Vista de Reputación y Personalidad */
function reputationView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const rep = getReputationSummary(player);
  const pers = player.personality || { name: 'Profesional Equilibrado', emoji: '⚽', desc: 'Dedicado y constante' };

  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`📈 Reputación, Fama & Prensa — ${player.name}`)
    .setDescription(
      `🎭 **Rasgo de Personalidad:** ${pers.emoji} **${pers.name}**\n` +
      `*${pers.desc}*\n\n` +
      `📊 **Métricas Mediáticas:**\n` +
      `• **Reputación:** ⭐ **${rep.reputation}/99** (Nivel de respeto deportivo global)\n` +
      `• **Popularidad:** 🔥 **${rep.popularity}/99** (Seguidores, marcas y valor comercial)\n` +
      `• **Prestigio:** 👑 **${rep.prestige}/99** (Peso histórico en grandes torneos)\n` +
      `• **Estatus Mediático:** **${rep.tierLabel}**\n\n` +
      `🎙️ **Veredicto de la Prensa:**\n` +
      `*"${rep.pressQuote}"*`
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 4. Vista de Timeline e Historial Completo */
function timelineView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const timelineText = formatCareerTimeline(player);
  const embed = new EmbedBuilder()
    .setColor(0x34495e)
    .setTitle(`📜 Historial Temporada a Temporada — ${player.name}`)
    .setDescription(timelineText.slice(0, 4000));

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 5. Vista de Selección Nacional y Ranking FIFA */
function nationalTeamView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const status = getNationalTeamStatus(player);
  const rankings = getFIFARankings();

  const rankingLines = rankings.slice(0, 8).map((r, i) =>
    `\`#${i + 1}\` ${r.flag} **${r.nation}** (${r.points} pts)`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x2980b9)
    .setTitle(`🇨🇱 Selección Nacional — ${player.nationality || 'Chile'}`)
    .setDescription(
      `👤 **Estado del Jugador:**\n` +
      `• Convocable: ${status.eligible ? '✅ Sí' : '❌ No (Media o reputación baja)'}\n` +
      `• Estatus en el plantel: **${status.status}**\n` +
      `• Partidos con la Selección: **${player.career.caps || 0} PJ**\n` +
      `• Goles Internacionales: **${player.career.nationalGoals || 0} ⚽**\n\n` +
      `🌍 **Ranking FIFA Oficial:**\n${rankingLines}`
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 6. Vista de Redes Sociales */
function socialFeedView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  let feed = player.lastSocialFeed;
  if (!feed) {
    const posts = generateSocialFeed(player, {
      playerGoals: player.seasonStats.goals,
      playerAssists: player.seasonStats.assists,
      rating: 7.2,
      result: 'V',
      opponent: 'Rival'
    });
    feed = formatSocialFeedEmbed(posts);
  }

  const feedStr = typeof feed === 'string' ? feed : formatSocialFeedEmbed(feed);

  const embed = new EmbedBuilder()
    .setColor(0x1da1f2)
    .setTitle(`📱 Feed Social & Tendencias — @${player.name.replace(/\s+/g, '_').toLowerCase()}`)
    .setDescription(feedStr.slice(0, 4000));

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 7. Vista de Noticias Dinámicas */
function newsFeedView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const news = player.lastNewsFeed || generateNewsFeed(player, {
    matchResult: {
      playerGoals: player.seasonStats.goals,
      playerAssists: player.seasonStats.assists,
      rating: 7.2,
      result: 'V',
      opponent: 'Rival'
    }
  });

  const newsStr = typeof news === 'string' ? news : formatNewsFeedEmbed(news);

  const embed = new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle(`📰 Diario Deportivo — Última Edición`)
    .setDescription(newsStr.slice(0, 4000));

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 8. Vista de Cantera y Jóvenes Promesas */
function academyView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const academy = getClubAcademy(player.club);
  const embed = new EmbedBuilder()
    .setColor(0x16a085)
    .setTitle(`🌱 Academia de Juveniles — ${player.club}`)
    .setDescription(
      `Las divisiones inferiores de **${player.club}** preparan a la próxima camada de cracks procedimentales:\n\n` +
      academy.prospects.map((p, i) =>
        `\`#${i + 1}\` 🌟 **${p.name}** (${p.position}) — Media: **${p.overall}** | Potencial: **${p.potential}** | ${p.age} años\n` +
        `└ 🏷️ *${p.trait}* | Valor: ${formatMoney(p.marketValue)} | Scout: *"${p.scoutReport}"*`
      ).join('\n\n')
    );

  return { ok: true, ephemeral: false, embeds: [embed], components: (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [] };
}

/** 9. Vista de Ranking Mundial */
function worldRankingView(userId, category = 'overall') {
  let list = [];
  let title = '🌍 Ranking Mundial de Jugadores';

  if (category === 'value') {
    list = getTopMarketValue(10);
    title = '💰 Top 10 Jugadores Más Valiosos del Mundo';
  } else if (category === 'wonderkids') {
    list = getTopWonderkids(10);
    title = '👶 Top 10 Jóvenes Promesas Mundiales (Sub-21)';
  } else if (category === 'chile') {
    list = getTopByCountry('Chile', 10);
    title = '🇨🇱 Top 10 Mejores Jugadores Chilenos';
  } else {
    list = getTopOverall(10);
    title = '👑 Top 10 Mejores Jugadores por Media (OVR)';
  }

  const lines = list.map((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
    return `${medal} **${p.name}** (${p.position}) — **${p.overall} OVR** (Pot: ${p.potential}) | 🏟️ ${p.club} | 💰 ${formatMoney(p.value)}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(title)
    .setDescription(lines);

  return { ok: true, ephemeral: false, embeds: [embed] };
}

/** 10. Vista del Salón de la Fama */
function hallOfFameView(userId) {
  const text = formatHallOfFameEmbed(12);
  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🏛️ Salón de la Fama Permanente — Leyendas Inmortales')
    .setDescription(text);

  return { ok: true, ephemeral: false, embeds: [embed] };
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
        : 'Sin foco de entrenamiento (te puede tocar elegirlo en una decisión de pretemporada).') +
      `\n\n💡 Usa \`/entrenar\` para mejorar habilidades específicas.`
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

  if (player.stage === 'copa_seleccion' && player.continentalNationalCup) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🌎 ${player.continentalNationalCup.name} · ${phaseLabel(player.continentalNationalCup)}`)
      .setDescription(groupTableText(player.continentalNationalCup));
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
    return { ok: false, ephemeral: true, content: 'No hay una tabla de liga en curso ahora mismo (estás en copa, torneo de selección o mercado de pases).' };
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

function shopView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(`🛒 Tienda de Inversiones & Estilo de Vida — ${player.name}`)
    .setDescription(
      `💰 Saldo actual en cuenta: **${(player.bank || 0).toLocaleString('en-US')}**\n` +
      `Sueldo por temporada: **${(player.salary || 25000).toLocaleString('en-US')}**\n\n` +
      `Invierte tus ganancias para mejorar tu longevidad, rendimiento y prestigio:`
    );

  const buttons = [];
  for (const [key, item] of Object.entries(SHOP_ITEMS)) {
    let owned = false;
    if (key === 'mansion') owned = !!player.mansionPurchased;
    else if (key === 'trainer') owned = !!player.trainerPurchased;
    else if (key === 'chef') owned = !!player.chefPurchased;
    else if (key === 'superagent') owned = !!player.superagentPurchased;
    else if (key === 'supercar') owned = !!player.supercarPurchased;
    else if (key === 'realestate') owned = (player.realEstateCount || 0) >= 10;

    const priceFormatted = `${item.price.toLocaleString('en-US')}`;
    const statusText = owned ? (key === 'realestate' ? `(Posees ${player.realEstateCount})` : '✅ Comprado') : priceFormatted;

    embed.addFields({
      name: `${item.emoji} ${item.name} · ${statusText}`,
      value: `${item.desc}\n**Precio:** ${priceFormatted}`
    });

    if (!owned || key === 'realestate') {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`shop:${userId}:buy:${key}`)
          .setLabel(`${item.emoji} Comprar ${item.name.split(' ')[0]}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled((player.bank || 0) < item.price)
      );
    }
  }

  const rows = [];
  while (buttons.length) {
    rows.push(new ActionRowBuilder().addComponents(buttons.splice(0, 5)));
  }

  return { ok: true, ephemeral: false, embeds: [embed], components: rows };
}

function buyItemAction(userId, itemId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const result = buyItem(player, itemId);
  if (!result.success) {
    return { ok: false, ephemeral: true, content: `❌ ${result.reason}` };
  }

  storage.setPlayer(userId, player);
  return shopView(userId);
}

function trainView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  if (player.retired) {
    return { ok: false, ephemeral: true, content: 'Tu jugador ya se ha retirado.' };
  }

  const maxWeekly = 3;
  const currentWeekly = player.trainingsThisWeek || 0;
  const remaining = Math.max(0, maxWeekly - currentWeekly);

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`🏋️ Sesión de Entrenamiento Individual — ${player.name}`)
    .setDescription(
      `Media: **${player.overall}** · Potencial: **${player.potential}** · Posición: **${POSITIONS[player.position].label}**\n` +
      `Entrenamientos disponibles esta semana: **${remaining}/${maxWeekly}**\n\n` +
      `${describeAttributes(player.attributes)}\n\n` +
      (remaining > 0
        ? 'Selecciona una habilidad para entrenar intensivamente en la cancha:'
        : '⏱️ Ya completaste tus sesiones esta semana. Juega partidos para avanzar al siguiente ciclo de entrenamientos.')
    );

  const buttons = Object.entries(ATTR_LABELS).map(([key, label]) =>
    new ButtonBuilder()
      .setCustomId(`train:${userId}:${key}`)
      .setLabel(`⚡ ${label} (${player.attributes[key] || 50})`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(remaining <= 0 || (player.attributes[key] || 50) >= 99)
  );

  const rows = [
    new ActionRowBuilder().addComponents(buttons.slice(0, 3)),
    new ActionRowBuilder().addComponents(buttons.slice(3, 6))
  ];

  return { ok: true, ephemeral: false, embeds: [embed], components: rows };
}

function trainSkillAction(userId, skillKey) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  if (player.retired) {
    return { ok: false, ephemeral: true, content: 'Tu jugador ya se ha retirado.' };
  }

  if ((player.trainingsThisWeek || 0) >= 3) {
    return { ok: false, ephemeral: true, content: 'Ya realizaste el máximo de 3 entrenamientos esta semana. ¡Juega partidos para avanzar la temporada!' };
  }

  const result = trainSkill(player, skillKey);
  if (!result.success) {
    return { ok: false, ephemeral: true, content: `❌ ${result.reason}` };
  }

  storage.setPlayer(userId, player);

  const label = ATTR_LABELS[skillKey] || skillKey;
  const feedback = result.isGreat
    ? `🌟 **¡Sesión Brillante!** Tu ${label} subió **+${result.boost}** (Nuevo nivel: **${result.newVal}**).`
    : `💪 **¡Buen Trabajo!** Tu ${label} subió **+${result.boost}** (Nuevo nivel: **${result.newVal}**).`;

  const updatedView = trainView(userId);
  updatedView.content = `${feedback}${result.ovrChanged ? ` 📈 ¡Tu media general subió a **${result.newOverall}**!` : ''}`;
  return updatedView;
}

function awardsView(userId) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🏆 Palmarés & Premios — ${player.name}`)
    .setDescription(`Trayectoria de ${player.career.apps} partidos disputados y ${player.career.goals} goles anotados.`);

  if (player.career.trophies.length) {
    embed.addFields({
      name: `🏆 Títulos Colectivos (${player.career.trophies.length})`,
      value: player.career.trophies.map(t => `• ${t}`).join('\n').slice(0, 1024)
    });
  } else {
    embed.addFields({ name: '🏆 Títulos Colectivos', value: 'Aún no has levantado trofeos con tus clubes o selección.' });
  }

  if ((player.career.awards || []).length) {
    embed.addFields({
      name: `🏅 Premios Individuales (${player.career.awards.length})`,
      value: player.career.awards.map(a => `• ${a}`).join('\n').slice(0, 1024)
    });
  } else {
    embed.addFields({ name: '🏅 Premios Individuales', value: 'Sigue brillando en los partidos para ganar el Balón de Oro, Bota de Oro o Trofeo Yashin.' });
  }

  const components = (!player.retired && player.stage !== 'entretemporada') ? [continueRow(userId)] : [];
  return { ok: true, ephemeral: false, embeds: [embed], components };
}

function resolveShootoutKick(userId, choiceIndex) {
  const player = storage.getPlayer(userId);
  if (!player) return noPlayer();
  if (!player.pendingShootout) {
    return { ok: false, ephemeral: true, content: 'No hay tanda de penales activa.' };
  }

  const pending = player.pendingShootout;
  const picked = Number(choiceIndex);
  const isGoalkeeper = player.position === 'POR';
  const oppChoice = rand(0, 2);

  let myRoundGoal = false;
  let oppRoundGoal = false;

  if (isGoalkeeper) {
    const defAttr = (player.attributes && (player.attributes.defensa || player.attributes.fisico)) || 50;
    if (picked === oppChoice) {
      const saveChance = Math.min(0.85, 0.45 + defAttr / 150);
      oppRoundGoal = Math.random() > saveChance;
    } else {
      oppRoundGoal = Math.random() < 0.85;
    }
    myRoundGoal = Math.random() < 0.75;
  } else {
    const shootAttr = (player.attributes && (player.attributes.tiro || player.attributes.regate)) || 50;
    if (picked === oppChoice) {
      const scoreChance = Math.min(0.70, 0.25 + shootAttr / 180);
      myRoundGoal = Math.random() < scoreChance;
    } else {
      myRoundGoal = Math.random() < 0.90;
    }
    oppRoundGoal = Math.random() < 0.75;
  }

  if (myRoundGoal) pending.myScore += 1;
  if (oppRoundGoal) pending.oppScore += 1;

  pending.history.push(
    `Penal ${pending.round}: ${myTeamName(player)} ${myRoundGoal ? '⚽ Gol' : '❌ Erraron'} · ${pending.oppName} ${oppRoundGoal ? '⚽ Gol' : '❌ Erraron'}`
  );

  pending.round += 1;

  const roundsPlayed = pending.round - 1;
  let finished = false;
  let won = false;

  if (roundsPlayed >= pending.maxRounds) {
    if (pending.myScore !== pending.oppScore) {
      finished = true;
      won = pending.myScore > pending.oppScore;
    }
  } else {
    const remaining = pending.maxRounds - roundsPlayed;
    if (pending.myScore > pending.oppScore + remaining) {
      finished = true;
      won = true;
    } else if (pending.oppScore > pending.myScore + remaining) {
      finished = true;
      won = false;
    }
  }

  if (!finished) {
    storage.setPlayer(userId, player);
    return {
      ok: true,
      ephemeral: false,
      embeds: [shootoutEmbed(player, pending)],
      components: [shootoutRow(userId)]
    };
  }

  const tournament = player.stage === 'copa_nacional'
    ? player.nationalCup
    : (player.stage === 'copa' ? player.cup : (player.stage === 'copa_seleccion' ? player.continentalNationalCup : player.worldCup));

  const penaltiesSummary = `\n🎯 Definición por penales: **${pending.myScore} - ${pending.oppScore}** (${won ? 'Ganó ' + myTeamName(player) : 'Ganó ' + pending.oppName}).`;
  player.pendingShootout = null;

  if (!tournament) {
    storage.setPlayer(userId, player);
    return finishSeasonFlow(userId, player, penaltiesSummary);
  }

  const outcome = finalizeShootout(tournament, won, penaltiesSummary);

  const embed = new EmbedBuilder()
    .setColor(won ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`🎯 Final de los penales · ${pending.tournamentName}`)
    .setDescription(
      `**Resultado final: ${myTeamName(player)} ${pending.myScore} - ${pending.oppScore} ${pending.oppName}**\n\n` +
      pending.history.join('\n') + `\n\n${outcome.text || ''}`
    );

  storage.setPlayer(userId, player);

  if (outcome.status === 'continue') {
    return { ok: true, ephemeral: false, embeds: [embed], components: [continueRow(userId)] };
  }

  const closing = closeTournament(userId, player, outcome);
  closing.embeds = [embed, ...(closing.embeds || [])];
  return closing;
}

function promptForFinal(userId, player, tournament) {
  storage.setPlayer(userId, player);
  const opponent = nextOpponent(tournament);
  const oppName = opponent ? opponent.name : (tournament.knockoutOpponent || 'Rival');
  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🏆 ¡LLEGASTE A LA GRAN FINAL! — ${tournament.name}`)
    .setDescription(
      `🏎️ **Simulación Pausada:** Has avanzado con victorias consecutivas y tu equipo clasificó al partido definitivo.\n\n` +
      `🆚 **${myTeamName(player)} vs ${oppName}**\n` +
      `🏟️ **${tournament.name} · FINAL**\n\n` +
      `¡El título se define en la cancha! Elige tu planteamiento táctico y prepárate para disputar el minijuego de consagración:`
    );
  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: [tacticRow(userId)]
  };
}

function simulateEntireSeason(userId) {
  const player = storage.getPlayer(userId);
  if (!player) {
    const manager = storage.getManager(userId);
    if (manager && !manager.retired) {
      return dtSimulateEntireSeason(userId);
    }
    return noPlayer();
  }
  if (player.retired) {
    const manager = storage.getManager(userId);
    if (manager && !manager.retired) {
      return dtSimulateEntireSeason(userId);
    }
    return { ok: false, ephemeral: true, content: 'Este jugador ya se ha retirado. Usa `/crear-jugador` para empezar una nueva carrera.' };
  }

  if (player.stage === 'entretemporada') {
    return {
      ok: true,
      ephemeral: false,
      content: `Ya estás en el mercado de pases. ¡Elegí club para la temporada ${player.season + 1}!`,
      embeds: [offersEmbed(player)],
      components: offersRows(userId, player.offers || [])
    };
  }

  // Limpiar pendientes
  player.pendingShootout = null;
  player.pendingMinigame = null;
  player.pendingMomento = null;
  player.pendingCareerEvent = null;
  player.pendingTactic = null;

  const currentSeasonNum = player.season;
  const initialTrophiesCount = player.career.trophies.length;
  const club = findClub(player.club);
  const league = getLeague(player.leagueKey);

  // 1. Simular Liga restante si estamos en fase de liga
  if (player.stage === 'liga') {
    ensureFixture(player);

    while (player.matchdayIndex < (player.fixture || []).length) {
      const roundIndex = player.matchdayIndex;
      const oppName = player.fixture[roundIndex];
      const oppClub = findClub(oppName) || { name: oppName, media: 65, tier: 1 };

      if (player.injuredMatches > 0) {
        player.injuredMatches -= 1;
        const res = simulateMatchWithoutPlayer(club, oppClub, player.overall);
        updateTable(player.table, player.club, res.myGoals, res.oppGoals);
        updateTable(player.table, oppName, res.oppGoals, res.myGoals);
        simulateOtherRoundMatches(player, roundIndex);
        player.matchdayIndex += 1;
      } else if (player.suspendedMatches > 0) {
        player.suspendedMatches -= 1;
        const res = simulateMatchWithoutPlayer(club, oppClub, player.overall);
        updateTable(player.table, player.club, res.myGoals, res.oppGoals);
        updateTable(player.table, oppName, res.oppGoals, res.myGoals);
        simulateOtherRoundMatches(player, roundIndex);
        player.matchdayIndex += 1;
      } else {
        const res = simulateMatch(player, club, oppClub, 'equilibrado', {});
        applyMatchToPlayer(player, res);
        updateTable(player.table, player.club, res.myGoals, res.oppGoals);
        updateTable(player.table, oppName, res.oppGoals, res.myGoals);
        simulateOtherRoundMatches(player, roundIndex);
        player.matchdayIndex += 1;
      }
    }

    // Resolver fin de liga
    const table = standingsSorted(player.table);
    const posIndex = table.findIndex(t => t.club === player.club);
    const posicion = posIndex + 1;
    const totalClubs = table.length;

    if (posicion === 1) {
      player.career.trophies.push(`Campeón ${league.name} (Temporada ${player.season})`);
    }

    const movement = applyPromotionRelegation(player, posicion, totalClubs);
    if (movement.moved === 'ascenso') {
      player.morale = Math.min(100, player.morale + 10);
    } else if (movement.moved === 'descenso') {
      player.morale = Math.max(10, player.morale - 10);
    }

    const qual = (league.level === 1 && movement.moved !== 'descenso')
      ? getContinentalQualification(player.leagueKey, posicion)
      : null;
    player.qualifiedContinentalCup = qual;

    player.stage = 'copa_nacional';
    player.nationalCup = createNationalCup(player);
    storage.setPlayer(userId, player);
  }

  // 2. Simular Copa Nacional
  if (player.stage === 'copa_nacional') {
    if (!player.nationalCup) {
      player.nationalCup = createNationalCup(player);
    }

    while (player.nationalCup && player.nationalCup.phase !== 'eliminado' && player.nationalCup.phase !== 'campeon') {
      const opp = nextOpponent(player.nationalCup);
      if (!opp) break;
      const res = simulateMatch(player, club, opp, 'equilibrado', {});
      if (res.myGoals === res.oppGoals) {
        const winShootout = Math.random() < 0.52 + ((player.overall - opp.media) / 200);
        if (winShootout) res.myGoals += 1;
        else res.oppGoals += 1;
      }
      applyMatchToPlayer(player, res);
      const out = applyTournamentResult(player.nationalCup, res.myGoals, res.oppGoals);
      if (out.status === 'campeon') {
        player.career.trophies.push(`Campeón ${player.nationalCup.name} (Temporada ${player.season})`);
        break;
      } else if (out.status === 'eliminado') {
        break;
      }
    }

    player.nationalCup = null;
    if (player.qualifiedContinentalCup) {
      player.stage = 'copa';
      player.cup = createContinentalCup(player, player.qualifiedContinentalCup);
      player.qualifiedContinentalCup = null;
    } else {
      player.stage = 'copa_seleccion';
    }
    storage.setPlayer(userId, player);
  }

  // 3. Simular Copa Continental si corresponde
  if (player.stage === 'copa') {
    if (!player.cup && player.qualifiedContinentalCup) {
      player.cup = createContinentalCup(player, player.qualifiedContinentalCup);
      player.qualifiedContinentalCup = null;
    }

    while (player.cup && player.cup.phase !== 'eliminado' && player.cup.phase !== 'campeon') {
      const opp = nextOpponent(player.cup);
      if (!opp) break;
      const res = simulateMatch(player, club, opp, 'equilibrado', {});
      if (res.myGoals === res.oppGoals && KNOCKOUT_ORDER.includes(player.cup.phase)) {
        const winShootout = Math.random() < 0.50 + ((player.overall - opp.media) / 200);
        if (winShootout) res.myGoals += 1;
        else res.oppGoals += 1;
      }
      applyMatchToPlayer(player, res);
      const out = applyTournamentResult(player.cup, res.myGoals, res.oppGoals);
      if (out.status === 'campeon') {
        player.career.trophies.push(`Campeón ${player.cup.name} (Temporada ${player.season})`);
        break;
      } else if (out.status === 'eliminado') {
        break;
      }
    }

    player.cup = null;
    player.stage = 'copa_seleccion';
    storage.setPlayer(userId, player);
  }

  // 4. Simular Selección (Mundial / Copa América / Eurocopa) si fue convocado
  if (player.stage === 'copa_seleccion' || player.stage === 'mundial') {
    if (!player.worldCup && !player.continentalNationalCup) {
      const callUp = nationalTeamCallUp(player);
      if (callUp.called) {
        if (callUp.type === 'mundial') {
          player.stage = 'mundial';
          player.worldCup = createWorldCup(player);
        } else if (callUp.type === 'continental') {
          player.stage = 'copa_seleccion';
          player.continentalNationalCup = createContinentalNationalTournament(player);
        }
      }
    }

    if (player.stage === 'mundial' && player.worldCup) {
      const nationObj = findNation(player.nationality) || { media: 75 };
      while (player.worldCup && player.worldCup.phase !== 'eliminado' && player.worldCup.phase !== 'campeon') {
        const opp = nextOpponent(player.worldCup);
        if (!opp) break;
        const res = simulateMatch(player, { name: player.worldCup.myTeam, media: nationObj.media, tier: 5 }, opp, 'equilibrado', {});
        if (res.myGoals === res.oppGoals && KNOCKOUT_ORDER.includes(player.worldCup.phase)) {
          const winShootout = Math.random() < 0.50 + ((player.overall - opp.media) / 200);
          if (winShootout) res.myGoals += 1;
          else res.oppGoals += 1;
        }
        applyMatchToPlayer(player, res, { national: true });
        const out = applyTournamentResult(player.worldCup, res.myGoals, res.oppGoals);
        if (out.status === 'campeon') {
          player.career.trophies.push(`Campeón Copa del Mundo (Temporada ${player.season})`);
          break;
        } else if (out.status === 'eliminado') {
          break;
        }
      }
      player.worldCup = null;
    } else if (player.stage === 'copa_seleccion' && player.continentalNationalCup) {
      const nationObj = findNation(player.nationality) || { media: 75 };
      while (player.continentalNationalCup && player.continentalNationalCup.phase !== 'eliminado' && player.continentalNationalCup.phase !== 'campeon') {
        const opp = nextOpponent(player.continentalNationalCup);
        if (!opp) break;
        const res = simulateMatch(player, { name: player.continentalNationalCup.myTeam, media: nationObj.media, tier: 5 }, opp, 'equilibrado', {});
        if (res.myGoals === res.oppGoals && KNOCKOUT_ORDER.includes(player.continentalNationalCup.phase)) {
          const winShootout = Math.random() < 0.50 + ((player.overall - opp.media) / 200);
          if (winShootout) res.myGoals += 1;
          else res.oppGoals += 1;
        }
        applyMatchToPlayer(player, res, { national: true });
        const out = applyTournamentResult(player.continentalNationalCup, res.myGoals, res.oppGoals);
        if (out.status === 'campeon') {
          player.career.trophies.push(`Campeón ${player.continentalNationalCup.name} (Temporada ${player.season})`);
          break;
        } else if (out.status === 'eliminado') {
          break;
        }
      }
      player.continentalNationalCup = null;
    }
  }

  // 5. Cierre de Temporada
  const sStats = { ...player.seasonStats };
  const table = standingsSorted(player.table || {});
  const posIndex = table.findIndex(t => t.club === player.club);
  const posicion = posIndex >= 0 ? posIndex + 1 : 1;
  const totalClubs = table.length || 16;
  const leagueName = league ? league.name : 'Liga';
  const countryFlag = flagFor(league ? league.country : '');

  const { development, awards } = finishSeason(player);
  storage.setPlayer(userId, player);

  const newTrophies = player.career.trophies.slice(initialTrophiesCount);
  const avgRating = sStats.apps > 0 ? (sStats.avgRatingSum / sStats.apps).toFixed(2) : '—';


  const seasonSummaryEmbed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`🏎️ Simulación Rápida · Temporada ${currentSeasonNum} Completada`)
    .setDescription(
      `Has disputado la temporada completa en ${countryFlag} **${player.club}** (${leagueName}).\n` +
      `Posición final en liga: **${posicion}° de ${totalClubs}**`
    )
    .addFields(
      {
        name: '📊 Rendimiento del Año',
        value: `• PJ: **${sStats.apps}** | Goles: **${sStats.goals}** | Asist: **${sStats.assists}**\n• ${player.position === 'POR' ? `Vallas Invictas: **${sStats.cleanSheets || 0}**` : `G/A por partido: **${((sStats.goals + sStats.assists) / Math.max(1, sStats.apps)).toFixed(2)}**`}\n• Rating Promedio: **${avgRating}**`,
        inline: true
      },
      {
        name: '📈 Progresión y Media',
        value: `• Edad: **${player.age} años** (Máx 42)\n• Media OVR: **${player.overall}** (${development.growth >= 0 ? '+' : ''}${development.growth})\n• Potencial: **${player.potential}**`,
        inline: true
      },
      {
        name: '💰 Finanzas & Sueldo',
        value: `• Sueldo Anual: **$${(player.salary || 25000).toLocaleString('en-US')}**\n• Saldo Total: **$${(player.bank || 0).toLocaleString('en-US')}**`,
        inline: true
      }
    );

  if (newTrophies.length) {
    seasonSummaryEmbed.addFields({
      name: `🏆 Títulos Conseguidos (${newTrophies.length})`,
      value: newTrophies.map(t => `• ${t}`).join('\n')
    });
  }

  if (awards.length) {
    seasonSummaryEmbed.addFields({
      name: `🏅 Distinciones Individuales (${awards.length})`,
      value: awards.map(a => `• ${a}`).join('\n')
    });
  }

  seasonSummaryEmbed.setFooter({ text: 'Revisa las ofertas del mercado de pases abajo para continuar' });

  // Si se retiró por edad
  if (player.retired || player.age >= 42) {
    player.retired = true;
    storage.setPlayer(userId, player);
    const verdict = retirementVerdict(player);
    const retireEmbed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`👑 ¡CARRERA FINALIZADA! — ${player.name}`)
      .setDescription(
        `🏆 **Rango de Leyenda:** ${verdict.titulo}\n\n` +
        `📊 **Total Carrera:** ${player.career.apps} PJ | ${player.career.goals} Goles | ${player.career.trophies.length} Títulos\n` +
        `Fortuna final acumulada: **$${(player.bank || 0).toLocaleString('en-US')}**`
      );
    return { ok: true, ephemeral: false, embeds: [seasonSummaryEmbed, retireEmbed], components: [] };
  }

  return {
    ok: true,
    ephemeral: false,
    embeds: [seasonSummaryEmbed, offersEmbed(player)],
    components: offersRows(userId, player.offers || [])
  };
}

// ─────────────────────────────── MODO DIRECTOR TÉCNICO (DT) ───────────────────────────────

function dtSimulateStep(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes una carrera activa como Director Técnico. Usa `/dt crear [nombre] [club]` para empezar.' };
  }
  if (manager.retired) {
    return { ok: false, ephemeral: true, content: `Esta carrera de DT con **${manager.name}** ya ha finalizado por retiro. Usa \`/dt crear\` para iniciar una nueva carrera.` };
  }

  // Si ya terminó la temporada anterior y presiona seguir, avanzar a la siguiente
  if (manager.matchdayIndex >= (manager.matchdayTotal || 16)) {
    advanceDTLeague(manager);
  }

  const opponent = ensureDTFixture(manager);
  const matchSim = simulateDTMatch(manager, opponent);
  storage.setManager(userId, manager);

  const classicText = matchSim.classicData && matchSim.classicData.isClassic
    ? `🔥 **¡CLÁSICO HISTÓRICO: ${matchSim.classicData.name}!**\n*${matchSim.classicData.desc}*\n\n`
    : '';

  const leagueText = matchSim.leagueUpdate
    ? `\n\n📍 **Liga:** Fecha ${matchSim.leagueUpdate.matchdayIndex}/${matchSim.leagueUpdate.matchdayTotal} · Posición actual: **#${matchSim.leagueUpdate.position}**`
    : '';

  const seasonWrap = matchSim.leagueUpdate?.seasonEnded
    ? `\n\n🏁 **¡FINALIZÓ LA TEMPORADA!** ${matchSim.leagueUpdate.seasonTrophy ? `\n${matchSim.leagueUpdate.seasonTrophy}` : ''}\n💼 Tienes **${matchSim.leagueUpdate.offersCount} nuevas ofertas de clubes**. Usa los botones de abajo para verlas.`
    : '';

  const embed = new EmbedBuilder()
    .setColor(matchSim.result === 'V' ? 0x2ecc71 : matchSim.result === 'E' ? 0xf1c40f : 0xe74c3c)
    .setTitle(`⚽ ${manager.club} ${matchSim.myGoals} - ${matchSim.oppGoals} ${matchSim.opponentName}`)
    .setDescription(
      classicText +
      `Resultado: **${matchSim.result === 'V' ? '¡VICTORIA!' : matchSim.result === 'E' ? 'EMPATE' : 'DERROTA'}**\n\n` +
      `📋 **Crónica de Jugadas Clave:**\n` +
      matchSim.events.map(e => `• **${e.minute}'** ${e.title}\n  ${e.desc}`).join('\n\n') +
      leagueText +
      seasonWrap +
      `\n\n📊 **Confianza Directiva:** ${manager.boardConfidence}% | **Hinchada:** ${manager.fanConfidence}%`
    )
    .setFooter({ text: 'Toca "Siguiente partido" para continuar el calendario oficial' });

  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: [dtContinueRow(userId, manager)]
  };
}

function dtSimulateEntireSeason(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes una carrera activa como Director Técnico. Usa `/dt crear [nombre] [club]` para empezar.' };
  }
  if (manager.retired) {
    return { ok: false, ephemeral: true, content: `Esta carrera de DT con **${manager.name}** ya ha finalizado por retiro.` };
  }

  // Si ya estaba en final de temporada, avanzamos de temporada primero
  if (manager.matchdayIndex >= (manager.matchdayTotal || 16)) {
    advanceDTLeague(manager);
  }

  const seasonRes = simulateEntireDTSeason(manager);
  storage.setManager(userId, manager);

  const embed = new EmbedBuilder()
    .setColor(seasonRes.isChampion ? 0xf1c40f : 0x3498db)
    .setTitle(`🏆 Resumen de Temporada ${seasonRes.season} · ${manager.club}`)
    .setDescription(
      `Has disputado la temporada completa de liga como Director Técnico de **${manager.club}** (${manager.leagueName}).\n\n` +
      `🏅 **Posición Final:** **#${seasonRes.position}** de ${seasonRes.totalClubs} equipos\n` +
      (seasonRes.isChampion ? `👑 **¡CAMPEÓN DE LA LIGA!** Se añade un nuevo trofeo a tu palmarés.\n` : '') +
      `\n📊 **Rendimiento:**\n` +
      `• Partidos: **${manager.seasonStats.matches}** (V: ${manager.seasonStats.wins} · E: ${manager.seasonStats.draws} · D: ${manager.seasonStats.losses})\n` +
      `• Puntos: **${manager.seasonStats.points} pts** | DG: **${manager.seasonStats.goalsFor - manager.seasonStats.goalsAgainst}**\n` +
      `• Confianza Directiva: **${manager.boardConfidence}%** | Hinchada: **${manager.fanConfidence}%**\n` +
      `• Presupuesto actual: **$${manager.budget.toLocaleString('en-US')}**\n` +
      `\n💼 **Mercado de Contratos:** Tienes **${(seasonRes.offers || []).length} ofertas** de otros clubes para dirigirlos.`
    )
    .setFooter({ text: 'Revisa las ofertas de clubes o continúa con la próxima temporada' });

  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: [dtContinueRow(userId, manager)]
  };
}

function dtTableView(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes carrera activa como DT.' };
  }

  ensureDTFixture(manager);
  const table = dtTableSorted(manager.table || []);

  const lines = table.map((row, idx) => {
    const isMyClub = row.club === manager.club;
    const mark = isMyClub ? '👉 ' : `${idx + 1}. `;
    const clubName = isMyClub ? `**${row.club}**` : row.club;
    return `${mark}${clubName.padEnd(20)} | PJ:${row.pj} G:${row.g} E:${row.e} P:${row.p} | DG:${row.dg >= 0 ? '+' : ''}${row.dg} | **${row.pts} pts**`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x2980b9)
    .setTitle(`🏆 Tabla de Posiciones · ${manager.leagueName} (Temporada ${manager.season})`)
    .setDescription(
      `Jornada: **${manager.matchdayIndex}/${manager.matchdayTotal || 16}**\n\n` +
      `\`\`\`text\n${lines.join('\n')}\n\`\`\``
    );

  return {
    ok: true,
    ephemeral: true,
    embeds: [embed],
    components: [dtContinueRow(userId, manager)]
  };
}

function dtOffersView(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes carrera activa como DT.' };
  }

  if (!manager.jobOffers || manager.jobOffers.length === 0) {
    manager.jobOffers = generateManagerOffers(manager);
    storage.setManager(userId, manager);
  }

  const offers = manager.jobOffers;
  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(`💼 Mercado de Contratos · Ofertas para DT ${manager.name}`)
    .setDescription(
      `Tu reputación (**${manager.reputation}/99**) y palmarés llaman la atención en el mercado internacional.\n` +
      `Club actual: **${manager.club}**\n\n` +
      offers.map((o, idx) =>
        `**${idx + 1}. ${o.club}** (${o.country} · ${o.leagueName})\n` +
        `• Media del Club: ⭐ **${o.clubMedia} OVR**\n` +
        `• Presupuesto de Fichajes: 💰 **$${o.budget.toLocaleString('en-US')}**\n` +
        `• Objetivo: *${o.expectation}*\n` +
        `• *"${o.pitch}"*\n`
      ).join('\n') +
      `\n✍️ Presiona uno de los botones abajo para firmar contrato con un club o usa \`/dt aceptar [club]\`.`
    );

  const offerButtons = offers.slice(0, 4).map((o, i) =>
    new ButtonBuilder()
      .setCustomId(`dt_accept:${userId}:${i}`)
      .setLabel(`Firmar: ${o.club}`.slice(0, 80))
      .setStyle(ButtonStyle.Primary)
  );

  const buttonsRow = new ActionRowBuilder().addComponents(offerButtons);

  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: [buttonsRow, dtContinueRow(userId, manager)]
  };
}

function dtAcceptOfferAction(userId, offerIndexOrName) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes carrera activa como DT.' };
  }

  let clubName = offerIndexOrName;
  if (!isNaN(offerIndexOrName) && manager.jobOffers && manager.jobOffers[parseInt(offerIndexOrName)]) {
    clubName = manager.jobOffers[parseInt(offerIndexOrName)].club;
  }

  const result = acceptManagerJobOffer(manager, clubName);
  if (!result.ok) {
    return { ok: false, ephemeral: true, content: `❌ ${result.message}` };
  }

  storage.setManager(userId, manager);

  const embed = new EmbedBuilder()
    .setColor(0x27ae60)
    .setTitle(`🤝 ¡CONTRATO FIRMADO! BIENVENIDO A ${result.club.toUpperCase()}`)
    .setDescription(
      `**${manager.name}** ha sido presentado oficialmente como el nuevo Director Técnico de **${result.club}** (${result.league}).\n\n` +
      `💼 **Condiciones del nuevo proyecto:**\n` +
      `• Presupuesto para fichajes: 💰 **$${result.budget.toLocaleString('en-US')}**\n` +
      `• Plantel recibido: **${result.squadCount} futbolistas** listos para tu esquema táctico.\n` +
      `• Nuevo calendario de liga preparado.\n\n` +
      `¡Éxitos en tu nueva era!`
    );

  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: [dtContinueRow(userId, manager)]
  };
}

function dtPanelView(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes carrera activa como DT.' };
  }

  const metrics = calculateTeamChemistryAndRating(manager);
  const xi = manager.startingXI.map(id => manager.squad.find(p => p.id === id)).filter(Boolean);
  const currentOpp = ensureDTFixture(manager);
  const table = dtTableSorted(manager.table || []);
  const pos = table.findIndex(t => t.club === manager.club) + 1;

  const embed = new EmbedBuilder()
    .setColor(0x34495e)
    .setTitle(`👔 Despacho de ${manager.name} · ${manager.club}`)
    .setDescription(
      `**Liga:** ${manager.leagueName} · **Temporada:** ${manager.season}\n` +
      `**Posición en Tabla:** ${pos > 0 ? `**#${pos}** (${manager.seasonStats.points} pts)` : 'Por comenzar'}\n` +
      `**Próximo Rival:** ⚔️ **${currentOpp}** (Fecha ${manager.matchdayIndex + 1}/${manager.matchdayTotal || 16})\n` +
      `**Presupuesto:** 💰 $${manager.budget.toLocaleString('en-US')} · **Reputación:** ⭐ ${manager.reputation}/99\n\n` +
      `📈 **Métricas de Equipo:**\n` +
      `• Media Titular: **${metrics.avgRating}** | Química de Equipo: **${metrics.chemistry}%** 🧪\n` +
      `• Confianza Directiva: **${manager.boardConfidence}%** | Confianza Hinchada: **${manager.fanConfidence}%**\n` +
      `• Esquema Táctico: **${manager.formation}** (${manager.tacticStyle})\n` +
      `• Récord: **${manager.records.wins}V - ${manager.records.draws}E - ${manager.records.losses}D**\n` +
      (manager.jobOffers && manager.jobOffers.length ? `\n💼 **¡Tienes ${manager.jobOffers.length} ofertas de clubes para ficharte!** Usa el botón "Ofertas" para verlas.` : '') +
      `\n\n👥 **11 Titular Actual:**\n` +
      xi.map((p, idx) => `${idx + 1}. **${p.name}** (${p.position} ${p.overall}) — ${p.goals}G / ${p.assists}A`).join('\n')
    );

  return {
    ok: true,
    ephemeral: true,
    embeds: [embed],
    components: [dtContinueRow(userId, manager)]
  };
}

function dtRetireAction(userId) {
  const manager = storage.getManager(userId);
  if (!manager) {
    return { ok: false, ephemeral: true, content: 'No tienes una carrera activa como Director Técnico.' };
  }
  if (manager.retired) {
    return { ok: false, ephemeral: true, content: 'Este Director Técnico ya está retirado.' };
  }

  const verdict = retireManager(manager);
  storage.setManager(userId, manager);

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🏅 RETIRO OFICIAL DEL DIRECTOR TÉCNICO · ${manager.name}`)
    .setDescription(
      `Después de dirigir **${verdict.matches} partidos oficiales**, ${manager.name} anuncia su retiro definitivo de los banquillos.\n\n` +
      `👑 **Rango Histórico de DT:** ${verdict.emoji} **${verdict.titulo}** (Nivel ${verdict.tier})\n` +
      `Puntaje de Legado Técnico: **${verdict.score} pts**`
    )
    .addFields(
      { name: 'Partidos Dirigidos', value: `${verdict.matches}`, inline: true },
      { name: 'Efectividad', value: `${verdict.winRate}% de victorias`, inline: true },
      { name: 'Récord Histórico', value: `${verdict.wins}V - ${verdict.draws}E - ${verdict.losses}D`, inline: true },
      { name: 'Títulos Conseguidos', value: `${verdict.trophiesCount}`, inline: true },
      { name: 'Reputación Final', value: `⭐ ${verdict.reputation}/99`, inline: true },
      { name: 'Clubes Dirigidos', value: verdict.clubsManaged.join(', ') || manager.club, inline: true }
    )
    .setFooter({ text: 'Tu carrera de DT ha concluido. Puedes iniciar una nueva carrera con /crear-jugador o /dt crear' });

  if (verdict.trophies.length > 0) {
    embed.addFields({
      name: '🏆 Vitrina de Trofeos',
      value: verdict.trophies.map(t => `• ${t}`).join('\n').slice(0, 1000)
    });
  }

  return {
    ok: true,
    ephemeral: false,
    embeds: [embed],
    components: []
  };
}

module.exports = {
  simulateStep,
  simulateEntireSeason,
  resolveTactic,
  resolveMinigameChoice,
  resolveShootoutKick,
  resolveMomento,
  resolveCareerEvent,
  performTransfer,
  offersView,
  profileView,
  attributesView,
  tableView,
  shopView,
  buyItemAction,
  trainView,
  trainSkillAction,
  awardsView,
  continueRow,
  shootoutRow,
  shootoutEmbed,
  offersRows,
  offersEmbed,
  flagFor,
  cupNameFor,
  // DT methods
  dtContinueRow,
  dtSimulateStep,
  dtSimulateEntireSeason,
  dtTableView,
  dtOffersView,
  dtPanelView,
  dtRetireAction,
  dtAcceptOfferAction,
  // 15 Deep Systems
  injuryView,
  injuryTreatAction,
  economyView,
  reputationView,
  timelineView,
  nationalTeamView,
  socialFeedView,
  newsFeedView,
  academyView,
  worldRankingView,
  hallOfFameView
};
