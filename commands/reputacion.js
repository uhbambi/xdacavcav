'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reputacion')
    .setDescription('Consulta tu reputación deportiva, popularidad mediática, prestigio y personalidad'),

  async execute(interaction) {
    const view = engine.reputationView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
