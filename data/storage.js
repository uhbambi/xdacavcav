'use strict';

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'players.json');

function loadAll() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('players.json corrupto, reiniciando en memoria (revisa el archivo manualmente).', e);
    return {};
  }
}

function saveAll(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getPlayer(userId) {
  const all = loadAll();
  const player = all[userId];
  if (!player) return null;
  // Carga perezosa para evitar dependencias circulares al arrancar
  const { normalizePlayer } = require('../utils/player.js');
  return normalizePlayer(player);
}

function setPlayer(userId, playerData) {
  const all = loadAll();
  all[userId] = playerData;
  saveAll(all);
  return playerData;
}

function deletePlayer(userId) {
  const all = loadAll();
  delete all[userId];
  saveAll(all);
}

module.exports = { getPlayer, setPlayer, deletePlayer, loadAll, saveAll };
