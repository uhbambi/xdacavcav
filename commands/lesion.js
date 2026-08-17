'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lesion')
    .setDescription('Consulta tu estado médico, lesiones activas y opciones de fisioterapia'),

  async execute(interaction) {
    const view = engine.injuryView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
