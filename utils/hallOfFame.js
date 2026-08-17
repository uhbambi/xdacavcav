'use strict';

const storage = require('../data/storage.js');
const { FLAGS } = require('../data/clubs.js');

function flagFor(country) {
  return FLAGS[country] || '🇨🇱';
}

/**
 * Registra formalmente a un jugador retirado en el Salón de la Fama
 */
function inductIntoHallOfFame(player, verdict) {
  const records = storage.getRecords();
  records.hallOfFame = records.hallOfFame || [];

  // Evitar duplicados del mismo usuario
  records.hallOfFame = records.hallOfFame.filter(l => l.playerId !== player.id && l.playerName !== player.name);

  const legendEntry = {
    playerId: player.id || player.name,
    playerName: player.name,
    position: player.position,
    nationality: player.nationality || 'Chile',
    flag: flagFor(player.nationality || 'Chile'),
    retiredAge: player.age,
    peakOverall: player.overall,
    careerApps: player.career?.apps || 0,
    careerGoals: player.career?.goals || 0,
    careerAssists: player.career?.assists || 0,
    careerCaps: player.career?.caps || 0,
    careerNationalGoals: player.career?.nationalGoals || 0,
    trophies: player.career?.trophies || [],
    trophyCount: (player.career?.trophies || []).length,
    awards: player.career?.awards || [],
    awardCount: (player.career?.awards || []).length,
    netWorth: player.bank || 0,
    lastClub: player.club,
    categoryTitle: verdict.titulo,
    hallOfFameScore: verdict.score,
    inductedAt: new Date().toISOString()
  };

  records.hallOfFame.push(legendEntry);
  // Ordenar por puntuación histórica
  records.hallOfFame.sort((a, b) => b.hallOfFameScore - a.hallOfFameScore);

  storage.setRecords(records);
  return legendEntry;
}

/**
 * Obtiene la lista de leyendas consagradas
 */
function getHallOfFame() {
  const records = storage.getRecords();
  return records.hallOfFame || [];
}

/**
 * Formatea el Salón de la Fama para un embed
 */
function formatHallOfFameEmbed(limit = 10) {
  const list = getHallOfFame();
  if (list.length === 0) {
    return '🏛️ *El Salón de la Fama está esperando a su primera leyenda retirada.*';
  }

  return list.slice(0, limit).map((leg, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
    return `${medal} **${leg.playerName}** (${leg.position}) ${leg.flag} — **${leg.categoryTitle}**\n` +
           `└ 🏟️ **${leg.lastClub}** (Retiro: ${leg.retiredAge} años) | 🏆 ${leg.trophyCount} Copas | ⚽ ${leg.careerGoals} Goles | 🎖️ Score: **${leg.hallOfFameScore} pts**`;
  }).join('\n\n');
}

module.exports = {
  inductIntoHallOfFame,
  getHallOfFame,
  formatHallOfFameEmbed
};
