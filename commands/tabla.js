'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tabla')
    .setDescription('Muestra la tabla de posiciones de tu liga esta temporada'),

  async execute(interaction) {
    const view = engine.tableView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
