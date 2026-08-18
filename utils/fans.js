'use strict';

const { rand } = require('./simulation.js');
const { getStadium } = require('./stadium.js');

/**
 * Relación del jugador con la hinchada de su club (0-100).
 * Sube con goles, triunfos y gestos; baja con derrotas, malas declaraciones
 * y —sobre todo— con goleadas en contra: ahí la tribuna se mete al campo.
 */

const FAN_TIERS = [
  { min: 92, title: 'Ídolo Eterno', emoji: '👑' },
  { min: 80, title: 'Ídolo', emoji: '🔥' },
  { min: 65, title: 'Muy Querido', emoji: '❤️' },
  { min: 50, title: 'Respetado', emoji: '👍' },
  { min: 35, title: 'Cuestionado', emoji: '😐' },
  { min: 20, title: 'Silbado', emoji: '😡' },
  { min: 0, title: 'En Ruptura', emoji: '💔' }
];

const GOLEADA_THRESHOLD = 3;

function normalizeFanRelation(player) {
  if (typeof player.fanRelation !== 'number') {
    player.fanRelation = Math.max(30, Math.min(85, Math.round((player.morale || 70) * 0.7)));
  }
  player.fanRelation = Math.max(0, Math.min(100, player.fanRelation));
  if (!Array.isArray(player.fanEvents)) player.fanEvents = [];
  return player.fanRelation;
}

function fanTier(score) {
  const s = Math.max(0, Math.min(100, score));
  return FAN_TIERS.find(t => s >= t.min) || FAN_TIERS[FAN_TIERS.length - 1];
}

