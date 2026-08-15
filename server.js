'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const storage = require('./data/storage.js');
const engine = require('./game/engine.js');
const { newPlayer } = require('./utils/player.js');
const { ATTRS, ATTR_LABELS, POSITION_WEIGHTS, describeAttributes } = require('./utils/attributes.js');
const { TACTICS, POSITIONS } = require('./utils/simulation.js');
const { getAllClubs, LEAGUES, FLAGS, getLeague } = require('./data/clubs.js');
const { NATIONS, NATION_FLAGS } = require('./data/nations.js');
const { MINIGAMES } = require('./utils/minigames.js');
const { MOMENTOS, EVENTOS_CARRERA } = require('./utils/decisions.js');
const { startBot, getBotStatus } = require('./index.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar bot de Discord de fondo si hay token configurado
startBot().catch(err => {
  console.log('Discord bot init note:', err.message || err);
});

// Helper para convertir embeds de discord.js en objetos JSON limpios para la web
function sanitizeEmbed(embed) {
  if (!embed) return null;
  const data = embed.data || embed;
  return {
    title: data.title || '',
    description: data.description || '',
    color: data.color ? `#${data.color.toString(16).padStart(6, '0')}` : '#3498db',
    fields: (data.fields || []).map(f => ({ name: f.name, value: f.value, inline: Boolean(f.inline) })),
    footer: data.footer ? { text: data.footer.text } : null
  };
}

// Helper para parsear la respuesta del motor de juego
function formatEngineResult(engineResult, userId) {
  const player = storage.getPlayer(userId);
  const embeds = (engineResult.embeds || []).map(sanitizeEmbed);
  
  // Analizar si hay botones de tácticas, minijuegos, momentos, transferencias o siguiente partido
  const buttons = [];
  for (const row of engineResult.components || []) {
    for (const comp of (row.components || [])) {
      const d = comp.data || comp;
      buttons.push({
        customId: d.custom_id,
        label: d.label,
        style: d.style
      });
    }
  }

  return {
    ok: engineResult.ok !== false,
    content: engineResult.content || '',
    embeds,
    buttons,
    player,
    pendingAction: player ? {
      minigame: player.pendingMinigame,
      momento: player.pendingMomento,
      careerEvent: player.pendingCareerEvent,
      stage: player.stage,
      offers: player.offers || []
    } : null
  };
}

// ──────────────────────── API ROUTES ────────────────────────

// Estado general del servidor y bot
app.get('/api/status', (req, res) => {
  const allPlayers = storage.loadAll();
  const botStatus = getBotStatus();
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    playersCount: Object.keys(allPlayers).length,
    clubsCount: getAllClubs().length,
    leaguesCount: Object.keys(LEAGUES).length,
    bot: botStatus
  });
});

