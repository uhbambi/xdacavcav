'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { getHeadToHeadStats, detectRivalryStatus } = require('../utils/rivalries.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rivalidades')
    .setDescription('Consulta rivalidades activas y el historial Head-to-Head entre jugadores del servidor'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const player = storage.getPlayer(userId);

    if (!player) {
      return interaction.reply({
        content: 'No tienes un jugador activo. Usa `/crear-jugador` para empezar.',
        ephemeral: true
      });
    }

    const allPlayers = Object.entries(storage.loadAll());
    const rivals = [];

    for (const [otherId, other] of allPlayers) {
      if (otherId === userId || other.retired) continue;
      const status = detectRivalryStatus(player, other);
      if (status.level > 0) {
        rivals.push({
          name: other.name,
          club: other.club,
          overall: other.overall,
          text: status.text,
          h2h: getHeadToHeadStats(player, otherId)
        });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`⚔️ Rivalidades de ${player.name} · ${player.club}`)
      .setDescription(
        rivals.length
          ? `Se detectaron **${rivals.length} rivalidades directas** en tu entorno:\n\n` +
            rivals.map(r => {
              const h2hText = r.h2h
                ? `   📊 H2H: ${r.h2h.wins}V - ${r.h2h.draws}E - ${r.h2h.losses}D (Dif: ${r.h2h.goalDiff > 0 ? '+' : ''}${r.h2h.goalDiff})`
                : '   📊 Sin enfrentamientos directos aún.';
              return `• **${r.name}** (${r.club} - ${r.overall} OVR)\n  ${r.text}\n${h2hText}`;
            }).join('\n\n')
          : 'No hay jugadores rivales en tu misma liga o club por el momento. ¡Invita a amigos al servidor para competir directamente!'
      );

    return interaction.reply({ embeds: [embed] });
  }
};
