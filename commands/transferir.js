'use strict';

const { SlashCommandBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const engine = require('../game/engine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transferir')
    .setDescription('Revisa tus ofertas o elige nuevo club en el mercado de pases')
    .addStringOption(opt =>
      opt.setName('club').setDescription('Nombre exacto del club, o "quedarme" (deja vacio para ver botones)').setRequired(false)
    ),

  async execute(interaction) {
    const player = storage.getPlayer(interaction.user.id);
    if (!player) {
      await interaction.reply({ content: 'Todavia no tenis jugador. Usa `/crear-jugador` para empezar.', ephemeral: true });
      return;
    }
    if (player.stage !== 'entretemporada') {
      await interaction.reply({ content: 'Solo podis transferirte durante el mercado de pases (al terminar una temporada).', ephemeral: true });
      return;
    }

    const chosen = interaction.options.getString('club');

    if (!chosen) {
      const view = engine.offersView(interaction.user.id);
      await interaction.reply({ content: view.content, embeds: view.embeds, components: view.components, ephemeral: view.ephemeral });
      return;
    }

    let choice;
    if (chosen.toLowerCase() === 'quedarme' || chosen.toLowerCase() === player.club.toLowerCase()) {
      choice = 'stay';
    } else {
      const idx = (player.offers || []).findIndex(o => o.toLowerCase() === chosen.toLowerCase());
      if (idx === -1) {
        await interaction.reply({ content: `No tenis ninguna oferta de **${chosen}** esta ventana. Usa \`/transferir\` sin opciones para ver botones.`, ephemeral: true });
        return;
      }
      choice = idx;
    }

    const result = engine.performTransfer(interaction.user.id, choice);
    await interaction.reply({
      content: result.content,
      embeds: result.embeds,
      components: result.components,
      ephemeral: result.ephemeral
    });
  }
};
