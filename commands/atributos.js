'use strict';

const { SlashCommandBuilder } = require('discord.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('atributos')
    .setDescription('Mira tus atributos tipo FIFA (ritmo, tiro, pase, regate, defensa, fisico)'),

  async execute(interaction) {
    const result = engine.attributesView(interaction.user.id);
    await interaction.reply({
      content: result.content ?? '',
      embeds: result.embeds ?? [],
      components: result.components ?? [],
      ephemeral: !result.ok
    });
  }
};
