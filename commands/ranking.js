'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Consulta los rankings mundiales de jugadores')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Categoría del ranking mundial')
        .setRequired(false)
        .addChoices(
          { name: '👑 Mejor Media (OVR)', value: 'overall' },
          { name: '💰 Mayor Valor de Mercado', value: 'value' },
          { name: '👶 Wonderkids (Sub-21)', value: 'wonderkids' },
          { name: '🇨🇱 Jugadores Chilenos', value: 'chile' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('categoria') || 'overall';
    const view = engine.worldRankingView(interaction.user.id, category);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
