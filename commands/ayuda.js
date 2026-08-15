'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Explica cómo funciona el juego y todos sus comandos'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle('⚽ El Ídolo Copero — Guía y Comandos')
      .setDescription(
        '**/crear-jugador** — Crea tu jugador eligiendo nombre, posición (DEL, MC, DEF, POR) y país. Arrancas a los 17 años en el ascenso.\n\n' +
        '**/simular** — Juega tu próximo partido con tácticas, minijuegos y decisiones interactivas.\n\n' +
        '**/entrenar** — Sesión de entrenamiento semanal para subir atributos clave (Ritmo, Tiro, Pase, Regate, Defensa, Físico).\n\n' +
        '**/tienda** — Compra mansiones deportivas, preparadores VIP, chefs, superagentes y negocios con tus sueldos acumulados.\n\n' +
        '**/premios** — Revisa tu vitrina de títulos y distinciones individuales (Balón de Oro, The Best, Golden Boy, Trofeo Yashin, etc.).\n\n' +
        '**/perfil** — Ficha completa con finanzas, propiedades, atributos y estadísticas de temporada y carrera.\n\n' +
        '**/atributos** — Detalle de atributos estilo FIFA/EA FC.\n\n' +
        '**/tabla** — Tabla de posiciones de liga o fase de grupos de torneos.\n\n' +
        '**/transferir** — Elige tu nuevo club o renueva contrato en el mercado de entretemporada.\n\n' +
        '**/retirar** — Cuelga los botines voluntariamente (edad máxima: 41-42 años) y recibe tu veredicto de leyenda.\n\n' +
        '🧤 **Porteros Decisivos**: Los arqueros tienen atajadas clave en minijuegos y tanda de penales, y premian vallas invictas.\n' +
        '🏆 **Torneos de Selecciones**: Ciclo alternado de Copa del Mundo (cada 4 años) y Torneo Continental (Copa América, Eurocopa, Copa Asiática, Copa Oro, Copa África).\n' +
        '🌎 **Copas Continentales de Clubes**: Libertadores, Sudamericana, Champions League, Europa League, Conference League y Concachampions.'
      );
    await interaction.reply({ embeds: [embed] });
  }
};


