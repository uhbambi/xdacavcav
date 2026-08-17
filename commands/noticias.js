'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('noticias')
    .setDescription('Consulta las portadas y crónicas de la prensa deportiva'),

  async execute(interaction) {
    const view = engine.newsFeedView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
