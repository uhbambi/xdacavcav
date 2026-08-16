'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const storage = require('../data/storage.js');
const { FORMATIONS, TACTICAL_STYLES, calculateTeamChemistryAndRating } = require('../utils/manager.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alineacion')
    .setDescription('Modifica el esquema táctico y la formación de tu equipo en Modo DT')
    .addStringOption(opt =>
      opt
        .setName('esquema')
        .setDescription('Elige la formación táctica')
        .setRequired(true)
        .addChoices(
          { name: '4-3-3 Ofensivo (Extremos y Posesión)', value: '4-3-3' },
          { name: '4-4-2 Clásico Equilibrado', value: '4-4-2' },
          { name: '4-2-3-1 Control y Enganche', value: '4-2-3-1' },
          { name: '3-5-2 Presión y Dominio Medular', value: '3-5-2' },
          { name: '5-3-2 Catenaccio y Contraataque', value: '5-3-2' },
          { name: '3-4-3 Ataque Total', value: '3-4-3' }
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const manager = storage.getManager(userId);

    if (!manager) {
      return interaction.reply({
        content: 'Solo disponible para Directores Técnicos. Usa `/dt crear` para empezar tu carrera de DT.',
        ephemeral: true
      });
    }

    const formationChoice = interaction.options.getString('esquema');
    manager.formation = formationChoice;
    storage.setManager(userId, manager);

    const metrics = calculateTeamChemistryAndRating(manager);
    const formDef = FORMATIONS[formationChoice];

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📋 Pizarra Táctica Actualizada · ${manager.club}`)
      .setDescription(
        `Has cambiado la formación a **${formDef.name}**.\n\n` +
        `📊 **Impacto Táctico:**\n` +
        `• Química de Plantel: **${metrics.chemistry}%**\n` +
        `• Media Efectiva del 11: **${metrics.effectiveRating}**\n` +
        `• Bonificaciones: Ataque x${formDef.bonus.attack || 1.0} | Defensa x${formDef.bonus.defense || 1.0} | Posesión x${formDef.bonus.possession || 1.0}\n\n` +
        `Posiciones en campo: ${formDef.slots.map(s => `\`${s.label}\``).join(' · ')}`
      );

    return interaction.reply({ embeds: [embed] });
  }
};
