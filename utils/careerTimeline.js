'use strict';

const { FLAGS } = require('../data/clubs.js');

function flagFor(country) {
  return FLAGS[country] || '🏳️';
}

/**
 * Guarda el resumen de la temporada que acaba de terminar en el timeline de carrera
 */
function recordSeasonInTimeline(player, seasonEndData = {}) {
  player.career = player.career || {};
  player.career.seasonHistory = player.career.seasonHistory || [];

  const seasonStats = player.seasonStats || { apps: 0, goals: 0, assists: 0, avgRatingSum: 0, cleanSheets: 0 };
  const apps = seasonStats.apps || 0;
  const avgRating = apps > 0 ? (seasonStats.avgRatingSum / apps).toFixed(2) : '0.00';

  const baseYear = 2026;
  const currentYear = baseYear + (player.season - 1);

  const entry = {
    season: player.season,
    year: currentYear,
    club: player.club,
    leagueName: player.leagueName || 'Liga Oficial',
    nationality: player.nationality || 'Chile',
    country: player.country || player.nationality || 'Chile',
    flag: flagFor(player.nationality || 'Chile'),
    age: player.age,
    overall: player.overall,
    apps: apps,
    goals: seasonStats.goals || 0,
    assists: seasonStats.assists || 0,
    cleanSheets: seasonStats.cleanSheets || 0,
    avgRating: parseFloat(avgRating),
    trophiesWon: seasonEndData.trophiesWon || [],
    awardsWon: seasonEndData.awardsWon || [],
    transferredTo: seasonEndData.transferredTo || null
  };

  player.career.seasonHistory.push(entry);
  return entry;
}

/**
 * Formatea el timeline completo para mostrar en Discord
 */
function formatTimelineEmbedText(player) {
  const history = player.career?.seasonHistory || player.careerHistory || [];
  if (history.length === 0) {
    const club = player.club || 'tu club';
    return `*Aún no has completado tu primera temporada oficial en **${club}**.*`;
  }

  const lines = history.map(h => {
    const trophies = Array.isArray(h.trophiesWon) ? h.trophiesWon : (Array.isArray(h.trophies) ? h.trophies : []);
    const awards = Array.isArray(h.awardsWon) ? h.awardsWon : [];
    const trophiesStr = trophies.length > 0 ? ` 🏆 ${trophies.join(', ')}` : '';
    const awardsStr = awards.length > 0 ? ` ⭐ ${awards.map(a => typeof a === 'string' ? a.split(' ')[0] + ' ' + (a.split(' ')[1] || '') : '').join(', ')}` : '';
    const isPortero = player.position === 'POR';
    const isDT = !player.position || player.records?.matches !== undefined;

    let statsStr = '';
    if (isDT) {
      statsStr = `${h.matches || h.apps || 0} PJ | ${h.wins || 0}V - ${h.draws || 0}E - ${h.losses || 0}D | ⭐ ${h.reputation || player.reputation || 50} Rep`;
    } else if (isPortero) {
      statsStr = `${h.apps || 0} PJ | ${h.cleanSheets || 0} Invictas | ⭐ ${h.avgRating || '0.0'}`;
    } else {
      statsStr = `${h.apps || 0} PJ | ⚽ ${h.goals || 0} | 🎯 ${h.assists || 0} | ⭐ ${h.avgRating || '0.0'}`;
    }

    const seasonNum = h.season || h.seasons || 1;
    const yearStr = h.year ? ` (${h.year})` : '';
    const flag = h.flag || flagFor(h.country || player.nationality || 'Chile');
    const media = h.overall || h.clubMedia || player.overall || 65;

    return `🗓️ **Temporada ${seasonNum}${yearStr}** — ${flag} **${h.club || player.club}** (Media ${media})\n` +
           `└ ${statsStr}${trophiesStr}${awardsStr}`;
  });

  return lines.join('\n\n');
}

/**
 * Calcula los totales históricos agregados
 */
function getCareerAggregateTotals(player) {
  const c = player.career || {};
  return {
    totalApps: c.apps || 0,
    totalGoals: c.goals || 0,
    totalAssists: c.assists || 0,
    totalCaps: c.caps || 0,
    totalNationalGoals: c.nationalGoals || 0,
    totalTrophies: (c.trophies || []).length,
    totalAwards: (c.awards || []).length,
    trophiesList: c.trophies || [],
    awardsList: c.awards || []
  };
}

module.exports = {
  recordSeasonInTimeline,
  formatTimelineEmbedText,
  formatCareerTimeline: formatTimelineEmbedText,
  getCareerAggregateTotals
};
