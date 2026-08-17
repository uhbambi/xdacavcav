'use strict';

const { rand } = require('./simulation.js');

/**
 * Relación del jugador con la hinchada de su club (0-100).
 * Sube con goles, triunfos y gestos; baja con derrotas, malas declaraciones
 * y cuando la gente siente que te vas a ir.
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

function normalizeFanRelation(player) {
  if (typeof player.fanRelation !== 'number') {
    // Hereda un punto de partida según la moral actual
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

/** Actualiza la relación con la hinchada después de un partido. */
function recordFanMatch(player, result, context = {}) {
  normalizeFanRelation(player);
  const { goals = 0, isClassic = false, isFinal = false, motm = false } = context;

  let delta = 0;
  if (result === 'V') delta += 4;
  else if (result === 'E') delta += 0;
  else delta -= 5;

  delta += Math.min(3, goals * 1);
  if (motm) delta += 2;
  if (isClassic) delta += result === 'V' ? 4 : result === 'D' ? -4 : 0;
  if (isFinal && result === 'V') delta += 5;

  player.fanRelation = Math.max(0, Math.min(100, player.fanRelation + delta));
  return player.fanRelation;
}

/**
 * Evento espontáneo de la hinchada. Devuelve un texto descriptivo o null.
 * Pensado para colgarse del resultado del partido.
 */
function maybeFanMoment(player, context = {}) {
  normalizeFanRelation(player);
  const tier = fanTier(player.fanRelation);
  const { result, goals = 0, isClassic = false } = context;

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
      `😡 **"Vendido"**: un sector de la tribuna te reprocha la falta de entrega en el último tiempo.`,
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
    bar: fanBar(player.fanRelation)
  };
}

module.exports = {
  FAN_TIERS,
  normalizeFanRelation,
  fanTier,
  fanBar,
  recordFanMatch,
  maybeFanMoment,
  describeFanStatus
};
