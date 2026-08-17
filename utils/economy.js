'use strict';

const { rand, pick } = require('./simulation.js');

const AGENT_PROFILES = [
  {
    name: 'Jorge Mendes Jr.',
    type: 'Superagente Élite',
    emoji: '💼',
    commission: 0.12,
    bonusOfferChance: 0.35,
    wageMultiplier: 1.30,
    style: 'Agresivo con gigantes europeos'
  },
  {
    name: 'Mino Raiola Associates',
    type: 'Negociador Implacable',
    emoji: '🦈',
    commission: 0.15,
    bonusOfferChance: 0.40,
    wageMultiplier: 1.40,
    style: 'Exige cláusulas millonarias y comisiones récord'
  },
  {
    name: 'Federico Pastorello',
    type: 'Agente Estratégico',
    emoji: '👔',
    commission: 0.08,
    bonusOfferChance: 0.20,
    wageMultiplier: 1.15,
    style: 'Especialista en ligas top y estabilidad'
  },
  {
    name: 'Asesoría Familiar (Papá)',
    type: 'Representación Familiar',
    emoji: '👨‍👦',
    commission: 0.03,
    bonusOfferChance: 0.05,
    wageMultiplier: 1.00,
    style: 'Leal y protector, busca cariño de la hinchada'
  }
];

/**
 * Calcula el valor de mercado real (€)
 */
function calculateMarketValue(player) {
  const ovr = player.overall || 60;
  const pot = player.potential || (ovr + 5);
  const age = player.age || 18;
  const pos = player.position || 'DEL';

  // Base cuadrática según media
  let base = Math.pow(ovr / 40, 4.2) * 150000;

  // Factor Edad (pico 22-26, penalización fuerte >32)
  let ageFactor = 1.0;
  if (age <= 21) ageFactor = 1.55 + (pot - ovr) * 0.08;
  else if (age <= 24) ageFactor = 1.35 + (pot - ovr) * 0.04;
  else if (age <= 28) ageFactor = 1.15;
  else if (age <= 31) ageFactor = 0.85;
  else if (age <= 34) ageFactor = 0.50;
  else if (age <= 37) ageFactor = 0.25;
  else ageFactor = 0.10;

  // Factor Posición
  let posFactor = 1.0;
  if (pos === 'DEL' || pos === 'EXT') posFactor = 1.15;
  else if (pos === 'MED' || pos === 'VOL') posFactor = 1.05;
  else if (pos === 'DEF' || pos === 'LAT') posFactor = 0.90;
  else if (pos === 'POR') posFactor = 0.80;

  // Factor de liga / club
  const clubMedia = player.clubMedia || 62;
  const clubFactor = Math.max(0.6, clubMedia / 70);

  // Rendimiento reciente
  const stats = player.seasonStats || { apps: 0, goals: 0, assists: 0, avgRatingSum: 0 };
  let formFactor = 1.0;
  if (stats.apps > 4) {
    const avg = stats.avgRatingSum / stats.apps;
    if (avg >= 7.6) formFactor = 1.25;
    else if (avg >= 7.0) formFactor = 1.10;
    else if (avg <= 6.0) formFactor = 0.85;
  }

  const value = Math.round(base * ageFactor * posFactor * clubFactor * formFactor);
  return Math.max(80000, value);
}

/**
 * Calcula la cláusula de rescisión (€)
 */
function calculateReleaseClause(player, marketValue) {
  const mv = marketValue || calculateMarketValue(player);
  const clubTier = player.clubTier || 1;
  const multiplier = 2.2 + (clubTier * 0.6) + ((player.potential || 75) > 85 ? 0.8 : 0);
  return Math.round(mv * multiplier);
}

/**
 * Calcula el sueldo semanal, anual y bonos (€)
 */
function calculateWages(player) {
  const ovr = player.overall || 60;
  const clubTier = player.clubTier || 1;
  const agentBoost = player.agent ? (player.agent.wageMultiplier || 1.0) : (player.superagentPurchased ? 1.25 : 1.0);
  
  const annualBase = Math.round(Math.pow(ovr / 42, 3.7) * 1500 * (1 + clubTier * 0.45) * agentBoost);
  const annualWage = Math.max(25000, annualBase);
  const weeklyWage = Math.round(annualWage / 52);

  const goalBonus = player.goalBonus || Math.round(1500 * clubTier * (ovr / 50));
  const trophyBonus = player.trophyBonus || Math.round(25000 * clubTier);

  return { annualWage, weeklyWage, goalBonus, trophyBonus };
}

/**
 * Calcula el patrimonio neto (Net Worth)
 */
function calculateNetWorth(player) {
  let netWorth = player.bank || 0;
  // Bienes raíces
  netWorth += (player.realEstateCount || 0) * 1200000;
  // Mansión
  if (player.mansionPurchased) netWorth += 800000;
  // Autos
  if (player.supercarPurchased) netWorth += 250000;
  return netWorth;
}

/**
 * Calcula los gastos semanales de mantenimiento
 */
function calculateWeeklyExpenses(player) {
  let expenses = 500;
  if (player.mansionPurchased) expenses += 3500;
  if (player.supercarPurchased) expenses += 1200;
  if (player.trainerPurchased) expenses += 1500;
  if (player.chefPurchased) expenses += 900;
  return expenses;
}

/**
 * Inicializa o normaliza la economía del jugador
 */
function normalizeEconomy(player) {
  if (!player.agent) {
    player.agent = AGENT_PROFILES[3];
  }
  if (!player.contractYears) {
    player.contractYears = rand(2, 4);
  }
  const clubTier = player.clubTier || 1;
  if (!player.goalBonus) {
    player.goalBonus = Math.round(1500 * clubTier * ((player.overall || 60) / 50));
  }
  if (!player.trophyBonus) {
    player.trophyBonus = Math.round(25000 * clubTier);
  }
  if (!player.marketValue) {
    player.marketValue = calculateMarketValue(player);
  }
  if (!player.releaseClause) {
    player.releaseClause = calculateReleaseClause(player, player.marketValue);
  }
  if (!player.weeklyWage) {
    const wages = calculateWages(player);
    player.weeklyWage = wages.weeklyWage;
    player.salary = wages.annualWage;
  }
  return player;
}

/**
 * Formatea cantidades en millones / miles de Euros (€)
 */
function formatMoney(amount) {
  const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
  if (num >= 1000000) {
    return `€${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `€${(num / 1000).toFixed(0)}K`;
  }
  return `€${num.toLocaleString('es-CL')}`;
}

module.exports = {
  AGENT_PROFILES,
  calculateMarketValue,
  calculateReleaseClause,
  calculateWages,
  calculateNetWorth,
  calculateWeeklyExpenses,
  normalizeEconomy,
  formatMoney
};
