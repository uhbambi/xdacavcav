'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const storage = require('../data/storage.js');
const { newPlayer } = require('../utils/player.js');
const { POSITIONS } = require('../utils/simulation.js');
const { FLAGS } = require('../data/clubs.js');
const { describeAttributes } = require('../utils/attributes.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-jugador')
    .setDescription('Crea tu jugador y empieza tu carrera de idolo copero')
    .addStringOption(opt =>
      opt.setName('nombre').setDescription('Nombre de tu jugador').setRequired(true).setMaxLength(24)
    )
    .addStringOption(opt =>
      opt.setName('posicion').setDescription('Posicion en la cancha').setRequired(true)
        .addChoices(
          { name: 'Delantero', value: 'DEL' },
          { name: 'Mediocampista', value: 'MED' },
          { name: 'Defensa', value: 'DEF' },
          { name: 'Portero', value: 'POR' }
        )
    )
    .addStringOption(opt =>
      opt.setName('nacionalidad').setDescription('Pais de origen (arrancas en un club chico de ahi)').setRequired(true)
        .addChoices(
          { name: '🇨🇱 Chile', value: 'CHILE' },
          { name: '🇦🇷 Argentina', value: 'ARGENTINA' },
          { name: '🇧🇷 Brasil', value: 'BRASIL' },
          { name: '🇲🇽 Mexico', value: 'MEXICO' },
          { name: '🇺🇾 Uruguay', value: 'URUGUAY' },
          { name: '🇨🇴 Colombia', value: 'COLOMBIA' },
          { name: '🇵🇪 Peru', value: 'PERU' },
          { name: '🇪🇨 Ecuador', value: 'ECUADOR' },
          { name: '🇵🇾 Paraguay', value: 'PARAGUAY' },
          { name: '🇧🇴 Bolivia', value: 'BOLIVIA' },
          { name: '🇻🇪 Venezuela', value: 'VENEZUELA' },
          { name: '🇺🇸 Estados Unidos', value: 'USA' },
          { name: '🇪🇸 Espana', value: 'ESPANA' },
          { name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', value: 'INGLATERRA' },
          { name: '🇮🇹 Italia', value: 'ITALIA' },
          { name: '🇩🇪 Alemania', value: 'ALEMANIA' },
          { name: '🇫🇷 Francia', value: 'FRANCIA' },
          { name: '🇵🇹 Portugal', value: 'PORTUGAL' },
          { name: '🇳🇱 Paises Bajos', value: 'HOLANDA' },
          { name: '🇹🇷 Turquia', value: 'TURQUIA' },
          { name: '🇧🇪 Belgica', value: 'BELGICA' },
          { name: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', value: 'ESCOCIA' },
          { name: '🇬🇷 Grecia', value: 'GRECIA' },
          { name: '🇸🇦 Arabia Saudita', value: 'ARABIA' }
        )
    ),

  async execute(interaction) {
    const existing = storage.getPlayer(interaction.user.id);
    if (existing && !existing.retired) {
      await interaction.reply({
        content: `Ya tienes una carrera activa como futbolista con **${existing.name}** (${existing.club}). Usa \`/retirar\` si quieres terminarla y empezar otra.`,
        ephemeral: true
      });
      return;
    }

    const existingManager = storage.getManager(interaction.user.id);
    if (existingManager && !existingManager.retired) {
      await interaction.reply({
        content: `⚠️ Ya tienes una carrera activa como **Director Técnico** en **${existingManager.club}**.\nNo puedes ser Jugador y DT al mismo tiempo.\nDebes retirarte como DT usando \`/dt retirar\` antes de crear una carrera como futbolista.`,
        ephemeral: true
      });
      return;
    }

    const name = interaction.options.getString('nombre');
    const position = interaction.options.getString('posicion');
    const nationalityLeagueKey = interaction.options.getString('nacionalidad');

    const player = newPlayer({ name, position, nationalityLeagueKey });
    storage.setPlayer(interaction.user.id, player);

    const flag = FLAGS[player.nationality] || '';

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`⚽ ${player.name} empieza su carrera`)
      .setDescription(`Arrancai en **${player.club}** (${player.leagueName}), a puro esfuerzo pa' llegar a ser idolo copero.`)
      .addFields(
        { name: 'Posicion', value: POSITIONS[position].label, inline: true },
        { name: 'Edad', value: `${player.age}`, inline: true },
        { name: 'Overall', value: `${player.overall}`, inline: true },
        { name: 'Potencial', value: '???', inline: true },
        { name: 'Club', value: player.club, inline: true },
        { name: 'Nacionalidad', value: `${flag} ${player.nationality}`, inline: true },
        { name: '⚡ Atributos', value: describeAttributes(player.attributes) }
      )
      .setFooter({ text: 'Toca el boton para jugar tu primer partido' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`sim:${interaction.user.id}`)
        .setLabel('▶️ Simular primer partido')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