function fanBar(score) {
  const filled = Math.max(0, Math.min(20, Math.round(score / 5)));
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

function goalDiff(context = {}) {
  const my = Number(context.myGoals);
  const opp = Number(context.oppGoals);
  if (!Number.isFinite(my) || !Number.isFinite(opp)) return 0;
  return opp - my;
}

function isGoleadaEnContra(context = {}) {
  return context.result === 'D' && goalDiff(context) >= GOLEADA_THRESHOLD;
}

/** Extra de bronca por goleada (se suma al -5 de una derrota normal). */
function goleadaPenalty(diff, isClassic) {
  let extra = 0;
  if (diff >= 5) extra = 12;
  else if (diff >= 4) extra = 9;
  else if (diff >= 3) extra = 6;
  if (isClassic && extra) extra += 4;
  return extra;
}

/** Actualiza la relación con la hinchada después de un partido. */
function recordFanMatch(player, result, context = {}) {
  normalizeFanRelation(player);
  const { goals = 0, isClassic = false, isFinal = false, motm = false } = context;
  const diff = goalDiff({ ...context, result });

  let delta = 0;
  if (result === 'V') delta += 4;
  else if (result === 'E') delta += 0;
  else delta -= 5;

  delta += Math.min(3, goals * 1);
  if (motm) delta += 2;
  if (isClassic) delta += result === 'V' ? 4 : result === 'D' ? -4 : 0;
  if (isFinal && result === 'V') delta += 5;

  if (result === 'D') delta -= goleadaPenalty(diff, isClassic);

  player.fanRelation = Math.max(0, Math.min(100, player.fanRelation + delta));
  return player.fanRelation;
}

function rememberFanEvent(player, entry) {
  if (!player) return;
  if (!Array.isArray(player.fanEvents)) player.fanEvents = [];
  player.fanEvents.unshift({
    ...entry,
    season: player.season || 1
  });
  player.fanEvents = player.fanEvents.slice(0, 8);
}

/**
 * Disturbio de hinchada tras una goleada en contra.
 * Siempre dispara si te golean por 3 o más.
 */
function goleadaRiotText(player, context = {}) {
  const myGoals = Number(context.myGoals) || 0;
  const oppGoals = Number(context.oppGoals) || 0;
  const club = (player && player.club) || context.club || 'el club';
  const stadium = getStadium(club);
  const venue = stadium.name;
  const city = stadium.city ? ` de ${stadium.city}` : '';
  const score = `${myGoals}-${oppGoals}`;
  const name = (player && player.name) || 'el plantel';

  const texts = [
    `🚨 **¡INVASIÓN DE CANCHA EN ${venue.toUpperCase()}!** Tras el **${score}**, la hinchada saltó al césped${city} y persiguió a los jugadores hasta el túnel. **${name}** salió corriendo al vestuario escoltado por la policía.`,
    `🍾 **Lluvia de objetos en ${venue}:** botellas, piedras y butacas volaron hacia la cancha después del **${score}**. El árbitro suspendió el epílogo y armó un cordón para sacarlos vivos.`,
    `🔥 **La hinchada se metió al estadio a cazar al plantel.** Tras la goleada **${score}**, rompieron el perímetro de ${venue}, persiguieron a los jugadores por la mixtura y le pegaron a la puerta del vestuario.`,
    `🪑 **Butacazo en ${venue}:** la popular destrozó su sector y tiró sillas al campo. Un grupo esperó el micro afuera gritando el nombre de **${name}** después del **${score}**.`,
    `🧨 **Bengalas y caza al plantel:** al pitazo final del **${score}** la barra cruzó el alambrado de ${venue}, corrió a los jugadores y les tiró de todo. El cuerpo técnico se encerró en el vestuario.`,
    `🚌 **Emboscada al micro:** la hinchada de ${club} rodeó la salida de ${venue} después del **${score}**. Piedrazos al bus, camisetas quemadas y un cartel: "TRAIDORES".`,
    `😡 **Túnel del infierno:** al irse al vestuario por el **${score}**, la gente se metió a ${venue}, persiguió a **${name}** por el pasillo y le escupió la camiseta. Tuvieron que sacarlos por una puerta de servicio.`,
    `🪧 **Toma de ${venue}:** tras el **${score}** la hinchada no se fue. Ocuparon el círculo central, prendieron fuego a las camisetas y gritaron que el plantel no salga vivo de la ciudad${city ? city : ''}.`
  ];

  return texts[rand(0, texts.length - 1)];
}

/**
 * Evento espontáneo de la hinchada. Devuelve un texto descriptivo o null.
 * Las goleadas en contra (3+ goles) SIEMPRE generan un disturbio.
 */
function maybeFanMoment(player, context = {}) {
  normalizeFanRelation(player);
  const tier = fanTier(player.fanRelation);
  const { result, goals = 0, isClassic = false } = context;

  if (isGoleadaEnContra(context)) {
    const text = goleadaRiotText(player, context);
    rememberFanEvent(player, {
      type: 'goleada',
      text,
      score: `${context.myGoals}-${context.oppGoals}`
    });
    player.morale = Math.max(10, (player.morale || 70) - 6);
    return text;
  }

  // Tifo / banderazo para ídolos
  if (tier.emoji === '🔥' || tier.emoji === '👑') {
    if (Math.random() < 0.18) {
      const texts = [
        `🏟️ **¡La hinchada desplegó un tifo dedicado a vos!** Todo ${player.club} corea tu nombre.`,
        `🎺 **Banderazo en la previa:** cientos de hinchas te esperaron con bengalas y cánticos.`,
        `🧣 **La tribuna te regaló una bufanda gigante** con tu cara. Sos historia en ${player.club}.`
      ];
      return texts[rand(0, texts.length - 1)];
    }
  }

  // Furia de la hinchada
  if (player.fanRelation < 35 && (result === 'D' || Math.random() < 0.12)) {
    const texts = [
      `🚨 **La hinchada está furiosa** después de tus últimas actuaciones: silbidos y pancartas pidiendo reacción.`,
      `😡 **\"Vendido\"**: un sector de la tribuna te reprocha la falta de entrega en el último tiempo.`,
      `📣 **La barra cantó en tu contra** y te apuntó como responsable del mal momento.`
    ];
    return texts[rand(0, texts.length - 1)];
  }

  if (isClassic && result === 'V' && goals >= 1) {
    return `⚔️ **La hinchada no se olvida de tu gol en el clásico:** te lo van a cantar durante años.`;
  }

  return null;
}

/** Describe el estatus actual con la hinchada. */
function describeFanStatus(player) {
  normalizeFanRelation(player);
  const tier = fanTier(player.fanRelation);
  return {
    score: player.fanRelation,
    tier: tier.title,
    emoji: tier.emoji,
    bar: fanBar(player.fanRelation),
    lastEvents: (player.fanEvents || []).slice(0, 3)
  };
}

module.exports = {
  FAN_TIERS,
  GOLEADA_THRESHOLD,
  normalizeFanRelation,
  fanTier,
  fanBar,
  recordFanMatch,
  maybeFanMoment,
  describeFanStatus,
  isGoleadaEnContra,
  goleadaRiotText,
  goleadaPenalty
};
