'use strict';

const { pick, rand } = require('./simulation.js');
const { formatMoney } = require('./economy.js');

/**
 * Genera una noticia principal destacada
 */
function generateNewsHeadline(player, context = {}) {
  const { eventType = 'match', extra = {}, matchResult = {} } = context;

  if (eventType === 'transfer') {
    const fee = extra.fee || (player.marketValue || 5000000);
    return {
      title: `🚨 ¡BOMBAZO EN EL MERCADO! ${player.name.toUpperCase()} FIRMA POR ${extra.newClub || player.club}`,
      tag: 'MERCADO DE PASES',
      body: `Tras intensas semanas de negociaciones, se hace oficial el traspaso por una cifra récord de **${formatMoney(fee)}**. El astro asumirá de inmediato como referente del proyecto deportivo.`,
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

  if (eventType === 'injury_severe' || (player.injury && player.injury.type === 'GRAVE')) {
    return {
      title: `🏥 ALERTA EN ${player.club.toUpperCase()}: ${player.name.toUpperCase()} SUFRE LESIÓN`,
      tag: 'PARTE MÉDICO OFICIAL',
      body: `Los estudios médicos confirmaron una baja de ${player.injuredMatches || extra.matches || 6} partidos. El cuerpo técnico evalúa alternativas tácticas mientras el jugador inicia fisioterapia.`,
      source: 'Sanitas & Clínica Deportiva'
    };
  }

  if (eventType === 'derby_win' || (matchResult && matchResult.isClassic && matchResult.result === 'V')) {
    return {
      title: `🔥 LOCURA TOTAL: ${player.club.toUpperCase()} SE QUEDA CON EL SUPERCLÁSICO`,
      tag: 'FIESTA EN EL ESTADIO',
      body: `El clásico más esperado del año fue una fiesta total. ${player.name} comandó el planteo ofensivo y desató el delirio de la hinchada en las gradas.`,
      source: 'Radio Deportes en Vivo'
    };
  }

  if (eventType === 'trophy_won') {
    return {
      title: `🏆 ¡CAMPEONES! ${player.club.toUpperCase()} Y ${player.name.toUpperCase()} LEVANTAN LA COPA`,
      tag: 'VUELTA OLÍMPICA',
      body: `Gritos de gloria y llanto de emoción. Tras una campaña implacable, el plantel celebró con su gente un título que quedará grabado en la historia dorada de la institución.`,
      source: 'Cadena Deportiva Nacional'
    };
  }

  // Noticia regular de rendimiento
  const regularNews = [
    {
      title: `📈 ${player.name.toUpperCase()} DESPIERTA EL INTERÉS DE SCOUTS INTERNACIONALES`,
      tag: 'INFORMES DE OJEADORES',
      body: `Varios emisores europeos estuvieron presentes en el estadio tomando apuntes sobre el rendimiento del talentoso futbolista de ${player.club}.`,
      source: 'Mundo Fútbol Scouts'
    },
    {
      title: `💬 CONFERENCIA: EL DT ELOGIA EL COMPROMISO DE ${player.name.toUpperCase()}`,
      tag: 'DECLARACIONES EN SALA DE PRENSA',
      body: `"Es un profesional intachable que contagia al grupo en cada entrenamiento y en cada pelota dividida", aseguró el entrenador en rueda de prensa.`,
      source: 'Diario Crónica del Deporte'
    },
    {
      title: `📊 ANÁLISIS TÁCTICO: EL IMPACTO DE ${player.name.toUpperCase()} EN EL ESQUEMA DE ${player.club.toUpperCase()}`,
      tag: 'COLUMNA DE OPINIÓN',
      body: `El despliegue físico y la visión de juego siguen siendo el termómetro del equipo esta temporada.`,
      source: 'Revista Táctica Global'
    }
  ];

  return pick(regularNews);
}

/**
 * Genera un feed completo de noticias deportivas formateado
 */
function generateNewsFeed(player, context = {}) {
  const headline = generateNewsHeadline(player, context);
  const secondary = [
    `• **Mercado:** Cotización de ${player.name} asciende a **${formatMoney(player.marketValue || 1000000)}** tras sus últimas actuaciones.`,
    `• **Vestuario:** El plantel de ${player.club} prepara el próximo desafío con moral al ${player.morale || 75}%.`,
    `• **Internacional:** Ojeadores destacan la proyección y atributos de las jóvenes promesas en la liga.`
  ];

  const fullText =
    `📰 **[${headline.tag}]**\n` +
    `### ${headline.title}\n\n` +
    `> ${headline.body}\n\n` +
    `*Fuente: ${headline.source}*\n\n` +
    `───────────────\n` +
    `**BREVES DEL DÍA:**\n` +
    secondary.join('\n');

  return fullText;
}

/**
 * Formatea el feed de noticias si fuera necesario
 */
function formatNewsFeedEmbed(news) {
  if (typeof news === 'string') return news;
  if (news && news.title && news.body) {
    return `### ${news.title}\n\n> ${news.body}\n\n*Fuente: ${news.source || 'Prensa Oficial'}*`;
  }
  return '📰 *No hay noticias recientes en la prensa deportiva.*';
}

module.exports = {
  generateNewsHeadline,
  generateNewsFeed,
  formatNewsFeedEmbed
};
