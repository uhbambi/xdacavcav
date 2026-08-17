'use strict';

const { getLeague } = require('../data/clubs.js');

const AWARDS_CATALOG = {
  BALLON_DOR: {
    id: 'BALLON_DOR',
    name: 'Balón de Oro (Ballon d’Or)',
    emoji: '🌟',
    prestigePoints: 25,
    minOvr: 80,
    desc: 'El galardón individual más prestigioso del planeta fútbol.'
  },
  THE_BEST: {
    id: 'THE_BEST',
    name: 'The Best FIFA Men’s Player',
    emoji: '🏆',
    prestigePoints: 20,
    minOvr: 78,
    desc: 'Premio otorgado por la FIFA al mejor futbolista del año.'
  },
  GOLDEN_BOOT: {
    id: 'GOLDEN_BOOT',
    name: 'Bota de Oro Mundial',
    emoji: '👟',
    prestigePoints: 15,
    minOvr: 70,
    desc: 'Máximo artillero absoluto de las grandes ligas.'
  },
  GOLDEN_BOY: {
    id: 'GOLDEN_BOY',
    name: 'Premio Golden Boy (Sub-21)',
    emoji: '👶',
    prestigePoints: 12,
    maxAge: 21,
    minOvr: 72,
    desc: 'Mejor futbolista joven del mundo menor de 21 años.'
  },
  YASHIN_TROPHY: {
    id: 'YASHIN_TROPHY',
    name: 'Trofeo Yashin / Guante de Oro',
    emoji: '🧤',
    prestigePoints: 15,
    position: 'POR',
    desc: 'Mejor arquero del planeta por sus atajadas y vallas invictas.'
  },
  REY_DE_AMERICA: {
    id: 'REY_DE_AMERICA',
    name: 'Rey de América (Diario El País)',
    emoji: '👑',
    prestigePoints: 16,
    confed: 'CONMEBOL',
    desc: 'El mejor jugador consagrado en canchas sudamericanas.'
  },
  WORLD_CUP_GOLDEN_BALL: {
    id: 'WORLD_CUP_GOLDEN_BALL',
    name: 'Balón de Oro del Mundial de la FIFA',
    emoji: '🌍',
    prestigePoints: 30,
    desc: 'Mejor jugador consagrado en la Copa del Mundo.'
  },
  LEAGUE_MVP: {
    id: 'LEAGUE_MVP',
    name: 'MVP del Campeonato de Liga',
    emoji: '🎖️',
    prestigePoints: 8,
    desc: 'Jugador Más Valioso de la temporada regular de liga.'
  },
  TOTS_XI: {
    id: 'TOTS_XI',
    name: 'Equipo del Año (FIFPRO World 11)',
    emoji: '👕',
    prestigePoints: 10,
    desc: 'Integrante del once ideal del fútbol mundial.'
  },
  PLAYMAKER_YEAR: {
    id: 'PLAYMAKER_YEAR',
    name: 'Máximo Asistente del Año',
    emoji: '🪄',
    prestigePoints: 8,
    desc: 'Líder en pases de gol y visión de juego.'
  },
  PUSKAS_AWARD: {
    id: 'PUSKAS_AWARD',
    name: 'Premio Puskás de la FIFA (Mejor Gol del Año)',
    emoji: '🚀',
    prestigePoints: 18,
    desc: 'Galardón al gol más espectacular, acrobático y legendario de la temporada.'
  }
};

/**
 * Evalúa y otorga los premios de la temporada
 */
