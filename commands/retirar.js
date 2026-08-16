'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { retirementVerdict } = require('../utils/player.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirar')
    .setDescription('Termina la carrera de tu jugador o DT y recibe tu veredicto final'),

  async execute(interaction) {
    const player = storage.getPlayer(interaction.user.id);
    const manager = storage.getManager(interaction.user.id);

    if (!player || player.retired) {
      if (manager && !manager.retired) {
        const res = engine.dtRetireAction(interaction.user.id);
        return interaction.reply({
          content: res.content,
          embeds: res.embeds,
          components: res.components,
          ephemeral: res.ephemeral
        });
      }
      await interaction.reply({ content: 'No tienes una carrera activa de futbolista ni de Director Técnico para retirar.', ephemeral: true });
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
