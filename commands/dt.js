'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { newManager, FORMATIONS, TACTICAL_STYLES, CHARLAS_VESTUARIO, simulateDTMatch, calculateTeamChemistryAndRating } = require('../utils/manager.js');
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
        .setDescription('Simular el próximo partido como Director Técnico')
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
          `🎯 **Objetivo de la temporada:**\n` +
          manager.seasonObjectives.map(o => `• ${o.title} (${o.target})`).join('\n')
        )
        .setFooter({ text: 'Usa /dt panel para ver tu 11 titular o /dt simular para jugar.' });

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

      const embed = new EmbedBuilder()
        .setColor(0x34495e)
        .setTitle(`👔 Despacho de ${manager.name} · ${manager.club}`)
        .setDescription(
          `**Liga:** ${manager.leagueName} · **Temporada:** ${manager.season}\n` +
          `**Presupuesto:** 💰 $${manager.budget.toLocaleString('en-US')} · **Reputación:** ⭐ ${manager.reputation}/99\n\n` +
          `📈 **Métricas de Equipo:**\n` +
          `• Media Titular: **${metrics.avgRating}** | Química de Equipo: **${metrics.chemistry}%** 🧪\n` +
          `• Confianza Directiva: **${manager.boardConfidence}%** | Confianza Hinchada: **${manager.fanConfidence}%**\n` +
          `• Esquema Táctico: **${manager.formation}** (${manager.tacticStyle})\n` +
          `• Récord: **${manager.records.wins}V - ${manager.records.draws}E - ${manager.records.losses}D**\n\n` +
          `👥 **11 Titular Actual:**\n` +
          xi.map((p, idx) => `${idx + 1}. **${p.name}** (${p.position} ${p.overall}) — ${p.goals}G / ${p.assists}A`).join('\n')
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'simular') {
      // Obtener rival ficticio o de fixture
      const allClubs = getAllClubs().filter(c => c.leagueKey === manager.leagueKey && c.name !== manager.club);
      const opponent = allClubs.length ? allClubs[Math.floor(Math.random() * allClubs.length)].name : 'Rival de Liga';

      const matchSim = simulateDTMatch(manager, opponent);
      storage.setManager(userId, manager);

      const embed = new EmbedBuilder()
        .setColor(matchSim.result === 'V' ? 0x2ecc71 : matchSim.result === 'E' ? 0xf1c40f : 0xe74c3c)
        .setTitle(`⚽ ${manager.club} ${matchSim.myGoals} - ${matchSim.oppGoals} ${matchSim.opponentName}`)
        .setDescription(
          `Resultado: **${matchSim.result === 'V' ? '¡VICTORIA!' : matchSim.result === 'E' ? 'EMPATE' : 'DERROTA'}**\n\n` +
          `📋 **Crónica de Jugadas Clave:**\n` +
          matchSim.events.map(e => `• **${e.minute}'** ${e.title}\n  ${e.desc}`).join('\n\n') +
          `\n\n📊 **Confianza de la Directiva:** ${manager.boardConfidence}%`
        );

      return interaction.reply({ embeds: [embed] });
    }
  }
};