// Opciones de referencia para creación de jugador y visualización
app.get('/api/reference/options', (req, res) => {
  const countries = [
    { name: 'Chile', key: 'CHILE', flag: '🇨🇱' },
    { name: 'Argentina', key: 'ARGENTINA', flag: '🇦🇷' },
    { name: 'Brasil', key: 'BRASIL', flag: 'BRASIL' },
    { name: 'Mexico', key: 'MEXICO', flag: '🇲🇽' },
    { name: 'Uruguay', key: 'URUGUAY', flag: '🇺🇾' },
    { name: 'Colombia', key: 'COLOMBIA', flag: '🇨🇴' },
    { name: 'Peru', key: 'PERU', flag: '🇵🇪' },
    { name: 'Ecuador', key: 'ECUADOR', flag: '🇪🇨' },
    { name: 'Paraguay', key: 'PARAGUAY', flag: '🇵🇾' },
    { name: 'Bolivia', key: 'BOLIVIA', flag: '🇧🇴' },
    { name: 'Venezuela', key: 'VENEZUELA', flag: '🇻🇪' },
    { name: 'Estados Unidos', key: 'USA', flag: '🇺🇸' },
    { name: 'Espana', key: 'ESPANA', flag: '🇪🇸' },
    { name: 'Inglaterra', key: 'INGLATERRA', flag: '🏴' },
    { name: 'Italia', key: 'ITALIA', flag: '🇮🇹' },
    { name: 'Alemania', key: 'ALEMANIA', flag: '🇩🇪' },
    { name: 'Francia', key: 'FRANCIA', flag: '🇫🇷' },
    { name: 'Portugal', key: 'PORTUGAL', flag: '🇵🇹' },
    { name: 'Paises Bajos', key: 'HOLANDA', flag: '🇳🇱' },
    { name: 'Turquia', key: 'TURQUIA', flag: '🇹🇷' },
    { name: 'Belgica', key: 'BELGICA', flag: '🇧🇪' },
    { name: 'Escocia', key: 'ESCOCIA', flag: '🏴' },
    { name: 'Grecia', key: 'GRECIA', flag: '🇬🇷' },
    { name: 'Arabia Saudita', key: 'ARABIA', flag: '🇸🇦' }
  ];

  const positions = [
    { key: 'DEL', name: 'Delantero', desc: 'Goleador nato. Enfoque en ritmo, tiro y regate.' },
    { key: 'MED', name: 'Mediocampista', desc: 'Motor del equipo. Enfoque en pase, regate y visión.' },
    { key: 'DEF', name: 'Defensa', desc: 'Muralla defensiva. Enfoque en defensa, físico y ritmo.' },
    { key: 'POR', name: 'Portero', desc: 'Guardián bajo los 3 palos. Enfoque en defensa/reflejos y físico.' }
  ];

  const tacticsList = Object.entries(TACTICS).map(([key, t]) => ({
    key,
    label: t.label,
    emoji: t.emoji,
    desc: t.desc,
    bonus: t.bonus
  }));

  const attributesList = ATTRS.map(key => ({
    key,
    label: ATTR_LABELS[key]
  }));

  res.json({
    countries,
    positions,
    tactics: tacticsList,
    attributes: attributesList,
    allClubsCount: getAllClubs().length
  });
});

// Lista de todos los jugadores guardados
app.get('/api/players', (req, res) => {
  const all = storage.loadAll();
  const { normalizePlayer } = require('./utils/player.js');
  const players = Object.entries(all).map(([id, p]) => {
    const norm = normalizePlayer(p);
    return {
      id,
      name: norm.name,
      position: norm.position,
      club: norm.club,
      clubMedia: norm.clubMedia,
      leagueName: norm.leagueName,
      nationality: norm.nationality,
      overall: norm.overall,
      potential: norm.potential,
      age: norm.age,
      season: norm.season,
      retired: norm.retired || false,
      goals: norm.career ? norm.career.goals : 0,
      apps: norm.career ? norm.career.apps : 0,
      trophiesCount: norm.career && norm.career.trophies ? norm.career.trophies.length : 0,
      lastActive: norm.createdAt || Date.now()
    };
  });
  res.json(players);
});

// Crear nuevo jugador
app.post('/api/players', (req, res) => {
  const { name, position, nationalityLeagueKey, userId } = req.body;
  if (!name || !position || !nationalityLeagueKey) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, posición y nacionalidad.' });
  }

  const id = (userId && String(userId).trim()) || `player_${Date.now()}`;
  const existing = storage.getPlayer(id);
  if (existing && !existing.retired) {
    return res.status(400).json({ error: `Ya existe una carrera activa para este identificador (${existing.name}).` });
  }

  const player = newPlayer({
    name: name.trim().slice(0, 24),
    position,
    nationalityLeagueKey
  });

  storage.setPlayer(id, player);
  res.json({ ok: true, id, player });
});

// Obtener datos de un jugador
app.get('/api/players/:id', (req, res) => {
  const player = storage.getPlayer(req.params.id);
  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado.' });
  }
  res.json(player);
});

