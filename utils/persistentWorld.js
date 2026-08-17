'use strict';

const storage = require('../data/storage.js');
const { rand, pick } = require('./simulation.js');
const { getAllClubs } = require('../data/clubs.js');

/**
 * Retorna el estado global del universo persistente
 */
function getWorldState() {
  const records = storage.getRecords();
  if (!records.worldState) {
    records.worldState = {
      currentYear: 2026,
      worldCupYear: 2026,
      lastTransferWindow: 2026,
      recentWorldTransfers: [],
      championsLeagueWinner: 'Real Madrid',
      libertadoresWinner: 'Flamengo',
      worldCupWinner: 'Argentina'
    };
    storage.setRecords(records);
  }
  return records.worldState;
}

/**
 * Simula movimientos globales en el mercado de pases del universo
 */
function simulateGlobalWorldWindow() {
  const records = storage.getRecords();
  const state = getWorldState();
  state.currentYear += 1;

  const clubs = getAllClubs();
  const topClubs = clubs.filter(c => c.media >= 80);
  const midClubs = clubs.filter(c => c.media >= 72 && c.media < 80);

  const starNames = [
    'Enzo Barrenechea', 'Lucas Bergvall', 'Claudio Echeverri', 'Franco Mastantuono',
    'Arda Güler', 'Vitor Roque', 'Alejandro Garnacho', 'Kobbie Mainoo', 'Warren Zaïre-Emery'
  ];

  const generatedTransfers = [];
  for (let i = 0; i < 3; i++) {
    const player = pick(starNames);
    const fromClub = pick(midClubs) || { name: 'River Plate' };
    const toClub = pick(topClubs) || { name: 'Real Madrid' };
    const fee = rand(25, 95) * 1000000;

    generatedTransfers.push({
      player,
      from: fromClub.name,
      to: toClub.name,
      fee,
      year: state.currentYear
    });
  }

  state.recentWorldTransfers = generatedTransfers;
  records.worldState = state;
  storage.setRecords(records);

  return state;
}

module.exports = {
  getWorldState,
  simulateGlobalWorldWindow
};
