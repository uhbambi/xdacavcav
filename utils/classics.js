'use strict';

/**
 * Sistema de Clásicos Históricos
 * Partidos con intensidad extra, bonus de sueldo y minijuego garantizado
 */

const CLASSICS = [
  { home: 'Boca Juniors', away: 'River Plate', name: 'Superclásico' },
  { home: 'Flamengo', away: 'Fluminense', name: 'Clássico Carioca' },
  { home: 'Flamengo', away: 'Vasco da Gama', name: 'Clássico dos Gigantes' },
  { home: 'São Paulo', away: 'Corinthians', name: 'Derby Paulista' },
  { home: 'Palmeiras', away: 'Corinthians', name: 'Derby Paulista' },
  { home: 'Real Madrid', away: 'Barcelona', name: 'El Clásico' },
  { home: 'Barcelona', away: 'Real Madrid', name: 'El Clásico' },
  { home: 'Sevilla', away: 'Real Betis', name: 'Derbi Sevillano' },
  { home: 'AC Milan', away: 'Inter Milan', name: 'Derby della Madonnina' },
  { home: 'Juventus', away: 'Torino', name: 'Derby della Mole' },
  { home: 'Manchester United', away: 'Manchester City', name: 'Manchester Derby' },
  { home: 'Manchester United', away: 'Liverpool', name: 'North West Derby' },
  { home: 'Arsenal', away: 'Tottenham', name: 'North London Derby' },
  { home: 'Chelsea', away: 'Arsenal', name: 'West London Derby' },
  { home: 'Bayern Munich', away: 'Borussia Dortmund', name: 'Klassiker' },
  { home: 'Paris Saint-Germain', away: 'Olympique Marseille', name: 'Le Classique' },
  { home: 'Paris Saint-Germain', away: 'Lyon', name: 'Trophée des Champions' },
  { home: 'Benfica', away: 'Porto', name: 'Clássico' },
  { home: 'Sporting CP', away: 'Benfica', name: 'Clássico Jogo da Discórdia' },
  { home: 'Colo-Colo', away: 'Universidad de Chile', name: 'Superclásico Chileno' },
  { home: 'América', away: 'Guadalajara', name: 'Clásico Tapatío' },
  { home: 'Millonarios', away: 'Santa Fe', name: 'Clásico Capitalino' },
  { home: 'Atlético Nacional', away: 'Deportivo Independiente Medellín', name: 'Clásico Paisa' }
];

function isClassicMatch(myClub, opponentClub) {
  return CLASSICS.some(c => 
    (c.home === myClub && c.away === opponentClub) ||
    (c.home === opponentClub && c.away === myClub)
  );
}

function getClassicData(myClub, opponentClub) {
  const classic = CLASSICS.find(c => 
    (c.home === myClub && c.away === opponentClub) ||
    (c.home === opponentClub && c.away === myClub)
  );
  
  if (!classic) return null;
  
  return {
    isClassic: true,
    name: classic.name,
    ratingBonus: 0.3,
    goalsMultiplier: 1.3,
    moraleWinBonus: 5,
    moraleLossBonus: -5,
    salaryBonus: 1.3,
    minigameGuaranteed: true
  };
}

module.exports = {
  CLASSICS,
  isClassicMatch,
  getClassicData
};