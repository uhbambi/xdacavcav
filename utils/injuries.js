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
  else if (player.age <= 20) baseRisk += 0.005; // físico joven aún en desarrollo

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

  // Si tiene preparador físico o mansión de alto rendimiento, reduce riesgo a la mitad
  if (player.trainerPurchased) baseRisk *= 0.65;
  if (player.mansionPurchased) baseRisk *= 0.70;
  if (player.chefPurchased) baseRisk *= 0.85;

  // Historial de lesiones previas aumenta propensión
  const prevInjuries = (player.injuryHistory || []).length;
  if (prevInjuries >= 5) baseRisk += 0.02;
  else if (prevInjuries >= 2) baseRisk += 0.01;

  baseRisk = Math.max(0.01, Math.min(0.20, baseRisk));

  if (Math.random() > baseRisk) {
    return { injured: false, injury: null };
  }

  // Hubo lesión: determinar gravedad
  // 68% Leve, 25% Media, 7% Grave
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
  player.injuredMatches = injury.matchesRemaining;
  player.injuryHistory = player.injuryHistory || [];
  player.injuryHistory.unshift({
    name: injury.name,
    type: injury.type,
    severityLabel: injury.severityLabel,
    matches: injury.initialMatches,
    season: injury.season,
    timestamp: Date.now()
  });

  // Si es lesión grave, impacto en moral y posible merma en ritmo/físico
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
  if (!player.injury || player.injury.matchesRemaining <= 0) {
    player.injury = null;
    player.injuredMatches = 0;
    return { recoveredNow: false };
  }

  player.injury.matchesRemaining -= 1;
  player.injuredMatches = player.injury.matchesRemaining;

  if (player.injury.matchesRemaining <= 0) {
    const recoveredInjury = player.injury;
    player.injury = null;
    player.injuredMatches = 0;
    player.morale = Math.min(100, (player.morale || 70) + 10);
    return { recoveredNow: true, recoveredInjury };
  }

  return { recoveredNow: false, remaining: player.injury.matchesRemaining };
}

/**
 * Tratamiento médico de emergencia / Fisioterapia de élite
 */
function treatInjury(player, treatmentType = 'fisio') {
  if (!player.injury || player.injury.matchesRemaining <= 0) {
    return { ok: false, message: 'No estás lesionado actualmente.' };
  }

  const bank = player.bank || 0;

  if (treatmentType === 'fisio') {
    const cost = 40000;
    if (bank < cost) {
      return { ok: false, message: `Fondos insuficientes. El tratamiento con Fisioterapeuta VIP cuesta €${cost.toLocaleString('es-CL')}.` };
    }
    player.bank -= cost;
    const reduced = Math.min(player.injury.matchesRemaining, rand(2, 4));
    player.injury.matchesRemaining = Math.max(0, player.injury.matchesRemaining - reduced);
    player.injuredMatches = player.injury.matchesRemaining;

    if (player.injury.matchesRemaining === 0) {
      player.injury = null;
    }

    return {
      ok: true,
      cost,
      reduced,
      matchesRemaining: player.injuredMatches,
      message: `🩹 Sesión intensiva completada (-${reduced} partidos de recuperación).`
    };
  }

  if (treatmentType === 'cirugia_express') {
    const cost = 120000;
    if (bank < cost) {
      return { ok: false, message: `Fondos insuficientes. La clínica médica internacional cuesta €${cost.toLocaleString('es-CL')}.` };
    }
    player.bank -= cost;
    const reduced = Math.min(player.injury.matchesRemaining, rand(5, 10));
    player.injury.matchesRemaining = Math.max(0, player.injury.matchesRemaining - reduced);
    player.injuredMatches = player.injury.matchesRemaining;

    if (player.injury.matchesRemaining === 0) {
      player.injury = null;
    }

    return {
      ok: true,
      cost,
      reduced,
      matchesRemaining: player.injuredMatches,
      message: `🏥 Tratamiento celular avanzado realizado con éxito (-${reduced} partidos de baja).`
    };
  }

  return { ok: false, message: 'Tipo de tratamiento no reconocido.' };
}

module.exports = {
  INJURY_TYPES,
  checkForInjury,
  applyInjury,
  advanceInjury,
  treatInjury
};
