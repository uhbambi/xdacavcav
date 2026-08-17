'use strict';

const { rand, pick } = require('./simulation.js');

const INJURY_TYPES = {
  LEVE: {
    key: 'LEVE',
    label: 'Lesión Leve 🩹',
    minMatches: 1,
    maxMatches: 2,
    names: [
      'Sobrecarga muscular en el isquiotibial',
      'Contractura en el gemelo',
      'Esguince leve de tobillo',
      'Fuerte contusión en el cuádriceps',
      'Molestia en el tendón rotuliano'
    ]
  },
  MEDIA: {
    key: 'MEDIA',
    label: 'Lesión Media 🤕',
    minMatches: 3,
    maxMatches: 8,
    names: [
      'Desgarro fibrilar en el aductor',
      'Esguince grado 2 de rodilla',
      'Fisura en las costillas tras un choque',
      'Distensión severa de ligamento lateral',
      'Elongación muscular con edema'
    ]
  },
  GRAVE: {
    key: 'GRAVE',
    label: 'Lesión Grave 🏥',
    minMatches: 10,
    maxMatches: 24,
    names: [
      'Rotura de ligamentos cruzados (LCA)',
      'Rotura del tendón de Aquiles',
      'Fractura de tibia y peroné',
      'Rotura completa de meniscos con intervención quirúrgica',
      'Luxación compleja de hombro con fisura'
    ]
  }
};

/**
 * Calcula el perfil de riesgo de lesión
 */
function getInjuryRiskProfile(player) {
  const age = player.age || 18;
  const fis = (player.attributes && player.attributes.fisico) || 60;
  let riskScore = 15;

  if (age >= 36) riskScore += 30;
  else if (age >= 32) riskScore += 18;
  else if (age <= 20) riskScore += 6;

  if (fis < 55) riskScore += 25;
  else if (fis < 68) riskScore += 12;
  else if (fis >= 85) riskScore -= 12;

  if (player.mansionPurchased) riskScore = Math.round(riskScore * 0.5);
  if (player.trainerPurchased) riskScore = Math.round(riskScore * 0.7);

  let riskLevel = 'Bajo 🟢';
  if (riskScore >= 45) riskLevel = 'Crítico 🔴';
  else if (riskScore >= 28) riskLevel = 'Moderado 🟡';

  return {
    age,
    physicalScore: fis,
    riskScore: Math.max(5, Math.min(95, riskScore)),
    riskLevel
  };
}

/**
 * Formatea el estado de lesión para embeds
 */
function formatInjuryStatus(player) {
  if (!player.injuredMatches || player.injuredMatches <= 0) {
    return '🟢 Apto físico (100% disponible)';
  }
  const injuryName = player.injury ? player.injury.name : 'Molestia muscular';
  return `🚑 **${player.injuredMatches} partidos de baja** — *${injuryName}*`;
}

/**
 * Calcula la probabilidad de lesión en un partido.
 * Retorna { injured: boolean, injury: object | null }
 */
function checkForInjury(player, matchContext = {}) {
  // Si ya está lesionado no se vuelve a lesionar en partido
  if (player.injury && player.injury.matchesRemaining > 0) {
    return { injured: false, injury: null };
  }

  // Base: 4% de probabilidad por partido
  let baseRisk = 0.04;

  // Factor Edad
  if (player.age >= 38) baseRisk += 0.035;
  else if (player.age >= 34) baseRisk += 0.02;
  else if (player.age >= 30) baseRisk += 0.01;
  else if (player.age <= 20) baseRisk += 0.005;

  // Factor Físico (atributo FIS)
  const fis = (player.attributes && player.attributes.fisico) || 60;
  if (fis < 50) baseRisk += 0.025;
  else if (fis < 65) baseRisk += 0.01;
  else if (fis >= 85) baseRisk -= 0.015;
  else if (fis >= 75) baseRisk -= 0.008;

  // Clásico o partido de alta tensión
  if (matchContext.isClassic || matchContext.isFinal) {
    baseRisk += 0.015;
  }

  // Si tiene preparador físico o mansión de alto rendimiento, reduce riesgo
  if (player.trainerPurchased) baseRisk *= 0.65;
  if (player.mansionPurchased) baseRisk *= 0.70;
  if (player.chefPurchased) baseRisk *= 0.85;

  // Historial de lesiones previas
  const prevInjuries = (player.injuryHistory || []).length;
  if (prevInjuries >= 5) baseRisk += 0.02;
  else if (prevInjuries >= 2) baseRisk += 0.01;

  baseRisk = Math.max(0.01, Math.min(0.20, baseRisk));

  if (Math.random() > baseRisk) {
    return { injured: false, injury: null };
  }

  // Hubo lesión: determinar gravedad
  const roll = Math.random();
  let typeKey = 'LEVE';
  if (roll > 0.93) {
    typeKey = 'GRAVE';
  } else if (roll > 0.68) {
    typeKey = 'MEDIA';
  }

  const def = INJURY_TYPES[typeKey];
  const name = pick(def.names);
  const matches = rand(def.minMatches, def.maxMatches);

  const injury = {
    name,
    type: typeKey,
    severityLabel: def.label,
    matchesRemaining: matches,
    matches: matches,
    initialMatches: matches,
    season: player.season || 1,
    date: new Date().toISOString(),
    matchOccurred: matchContext.opponent || 'Partido Oficial'
  };

  return { injured: true, injury };
}

