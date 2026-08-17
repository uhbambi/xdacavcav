'use strict';

const storage = require('../data/storage.js');
const { formatMoney } = require('./economy.js');
const { FLAGS } = require('../data/clubs.js');
const { getNpcWorld } = require('./npcWorld.js');

function flagFor(country) {
  return FLAGS[country] || '🇨🇱';
}

const GLOBAL_STARS = [
  { name: 'Kylian Mbappé', position: 'DEL', club: 'Real Madrid', nationality: 'Francia', overall: 91, goals: 34, value: 180000000 },
  { name: 'Erling Haaland', position: 'DEL', club: 'Manchester City', nationality: 'Noruega', overall: 91, goals: 38, value: 180000000 },
  { name: 'Vinícius Jr.', position: 'EXT', club: 'Real Madrid', nationality: 'Brasil', overall: 90, goals: 26, value: 150000000 },
  { name: 'Jude Bellingham', position: 'MED', club: 'Real Madrid', nationality: 'Inglaterra', overall: 90, goals: 21, value: 150000000 },
  { name: 'Rodri', position: 'MED', club: 'Manchester City', nationality: 'Espana', overall: 91, goals: 9, value: 130000000 },
  { name: 'Lamine Yamal', position: 'EXT', club: 'Barcelona', nationality: 'Espana', overall: 84, goals: 14, value: 120000000, age: 17 },
  { name: 'Harry Kane', position: 'DEL', club: 'Bayern Munich', nationality: 'Inglaterra', overall: 89, goals: 36, value: 90000000 },
  { name: 'Lautaro Martínez', position: 'DEL', club: 'Inter Milan', nationality: 'Argentina', overall: 89, goals: 27, value: 110000000 },
  { name: 'Federico Valverde', position: 'MED', club: 'Real Madrid', nationality: 'Uruguay', overall: 88, goals: 12, value: 120000000 },
  { name: 'Thibaut Courtois', position: 'POR', club: 'Real Madrid', nationality: 'Belgica', overall: 89, goals: 0, value: 60000000 }
];

/**
 * Obtiene todos los jugadores activos combinados con el universo global
 */
function getAllUniversePlayers() {
  const allUsers = storage.loadAll();
  const userList = Object.values(allUsers).filter(p => !p.retired).map(p => ({
    name: p.name,
    position: p.position,
    club: p.club,
    nationality: p.nationality || 'Chile',
    overall: p.overall || 60,
    potential: p.potential || 75,
    age: p.age || 18,
    goals: p.career?.goals || p.seasonStats?.goals || 0,
    assists: p.career?.assists || p.seasonStats?.assists || 0,
    trophies: (p.career?.trophies || []).length,
    value: p.marketValue || 1000000,
    isUser: true
  }));

  const globalList = GLOBAL_STARS.map(g => ({
    ...g,
    potential: g.overall + (g.age && g.age < 23 ? 5 : 0),
    age: g.age || 26,
    assists: Math.round(g.goals * 0.4),
    trophies: 6,
    isUser: false
  }));

  // NPC del mundo persistente (generaciones, promesas y estrellas procedimentales)
  let npcList = [];
  try {
    const world = getNpcWorld();
    npcList = (world.players || [])
      .filter(p => p.status === 'active')
      .map(p => ({
        name: p.name,
        position: p.position,
        club: p.club || 'Agente libre',
        nationality: p.nationality || 'Chile',
        overall: p.overall || 60,
        potential: p.potential || 75,
        age: p.age || 18,
        goals: p.career?.goals || 0,
        assists: p.career?.assists || 0,
        trophies: p.career?.trophies || 0,
        value: p.value || 1000000,
        isUser: false,
        isNpc: true
      }));
  } catch (e) {
    npcList = [];
  }

  return [...userList, ...globalList, ...npcList];
}

/**
 * Top mundial por Media OVR
 */
function getTopOverall(limit = 10) {
  const all = getAllUniversePlayers();
  all.sort((a, b) => b.overall - a.overall);
  return all.slice(0, limit);
}

/**
 * Top mundial por Valor de Mercado
 */
function getTopMarketValue(limit = 10) {
  const all = getAllUniversePlayers();
  all.sort((a, b) => b.value - a.value);
  return all.slice(0, limit);
}

/**
 * Top mundial de Jóvenes Promesas (Sub-21)
 */
function getTopWonderkids(limit = 10) {
  const all = getAllUniversePlayers().filter(p => p.age <= 21);
  all.sort((a, b) => b.potential - a.potential || b.overall - a.overall);
  return all.slice(0, limit);
}

/**
 * Top por País / Nacionalidad
 */
function getTopByCountry(countryName = 'Chile', limit = 10) {
  const all = getAllUniversePlayers().filter(p =>
    p.nationality.toLowerCase().includes(countryName.toLowerCase())
  );
  all.sort((a, b) => b.overall - a.overall);
  return all.slice(0, limit);
}

module.exports = {
  getTopOverall,
  getTopMarketValue,
  getTopWonderkids,
  getTopByCountry,
  flagFor
};
