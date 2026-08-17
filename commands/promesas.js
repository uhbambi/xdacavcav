'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promesas')
    .setDescription('Mira las nuevas promesas y wonderkids del mundo: la generación de futbolistas NPC'),

  async execute(interaction) {
    const view = engine.wonderkidsView(interaction.user.id);
    await interaction.reply({
      content: view.content ?? '',
      embeds: view.embeds ?? [],
      components: view.components ?? [],
      ephemeral: Boolean(view.ephemeral)
    });
  }
};
