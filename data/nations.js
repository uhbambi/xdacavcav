'use strict';

/**
 * Selecciones nacionales para el Mundial (y amistosos / eliminatorias).
 * `media` = fuerza del combinado; se usa igual que la media de un club.
 */

const NATIONS = [
  { name: 'Argentina', country: 'Argentina', media: 87, confed: 'CONMEBOL' },
  { name: 'Brasil', country: 'Brasil', media: 86, confed: 'CONMEBOL' },
  { name: 'Francia', country: 'Francia', media: 86, confed: 'UEFA' },
  { name: 'Espana', country: 'Espana', media: 85, confed: 'UEFA' },
  { name: 'Inglaterra', country: 'Inglaterra', media: 85, confed: 'UEFA' },
  { name: 'Alemania', country: 'Alemania', media: 83, confed: 'UEFA' },
  { name: 'Portugal', country: 'Portugal', media: 84, confed: 'UEFA' },
  { name: 'Paises Bajos', country: 'Paises Bajos', media: 82, confed: 'UEFA' },
  { name: 'Italia', country: 'Italia', media: 81, confed: 'UEFA' },
  { name: 'Belgica', country: 'Belgica', media: 80, confed: 'UEFA' },
  { name: 'Uruguay', country: 'Uruguay', media: 80, confed: 'CONMEBOL' },
  { name: 'Croacia', country: 'Croacia', media: 79, confed: 'UEFA' },
  { name: 'Colombia', country: 'Colombia', media: 79, confed: 'CONMEBOL' },
  { name: 'Marruecos', country: 'Marruecos', media: 78, confed: 'CAF' },
  { name: 'Mexico', country: 'Mexico', media: 76, confed: 'CONCACAF' },
  { name: 'Estados Unidos', country: 'Estados Unidos', media: 75, confed: 'CONCACAF' },
  { name: 'Suiza', country: 'Suiza', media: 76, confed: 'UEFA' },
  { name: 'Dinamarca', country: 'Dinamarca', media: 77, confed: 'UEFA' },
  { name: 'Japon', country: 'Japon', media: 76, confed: 'AFC' },
  { name: 'Corea del Sur', country: 'Corea del Sur', media: 74, confed: 'AFC' },
  { name: 'Senegal', country: 'Senegal', media: 76, confed: 'CAF' },
  { name: 'Nigeria', country: 'Nigeria', media: 74, confed: 'CAF' },
  { name: 'Ecuador', country: 'Ecuador', media: 74, confed: 'CONMEBOL' },
  { name: 'Peru', country: 'Peru', media: 71, confed: 'CONMEBOL' },
  { name: 'Chile', country: 'Chile', media: 72, confed: 'CONMEBOL' },
  { name: 'Paraguay', country: 'Paraguay', media: 71, confed: 'CONMEBOL' },
  { name: 'Bolivia', country: 'Bolivia', media: 66, confed: 'CONMEBOL' },
  { name: 'Venezuela', country: 'Venezuela', media: 69, confed: 'CONMEBOL' },
  { name: 'Australia', country: 'Australia', media: 71, confed: 'AFC' },
  { name: 'Arabia Saudita', country: 'Arabia Saudita', media: 70, confed: 'AFC' },
  { name: 'Ghana', country: 'Ghana', media: 72, confed: 'CAF' },
  { name: 'Canada', country: 'Canada', media: 72, confed: 'CONCACAF' },
  { name: 'Costa Rica', country: 'Costa Rica', media: 68, confed: 'CONCACAF' },
  { name: 'Polonia', country: 'Polonia', media: 74, confed: 'UEFA' },
  { name: 'Serbia', country: 'Serbia', media: 75, confed: 'UEFA' },
  { name: 'Turquia', country: 'Turquia', media: 74, confed: 'UEFA' }
];

const NATION_FLAGS = {
  Argentina: '🇦🇷', Brasil: '🇧🇷', Francia: '🇫🇷', Espana: '🇪🇸', Inglaterra: '🏴',
  Alemania: '🇩🇪', Portugal: '🇵🇹', 'Paises Bajos': '🇳🇱', Italia: '🇮🇹', Belgica: '🇧🇪',
  Uruguay: '🇺🇾', Croacia: '🇭🇷', Colombia: '🇨🇴', Marruecos: '🇲🇦', Mexico: '🇲🇽',
  'Estados Unidos': '🇺🇸', Suiza: '🇨🇭', Dinamarca: '🇩🇰', Japon: '🇯🇵', 'Corea del Sur': '🇰🇷',
  Senegal: '🇸🇳', Nigeria: '🇳🇬', Ecuador: '🇪🇨', Peru: '🇵🇪', Chile: '🇨🇱', Paraguay: '🇵🇾',
  Bolivia: '🇧🇴', Venezuela: '🇻🇪', Australia: '🇦🇺', 'Arabia Saudita': '🇸🇦', Ghana: '🇬🇭',
  Canada: '🇨🇦', 'Costa Rica': '🇨🇷', Polonia: '🇵🇱', Serbia: '🇷🇸', Turquia: '🇹🇷'
};

function findNation(country) {
  return NATIONS.find(n => n.country.toLowerCase() === String(country).toLowerCase()) || null;
}

function nationFlag(name) {
  return NATION_FLAGS[name] || '🏳️';
}

/** Convierte una seleccion en un "club" simulable (misma forma que los clubes) */
function nationAsClub(nation) {
  return { name: nation.name, media: nation.media, tier: 5, isNation: true };
}

module.exports = { NATIONS, findNation, nationFlag, nationAsClub };
