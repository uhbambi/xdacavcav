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
        '⚡ **Atributos**: tu media sale de tus 6 atributos ponderados por tu puesto, y suben segun como rindas cada temporada.\n' +
        '🎮 **Minijuegos**: en los partidos importantes se frena el partido y te salen 3 botones (penal, mano a mano, tiro libre, centro, cabezazo o atajada). Solo uno termina en gol.\n' +
        '🚑 **Lesiones**: si te lesionas, tu equipo igual juega esas fechas sin vos y la liga avanza.\n' +
        '🌎 **Copas**: si sales top 4 de primera division, jugas la Libertadores/Champions/Concachampions **desde la fase de grupos**, y despues octavos, cuartos, semi y final.\n' +
        '⬆️⬇️ **Ascensos y descensos**: 1° o 2° en la B te suben; ultimos dos de primera se van a la B.\n' +
        '🌍 **Mundial**: cada 4 temporadas, si tu media alcanza, te convocan a tu seleccion.'
      );
    await interaction.reply({ embeds: [embed] });
  }
};
