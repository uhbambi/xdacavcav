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
        .setName('simular-partido')
        .setDescription('Simular el próximo partido oficial de liga en Modo DT')
    )
    .addSubcommand(sub =>
      sub
        .setName('partido')
        .setDescription('Simular el próximo partido oficial de liga en Modo DT')
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
        .setName('plantilla')
        .setDescription('Ver todos los jugadores de tu plantel, titulares y suplentes')
    )
    .addSubcommand(sub =>
      sub
        .setName('alinear')
        .setDescription('El cuerpo técnico optimiza automáticamente el mejor 11 titular')
    )
    .addSubcommand(sub =>
      sub
        .setName('tactica')
        .setDescription('Cambiar tu formación y estilo táctico de juego')
        .addStringOption(opt => opt.setName('formacion').setDescription('Ej: 4-3-3, 4-4-2, 3-5-2, 5-3-2').setRequired(false))
        .addStringOption(opt => opt.setName('estilo').setDescription('Ej: ofensivo, tiki-taka, contraataque, autobus, equilibrado').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('charla')
        .setDescription('Dar una charla motivacional o de vestuario al plantel')
        .addStringOption(opt => opt.setName('tipo').setDescription('motivacion, furia, concentracion, calma, gloria').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('fichar')
        .setDescription('Explorar el mercado de fichajes o contratar un jugador')
        .addIntegerOption(opt => opt.setName('numero').setDescription('Número del jugador a fichar').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('cantera')
        .setDescription('Promover a una joven joya de las divisiones inferiores al primer equipo')
    )
    .addSubcommand(sub =>
      sub
        .setName('copas')
        .setDescription('Ver el estado de tu club en Copa Libertadores, Champions o Copa Nacional')
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
          `• Presupuesto de fichajes: **${manager.budget.toLocaleString('en-US')}**\n` +
          `• Confianza de la Directiva: **${manager.boardConfidence}%**\n\n` +
          `🎯 **Objetivos de la temporada:**\n` +
          manager.seasonObjectives.map(o => `• ${o.title} (${o.target})`).join('\n')
        )
        .setFooter({ text: 'Toca el botón abajo para jugar tu primer partido de liga.' });

      return interaction.reply({ embeds: [embed], components: [engine.dtContinueRow(userId, manager)] });
    }

    const sendSafeReply = async (res) => {
      const payload = {};
      if (res.content) payload.content = res.content;
      if (res.embeds && res.embeds.length > 0) payload.embeds = res.embeds;
      if (res.components && res.components.length > 0) payload.components = res.components;
      if (res.ephemeral) payload.ephemeral = true;
      if (!payload.content && (!payload.embeds || payload.embeds.length === 0)) {
        payload.content = 'Comando ejecutado.';
      }
      return interaction.reply(payload);
    };

    if (sub === 'simular' || sub === 'simular-partido' || sub === 'partido') {
      const res = engine.dtSimulateStep(userId);
      return sendSafeReply(res);
    }

    if (sub === 'simular-temporada') {
      const res = engine.dtSimulateEntireSeason(userId);
      return sendSafeReply(res);
    }

    if (sub === 'panel') {
      const res = engine.dtPanelView(userId);
      return sendSafeReply(res);
    }

    if (sub === 'plantilla') {
      const res = engine.dtSquadView(userId);
      return sendSafeReply(res);
    }

    if (sub === 'alinear') {
      const res = engine.dtAutoLineupAction(userId);
      return sendSafeReply(res);
    }

    if (sub === 'tactica') {
      const formation = interaction.options.getString('formacion');
      const style = interaction.options.getString('estilo');
      const res = engine.dtTacticView(userId, formation, style);
      return sendSafeReply(res);
    }

    if (sub === 'charla') {
      const tipo = interaction.options.getString('tipo');
      const res = engine.dtTeamTalkView(userId, tipo);
      return sendSafeReply(res);
    }

    if (sub === 'fichar') {
      const num = interaction.options.getInteger('numero');
      const res = engine.dtTransfersView(userId, num ? num - 1 : null);
      return sendSafeReply(res);
    }

    if (sub === 'cantera') {
      const res = engine.dtYouthAcademyView(userId, true);
      return sendSafeReply(res);
    }

    if (sub === 'copas') {
      const res = engine.dtCupsView(userId);
      return sendSafeReply(res);
    }

    if (sub === 'tabla') {
      const res = engine.dtTableView(userId);
      return sendSafeReply(res);
    }

    if (sub === 'ofertas') {
      const res = engine.dtOffersView(userId);
      return sendSafeReply(res);
    }

    if (sub === 'aceptar') {
      const clubQuery = interaction.options.getString('club');
      const res = engine.dtAcceptOfferAction(userId, clubQuery);
      return sendSafeReply(res);
    }

    if (sub === 'retirar') {
      const res = engine.dtRetireAction(userId);
      return sendSafeReply(res);
    }

    // Fallback garantizado para evitar timeouts
    const fallbackRes = engine.dtPanelView(userId);
    return sendSafeReply(fallbackRes);
  }
};

