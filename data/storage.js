'use strict';

const fs = require('fs');
const path = require('path');
// Carga opcional y segura del cliente PostgreSQL
let pgModule = null;
try {
  pgModule = require('pg');
} catch (e) {
  // pg no está instalado o no se encuentra en el entorno actual
}

const DB_PATH = path.join(__dirname, 'players.json');
const MANAGERS_PATH = path.join(__dirname, 'managers.json');
const BALLON_DOR_PATH = path.join(__dirname, 'ballondor.json');
const RECORDS_PATH = path.join(__dirname, 'records.json');

// Memoria caché para respuestas síncronas ultra-rápidas en Discord y Web
let _playersCache = null;
let _managersCache = null;
let _ballonDorCache = null;
let _recordsCache = null;

// Pool de PostgreSQL
let pgPool = null;
let isPgConnected = false;
let isInitialized = false;

function safeRead(filePath, defaultData = {}) {
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    } catch (e) {}
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error(`[Storage] Error leyendo archivo local ${filePath}:`, e.message);
    return defaultData;
  }
}

function safeWrite(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`[Storage] Error guardando archivo local ${filePath}:`, e.message);
  }
}

/**
 * Inicializa la conexión a PostgreSQL si DATABASE_URL está configurado (Railway / Supabase / Neon / Local)
 */
async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // Cargar primero desde archivos locales para disponibilidad inmediata
  if (!_playersCache) _playersCache = safeRead(DB_PATH, {});
  if (!_managersCache) _managersCache = safeRead(MANAGERS_PATH, {});
  if (!_ballonDorCache) _ballonDorCache = safeRead(BALLON_DOR_PATH, { activeVote: null, history: [] });
  if (!_recordsCache) _recordsCache = safeRead(RECORDS_PATH, { topScorers: [], topRated: [], mostTrophies: [], hallOfFame: [] });

  if (!dbUrl) {
    console.log('[Storage] 📁 DATABASE_URL no configurado. Utilizando almacenamiento local persistente (JSON).');
    isInitialized = true;
    return;
  }

  if (!pgModule || !pgModule.Pool) {
    console.log('[Storage] ⚠️ DATABASE_URL está definido pero el módulo "pg" no está instalado. Para activar PostgreSQL en Railway ejecuta "npm install pg". Utilizando almacenamiento local persistente (JSON).');
    isInitialized = true;
    return;
  }

  try {
    const { Pool } = pgModule;
    const useSsl = dbUrl.includes('supabase') || dbUrl.includes('railway') || dbUrl.includes('neon') || process.env.NODE_ENV === 'production';
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000
    });

    // Probar conexión y crear tablas
    const client = await pgPool.connect();
    console.log('[Storage] 🐘 Conexión exitosa con base de datos PostgreSQL (Railway / Cloud).');
    isPgConnected = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(128) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS managers (
        id VARCHAR(128) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS game_state (
        key VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sincronizar desde PostgreSQL a memoria
    const playersRes = await client.query('SELECT id, data FROM players');
    if (playersRes.rows.length > 0) {
      for (const row of playersRes.rows) {
        _playersCache[row.id] = row.data;
      }
      safeWrite(DB_PATH, _playersCache);
      console.log(`[Storage] 📥 Cargados ${playersRes.rows.length} jugadores desde PostgreSQL.`);
    } else if (Object.keys(_playersCache).length > 0) {
      // Migrar datos locales existentes a PostgreSQL
      console.log(`[Storage] 📤 Migrando ${Object.keys(_playersCache).length} jugadores locales a PostgreSQL...`);
      for (const [id, data] of Object.entries(_playersCache)) {
        await client.query(
          'INSERT INTO players (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
          [id, JSON.stringify(data)]
        );
      }
    }

    const managersRes = await client.query('SELECT id, data FROM managers');
    if (managersRes.rows.length > 0) {
      for (const row of managersRes.rows) {
        _managersCache[row.id] = row.data;
      }
      safeWrite(MANAGERS_PATH, _managersCache);
      console.log(`[Storage] 📥 Cargados ${managersRes.rows.length} directores técnicos desde PostgreSQL.`);
    } else if (Object.keys(_managersCache).length > 0) {
      for (const [id, data] of Object.entries(_managersCache)) {
        await client.query(
          'INSERT INTO managers (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
          [id, JSON.stringify(data)]
        );
      }
    }

    const stateRes = await client.query('SELECT key, data FROM game_state');
    for (const row of stateRes.rows) {
      if (row.key === 'ballondor') _ballonDorCache = row.data;
      if (row.key === 'records') _recordsCache = row.data;
    }

    client.release();
    isInitialized = true;
    console.log('[Storage] ✅ Sincronización de Base de Datos completada con éxito.');
  } catch (err) {
    console.error('[Storage] ⚠️ Error inicializando PostgreSQL (usando modo fallback JSON):', err.message);
    isPgConnected = false;
    isInitialized = true;
  }
}

