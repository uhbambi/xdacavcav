'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('estadio')
    .setDescription('Consulta el estadio de tu club: nombre real, capacidad, ciudad, asistencia y taquilla'),

  async execute(interaction) {
    const view = engine.stadiumView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: Boolean(view.ephemeral)
    });
  }
};
