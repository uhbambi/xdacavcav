'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('salon-fama')
    .setDescription('Consulta el Salón de la Fama con las máximas leyendas inmortalizadas'),

  async execute(interaction) {
    const view = engine.hallOfFameView(interaction.user.id);
    await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
  }
};
