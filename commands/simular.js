'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simular')
    .setDescription('Simula el proximo partido, ronda de copa, o avanza tu carrera'),

  async execute(interaction) {
    const result = engine.simulateStep(interaction.user.id);
    await interaction.reply({
      content: result.content,
      embeds: result.embeds,
      components: result.components,
      ephemeral: result.ephemeral
    });
  }
};
