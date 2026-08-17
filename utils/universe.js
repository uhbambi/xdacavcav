'use strict';

const storage = require('../data/storage.js');
const { getNpcWorld, getNpcLegends, npcCareerSummary } = require('./npcWorld.js');

/**
 * Reúne en un solo listado normalizado a TODOS los futbolistas del universo:
 * los jugadores reales del servidor (activos y retirados) y los NPC del mundo
 * persistente. Es la base de los récords mundiales y del ranking GOAT.
 */
function getAllCareerEntries() {
  const entries = [];

  // 1. Jugadores del servidor
  const users = storage.loadAll();
  for (const p of Object.values(users)) {
    const c = p.career || {};
    entries.push({
      id: p.id || p.name,
      name: p.name,
      nationality: p.nationality || 'Chile',
      position: p.position,
      club: p.club,
      overall: p.overall || 60,
      peakOverall: p.overall || 60,
      goals: c.goals || 0,
      assists: c.assists || 0,
      apps: c.apps || 0,
      caps: c.caps || 0,
      trophies: (c.trophies || []).length,
      awards: (c.awards || []).length,
      seasons: p.season || 1,
      age: p.age || 18,
      retired: Boolean(p.retired),
      isUser: true
    });
  }

  // 2. NPC del mundo persistente (activos y retirados)
  const world = getNpcWorld();
  const npcs = (world.players || []).filter(p => p.status === 'active' || p.status === 'retired');
  for (const p of npcs) {
    const summary = p.career && p.career.apps ? p.career : npcCareerSummary(p);
    entries.push({
      id: p.id,
      name: p.name,
      nationality: p.nationality || 'Chile',
      position: p.position,
      club: p.club || (p.status === 'retired' ? 'Retirado' : 'Agente libre'),
      overall: p.overall || 60,
      peakOverall: p.peakOverall || p.overall || 60,
      goals: summary.goals || 0,
      assists: summary.assists || 0,
      apps: summary.apps || 0,
      caps: 0,
      trophies: summary.trophies || 0,
      awards: summary.awards || 0,
      seasons: summary.seasons || 1,
      age: p.age,
      retired: p.status === 'retired',
      isUser: false
    });
  }

  return entries;
}

module.exports = { getAllCareerEntries };
