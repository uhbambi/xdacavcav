'use strict';

const { findClub } = require('../data/clubs.js');
const { rand } = require('./simulation.js');

/**
 * Sistema de estadios: cada club tiene capacidad, asistencia promedio, ambiente,
 * ingresos por partido, estado e historial de mejoras/remodelaciones.
 * Los datos se derivan de forma estable de la media/tier del club (cache en memoria).
 */

const cache = new Map();

const NAME_SUFFIXES = [
  'Estadio Monumental', 'Arena', 'Parque', 'Estadio Nacional', 'Coliseo',
  'La Fortaleza', 'El Templo', 'Estadio Municipal', 'La Caldera', 'Estadio Olímpico'
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function stadiumNameFor(clubName) {
  const idx = hashString(String(clubName).toLowerCase()) % NAME_SUFFIXES.length;
  return `${NAME_SUFFIXES[idx]} ${clubName}`;
}

/** Capacidad según la media del club. */
function capacityFor(media) {
  const m = Math.max(45, Math.min(91, media));
  const base = 9000 + Math.round(Math.pow(m - 44, 2.15) * 3.4);
  return Math.min(95000, Math.round(base / 500) * 500);
}

/** Devuelve (o crea) el estadio de un club. */
function getStadium(clubName) {
  const key = String(clubName).toLowerCase();
  if (cache.has(key)) return cache.get(key);

  const club = findClub(clubName) || { name: clubName, media: 65, tier: 2, country: 'Chile', leagueKey: 'CHILE_A' };
  const media = club.media || 65;
  const capacity = capacityFor(media);

  const h = hashString(key);
  const fill = 0.52 + (media - 45) * 0.006 + ((h % 10) / 100); // 0.52..0.80
  const avgAttendance = Math.round(capacity * Math.min(0.96, Math.max(0.35, fill)));

  const stadium = {
    name: stadiumNameFor(club.name),
    club: club.name,
    country: club.country,
    capacity,
    avgAttendance,
    atmosphere: Math.round(50 + (media - 45) * 0.8 + (h % 15)), // ambiente base
    ticketPrice: Math.round(12 + Math.pow(media - 44, 1.35)),   // USD por entrada
    condition: 55 + (h % 45),                                    // 55..99
    lastRenovation: 2018 + (h % 7),
    upgrades: []
  };

  // Historial de remodelaciones estable por club
  if (stadium.condition < 70) {
    stadium.upgrades.push({ year: stadium.lastRenovation, type: 'Remodelación de tribunas', note: 'Ampliación y mejoras en accesos.' });
  }
  if (capacity >= 40000) {
    stadium.upgrades.push({ year: stadium.lastRenovation + 3, type: 'Nueva platea VIP', note: 'Sector premium y palcos corporativos.' });
  }

  cache.set(key, stadium);
  return stadium;
}

/** Asistencia esperada para un partido concreto. */
function attendanceFor(stadium, context = {}) {
  const { isClassic = false, isBigMatch = false, isFinal = false, opponentMedia = 60 } = context;
  let factor = 1.0;
  if (isFinal) factor *= 1.25;
  else if (isClassic) factor *= 1.18;
  else if (isBigMatch) factor *= 1.1;

  // Contra el último de la tabla hay menos gente
  if (opponentMedia <= 55) factor *= 0.85;

  const attendance = Math.round((stadium.avgAttendance || 0) * factor);
  return Math.min(stadium.capacity, Math.max(1200, attendance));
}

/** Ingresos por taquilla de un partido. */
function revenueFor(stadium, attendance) {
  const att = attendance || stadium.avgAttendance || 10000;
  return Math.round(att * (stadium.ticketPrice || 25));
}

/** Ambiente del día: base + factor por contexto. */
function atmosphereFor(stadium, context = {}) {
  const { isClassic = false, isFinal = false } = context;
  let atm = stadium.atmosphere || 60;
  if (isFinal) atm += 12;
  else if (isClassic) atm += 10;
  return Math.max(20, Math.min(100, atm + rand(-6, 6)));
}

/** Texto resumido para embeds. */
function stadiumLine(clubName, context = {}) {
  const stadium = getStadium(clubName);
  const att = attendanceFor(stadium, context);
  const atm = atmosphereFor(stadium, context);
  const revenue = revenueFor(stadium, att);
  return `🏟️ **${stadium.name}** · Asistencia: **${att.toLocaleString('en-US')}** (${Math.round((att / stadium.capacity) * 100)}%) · Ambiente: ${'🔥'.repeat(Math.max(1, Math.round(atm / 25)))} · Taquilla: **$${revenue.toLocaleString('en-US')}**`;
}

function describeStadium(stadium) {
  return {
    ...stadium,
    fillRate: stadium.capacity ? Math.round((stadium.avgAttendance / stadium.capacity) * 100) : 0
  };
}

module.exports = {
  getStadium,
  attendanceFor,
  revenueFor,
  atmosphereFor,
  stadiumLine,
  describeStadium
};
