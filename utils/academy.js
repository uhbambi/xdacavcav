'use strict';

const { rand, pick } = require('./simulation.js');
const { newAttributes, overallFrom } = require('./attributes.js');
const { formatMoney } = require('./economy.js');

const FIRST_NAMES = [
  'Mateo', 'Lucas', 'Thiago', 'Benjamín', 'Agustín', 'Gabriel', 'Valentín',
  'Franco', 'Tomás', 'Ignacio', 'Luka', 'Enzo', 'Pedri', 'Gavi', 'Lamine',
  'Jude', 'Kylian', 'Vinícius', 'Endrick', 'Bellingham', 'Arda', 'Joao'
];

const LAST_NAMES = [
  'Fernández', 'González', 'Rodríguez', 'López', 'Silva', 'Santos', 'Morales',
  'Navarro', 'Soto', 'Vargas', 'Pizarro', 'Medina', 'Rojas', 'Díaz', 'Muñoz',
  'Castillo', 'García', 'Alarcón', 'Herrera', 'Campos', 'Valenzuela', 'Baeza'
];

const PROSPECT_TRAITS = [
  'Regateador Eléctrico ⚡',
  'Defensor Férreo 🛡️',
  'Francotirador de Larga Distancia 🎯',
  'Visión Panorámica 🪄',
  'Portento Físico 🦍',
  'Arquero Felino 🧤',
  'Instinto Goleador ⚽'
];

/**
 * Genera un canterano / wonderkid procedural
 */
function generateYouthProspect(clubMedia = 70, nationality = 'Chile') {
  const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const positions = ['DEL', 'EXT', 'VOL', 'MED', 'DEF', 'LAT', 'POR'];
  const position = pick(positions);
  const age = rand(15, 18);

  const attributes = newAttributes(position);
  const targetOvr = Math.max(56, Math.min(74, Math.round(clubMedia * 0.85 + rand(-4, 6))));
  const current = overallFrom(attributes, position);
  const diff = targetOvr - current;
  for (const k of Object.keys(attributes)) {
    attributes[k] = Math.max(30, Math.min(95, attributes[k] + diff + rand(-3, 3)));
  }

  const overall = overallFrom(attributes, position);
  const potential = Math.min(95, Math.max(overall + rand(12, 24), rand(80, 95)));

  let scoutVerdict = 'Promesa con interesante margen de proyección';
  if (potential >= 90) scoutVerdict = '💎 ¡JOYA GENERACIONAL! Potencial Balón de Oro';
  else if (potential >= 85) scoutVerdict = '🌟 Wonderkid con futuro de Selección Absoluta';
  else if (potential >= 80) scoutVerdict = '📈 Titular garantizado de Primera División';

  const marketValue = Math.round(Math.pow(overall / 40, 4) * 120000 * (potential / 70));

  return {
    id: `youth_${Date.now()}_${rand(100, 999)}`,
    name,
    position,
    age,
    nationality,
    attributes,
    overall,
    potential,
    trait: pick(PROSPECT_TRAITS),
    scoutReport: scoutVerdict,
    scoutVerdict,
    marketValue,
    value: marketValue,
    promoted: false
  };
}

/**
 * Genera una camada de juveniles para la academia del club
 */
function generateClubAcademy(clubName = 'Club', clubMedia = 70, nationality = 'Chile') {
  const count = rand(3, 5);
  const prospects = [];
  for (let i = 0; i < count; i++) {
    prospects.push(generateYouthProspect(clubMedia, nationality));
  }
  return prospects;
}

const _academyCache = {};

function getClubAcademy(clubName = 'Club', clubMedia = 70, nationality = 'Chile') {
  if (!_academyCache[clubName]) {
    _academyCache[clubName] = {
      club: clubName,
      prospects: generateClubAcademy(clubName, clubMedia, nationality)
    };
  }
  return _academyCache[clubName];
}

function promoteProspect(clubName, prospectId) {
  const academy = getClubAcademy(clubName);
  const index = academy.prospects.findIndex(p => p.id === prospectId);
  if (index >= 0) {
    const [promoted] = academy.prospects.splice(index, 1);
    promoted.promoted = true;
    return promoted;
  }
  return null;
}

module.exports = {
  generateYouthProspect,
  generateClubAcademy,
  generateYouthAcademy: generateClubAcademy,
  getClubAcademy,
  promoteProspect
};
