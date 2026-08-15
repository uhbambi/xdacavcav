'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { retirementVerdict } = require('../utils/player.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirar')
    .setDescription('Termina la carrera de tu jugador y recibe tu veredicto final'),

  async execute(interaction) {
    const player = storage.getPlayer(interaction.user.id);
    if (!player) {
      await interaction.reply({ content: 'Todavia no tenis jugador.', ephemeral: true });
      return;
    }
    if (player.retired) {
      await interaction.reply({ content: 'Este jugador ya esta retirado.', ephemeral: true });
      return;
    }

    const verdict = retirementVerdict(player);
    player.retired = true;
    storage.setPlayer(interaction.user.id, player);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`🏅 Se retira ${player.name}`)
      .setDescription(`Despues de ${player.career.apps} partidos, cuelga los botines.`)
      .addFields(
        { name: 'Veredicto', value: `**${verdict.titulo}**` },
        { name: 'Goles en carrera', value: `${verdict.goals}`, inline: true },
        { name: 'Asistencias en carrera', value: `${verdict.assists}`, inline: true },
        { name: 'Partidos jugados', value: `${verdict.apps}`, inline: true },
        { name: 'Titulos', value: `${verdict.trophies}`, inline: true },
        { name: 'Puntaje de carrera', value: `${verdict.score}`, inline: true }
      )
      .setFooter({ text: 'Usa /crear-jugador para empezar una nueva carrera' });

    if (player.career.trophies.length) {
      embed.addFields({ name: 'Vitrina', value: player.career.trophies.map(t => `🏆 ${t}`).join('\n').slice(0, 1000) });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
