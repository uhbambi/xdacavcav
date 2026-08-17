'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historial')
    .setDescription('Consulta el historial detallado de tu carrera temporada a temporada'),

  async execute(interaction) {
    const view = engine.timelineView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
