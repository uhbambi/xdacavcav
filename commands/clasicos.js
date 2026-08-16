'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { getAllClassics, getClubRivalries, getClassicData } = require('../utils/classics.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clasicos')
    .setDescription('Consulta clásicos históricos, derbis y rivalidades del fútbol en el juego')
    .addStringOption(option =>
      option
        .setName('club')
        .setDescription('Nombre del club para ver sus clásicos (o déjalo vacío para ver los de tu club)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('pais')
        .setDescription('Filtrar clásicos por país (Chile, Argentina, Brasil, España, Inglaterra, etc.)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const player = storage.getPlayer(userId);
    const clubInput = interaction.options.getString('club');
    const paisInput = interaction.options.getString('pais');

    const targetClub = clubInput || (player ? player.club : null);

    if (targetClub && !paisInput) {
      const rivals = getClubRivalries(targetClub);
      if (!rivals.length) {
        return interaction.reply({
          content: `No se encontraron clásicos específicos para **${targetClub}**. Sin embargo, todos los partidos contra clubes de la misma liga cuentan con bonos dinámicos de rivalidad.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`⚔️ Clásicos y Derbis de ${targetClub}`)
        .setDescription(
          `**${rivals.length} clásicos históricos registrados:**\n\n` +
          rivals.map(r => {
            const fire = '🔥'.repeat(r.intensity || 4);
            return `• **${r.name}** vs **${r.rivalName}** (${fire})\n  _${r.desc}_\n  *Cántico: "${r.chant}"*\n  🎁 **Bonus:** +${Math.round(r.ratingBonus * 100)}% rating · +${Math.round((r.salaryBonus - 1) * 100)}% sueldo · +${r.moraleWinBonus} moral`;
          }).join('\n\n')
        )
        .setFooter({ text: 'Los clásicos garantizan minijuego y aumentan el valor de la victoria.' });

      return interaction.reply({ embeds: [embed] });
    }

    // Listado por país o generales
    const classics = getAllClassics({ country: paisInput, limit: 12 });
    const title = paisInput ? `🏟️ Clásicos de Fútbol en ${paisInput}` : '🏟️ Grandes Clásicos & Derbis del Juego';

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(title)
      .setDescription(
        `Mostrando **${classics.length}** de las miles de rivalidades disponibles en el simulador:\n\n` +
        classics.map(c => {
          return `• **${c.name}**\n  ⚔️ **${c.home}** vs **${c.away}** (${c.country})\n  _${c.desc}_`;
        }).join('\n\n')
      )
      .setFooter({ text: 'Usa /clasicos club:NombreClub para consultar los rivales de tu equipo.' });

    return interaction.reply({ embeds: [embed] });
  }
};