// Auto-inicializar de fondo si hay variable configurada
initDatabase().catch(err => console.error('[Storage Init Background Error]:', err.message));

// Helper asíncrono para operaciones en PostgreSQL
function pgQueryAsync(text, params) {
  if (!pgPool || !isPgConnected) return;
  pgPool.query(text, params).catch(err => {
    console.error('[Storage DB Query Error]:', err.message);
  });
}

// ──────────────────────── PLAYERS ────────────────────────

function loadAll() {
  if (!_playersCache) {
    _playersCache = safeRead(DB_PATH, {});
  }
  return _playersCache;
}

function saveAll(data) {
  _playersCache = data;
  safeWrite(DB_PATH, data);
  if (isPgConnected) {
    for (const [id, pData] of Object.entries(data)) {
      pgQueryAsync(
        'INSERT INTO players (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
        [id, JSON.stringify(pData)]
      );
    }
  }
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
  safeWrite(DB_PATH, all);

  if (isPgConnected) {
    pgQueryAsync(
      'INSERT INTO players (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
      [userId, JSON.stringify(playerData)]
    );
  }

  return playerData;
}

function deletePlayer(userId) {
  const all = loadAll();
  delete all[userId];
  safeWrite(DB_PATH, all);

  if (isPgConnected) {
    pgQueryAsync('DELETE FROM players WHERE id = $1', [userId]);
  }
}

// ──────────────────────── MANAGERS (MODO DT) ────────────────────────

function loadAllManagers() {
  if (!_managersCache) {
    _managersCache = safeRead(MANAGERS_PATH, {});
  }
  return _managersCache;
}

function saveAllManagers(data) {
  _managersCache = data;
  safeWrite(MANAGERS_PATH, data);
  if (isPgConnected) {
    for (const [id, mData] of Object.entries(data)) {
      pgQueryAsync(
        'INSERT INTO managers (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
        [id, JSON.stringify(mData)]
      );
    }
  }
}

function getManager(userId) {
  const all = loadAllManagers();
  return all[userId] || null;
}

function setManager(userId, managerData) {
  const all = loadAllManagers();
  all[userId] = managerData;
  safeWrite(MANAGERS_PATH, all);

  if (isPgConnected) {
    pgQueryAsync(
      'INSERT INTO managers (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
      [userId, JSON.stringify(managerData)]
    );
  }

  return managerData;
}

function deleteManager(userId) {
  const all = loadAllManagers();
  delete all[userId];
  safeWrite(MANAGERS_PATH, all);

  if (isPgConnected) {
    pgQueryAsync('DELETE FROM managers WHERE id = $1', [userId]);
  }
}

// ──────────────────────── BALÓN DE ORO ────────────────────────

function getBallonDorData() {
  if (!_ballonDorCache) {
    _ballonDorCache = safeRead(BALLON_DOR_PATH, {
      activeVote: null,
      history: []
    });
  }
  return _ballonDorCache;
}

function setBallonDorData(data) {
  _ballonDorCache = data;
  safeWrite(BALLON_DOR_PATH, data);

  if (isPgConnected) {
    pgQueryAsync(
      'INSERT INTO game_state (key, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW()',
      ['ballondor', JSON.stringify(data)]
    );
  }

  return data;
}

// ──────────────────────── RÉCORDS DEL SERVIDOR ────────────────────────

function getRecords() {
  if (!_recordsCache) {
    _recordsCache = safeRead(RECORDS_PATH, {
      topScorers: [],
      topRated: [],
      mostTrophies: [],
      hallOfFame: []
    });
  }
  return _recordsCache;
}

function setRecords(data) {
  _recordsCache = data;
  safeWrite(RECORDS_PATH, data);

  if (isPgConnected) {
    pgQueryAsync(
      'INSERT INTO game_state (key, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW()',
      ['records', JSON.stringify(data)]
    );
  }

  return data;
}

function isDatabaseConnected() {
  return isPgConnected;
}

module.exports = {
  initDatabase,
  isDatabaseConnected,
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
