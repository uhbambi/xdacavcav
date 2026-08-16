'use strict';

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'players.json');
const MANAGERS_PATH = path.join(__dirname, 'managers.json');
const BALLON_DOR_PATH = path.join(__dirname, 'ballondor.json');
const RECORDS_PATH = path.join(__dirname, 'records.json');

function safeRead(filePath, defaultData = {}) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error(`Error leyendo ${filePath}:`, e.message);
    return defaultData;
  }
}

function safeWrite(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error guardando ${filePath}:`, e.message);
  }
}

// ──────────────────────── PLAYERS ────────────────────────

function loadAll() {
  return safeRead(DB_PATH, {});
}

function saveAll(data) {
  safeWrite(DB_PATH, data);
}

function getPlayer(userId) {
  const all = loadAll();
  const player = all[userId];
  if (!player) return null;
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

// ──────────────────────── MANAGERS (MODO DT) ────────────────────────

function loadAllManagers() {
  return safeRead(MANAGERS_PATH, {});
}

function saveAllManagers(data) {
  safeWrite(MANAGERS_PATH, data);
}

function getManager(userId) {
  const all = loadAllManagers();
  return all[userId] || null;
}

function setManager(userId, managerData) {
  const all = loadAllManagers();
  all[userId] = managerData;
  saveAllManagers(all);
  return managerData;
}

function deleteManager(userId) {
  const all = loadAllManagers();
  delete all[userId];
  saveAllManagers(all);
}

// ──────────────────────── BALÓN DE ORO ────────────────────────

function getBallonDorData() {
  return safeRead(BALLON_DOR_PATH, {
    activeVote: null,
    history: []
  });
}

function setBallonDorData(data) {
  safeWrite(BALLON_DOR_PATH, data);
  return data;
}

// ──────────────────────── RÉCORDS DEL SERVIDOR ────────────────────────

function getRecords() {
  return safeRead(RECORDS_PATH, {
    topScorers: [],
    topRated: [],
    mostTrophies: [],
    hallOfFame: []
  });
}

function setRecords(data) {
  safeWrite(RECORDS_PATH, data);
  return data;
}

module.exports = {
  getPlayer,
  setPlayer,
  deletePlayer,
  loadAll,
  saveAll,
  getManager,
  setManager,
  deleteManager,
  loadAllManagers,
  saveAllManagers,
  getBallonDorData,
  setBallonDorData,
  getRecords,
  setRecords
};

