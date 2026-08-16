'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const storage = require('../data/storage.js');
const {
  newManager, FORMATIONS, TACTICAL_STYLES, CHARLAS_VESTUARIO,
  simulateDTMatch, calculateTeamChemistryAndRating, ensureDTFixture,
  dtTableSorted, generateManagerOffers, acceptManagerJobOffer
} = require('../utils/manager.js');
const engine = require('../game/engine.js');
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
        .setName('simular-temporada')
        .setDescription('Simular una temporada completa de liga en Modo DT')
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
    )
    .addSubcommand(sub =>
      sub
        .setName('retirar')
        .setDescription('Concluye tu carrera como Director Técnico y recibe tu veredicto histórico')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'crear') {
      const name = interaction.options.getString('nombre');
      const clubName = interaction.options.getString('club');

      const existingPlayer = storage.getPlayer(userId);
      if (existingPlayer && !existingPlayer.retired) {
        return interaction.reply({
          content: `⚠️ Ya tienes una carrera activa como **Futbolista** con **${existingPlayer.name}** (${existingPlayer.club}).\nNo puedes ser Jugador y DT al mismo tiempo.\nDebes retirarte con \`/retirar\` o realizar la transición a DT antes de iniciar como Director Técnico.`,
          ephemeral: true
        });
      }

      const existing = storage.getManager(userId);
      if (existing && !existing.retired) {
        return interaction.reply({
          content: `Ya tienes una carrera activa como DT en **${existing.club}**. Usa \`/dt panel\` para gestionarla o \`/dt retirar\` para concluir tu ciclo.`,
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
        .setFooter({ text: 'Toca el botón abajo para jugar tu primer partido de liga.' });

      return interaction.reply({ embeds: [embed], components: [engine.dtContinueRow(userId, manager)] });
    }

    if (sub === 'simular') {
      const res = engine.dtSimulateStep(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'simular-temporada') {
      const res = engine.dtSimulateEntireSeason(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'panel') {
      const res = engine.dtPanelView(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'tabla') {
      const res = engine.dtTableView(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'ofertas') {
      const res = engine.dtOffersView(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'aceptar') {
      const clubQuery = interaction.options.getString('club');
      const res = engine.dtAcceptOfferAction(userId, clubQuery);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }

    if (sub === 'retirar') {
      const res = engine.dtRetireAction(userId);
      return interaction.reply({
        content: res.content,
        embeds: res.embeds,
        components: res.components,
        ephemeral: res.ephemeral
      });
    }
  }
};

