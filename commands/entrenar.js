'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('entrenar')
    .setDescription('Realiza una sesión de entrenamiento individual para mejorar tus habilidades'),

  async execute(interaction) {
    const view = engine.trainView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
