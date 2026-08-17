'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('records')
    .setDescription('Consulta los récords históricos mundiales: goles, asistencias, títulos, OVR y longevidad'),

  async execute(interaction) {
    const view = engine.recordsView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: Boolean(view.ephemeral)
    });
  }
};
