'use strict';

const { rand, pick } = require('./simulation.js');

/**
 * Sistema de Objetivos de Temporada
 * La dirigencia te pide metas concretas con bonus/malus al cumplirlas
 */

const OBJECTIVES_TEMPLATES = [
  {
    id: 'top4',
    text: (p, league) => `La dirigencia te pide clasificar al Top 4 en ${league.name} esta temporada.`,
    check: (player, table, position) => position <= 4,
    salaryBonus: 1.15,
    moraleBonus: 8,
    rewardText: (p) => `✅ ¡Cumpliste el objetivo! Clasificaste al Top 4.`
  },
  {
    id: 'champion',
    text: (p, league) => `La dirigencia quiere que ganes la liga de ${league.name}.`,
    check: (player, table, position) => position === 1,
    salaryBonus: 1.3,
    moraleBonus: 15,
    rewardText: (p) => `🏆 ¡LO HICISTE! ¡Campeón de ${p.leagueName}!`
  },
  {
    id: 'avoid_relegation',
    text: (p, league) => `La dirigencia te pide que no desciendan de ${league.name}.`,
    check: (player, table, position, total) => position <= total - 2,
    salaryBonus: 1.1,
    moraleBonus: 5,
    penaltyMorale: -5,
    rewardText: (p) => `✅ ¡Se salvaron del descenso!`
  },
  {
    id: 'goals',
    text: (p) => `Necesitás anotar al menos 15 goles en la liga esta temporada.`,
    check: (player, table, position, total, goals) => goals >= 15,
    salaryBonus: 1.2,
    moraleBonus: 10,
    rewardText: (p) => `⚽ ¡15+ goles! ¡Sos un goleador!`
  },
  {
    id: 'assists',
    text: (p) => `Necesitás dar al menos 10 asistencias en la liga esta temporada.`,
    check: (player, table, position, total, goals, assists) => assists >= 10,
    salaryBonus: 1.15,
    moraleBonus: 8,
    rewardText: (p) => `🅰️ ¡10+ asistencias! ¡Sos un creador de juego!`
  },
  {
    id: 'clean_sheets',
    text: (p) => `Necesitás al menos 8 arcos en cero (vallas invictas) esta temporada.`,
    check: (player, table, position, total, goals, assists, cleanSheets) => cleanSheets >= 8,
    salaryBonus: 1.2,
    moraleBonus: 10,
    rewardText: (p) => `🛡️ ¡8+ vallas invictas! ¡Defensa sólida!`
  },
  {
    id: 'high_rating',
    text: (p) => `Necesitás un promedio de rating de 7.5+ en todos tus partidos esta temporada.`,
    check: (player, stats) => stats.apps > 0 && (stats.avgRatingSum / stats.apps) >= 7.5,
    salaryBonus: 1.2,
    moraleBonus: 10,
    rewardText: (p) => `⭐ ¡Rating promedio de 7.5+! ¡Rendimiento consistente!`
  }
];

function generateSeasonObjective(player, league) {
  const template = pick(OBJECTIVES_TEMPLATES);
  const textStr = typeof template.text === 'function' ? template.text(player, league) : String(template.text || '');
  const rewardStr = typeof template.rewardText === 'function' ? template.rewardText(player) : String(template.rewardText || '');
  
  return {
    id: template.id,
    text: textStr,
    salaryBonus: template.salaryBonus,
    moraleBonus: template.moraleBonus,
    penaltyMorale: template.penaltyMorale || -2,
    rewardText: rewardStr
  };
}

function checkObjectivesCompletion(player, objectives, table, position) {
  if (!objectives) return { completed: [], failed: [] };
  const list = Array.isArray(objectives) ? objectives : [objectives];
  
  const completed = [];
  const failed = [];
  const total = table ? table.length : 20;
  const stats = player.seasonStats || {};
  
  for (const obj of list) {
    const template = OBJECTIVES_TEMPLATES.find(t => t.id === obj.id);
    let isSuccess = false;

    if (template && typeof template.check === 'function') {
      isSuccess = !!template.check(player, table, position, total, stats.goals, stats.assists, stats.cleanSheets);
    } else if (typeof obj.check === 'function') {
      isSuccess = !!obj.check(player, table, position, total, stats.goals, stats.assists, stats.cleanSheets);
    } else {
      isSuccess = true;
    }
    
    if (isSuccess) {
      completed.push(obj);
    } else {
      failed.push(obj);
    }
  }
  
  return { completed, failed };
}

function applyObjectiveRewards(player, objectives) {
  if (!objectives) return { salary: 0, morale: 0 };
  const list = Array.isArray(objectives) ? objectives : [objectives];
  
  let salaryMultiplier = 1.0;
  let moraleBonus = 0;
  
  for (const obj of list) {
    salaryMultiplier *= (obj.salaryBonus || 1.1);
    moraleBonus += (obj.moraleBonus || 5);
  }
  
  player.salary = Math.round((player.salary || 50000) * salaryMultiplier);
  player.morale = Math.min(100, (player.morale || 70) + moraleBonus);
  
  return { salaryMultiplier, moraleBonus };
}

function applyObjectivePenalties(player, failed) {
  if (!failed) return { morale: 0 };
  const list = Array.isArray(failed) ? failed : [failed];
  
  let moralePenalty = 0;
  
  for (const obj of list) {
    moralePenalty += (obj.penaltyMorale || -2);
  }
  
  player.morale = Math.max(10, (player.morale || 70) + moralePenalty);
  
  return { moralePenalty };
}

function checkSeasonObjective(player, objectiveOrList, table, position) {
  if (!objectiveOrList) return false;
  const res = checkObjectivesCompletion(player, objectiveOrList, table, position);
  return res.completed.length > 0;
}


module.exports = {
  OBJECTIVES_TEMPLATES,
  generateSeasonObjective,
  checkObjectivesCompletion,
  checkSeasonObjective,
  applyObjectiveRewards,
  applyObjectivePenalties
};
