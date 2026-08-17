'use strict';

const { pick, rand } = require('./simulation.js');
const { formatMoney } = require('./economy.js');

/**
 * Genera noticias dinámicas del mundo futbolístico
 */
function generateNewsHeadline(player, context = {}) {
  const { eventType = 'match', extra = {} } = context;

  if (eventType === 'transfer') {
    const fee = extra.fee || (player.marketValue || 5000000);
    return {
      title: `🚨 ¡BOMBAZO EN EL MERCADO! ${player.name} FIRMA POR ${extra.newClub || player.club}`,
      tag: 'MERCADO DE PASES',
      body: `Tras intensas semanas de negociaciones, se hace oficial el traspaso por una cifra cercana a los **${formatMoney(fee)}**. El jugador asumirá como pieza clave del nuevo proyecto deportivo.`,
      source: 'Diario Deportivo Internacional'
    };
  }

  if (eventType === 'ballon_dor') {
    return {
      title: `🌟 ¡REY DEL FÚTBOL MUNDIAL! ${player.name.toUpperCase()} GANA EL BALÓN DE ORO`,
      tag: 'GALA DEL BALÓN DE ORO (PARÍS)',
      body: `En una noche inolvidable en París, el astro de ${player.club} levantó el galardón dorado tras una temporada de ensueño repleta de goles, títulos y magia futbolística.`,
      source: 'France Football / FIFA Press'
    };
  }

  if (eventType === 'injury_severe') {
    return {
      title: `🏥 ALERTA ROJA EN ${player.club.toUpperCase()}: ${player.name.toUpperCase()} SUFRE GRAVE LESIÓN`,
      tag: 'PARTE MÉDICO OFICIAL',
      body: `Los estudios confirmaron una baja de ${extra.matches || 12} partidos por lesión. El cuerpo médico evalúa opciones quirúrgicas y fisioterapia intensiva para acelerar los plazos.`,
      source: 'Sanitas & Clínica Deportiva'
    };
  }

  if (eventType === 'derby_win') {
    return {
      title: `🔥 LOCURA TOTAL: ${player.club.toUpperCase()} SE QUEDA CON EL SUPERCLÁSICO CON ACTUACIÓN DE ${player.name}`,
      tag: 'FIESTA EN EL ESTADIO',
      body: `El clásico más esperado del año fue una fiesta para los hinchas locales. La figura del encuentro sentenció el marcador y desató el delirio en las tribunas.`,
      source: 'Radio Deportes en Vivo'
    };
  }

  if (eventType === 'trophy_won') {
    return {
      title: `🏆 ¡CAMPEONES! ${player.club.toUpperCase()} Y ${player.name} LEVANTAN LA COPA`,
      tag: 'VUELTA OLÍMPICA',
      body: `Gritos de gloria y llanto de emoción. Tras un torneo implacable, el plantel celebró con su gente un título que quedará grabado en la historia dorada de la institución.`,
      source: 'Cadena Deportiva Nacional'
    };
  }

  // Noticia regular de rendimiento
  const regularNews = [
    {
      title: `📈 ${player.name} DESPIERTA EL INTERÉS DE GRANDES SCOUTS INTERNACIONALES`,
      tag: 'INFORMES DE OJEADORES',
      body: `Varios emisores europeos estuvieron presentes en el estadio tomando apuntes sobre el rendimiento del talentoso futbolista de ${player.club}.`,
      source: 'Mundo Fútbol Scouts'
    },
    {
      title: `💬 CONFERENCIA: EL DT ELOGIA EL COMPROMISO Y LA CONDICIÓN FÍSICA DE ${player.name}`,
      tag: 'DECLARACIONES EN SALA DE PRENSA',
      body: `"Es un profesional intachable que contagia al grupo en cada entrenamiento y en cada pelota dividida", aseguró el entrenador en rueda de prensa.`,
      source: 'Diario Crónica del Deporte'
    }
  ];

  return pick(regularNews);
}

module.exports = {
  generateNewsHeadline
};
