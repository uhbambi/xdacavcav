'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cantera')
    .setDescription('Explora las divisiones inferiores de tu club y sus jóvenes promesas'),

  async execute(interaction) {
    const view = engine.academyView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