function evaluateSeasonAwards(player, extraContext = {}) {
  const wonAwards = [];
  const s = player.seasonStats || { apps: 0, goals: 0, assists: 0, avgRatingSum: 0, cleanSheets: 0 };
  const apps = s.apps || 0;
  const avg = apps > 0 ? s.avgRatingSum / apps : 0;
  const c = player.career || {};
  const allTrophies = c.trophies || [];
  const hasBigTrophy = allTrophies.some(t =>
    t.includes('Champions') || t.includes('Libertadores') || t.includes('Mundial') ||
    t.includes('Copa América') || t.includes('Eurocopa')
  );

  // 1. Balón de Oro
  if (avg >= 7.95 && player.overall >= 80 && (hasBigTrophy || s.goals >= 25 || s.assists >= 18 || s.cleanSheets >= 14)) {
    wonAwards.push(`🌟 Balón de Oro (Temporada ${player.season})`);
  }

  // 2. The Best FIFA
  if (avg >= 7.80 && player.overall >= 78 && apps >= 10 && !wonAwards.some(a => a.includes('Balón de Oro'))) {
    wonAwards.push(`🏆 The Best FIFA Player (Temporada ${player.season})`);
  }

  // 3. Golden Boy
  if (player.age <= 21 && player.overall >= 72 && apps >= 8 && (s.goals >= 8 || s.assists >= 6 || avg >= 7.3)) {
    wonAwards.push(`👶 Premio Golden Boy (Temporada ${player.season})`);
  }

  // 4. Bota de Oro
  if (s.goals >= 22) {
    wonAwards.push(`👟 Bota de Oro Mundial [${s.goals} Goles] (Temporada ${player.season})`);
  } else if (s.goals >= 15) {
    wonAwards.push(`⚽ Goleador de la Temporada [${s.goals} Goles] (${player.season})`);
  }

  // 5. Máximo Asistente
  if (s.assists >= 12) {
    wonAwards.push(`🪄 Máximo Asistente del Año [${s.assists} Asistencias] (${player.season})`);
  }

  // 6. Portero: Yashin / Guante de Oro
  if (player.position === 'POR' && (s.cleanSheets >= 10 || avg >= 7.6) && apps >= 10) {
    wonAwards.push(`🧤 Trofeo Yashin / Mejor Arquero del Mundo (${player.season})`);
  } else if (player.position === 'POR' && s.cleanSheets >= 7) {
    wonAwards.push(`🧤 Guante de Oro (${player.season})`);
  }

  // 7. Rey de América
  const league = getLeague(player.leagueKey);
  if (league && league.confed === 'CONMEBOL' && avg >= 7.5 && apps >= 8) {
    if (allTrophies.some(t => t.includes('Libertadores') || t.includes('Sudamericana') || t.includes('Copa América'))) {
      wonAwards.push(`👑 Rey de América (Temporada ${player.season})`);
    }
  }

  // 8. FIFPRO World 11
  if (avg >= 7.55 && player.overall >= 79 && apps >= 10) {
    wonAwards.push(`👕 Integrante del FIFPRO World 11 (${player.season})`);
  }

  // 9. MVP de la Liga
  if (avg >= 7.7 && apps >= 8 && !wonAwards.some(a => a.includes('MVP'))) {
    wonAwards.push(`🎖️ MVP del Campeonato (${player.season})`);
  }

  // 10. Balón de oro del Mundial (si hubo mundial ganado)
  if (extraContext.wonWorldCup && avg >= 7.8) {
    wonAwards.push(`🌍 Balón de Oro del Mundial de la FIFA (${player.season})`);
  }

  // 11. Premio Puskás de la FIFA (Mejor Gol del Año)
  const hasPuskasCandidate = player.seasonBestGoal || (s.goals >= 8 && (player.attributes?.tiro >= 70 || player.attributes?.regate >= 72 || Math.random() < 0.35));
  if (player.position !== 'POR' && hasPuskasCandidate && s.goals >= 5) {
    // Si metió goles destacados y tuvo buena temporada ofensiva
    if (Math.random() < 0.45 || player.puskasNominated) {
      const goalDesc = player.seasonBestGoal || 'Chilena acrobática al ángulo de media distancia';
      wonAwards.push(`🚀 Premio Puskás de la FIFA [${goalDesc}] (Temporada ${player.season})`);
    }
  }

  return wonAwards;
}

module.exports = {
  AWARDS_CATALOG,
  evaluateSeasonAwards
};
