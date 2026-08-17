'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vitrina')
    .setDescription('Mira tu vitrina de trofeos: títulos colectivos y premios individuales de tu carrera'),

  async execute(interaction) {
    const view = engine.vitrinaView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: !view.ok
    });
  }
};
