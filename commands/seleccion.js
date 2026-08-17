'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seleccion')
    .setDescription('Consulta tu estado de convocatoria internacional y el Ranking FIFA mundial'),

  async execute(interaction) {
    const view = engine.nationalTeamView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
