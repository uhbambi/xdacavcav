'use strict';

const { pick } = require('./simulation.js');

const PERSONALITY_TRAITS = {
  AMBICIOSO: {
    key: 'AMBICIOSO',
    name: 'Ambicioso 🏆',
    emoji: '🔥',
    description: 'Hambre insaciable de gloria. Sueña con Balones de Oro y trofeos en los clubes más grandes del mundo.',
    transferPreference: 'Clubes gigantes y ligas top europeas',
    crunchBonus: 1.10,
    quote: '"Si no viniste a ser el número uno del mundo, estás en el deporte equivocado."'
  },
  LEAL: {
    key: 'LEAL',
    name: 'Leal / Amor a la Camiseta ❤️',
    emoji: '🛡️',
    description: 'Prioriza el cariño de la hinchada, la estabilidad y convertirse en ídolo de un solo club.',
    transferPreference: 'Quedarse en su club y renovar contratos',
    crunchBonus: 1.05,
    quote: '"El dinero va y viene, pero el amor de esta hinchada es para toda la vida."'
  },
  MERCENARIO: {
    key: 'MERCENARIO',
    name: 'Económico / Hombre de Negocios 💰',
    emoji: '💵',
    description: 'Prioriza los contratos millonarios, primas de fichaje y ofertas de Arabia Saudita o la Premier.',
    transferPreference: 'El club que ponga más ceros sobre la mesa',
    crunchBonus: 1.00,
    quote: '"El fútbol dura 15 años. Hay que asegurar el futuro de varias generaciones."'
  },
  FRIO: {
    key: 'FRIO',
    name: 'Frío / Imperturbable 🧊',
    emoji: '🎯',
    description: 'Mente quirúrgica. La presión de 80.000 hinchas no le afecta; infalible desde los 12 pasos.',
    transferPreference: 'Proyectos deportivos serios y estructurados',
    crunchBonus: 1.20,
    quote: '"En la cancha no hay emociones, sólo jugadas y decisiones correctas."'
  },
  CONFIADO: {
    key: 'CONFIADO',
    name: 'Líder Carismático 😎',
    emoji: '⚡',
    description: 'Pecho inflado y sangre caliente. Se agiganta en clásicos y enciende al público.',
    transferPreference: 'Donde sea la máxima estrella indiscutible',
    crunchBonus: 1.15,
    quote: '"Denme la pelota a mí en el minuto 90 y festejen."'
  },
  HIPERCOMPETITIVO: {
    key: 'HIPERCOMPETITIVO',
    name: 'Hipercompetitivo 😤',
    emoji: '💢',
    description: 'Odia perder hasta en los entrenamientos. Si va al banco exige explicaciones al DT.',
    transferPreference: 'Equipos ganadores y exigentes',
    crunchBonus: 1.12,
    quote: '"El segundo lugar es el primero de los perdedores."'
  },
  SHOWMAN: {
    key: 'SHOWMAN',
    name: 'Mediático / Showman 🎭',
    emoji: '📸',
    description: 'Amante de las cámaras, el regate de lujo, los peinados icónicos y los millones en redes sociales.',
    transferPreference: 'Capitales mundiales con exposición de prensa',
    crunchBonus: 1.05,
    quote: '"El fútbol también es espectáculo y magia."'
  }
};

/**
 * Asigna o normaliza la personalidad del jugador
 */
function normalizePersonality(player) {
  if (!player.personality || !PERSONALITY_TRAITS[player.personality.key]) {
    const keys = Object.keys(PERSONALITY_TRAITS);
    const chosenKey = pick(keys);
    player.personality = PERSONALITY_TRAITS[chosenKey];
  }
  return player.personality;
}

/**
 * Obtiene una reacción verbal del jugador basada en su personalidad
 */
function getPersonalityQuote(player, situation = 'post_match') {
  const p = normalizePersonality(player);
  return p.quote;
}

module.exports = {
  PERSONALITY_TRAITS,
  normalizePersonality,
  getPersonalityQuote
};
