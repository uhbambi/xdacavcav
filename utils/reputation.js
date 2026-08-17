'use strict';

/**
 * Normaliza y garantiza los 3 pilares de fama del jugador:
 * - reputacion: Respeto profesional entre clubes y DTs (0-99)
 * - popularidad: Fama mediática, redes, fans y marcas (0-99)
 * - prestigio: Legado histórico y títulos mayores (0-99)
 */
function normalizeReputationStats(player) {
  if (typeof player.reputationScore !== 'number') {
    const c = player.career || {};
    const baseRep = Math.min(85, Math.round(
      (player.overall * 0.45) +
      (c.goals || 0) * 0.05 +
      (c.trophies || []).length * 2
    ));
    player.reputationScore = Math.max(20, baseRep);
  }

  if (typeof player.popularityScore !== 'number') {
    let pop = Math.round(
      (player.overall * 0.40) +
      (player.supercarPurchased ? 10 : 0) +
      (player.career?.goals || 0) * 0.08
    );
    player.popularityScore = Math.max(15, Math.min(99, pop));
  }

  if (typeof player.prestigeScore !== 'number') {
    const c = player.career || {};
    let prest = Math.round(
      (c.trophies || []).length * 4 +
      (c.awards || []).length * 3 +
      (c.caps || 0) * 0.3
    );
    player.prestigeScore = Math.max(10, Math.min(99, prest));
  }

  return {
    reputacion: player.reputationScore,
    popularidad: player.popularityScore,
    prestigio: player.prestigeScore
  };
}

/**
 * Modifica las estadísticas según eventos de partido
 */
function recordMatchReputation(player, matchData = {}) {
  normalizeReputationStats(player);

  const { goals = 0, assists = 0, isClassic = false, isFinal = false, motm = false, won = false } = matchData;

  // Goles & Asistencias
  if (goals > 0) {
    player.reputationScore = Math.min(99, player.reputationScore + goals * 1);
    player.popularityScore = Math.min(99, player.popularityScore + goals * (isClassic ? 3 : 2));
  }
  if (assists > 0) {
    player.reputationScore = Math.min(99, player.reputationScore + assists * 1);
    player.popularityScore = Math.min(99, player.popularityScore + assists * 1);
  }

  // Clásico
  if (isClassic) {
    if (won) {
      player.popularityScore = Math.min(99, player.popularityScore + 4);
      player.reputationScore = Math.min(99, player.reputationScore + 2);
    } else {
      player.popularityScore = Math.min(99, player.popularityScore + 1); // Igual genera ruido
    }
  }

  // Final ganada
  if (isFinal && won) {
    player.prestigeScore = Math.min(99, player.prestigeScore + 5);
    player.reputationScore = Math.min(99, player.reputationScore + 3);
    player.popularityScore = Math.min(99, player.popularityScore + 6);
  }

  // Jugador del partido
  if (motm) {
    player.popularityScore = Math.min(99, player.popularityScore + 2);
    player.reputationScore = Math.min(99, player.reputationScore + 1);
  }
}

/**
 * Modifica según eventos de prensa / polémicas
 */
function applyMediaEvent(player, eventType, delta = {}) {
  normalizeReputationStats(player);

  if (delta.reputacion) {
    player.reputationScore = Math.max(1, Math.min(99, player.reputationScore + delta.reputacion));
  }
  if (delta.popularidad) {
    player.popularityScore = Math.max(1, Math.min(99, player.popularityScore + delta.popularidad));
  }
  if (delta.prestigio) {
    player.prestigeScore = Math.max(1, Math.min(99, player.prestigeScore + delta.prestigio));
  }
}

/**
 * Calificación del estatus mediático
 */
function getReputationTier(popularity) {
  if (popularity >= 90) return { title: 'Ícono Global 🌍⭐', desc: 'Conocido en todos los rincones del planeta' };
  if (popularity >= 80) return { title: 'Superestrella Mediática 📸', desc: 'Protagonista de portadas y virales' };
  if (popularity >= 70) return { title: 'Figura Reconocida 📺', desc: 'Ampliamente respetado por hinchas y marcas' };
  if (popularity >= 55) return { title: 'Jugador Destacado ⚽', desc: 'Nombre habitual en la prensa deportiva' };
  if (popularity >= 35) return { title: 'Promesa en Ascenso 📈', desc: 'Comienza a sonar en redes sociales' };
  return { title: 'Perfil Bajo 🤫', desc: 'Enfocado en la cancha, lejos de los focos' };
}

module.exports = {
  normalizeReputationStats,
  recordMatchReputation,
  applyMediaEvent,
  getReputationTier
};
