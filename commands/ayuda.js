'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Explica cómo funciona el juego y todos sus comandos'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle('⚽ El Ídolo Copero — Guía de Comandos y Sistemas')
      .setDescription(
        '**⚡ COMANDOS PRINCIPALES DE CARRERA:**\n' +
        '• `/crear-jugador` — Crea tu futbolista (17 años, ascenso) con personalidad procedimental única.\n' +
        '• `/simular` — Juega tu próximo partido con tácticas, minijuegos, lesiones y eventos.\n' +
        '• `/simular-temporada` — Simula una temporada completa rápida con progresión y premios.\n' +
        '• `/perfil` — Ficha completa con media, potencial, economía, personalidad y lesiones.\n' +
        '• `/entrenar` — Sesión semanal de entrenamiento focalizado en atributos específicos.\n' +
        '• `/transferir` — Ficha por un nuevo club o renueva contrato en el mercado de pases.\n\n' +
        '**🔥 NUEVOS SISTEMAS DE SIMULACIÓN PROFUNDA:**\n' +
        '• `/lesion` — 🩺 Departamento médico, nivel de riesgo, diagnósticos y tratamientos (Fisio/Clínica).\n' +
        '• `/economia` — 💰 Sueldo semanal, valor de mercado, cláusula de rescisión, bonos y agente.\n' +
        '• `/reputacion` — ⭐ Reputación (deportiva), popularidad (comercial), prestigio y personalidad.\n' +
        '• `/historial` — 📜 Timeline histórico completo de tu carrera año por año.\n' +
        '• `/seleccion` — 🇨🇱 Estado de convocatoria nacional y Ranking FIFA mundial.\n' +
        '• `/redes` — 📱 Feed social con reacciones de hinchas, memes y tendencias.\n' +
        '• `/noticias` — 📰 Portadas y crónicas de la prensa deportiva especializada.\n' +
        '• `/cantera` — 🌱 Divisiones inferiores del club con scouting de jóvenes promesas.\n' +
        '• `/ranking` — 🌍 Rankings mundiales (Top OVR, Mayor Valor, Wonderkids Sub-21, Chilenos).\n' +
        '• `/salon-fama` — 🏛️ Salón de la Fama con las máximas leyendas inmortalizadas.\n' +
        '• `/tienda` — 🛒 Compra mansiones, fisios VIP, chefs, superagentes e inmuebles.\n' +
        '• `/premios` — 🏅 Balón de Oro, The Best, Golden Boy, Trofeo Yashin, Botas de Oro.\n' +
        '• `/votar-ballon-dor` — 🗳️ Gala comunitaria de votación del Balón de Oro.\n' +
        '• `/clasicos` / `/rivalidades` — ⚔️ Clásicos históricos y duelos directos con otros jugadores.\n\n' +
        '**👔 MODO DIRECTOR TÉCNICO (DT):**\n' +
        '• `/dt` — Crea tu carrera de DT (`/dt crear`), plantilla (`/dt panel`), partidos (`/dt simular`).\n' +
        '• `/alineacion` — Ajusta el esquema táctico (4-3-3, 4-4-2, 3-5-2, etc.) y química de equipo.\n' +
        '• `/retirar` — Cuelga los botines a los 42 años o voluntariamente y conságrate en la historia.'
      );
    await interaction.reply({ embeds: [embed] });
  }
};

