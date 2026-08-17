'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hinchada')
    .setDescription('Mira tu relación con la hinchada: ídolo, amado, cuestionado o silbado'),

  async execute(interaction) {
    const view = engine.fansView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: Boolean(view.ephemeral)
    });
  }
};