/**
 * Aplica la lesión al jugador y guarda en su historial
 */
function applyInjury(player, injury) {
  player.injury = injury;
  player.injuredMatches = injury.matchesRemaining || injury.matches;
  player.injuryHistory = player.injuryHistory || [];
  player.injuryHistory.unshift({
    name: injury.name,
    type: injury.type,
    severityLabel: injury.severityLabel,
    matches: injury.initialMatches || injury.matches,
    season: injury.season || player.season || 1,
    timestamp: Date.now()
  });

  if (injury.type === 'GRAVE') {
    player.morale = Math.max(15, (player.morale || 70) - 25);
    if (player.attributes) {
      if (Math.random() < 0.4) {
        player.attributes.ritmo = Math.max(25, (player.attributes.ritmo || 60) - 1);
      }
      if (Math.random() < 0.4) {
        player.attributes.fisico = Math.max(25, (player.attributes.fisico || 60) - 1);
      }
    }
  } else if (injury.type === 'MEDIA') {
    player.morale = Math.max(25, (player.morale || 70) - 12);
  } else {
    player.morale = Math.max(35, (player.morale || 70) - 5);
  }
}

/**
 * Reduce 1 partido a la lesión en curso si existe
 */
function advanceInjury(player) {
  if (!player.injury || player.injuredMatches <= 0) {
    player.injury = null;
    player.injuredMatches = 0;
    return { recoveredNow: false };
  }

  player.injuredMatches = Math.max(0, player.injuredMatches - 1);
  if (player.injury) {
    player.injury.matchesRemaining = player.injuredMatches;
  }

  if (player.injuredMatches <= 0) {
    const recoveredInjury = player.injury;
    player.injury = null;
    player.injuredMatches = 0;
    player.morale = Math.min(100, (player.morale || 70) + 10);
    return { recoveredNow: true, recoveredInjury };
  }

  return { recoveredNow: false, remaining: player.injuredMatches };
}

/**
 * Tratamiento médico de emergencia / Fisioterapia de élite
 */
function treatInjury(player, treatmentType = 'physio') {
  if (!player.injury || player.injuredMatches <= 0) {
    return { success: false, reason: 'No estás lesionado actualmente.' };
  }

  const bank = player.bank || 0;

  if (treatmentType === 'physio' || treatmentType === 'fisio') {
    const cost = 40000;
    if (bank < cost) {
      return { success: false, reason: `Fondos insuficientes. La sesión con Fisioterapeuta VIP cuesta $${cost.toLocaleString('en-US')}.` };
    }
    player.bank -= cost;
    const reduced = Math.min(player.injuredMatches, rand(2, 4));
    player.injuredMatches = Math.max(0, player.injuredMatches - reduced);
    if (player.injury) {
      player.injury.matchesRemaining = player.injuredMatches;
    }

    if (player.injuredMatches === 0) {
      player.injury = null;
    }

    return {
      success: true,
      cost,
      reduced,
      matchesRemaining: player.injuredMatches,
      message: `🩹 Sesión intensiva completada (-${reduced} partidos de recuperación).`
    };
  }

  if (treatmentType === 'surgery' || treatmentType === 'cirugia_express' || treatmentType === 'suiza') {
    const cost = 120000;
    if (bank < cost) {
      return { success: false, reason: `Fondos insuficientes. La clínica médica internacional cuesta $${cost.toLocaleString('en-US')}.` };
    }
    player.bank -= cost;
    const reduced = Math.min(player.injuredMatches, rand(4, 8));
    player.injuredMatches = Math.max(0, player.injuredMatches - reduced);
    if (player.injury) {
      player.injury.matchesRemaining = player.injuredMatches;
    }

    if (player.injuredMatches === 0) {
      player.injury = null;
    }

    return {
      success: true,
      cost,
      reduced,
      matchesRemaining: player.injuredMatches,
      message: `🏥 Tratamiento celular en clínica suiza realizado con éxito (-${reduced} partidos de baja).`
    };
  }

  return { success: false, reason: 'Tipo de tratamiento no reconocido.' };
}

module.exports = {
  INJURY_TYPES,
  getInjuryRiskProfile,
  formatInjuryStatus,
  checkForInjury,
  applyInjury,
  advanceInjury,
  treatInjury
};
