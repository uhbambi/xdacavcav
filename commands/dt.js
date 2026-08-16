'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const {
  newManager, FORMATIONS, TACTICAL_STYLES, CHARLAS_VESTUARIO,
  simulateDTMatch, calculateTeamChemistryAndRating, ensureDTFixture,
  dtTableSorted, generateManagerOffers, acceptManagerJobOffer
} = require('../utils/manager.js');
const { findClub, getAllClubs, getLeague, FLAGS } = require('../data/clubs.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dt')
    .setDescription('Modo Director Técnico: Gestiona tu club, tácticas, alineaciones y partidos.')
    .addSubcommand(sub =>
      sub
        .setName('crear')
        .setDescription('Comienza tu carrera como Director Técnico')
        .addStringOption(opt => opt.setName('nombre').setDescription('Tu nombre de DT').setRequired(true))
        .addStringOption(opt => opt.setName('club').setDescription('Nombre del club que vas a dirigir').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('panel')
        .setDescription('Ver el estado actual de tu equipo, confianza de la directiva y finanzas')
    )
    .addSubcommand(sub =>
      sub
        .setName('simular')
        .setDescription('Simular el próximo partido oficial de liga según el calendario')
    )
    .addSubcommand(sub =>
      sub
        .setName('tabla')
        .setDescription('Ver la tabla de posiciones de tu liga en Modo DT')
    )
    .addSubcommand(sub =>
      sub
        .setName('ofertas')
        .setDescription('Ver qué clubes quieren ficharte como su nuevo Director Técnico')
    )
    .addSubcommand(sub =>
      sub
        .setName('aceptar')
        .setDescription('Firmar contrato con un nuevo club que te ha hecho una oferta')
        .addStringOption(opt => opt.setName('club').setDescription('Nombre del club de la oferta').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'crear') {
      const name = interaction.options.getString('nombre');
      const clubName = interaction.options.getString('club');
      const existing = storage.getManager(userId);

      if (existing) {
        return interaction.reply({
          content: `Ya tienes una carrera activa como DT en **${existing.club}**. Usa \`/dt panel\` para gestionarla.`,
          ephemeral: true
        });
      }

      const manager = newManager({
        name,
        clubName,
        userId
      });

      ensureDTFixture(manager);
      storage.setManager(userId, manager);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`👔 ¡NUEVO DIRECTOR TÉCNICO EN ${manager.club.toUpperCase()}!`)
        .setDescription(
          `**${manager.name}** asume el mando en **${manager.club}** (${manager.leagueName}).\n\n` +
          `📊 **Datos Iniciales:**\n` +
          `• Reputación: **${manager.reputation}/99** · Formación: **${manager.formation}**\n` +
          `• Plantel: **${manager.squad.length} jugadores**\n` +
          `• Presupuesto de fichajes: **$${manager.budget.toLocaleString('en-US')}**\n` +
          `• Confianza de la Directiva: **${manager.boardConfidence}%**\n\n` +
          `🎯 **Objetivos de la temporada:**\n` +
          manager.seasonObjectives.map(o => `• ${o.title} (${o.target})`).join('\n')
        )
        .setFooter({ text: 'Usa /dt panel para ver tu 11 titular o /dt simular para jugar el fixture.' });

      return interaction.reply({ embeds: [embed] });
    }

    const manager = storage.getManager(userId);
    if (!manager) {
      return interaction.reply({
        content: 'No tienes una carrera activa como Director Técnico. Usa `/dt crear [nombre] [club]` para empezar.',
        ephemeral: true
      });
    }

    if (sub === 'panel') {
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
          (manager.jobOffers && manager.jobOffers.length ? `\n💼 **¡Tienes ${manager.jobOffers.length} ofertas de clubes para ficharte!** Usa \`/dt ofertas\` para verlas.` : '') +
          `\n\n👥 **11 Titular Actual:**\n` +
          xi.map((p, idx) => `${idx + 1}. **${p.name}** (${p.position} ${p.overall}) — ${p.goals}G / ${p.assists}A`).join('\n')
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'tabla') {
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
        )
        .setFooter({ text: 'Avanza en la tabla ganando partidos con /dt simular' });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'ofertas') {
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
          `Los siguientes clubes quieren contratarte:\n\n` +
          offers.map((o, idx) =>
            `**${idx + 1}. ${o.club}** (${o.country} · ${o.leagueName})\n` +
            `• Media del Club: ⭐ **${o.clubMedia} OVR**\n` +
            `• Presupuesto de Fichajes: 💰 **$${o.budget.toLocaleString('en-US')}**\n` +
            `• Objetivo: *${o.expectation}*\n` +
            `• *"${o.pitch}"*\n`
          ).join('\n') +
          `\n✍️ Para firmar con un club usa: \`/dt aceptar [club]\``
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'aceptar') {
      const clubQuery = interaction.options.getString('club');
      const result = acceptManagerJobOffer(manager, clubQuery);

      if (!result.ok) {
        return interaction.reply({
          content: `❌ ${result.message}`,
          ephemeral: true
        });
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
          `¡Éxitos en tu nueva era! Usa \`/dt panel\` para revisar a tus nuevos futbolistas.`
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'simular') {
      // Obtener el próximo rival oficial del calendario rotatorio sin repeticiones
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
        ? `\n\n🏁 **¡FINALIZÓ LA TEMPORADA!** ${matchSim.leagueUpdate.seasonTrophy ? `\n${matchSim.leagueUpdate.seasonTrophy}` : ''}\n💼 Tienes **${matchSim.leagueUpdate.offersCount} nuevas ofertas de clubes**. Usa \`/dt ofertas\` para verlas.`
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
          `\n\n📊 **Confianza de la Directiva:** ${manager.boardConfidence}% | **Hinchada:** ${manager.fanConfidence}%`
        );

      return interaction.reply({ embeds: [embed] });
    }
  }
};
