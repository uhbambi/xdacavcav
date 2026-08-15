'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Explica como funciona el bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle('⚽ El Idolo Copero — Como jugar')
      .setDescription(
        '**/crear-jugador** — crea tu jugador (nombre, posicion, nacionalidad entre 24 paises). Arrancas en la segunda division de tu pais, en un club chico.\n\n' +
        '**/simular** — juega tu proximo partido de liga, copa o Mundial, con eventos minuto a minuto.\n\n' +
        '**/tabla** — tabla de tu liga, o la tabla del grupo si estas en copa o Mundial.\n\n' +
        '**/perfil** — tus stats, tu club, tus atributos y tu vitrina de titulos.\n\n' +
        '**/atributos** — tus atributos tipo FIFA: ritmo, tiro, pase, regate, defensa y fisico.\n\n' +
        '**/transferir** — al terminar la temporada, revisa tus ofertas y elige nuevo club (o quedate con `club:quedarme`).\n\n' +
        '**/retirar** — termina tu carrera y recibe tu veredicto final: desde "Nombre Olvidado" hasta "Leyenda Absoluta".\n\n' +
        '⚡ **Atributos**: tu media sale de tus 6 atributos ponderados por tu puesto, y suben según como rindas cada temporada.\n' +
        '🎮 **Minijuegos**: en los partidos importantes se frena el partido y te salen 3 botones (penal, mano a mano, tiro libre, centro, cabezazo o atajada). Solo uno termina en gol.\n' +
        '🚑 **Lesiones y 🟥 Sanciones**: si te lesionas o te expulsan con tarjeta roja, tu equipo juega las fechas sin vos mientras cumples la recuperación o suspensión.\n' +
        '🏆 **Copas Nacionales**: cada temporada tu club disputa la Copa Nacional de su país (Copa Chile, Copa Argentina, Copa del Rey, FA Cup, Copa do Brasil, etc.) en eliminación directa.\n' +
        '🌎 **Copas Continentales**: según tu posición en liga clasificas a Copa Libertadores / Copa Sudamericana (CONMEBOL), UEFA Champions League / Europa League / Conference League (UEFA), Concachampions o AFC Champions League.\n' +
        '⬆️⬇️ **Ascensos y descensos**: 1° o 2° en la B te suben; los últimos de primera descienden a la B.\n' +
        '🌍 **Mundial**: cada 4 temporadas, si tu media alcanza, te convocan a tu selección nacional.'
      );
    await interaction.reply({ embeds: [embed] });
  }
};
