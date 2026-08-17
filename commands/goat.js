'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goat')
    .setDescription('Consulta el ranking GOAT: el índice histórico de los mejores futbolistas de todos los tiempos'),

  async execute(interaction) {
    const view = engine.goatView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: Boolean(view.ephemeral)
    });
  }
};
