'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redes')
    .setDescription('Consulta el feed de redes sociales con opiniones de hinchas y memes'),

  async execute(interaction) {
    const view = engine.socialFeedView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
