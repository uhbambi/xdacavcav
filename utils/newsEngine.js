'use strict';

const { pick, rand } = require('./simulation.js');
const { formatMoney } = require('./economy.js');

/**
 * Genera una noticia principal destacada basada íntimamente en el rendimiento
 */
function generateNewsHeadline(player, context = {}) {
  const { eventType = 'match', extra = {}, matchResult = {} } = context;

  const goals = matchResult.playerGoals ?? matchResult.goals ?? 0;
  const assists = matchResult.playerAssists ?? matchResult.assists ?? 0;
  const rating = typeof matchResult.rating === 'number' ? matchResult.rating : 6.5;
  const won = matchResult.result === 'V' || matchResult.won === true;
  const lost = matchResult.result === 'D' || matchResult.lost === true;
  const red = Boolean(matchResult.red);
  const cleanSheet = Boolean(matchResult.cleanSheet);
  const isClassic = Boolean(matchResult.isClassic);
  const opponent = matchResult.opponent || matchResult.rival || 'Rival';

  // 1. EVENTOS INSTITUCIONALES / GLOBALES
  if (eventType === 'transfer') {
    const fee = extra.fee || (player.marketValue || 5000000);
    return {
      title: `🚨 ¡BOMBAZO EN EL MERCADO! ${player.name.toUpperCase()} FIRMA POR ${extra.newClub || player.club}`,
      tag: 'MERCADO DE PASES',
      body: `Tras intensas semanas de negociaciones, se hace oficial el traspaso por una cifra récord de **${formatMoney(fee)}**. El astro asumirá de inmediato como referente del proyecto deportivo de ${extra.newClub || player.club}.`,
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

  if (eventType === 'trophy_won') {
    return {
      title: `🏆 ¡CAMPEONES! ${player.club.toUpperCase()} Y ${player.name.toUpperCase()} LEVANTAN LA COPA`,
      tag: 'VUELTA OLÍMPICA',
      body: `Gritos de gloria y llanto de emoción. Tras una campaña implacable, el plantel celebró con su gente un título que quedará grabado en la historia dorada de la institución.`,
      source: 'Cadena Deportiva Nacional'
    };
  }

  if (eventType === 'injury_severe' || (player.injury && player.injury.type === 'GRAVE')) {
    return {
      title: `🏥 ALERTA EN ${player.club.toUpperCase()}: ${player.name.toUpperCase()} SUFRE DURA LESIÓN`,
      tag: 'PARTE MÉDICO OFICIAL',
      body: `Los estudios médicos confirmaron una baja de ${player.injuredMatches || extra.matches || 6} partidos. El cuerpo técnico evalúa alternativas tácticas mientras el jugador inicia fisioterapia.`,
      source: 'Sanitas & Clínica Deportiva'
    };
  }

  // 2. RENDIMIENTO EN EL PARTIDO

  // CASO A: EXPULSIÓN (TARJETA ROJA)
  if (red) {
    return {
      title: `🟥 EXPULSIÓN Y POLÉMICA: ${player.name.toUpperCase()} DEJÓ A ${player.club.toUpperCase()} CON DIEZ`,
      tag: 'INCIDENCIA DISCIPLINARIA',
      body: `Una infracción a destiempo le costó la tarjeta roja directa a ${player.name} ante ${opponent}. El tribunal de disciplina ya evalúa las fechas de sanción correspondientes.`,
      source: 'Tribunal de Disciplina & Prensa'
    };
  }

  // CASO B: MASTERCLASS HISTÓRICA (Rating >= 9.0 o Hat-Trick)
  if (rating >= 9.0 || goals >= 3) {
    return {
      title: `🔥 ¡EXHIBICIÓN MONUMENTAL! CÁTEDRA DE ${player.name.toUpperCase()} ANTE ${opponent.toUpperCase()}`,
      tag: 'JUGADOR DE CLASE MUNDIAL',
      body: `Una de las noches más memorables de la temporada. Con ${goals > 0 ? `${goals} goles y ` : ''}una nota de ${rating.toFixed(1)}, ${player.name} destrozó tácticamente a la defensa rival en un recital inolvidable.`,
      source: 'L\'Équipe & Prensa Internacional'
    };
  }

  // CASO C: SUPERCLÁSICO GANADO CON GOL
  if (isClassic && (won || goals >= 1)) {
    return {
      title: `🔥 CLÁSICO CONSAGRATORIO: ${player.name.toUpperCase()} DESATA LA LOCURA EN ${player.club.toUpperCase()}`,
      tag: 'HÉROE DEL SUPERCLÁSICO',
      body: `En el partido que paraliza a todo el país, ${player.name} se vistió de héroe, silenciando al rival y regalándole a su hinchada una fiesta que durará toda la semana.`,
      source: 'Diario Crónica del Deporte'
    };
  }

  // CASO D: PARTIDAZO / MVP (Rating 8.0 - 8.9 o Doblete)
  if (rating >= 8.0 || goals >= 2) {
    return {
      title: `⭐ RECITAL OFENSIVO: ${player.name.toUpperCase()} BRUSTICA EL TRIUNFO DE ${player.club.toUpperCase()}`,
      tag: 'FIGURA ESTELAR DE LA FECHA',
      body: `Con una actuación descollante (calificación ${rating.toFixed(1)}), ${player.name} fue el motor imparable de su equipo frente a ${opponent}, confirmando su momento estelar.`,
      source: 'Diario MARCA / Olé'
    };
  }

  // CASO E: PORTERO CON VALLA INVICTA
  if (player.position === 'POR' && cleanSheet && rating >= 7.2) {
    return {
      title: `🧤 CERROJO BAJO LOS TRES PALOS: ${player.name.toUpperCase()} SALVA A ${player.club.toUpperCase()}`,
      tag: 'MURALLA EN EL ARCO',
      body: `Con intervenciones milagrosas y un temple de acero, ${player.name} mantuvo su valla invicta y frustró todas las llegadas peligrosas de ${opponent}.`,
      source: 'Revista Arqueros del Mundo'
    };
  }

  // CASO F: BUEN RENDIMIENTO (Rating 7.0 - 7.9 o Gol importante)
  if (rating >= 7.0 || goals === 1) {
    return {
      title: `📈 EFICACIA Y SOLIDEZ: ${player.name.toUpperCase()} CUMPLE Y GUÍA A ${player.club.toUpperCase()}`,
      tag: 'ANÁLISIS DE LA JORNADA',
      body: `Rendimiento de alto nivel y regularidad. ${player.name} fue clave para manejar los tiempos del mediocampo y ataque ante la marca pegajosa de ${opponent}.`,
      source: 'Mundo Fútbol Digital'
    };
  }

  // CASO G: PARTIDO REGULAR (Rating 6.0 - 6.9)
  if (rating >= 6.0) {
    return {
      title: `⚖️ DUELO TRABADO: ${player.name.toUpperCase()} Y ${player.club.toUpperCase()} LUCHAN ANTE ${opponent.toUpperCase()}`,
      tag: 'CRÓNICA TÁCTICA',
      body: `Un partido muy físico con pocos espacios. ${player.name} colaboró en la contención y circulación, aunque le costó encontrar profundidad ante el cerrojo rival.`,
      source: 'Revista Táctica Global'
    };
  }

  // CASO H: PARTIDO FLOJO / CRÍTICAS (Rating < 6.0)
  return {
    title: `📉 BAJO LA LUPA: CRÍTICAS A ${player.name.toUpperCase()} TRAS UNA JORNADA PARA EL OLVIDO`,
    tag: 'DEBATE Y POLÉMICA',
    body: `Lejos de su mejor versión futbolística. ${player.name} lució impreciso y desconectado en el duelo ante ${opponent}, abriendo el debate sobre su titularidad en los paneles deportivos.`,
    source: 'Cadena Deportiva de Debate'
  };
}

/**
 * Genera un feed completo de noticias deportivas formateado y adaptado al rendimiento
 */
function generateNewsFeed(player, context = {}) {
  const headline = generateNewsHeadline(player, context);
  const matchResult = context.matchResult || {};
  const rating = typeof matchResult.rating === 'number' ? matchResult.rating : 6.5;
  const goals = matchResult.playerGoals ?? matchResult.goals ?? 0;

  let marketTrend = `Cotización de ${player.name} se sitúa en **${formatMoney(player.marketValue || 1000000)}**.`;
  if (rating >= 8.5 || goals >= 2) {
    marketTrend = `Tras su brillante partido, la cotización de ${player.name} se dispara a **${formatMoney(player.marketValue || 1000000)}** con interés desde las principales ligas de Europa.`;
  } else if (rating < 5.8) {
    marketTrend = `Prensa deportiva analiza si el bache de rendimiento afectará las futuras negociaciones de mercado.`;
  }

  const secondary = [
    `• **Mercado:** ${marketTrend}`,
    `• **Vestuario:** Moral del plantel de ${player.club} en **${player.morale || 75}%** tras la jornada oficial.`,
    `• **Internacional:** Ojeadores internacionales actualizan sus informes de scouting semana a semana.`
  ];

  const fullText =
    `📰 **[${headline.tag}]**\n` +
    `### ${headline.title}\n\n` +
    `> ${headline.body}\n\n` +
    `*Fuente: ${headline.source}*\n\n` +
    `───────────────\n` +
    `**BREVES DE LA PRENSA:**\n` +
    secondary.join('\n');

  return fullText;
}

/**
 * Formatea el feed de noticias
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
