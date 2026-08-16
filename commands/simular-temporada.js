'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simular-temporada')
    .setDescription('Simula una temporada completa de tu carrera de forma rapida y realista'),

  async execute(interaction) {
    const result = engine.simulateEntireSeason(interaction.user.id);
    await interaction.reply({
      content: result.content,
      embeds: result.embeds,
      components: result.components,
      ephemeral: result.ephemeral
    });
  }
};