// Simular siguiente paso / partido
app.post('/api/players/:id/simulate', (req, res) => {
  const { id } = req.params;
  const player = storage.getPlayer(id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });
  if (player.retired) return res.status(400).json({ error: 'El jugador ya está retirado.' });

  const result = engine.simulateStep(id);
  res.json(formatEngineResult(result, id));
});

// Resolver táctica para el partido
app.post('/api/players/:id/tactic', (req, res) => {
  const { id } = req.params;
  const { tactic } = req.body;
  if (!tactic) return res.status(400).json({ error: 'Falta la táctica elegida.' });

  const result = engine.resolveTactic(id, tactic);
  res.json(formatEngineResult(result, id));
});

// Resolver minijuego
app.post('/api/players/:id/minigame', (req, res) => {
  const { id } = req.params;
  const { choiceIndex } = req.body;
  if (choiceIndex === undefined) return res.status(400).json({ error: 'Falta choiceIndex del minijuego.' });

  const result = engine.resolveMinigameChoice(id, String(choiceIndex));
  res.json(formatEngineResult(result, id));
});

// Resolver momento en vivo de partido
app.post('/api/players/:id/momento', (req, res) => {
  const { id } = req.params;
  const { choiceIndex } = req.body;
  if (choiceIndex === undefined) return res.status(400).json({ error: 'Falta choiceIndex del momento.' });

  const result = engine.resolveMomento(id, String(choiceIndex));
  res.json(formatEngineResult(result, id));
});

// Resolver evento de carrera
app.post('/api/players/:id/career-event', (req, res) => {
  const { id } = req.params;
  const { choiceIndex } = req.body;
  if (choiceIndex === undefined) return res.status(400).json({ error: 'Falta choiceIndex del evento.' });

  const result = engine.resolveCareerEvent(id, String(choiceIndex));
  res.json(formatEngineResult(result, id));
});

// Resolver transferencia
app.post('/api/players/:id/transfer', (req, res) => {
  const { id } = req.params;
  const { choice } = req.body; // 'stay' o índice numérico como string
  if (choice === undefined) return res.status(400).json({ error: 'Falta elección de transferencia.' });

  const result = engine.performTransfer(id, String(choice));
  res.json(formatEngineResult(result, id));
});

// Establecer foco de entrenamiento
app.post('/api/players/:id/training', (req, res) => {
  const { id } = req.params;
  const { focus } = req.body;
  const player = storage.getPlayer(id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

  if (focus && !ATTRS.includes(focus)) {
    return res.status(400).json({ error: 'Atributo de entrenamiento no válido.' });
  }

  player.trainingFocus = focus || null;
  storage.setPlayer(id, player);
  res.json({ ok: true, player, focus: player.trainingFocus });
});

// Retirar jugador
app.post('/api/players/:id/retire', (req, res) => {
  const { id } = req.params;
  const player = storage.getPlayer(id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado.' });

  player.retired = true;
  storage.setPlayer(id, player);
  res.json({ ok: true, player, message: `${player.name} ha colgado las botas oficialmente.` });
});

// Eliminar guardado
app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  storage.deletePlayer(id);
  res.json({ ok: true, message: 'Carrera eliminada exitosamente.' });
});

// Vistas del motor (tabla, perfil, atributos)
app.get('/api/players/:id/view/:type', (req, res) => {
  const { id, type } = req.params;
  let result;
  if (type === 'table') result = engine.tableView(id);
  else if (type === 'profile') result = engine.profileView(id);
  else if (type === 'attributes') result = engine.attributesView(id);
  else return res.status(400).json({ error: 'Tipo de vista no válido.' });

  res.json(formatEngineResult(result, id));
});

// Si se accede a cualquier otra ruta, servir index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar servidor Express
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽ Ídolo Copero - Servidor web activo en http://0.0.0.0:${PORT}`);
});
