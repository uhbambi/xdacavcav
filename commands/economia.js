'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economia')
    .setDescription('Consulta tu sueldo semanal, valor de mercado, cláusula de rescisión y patrimonio'),

  async execute(interaction) {
    const view = engine.economyView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
