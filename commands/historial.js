'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('historial')
    .setDescription('Consulta el historial detallado de tu carrera temporada a temporada'),

  async execute(interaction) {
    const view = engine.timelineView(interaction.user.id);
    const payload = {
      content: view.content || undefined,
      embeds: view.embeds || [],
      components: view.components || [],
      ephemeral: Boolean(view.ephemeral)
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
};
