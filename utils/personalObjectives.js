'use strict';

const { rand } = require('./simulation.js');

/**
 * Objetivos personales de temporada (distintos de los objetivos de la directiva):
 * metas concretas de goles, asistencias, rating, vallas invictas y clasificación.
 * Cumplirlos da moral, reputación y un bonus salarial; fallarlos resta.
 */

const POSITIONS = {
  POR: { label: 'Portero' },
  DEF: { label: 'Defensa' },
  MED: { label: 'Mediocampista' },
  DEL: { label: 'Delantero' }
};

function buildObjective(id, label, type, target) {
  return { id, label, type, target, met: false };
}

/** Genera 3-4 objetivos personales según posición y nivel de liga. */
function generatePersonalObjectives(player) {
  const pos = player.position || 'MED';
  const isTopPlayer = player.overall >= 80;
  const objs = [];

  if (pos === 'POR') {
    objs.push(buildObjective('vallas', `Mantener ${isTopPlayer ? 10 : 6} vallas invictas`, 'vallas', isTopPlayer ? 10 : 6));
    objs.push(buildObjective('rating', `Promedio de rating ${isTopPlayer ? 7.3 : 7.0}`, 'rating', isTopPlayer ? 7.3 : 7.0));
    objs.push(buildObjective('clasificar', 'Clasificar a copa continental', 'qualify', 1));
  } else if (pos === 'DEF') {
    objs.push(buildObjective('vallas', `Colaborar en ${isTopPlayer ? 12 : 8} vallas invictas del equipo`, 'vallas', isTopPlayer ? 12 : 8));
    objs.push(buildObjective('rating', `Promedio de rating ${isTopPlayer ? 7.2 : 6.9}`, 'rating', isTopPlayer ? 7.2 : 6.9));
    objs.push(buildObjective('puesto', 'Terminar la liga entre los 6 primeros', 'puesto', 6));
  } else if (pos === 'MED') {
    objs.push(buildObjective('asistencias', `Repartir ${isTopPlayer ? 12 : 8} asistencias`, 'asistencias', isTopPlayer ? 12 : 8));
    objs.push(buildObjective('rating', `Promedio de rating ${isTopPlayer ? 7.4 : 7.0}`, 'rating', isTopPlayer ? 7.4 : 7.0));
    objs.push(buildObjective('goles', `Anotar ${isTopPlayer ? 10 : 6} goles`, 'goles', isTopPlayer ? 10 : 6));
    objs.push(buildObjective('puesto', 'Terminar la liga entre los 5 primeros', 'puesto', 5));
  } else {
    // DEL
    objs.push(buildObjective('goles', `Anotar ${isTopPlayer ? 22 : 15} goles`, 'goles', isTopPlayer ? 22 : 15));
    objs.push(buildObjective('rating', `Promedio de rating ${isTopPlayer ? 7.5 : 7.1}`, 'rating', isTopPlayer ? 7.5 : 7.1));
    objs.push(buildObjective('asistencias', `Dar ${isTopPlayer ? 10 : 6} asistencias`, 'asistencias', isTopPlayer ? 10 : 6));
    objs.push(buildObjective('clasificar', 'Clasificar a copa continental', 'qualify', 1));
  }

  // Máximo 4 objetivos, siempre 3 mínimo
  return objs.slice(0, 4);
}

/** Calcula el progreso actual (para /objetivos). */
function objectivesProgress(player) {
  const s = player.seasonStats || { apps: 0, goals: 0, assists: 0, avgRatingSum: 0, cleanSheets: 0 };
  const avg = s.apps > 0 ? s.avgRatingSum / s.apps : 0;
  return {
    goals: s.goals || 0,
    asistencias: s.assists || 0,
    rating: Math.round(avg * 10) / 10,
    vallas: s.cleanSheets || 0
  };
}

/**
 * Evalúa los objetivos al cierre de temporada, aplica premios/castigos y
 * devuelve un texto resumen. Contexto: posición final, clasificación, stats.
 */
function evaluateAndApplyPersonalObjectives(player, context = {}) {
  const objs = player.personalObjectives || [];
  if (!objs.length) return { met: [], failed: [], text: '' };

  const s = player.seasonStats || {};
  const apps = s.apps || 0;
  const avg = apps > 0 ? s.avgRatingSum / apps : 0;
  const { position = 1, qualifiedContinentalCup = null } = context;

  const progress = {
    goals: s.goals || 0,
    asistencias: s.assists || 0,
    rating: avg,
    vallas: s.cleanSheets || 0
  };

  const met = [];
  const failed = [];
  for (const obj of objs) {
    let ok = false;
    switch (obj.type) {
      case 'goles': ok = progress.goals >= obj.target; break;
      case 'asistencias': ok = progress.asistencias >= obj.target; break;
      case 'rating': ok = avg >= obj.target && apps >= 5; break;
      case 'vallas': ok = progress.vallas >= obj.target; break;
      case 'puesto': ok = position <= obj.target; break;
      case 'qualify': ok = Boolean(qualifiedContinentalCup); break;
      default: ok = false;
    }
    obj.met = ok;
    (ok ? met : failed).push(obj);
  }

  // Premios y castigos
  const moraleGain = met.length * 5;
  const moraleLoss = failed.length * 3;
  player.morale = Math.max(10, Math.min(100, (player.morale || 75) + moraleGain - moraleLoss));

  if (typeof player.reputationScore === 'number') {
    player.reputationScore = Math.max(1, Math.min(99, player.reputationScore + met.length * 2 - failed.length * 2));
  }

  // Bonus salarial si cumplió todo
  let salaryBonus = 0;
  if (failed.length === 0 && met.length > 0) {
    salaryBonus = Math.round((player.salary || 50000) * 0.1);
    player.bank = (player.bank || 0) + salaryBonus;
  }

  let text = '';
  if (met.length) text += `🎯 **Objetivos personales CUMPLIDOS (${met.length}/${objs.length}):**\n${met.map(o => `• ✅ ${o.label}`).join('\n')}`;
  if (failed.length) text += `${text ? '\n' : ''}⚠️ **Objetivos personales FALLADOS:**\n${failed.map(o => `• ❌ ${o.label}`).join('\n')}`;
  if (met.length) text += `\n↗️ +${moraleGain} moral · +${met.length * 2} reputación`;
  if (failed.length) text += `\n↘️ -${moraleLoss} moral · -${failed.length * 2} reputación`;
  if (salaryBonus) text += `\n💰 Bonus salarial por pleno: +$${salaryBonus.toLocaleString('en-US')}`;

  player.personalObjectives = objs;
  return { met, failed, text, salaryBonus };
}

module.exports = {
  POSITIONS,
  generatePersonalObjectives,
  objectivesProgress,
  evaluateAndApplyPersonalObjectives
};
