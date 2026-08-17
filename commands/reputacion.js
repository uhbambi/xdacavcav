'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reputacion')
    .setDescription('Consulta tu reputación deportiva, popularidad mediática, prestigio y personalidad'),

  async execute(interaction) {
    const view = engine.reputationView(interaction.user.id);
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
