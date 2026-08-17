'use strict';

const { rand, pick } = require('./simulation.js');
const { getAllClubs, findClub, getLeague, LEAGUES, FLAGS } = require('../data/clubs.js');
const { ATTR_LABELS } = require('./attributes.js');
const storage = require('../data/storage.js');

/**
 * FORMACIONES TÁCTICAS DISPONIBLES EN MODO DT
 */
const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3 Ofensivo',
    category: 'Ofensivo',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'DFI', label: 'DFI', x: 18, y: 72, role: 'Lateral Izquierdo' },
      { id: 'DFC1', label: 'DFC', x: 38, y: 75, role: 'Defensa Central' },
      { id: 'DFC2', label: 'DFC', x: 62, y: 75, role: 'Defensa Central' },
      { id: 'DFD', label: 'DFD', x: 82, y: 72, role: 'Lateral Derecho' },
      { id: 'MCD', label: 'MCD', x: 50, y: 55, role: 'Volante Tapón' },
      { id: 'MC1', label: 'MC', x: 32, y: 44, role: 'Volante Mixto' },
      { id: 'MC2', label: 'MC', x: 68, y: 44, role: 'Volante Creativo' },
      { id: 'EI', label: 'EI', x: 20, y: 22, role: 'Extremo Izquierdo' },
      { id: 'DC', label: 'DC', x: 50, y: 16, role: 'Centrodelantero' },
      { id: 'ED', label: 'ED', x: 80, y: 22, role: 'Extremo Derecho' }
    ],
    bonus: { attack: 1.15, defense: 0.95, possession: 1.05 }
  },
  '4-4-2': {
    name: '4-4-2 Clásico Equilibrado',
    category: 'Equilibrado',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'DFI', label: 'DFI', x: 18, y: 72, role: 'Lateral Izquierdo' },
      { id: 'DFC1', label: 'DFC', x: 38, y: 75, role: 'Defensa Central' },
      { id: 'DFC2', label: 'DFC', x: 62, y: 75, role: 'Defensa Central' },
      { id: 'DFD', label: 'DFD', x: 82, y: 72, role: 'Lateral Derecho' },
      { id: 'MI', label: 'MI', x: 18, y: 48, role: 'Volante Izquierdo' },
      { id: 'MC1', label: 'MC', x: 38, y: 50, role: 'Volante Central' },
      { id: 'MC2', label: 'MC', x: 62, y: 50, role: 'Volante Central' },
      { id: 'MD', label: 'MD', x: 82, y: 48, role: 'Volante Derecho' },
      { id: 'DC1', label: 'DC', x: 38, y: 18, role: 'Delantero' },
      { id: 'DC2', label: 'DC', x: 62, y: 18, role: 'Delantero' }
    ],
    bonus: { attack: 1.05, defense: 1.05, possession: 1.0 }
  },
  '4-2-3-1': {
    name: '4-2-3-1 Control y Creación',
    category: 'Posesión',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'DFI', label: 'DFI', x: 18, y: 72, role: 'Lateral Izquierdo' },
      { id: 'DFC1', label: 'DFC', x: 38, y: 75, role: 'Defensa Central' },
      { id: 'DFC2', label: 'DFC', x: 62, y: 75, role: 'Defensa Central' },
      { id: 'DFD', label: 'DFD', x: 82, y: 72, role: 'Lateral Derecho' },
      { id: 'MCD1', label: 'MCD', x: 36, y: 58, role: 'Doble Pivote' },
      { id: 'MCD2', label: 'MCD', x: 64, y: 58, role: 'Doble Pivote' },
      { id: 'MI', label: 'MI', x: 20, y: 36, role: 'Mediapunta Izq.' },
      { id: 'MCO', label: 'MCO', x: 50, y: 34, role: 'Enganche / 10' },
      { id: 'MD', label: 'MD', x: 80, y: 36, role: 'Mediapunta Der.' },
      { id: 'DC', label: 'DC', x: 50, y: 16, role: 'Punta Solitario' }
    ],
    bonus: { attack: 1.1, defense: 1.05, possession: 1.15 }
  },
  '3-5-2': {
    name: '3-5-2 Presión y Dominio Medular',
    category: 'Presión Alta',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'DFC1', label: 'DFC', x: 28, y: 74, role: 'Stopper Izquierdo' },
      { id: 'DFC2', label: 'LIB', x: 50, y: 76, role: 'Líbero Central' },
      { id: 'DFC3', label: 'DFC', x: 72, y: 74, role: 'Stopper Derecho' },
      { id: 'CAI', label: 'CAI', x: 14, y: 48, role: 'Carrilero Izq.' },
      { id: 'MC1', label: 'MC', x: 36, y: 52, role: 'Volante Mixto' },
      { id: 'MCD', label: 'MCD', x: 50, y: 60, role: 'Tapón' },
      { id: 'MC2', label: 'MC', x: 64, y: 52, role: 'Volante Mixto' },
      { id: 'CAD', label: 'CAD', x: 86, y: 48, role: 'Carrilero Der.' },
      { id: 'DC1', label: 'DC', x: 38, y: 18, role: 'Segundo Delantero' },
      { id: 'DC2', label: 'DC', x: 62, y: 18, role: 'Goleador' }
    ],
    bonus: { attack: 1.12, defense: 0.98, possession: 1.18 }
  },
  '5-3-2': {
    name: '5-3-2 Muralla Defensiva / Contra',
    category: 'Defensivo',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'CAI', label: 'CAI', x: 14, y: 70, role: 'Carrilero Izq.' },
      { id: 'DFC1', label: 'DFC', x: 32, y: 76, role: 'Central Izq.' },
      { id: 'DFC2', label: 'LIB', x: 50, y: 78, role: 'Líbero' },
      { id: 'DFC3', label: 'DFC', x: 68, y: 76, role: 'Central Der.' },
      { id: 'CAD', label: 'CAD', x: 86, y: 70, role: 'Carrilero Der.' },
      { id: 'MC1', label: 'MC', x: 32, y: 50, role: 'Contención' },
      { id: 'MCD', label: 'MCD', x: 50, y: 55, role: 'Pivote' },
      { id: 'MC2', label: 'MC', x: 68, y: 50, role: 'Lanzador' },
      { id: 'DC1', label: 'DC', x: 38, y: 18, role: 'Punta Rápido' },
      { id: 'DC2', label: 'DC', x: 62, y: 18, role: 'Torre de Área' }
    ],
    bonus: { attack: 0.9, defense: 1.3, counter: 1.25 }
  },
  '3-4-3': {
    name: '3-4-3 Ataque Total',
    category: 'Ataque Total',
    slots: [
      { id: 'POR', label: 'POR', x: 50, y: 88, role: 'Portero' },
      { id: 'DFC1', label: 'DFC', x: 28, y: 74, role: 'Central Izq.' },
      { id: 'DFC2', label: 'DFC', x: 50, y: 76, role: 'Central' },
      { id: 'DFC3', label: 'DFC', x: 72, y: 74, role: 'Central Der.' },
      { id: 'MI', label: 'MI', x: 16, y: 48, role: 'Volante Izq.' },
      { id: 'MC1', label: 'MC', x: 40, y: 50, role: 'Mediocentro' },
      { id: 'MC2', label: 'MC', x: 60, y: 50, role: 'Mediocentro' },
      { id: 'MD', label: 'MD', x: 84, y: 48, role: 'Volante Der.' },
      { id: 'EI', label: 'EI', x: 22, y: 20, role: 'Extremo Izq.' },
      { id: 'DC', label: 'DC', x: 50, y: 16, role: 'Centrodelantero' },
      { id: 'ED', label: 'ED', x: 78, y: 20, role: 'Extremo Der.' }
    ],
    bonus: { attack: 1.3, defense: 0.85, possession: 1.05 }
  }
};

const TACTICAL_STYLES = {
  ofensivo: { name: 'Fútbol Ofensivo', desc: 'Presión adelantada y búsqueda constante del arco rival.', bonus: 'Ataque +15%, Riesgo de contra' },
  tiki_taka: { name: 'Posesión / Tiki-Taka', desc: 'Circulación paciente del balón y desmarques precisos.', bonus: 'Posesión +20%, Precisión de pases' },
  contraataque: { name: 'Contraataque Letal', desc: 'Líneas juntas y transiciones supersónicas con velocidad.', bonus: 'Efectividad en contra +25%' },
  presion_alta: { name: 'Gegenpressing (Presión Alta)', desc: 'Asfixia constante al rival en su propio campo tras pérdida.', bonus: 'Recuperación alta, Desgaste físico' },
  cerrojo: { name: 'Catenaccio / Cerrojo', desc: 'Orden defensivo extremo, juego aéreo y despejes seguros.', bonus: 'Defensa +30%, Menos goles en contra' },
  equilibrado: { name: 'Estilo Equilibrado', desc: 'Adaptación según el ritmo y el marcador del partido.', bonus: 'Balance completo' }
};

const CHARLAS_VESTUARIO = {
  motivacional: {
    id: 'motivacional',
    title: 'Arenga Motivacional',
    text: '¡A dejar la vida en la cancha, muchachos!',
    label: '🔥 Arenga Motivacional',
    morale: 6,
    stamina: -2,
    focusBoost: 0,
    desc: 'Sube la intensidad y la moral del plantel.'
  },
  tactica: {
    id: 'tactica',
    title: 'Indicación Táctica',
    text: 'Concentración máxima en las marcas y en la salida.',
    label: '📋 Indicación Táctica',
    focus: 5,
    morale: 2,
    focusBoost: 5,
    desc: 'Mejora el orden y reduce errores defensivos.'
  },
  tranquilidad: {
    id: 'tranquilidad',
    title: 'Mensaje de Calma',
    text: 'Jueguen sin presión, disfruten del partido.',
    label: '🧘 Mensaje de Calma',
    morale: 4,
    composure: 6,
    focusBoost: 3,
    desc: 'Reduce el pánico ante rivales difíciles.'
  },
  exigencia: {
    id: 'exigencia',
    title: 'Reto y Exigencia',
    text: '¡No los veo con hambre de ganar!',
    label: '⚡ Reto y Exigencia',
    morale: -2,
    aggression: 7,
    focusBoost: 4,
    desc: 'Mete presión al equipo; útil si venían jugando flojo.'
  }
};

// Nombres y apellidos realistas para generación de jugadores del plantel
const FIRST_NAMES = ['Matías', 'Lucas', 'Nicolás', 'Santiago', 'Joaquín', 'Rodrigo', 'Facundo', 'Lautaro', 'Enzo', 'Julián', 'Federico', 'Thiago', 'Benjamín', 'Gabriel', 'Ignacio', 'Esteban', 'Diego', 'Bruno', 'Emiliano', 'Gonzalo', 'Maximiliano', 'Alexis', 'Arturo', 'Cristian', 'Álvaro', 'Felipe', 'Tomás', 'Marcos', 'Agustín', 'Mauro'];
const LAST_NAMES = ['García', 'Rodríguez', 'Fernández', 'González', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sánchez', 'Díaz', 'Álvarez', 'Romero', 'Sosa', 'Torres', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas', 'Ortiz', 'Morales'];

function randomPlayerName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

/**
 * Genera un plantel completo de 22 jugadores adaptado al nivel de media del club
 */
function generateClubSquad(club) {
  const targetMedia = club.media || 65;
  const positionsNeeded = [
    // 3 Arqueros
    { pos: 'POR', role: 'Portero Titular', count: 1, bias: 2 },
    { pos: 'POR', role: 'Portero Suplente', count: 1, bias: -4 },
    { pos: 'POR', role: 'Portero Reserva', count: 1, bias: -10 },
    // 7 Defensas
    { pos: 'DEF', role: 'Central Titular 1', count: 1, bias: 2 },
    { pos: 'DEF', role: 'Central Titular 2', count: 1, bias: 1 },
    { pos: 'DEF', role: 'Lateral Izq Titular', count: 1, bias: 1 },
    { pos: 'DEF', role: 'Lateral Der Titular', count: 1, bias: 1 },
    { pos: 'DEF', role: 'Defensa Polivalente', count: 1, bias: -3 },
    { pos: 'DEF', role: 'Lateral Suplente', count: 1, bias: -4 },
    { pos: 'DEF', role: 'Central Joven Promesa', count: 1, bias: -7, potentialBias: 8 },
    // 7 Mediocampistas
    { pos: 'MED', role: 'Volante Tapón Titular', count: 1, bias: 2 },
    { pos: 'MED', role: 'Mediocentro Mixto', count: 1, bias: 2 },
    { pos: 'MED', role: 'Enganche Creativo', count: 1, bias: 3 },
    { pos: 'MED', role: 'Volante de Banda', count: 1, bias: 0 },
    { pos: 'MED', role: 'Mediocampista Suplente', count: 1, bias: -3 },
    { pos: 'MED', role: 'Volante Ofensivo', count: 1, bias: -2 },
    { pos: 'MED', role: 'Joven Promesa Cantera', count: 1, bias: -8, potentialBias: 10 },
    // 5 Delanteros
    { pos: 'DEL', role: 'Goleador Estrella', count: 1, bias: 4 },
    { pos: 'DEL', role: 'Extremo Rápido', count: 1, bias: 2 },
    { pos: 'DEL', role: 'Segundo Delantero', count: 1, bias: 0 },
    { pos: 'DEL', role: 'Delantero de Área', count: 1, bias: -3 },
    { pos: 'DEL', role: 'Joven Delantero', count: 1, bias: -6, potentialBias: 9 }
  ];

  let idCounter = 1;
  const squad = [];

  for (const item of positionsNeeded) {
    const age = item.potentialBias ? rand(17, 21) : rand(22, 33);
    const overall = Math.max(45, Math.min(96, targetMedia + item.bias + rand(-2, 2)));
    const potential = Math.max(overall, Math.min(99, overall + (item.potentialBias || rand(0, 5))));
    
    // Atributos acordes
    const isPOR = item.pos === 'POR';
    const isDEF = item.pos === 'DEF';
    const isMED = item.pos === 'MED';
    const isDEL = item.pos === 'DEL';

    const attributes = {
      ritmo: Math.max(35, Math.min(99, overall + (isDEL ? rand(3, 8) : isDEF ? rand(-4, 3) : rand(-2, 4)))),
      tiro: Math.max(30, Math.min(99, overall + (isDEL ? rand(4, 9) : isPOR ? -25 : rand(-5, 4)))),
      pase: Math.max(35, Math.min(99, overall + (isMED ? rand(4, 9) : isDEF ? rand(-6, 2) : rand(-2, 3)))),
      regate: Math.max(35, Math.min(99, overall + (isDEL || isMED ? rand(2, 7) : isDEF ? -8 : -15))),
      defensa: Math.max(30, Math.min(99, overall + (isDEF || isPOR ? rand(4, 9) : isDEL ? -18 : rand(-4, 4)))),
      fisico: Math.max(40, Math.min(99, overall + rand(-3, 6)))
    };

    const value = Math.round(Math.pow(overall / 10, 3.5) * 8000 + rand(50000, 300000));
    const wage = Math.round(value * 0.04 + rand(5000, 20000));

    squad.push({
      id: `p_${idCounter++}`,
      name: randomPlayerName(),
      position: item.pos,
      role: item.role,
      age,
      overall,
      potential,
      attributes,
      morale: rand(70, 95),
      stamina: 100,
      energy: 100,
      form: rand(6, 9),
      goals: 0,
      assists: 0,
      apps: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      marketValue: value,
      wage,
      injuredMatches: 0
    });
  }

  return squad;
}

/**
 * Crea una nueva carrera como Director Técnico
 */
function newManager({ name, clubName, userId, startingAge = 42, tacticStyle = 'ofensivo', formation = '4-3-3' }) {
  const club = findClub(clubName) || { name: clubName, media: 68, leagueKey: 'CHILE_A', tier: 1 };
  const league = getLeague(club.leagueKey) || { name: 'Primera División', country: 'CHILE' };
  const squad = generateClubSquad(club);

  // Seleccionar automáticamente el 11 titular inicial basado en las mejores medias por posición
  const porPlayers = squad.filter(p => p.position === 'POR').sort((a, b) => b.overall - a.overall);
  const defPlayers = squad.filter(p => p.position === 'DEF').sort((a, b) => b.overall - a.overall);
  const medPlayers = squad.filter(p => p.position === 'MED').sort((a, b) => b.overall - a.overall);
  const delPlayers = squad.filter(p => p.position === 'DEL').sort((a, b) => b.overall - a.overall);

  const startingXI = [
    porPlayers[0] ? porPlayers[0].id : squad[0].id,
    defPlayers[0] ? defPlayers[0].id : squad[1].id,
    defPlayers[1] ? defPlayers[1].id : squad[2].id,
    defPlayers[2] ? defPlayers[2].id : squad[3].id,
    defPlayers[3] ? defPlayers[3].id : squad[4].id,
    medPlayers[0] ? medPlayers[0].id : squad[5].id,
    medPlayers[1] ? medPlayers[1].id : squad[6].id,
    medPlayers[2] ? medPlayers[2].id : squad[7].id,
    delPlayers[0] ? delPlayers[0].id : squad[8].id,
    delPlayers[1] ? delPlayers[1].id : squad[9].id,
    delPlayers[2] ? delPlayers[2].id : squad[10].id
  ];

  const bench = squad.filter(p => !startingXI.includes(p.id)).slice(0, 7).map(p => p.id);

  // Objetivos según el club
  const isTopClub = (club.media || 65) >= 75;
  const isMidClub = (club.media || 65) >= 65 && (club.media || 65) < 75;
  
  const objectives = isTopClub
    ? [
        { id: 'league', title: `Campeón de ${league.name}`, target: '1° Puesto', reward: '$12,000,000', completed: false },
        { id: 'cup', title: 'Llegar a la Final de Copa', target: 'Finalista', reward: '$5,000,000', completed: false },
        { id: 'youngsters', title: 'Dar rodaje a 1 promesa juvenil (10+ partidos)', target: '1 Joven', reward: '$2,000,000', completed: false }
      ]
    : isMidClub
    ? [
        { id: 'top4', title: `Clasificar a Copas Internacionales (Top 4 en ${league.name})`, target: 'Top 4', reward: '$6,000,000', completed: false },
        { id: 'cup', title: 'Avanzar a Cuartos de Copa', target: 'Cuartos de final', reward: '$2,500,000', completed: false },
        { id: 'budget', title: 'Mantener superávit financiero', target: 'Finanzas Sanas', reward: '$1,500,000', completed: false }
      ]
    : [
        { id: 'salvation', title: `Evitar el descenso en ${league.name}`, target: 'Permanencia', reward: '$4,000,000', completed: false },
        { id: 'points', title: 'Conseguir al menos 32 puntos en la temporada', target: '32 Puntos', reward: '$1,500,000', completed: false }
      ];

  const initialBudget = Math.round(Math.pow((club.media || 65) / 10, 3) * 600000 + rand(2000000, 8000000));

  return {
    id: userId || `dt_${Date.now()}`,
    userId: userId || `dt_${Date.now()}`,
    name: name || 'Director Técnico',
    age: startingAge,
    club: club.name,
    clubMedia: club.media || 68,
    leagueKey: club.leagueKey,
    leagueName: league.name,
    country: league.country,
    stage: 'liga',
    reputation: Math.min(99, Math.max(30, (club.media || 65) - 5 + rand(0, 5))),
    tacticStyle,
    formation,
    mentality: 'equilibrada', // ultra_defensiva, defensiva, equilibrada, ofensiva, ataque_total
    passingStyle: 'mixto', // corto, directo, mixto, bandas
    pressing: 'media', // baja, media, alta
    squad,
    startingXI,
    bench,
    captainId: startingXI[0],
    penaltyTakerId: startingXI[8] || startingXI[0],
    freeKickTakerId: startingXI[6] || startingXI[0],
    boardConfidence: 85, // 0 - 100
    fanConfidence: 80, // 0 - 100
    budget: initialBudget,
    wageBudget: Math.round(initialBudget * 0.3),
    season: 1,
    seasonObjectives: objectives,
    records: {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      trophies: []
    },
    seasonStats: {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0
    },
    trophies: [],
    matchdayIndex: 0,
    matchdayTotal: 18,
    table: [],
    recentForm: [], // ['V', 'V', 'E', 'D']
    tacticsHistory: [],
    pressQuestions: [],
    createdAt: Date.now()
  };
}

/**
 * Convierte un jugador retirado en Director Técnico
 */
function transitionPlayerToManager(player, chosenClub) {
  const managerName = `DT ${player.name}`;
  const targetClub = chosenClub || player.club;
  const startingAge = Math.max(40, player.age || 42);
  const manager = newManager({
    name: managerName,
    clubName: targetClub,
    userId: player.id || player.userId,
    startingAge,
    tacticStyle: 'ofensivo',
    formation: '4-3-3'
  });

  // Hereda prestigio y reputación según su carrera de jugador
  const careerTrophies = player.career?.trophies?.length || 0;
  const careerGoals = player.career?.goals || 0;
  manager.reputation = Math.min(99, Math.round(50 + careerTrophies * 4 + (player.overall / 4)));
  manager.records.playerLegacy = {
    originalPlayerName: player.name,
    playerGoals: careerGoals,
    playerTrophies: careerTrophies,
    playerApps: player.career?.apps || 0
  };

  return manager;
}

/**
 * Calcula la química del equipo y la media general del 11 titular
 */
function calculateTeamChemistryAndRating(manager) {
  const formationDef = FORMATIONS[manager.formation] || FORMATIONS['4-3-3'];
  const xiPlayers = manager.startingXI.map(id => manager.squad.find(p => p.id === id)).filter(Boolean);

  let totalRating = 0;
  let positionalBonus = 0;
  let moraleSum = 0;

  xiPlayers.forEach((p, idx) => {
    totalRating += p.overall;
    moraleSum += p.morale;

    // Verificar si el jugador está jugando en su posición natural
    const slot = formationDef.slots[idx];
    if (slot) {
      if (
        (slot.id.startsWith('DEF') || slot.id.startsWith('DF') || slot.id.startsWith('CA') || slot.id === 'LIB') && p.position === 'DEF' ||
        (slot.id.startsWith('MC') || slot.id.startsWith('MI') || slot.id.startsWith('MD') || slot.id.startsWith('MCD') || slot.id.startsWith('MCO')) && p.position === 'MED' ||
        (slot.id.startsWith('DC') || slot.id.startsWith('EI') || slot.id.startsWith('ED') || slot.id.startsWith('DEL')) && p.position === 'DEL' ||
        slot.id === 'POR' && p.position === 'POR'
      ) {
        positionalBonus += 3;
      } else {
        positionalBonus -= 5;
      }
    }
  });

  const avgRating = xiPlayers.length ? Math.round(totalRating / xiPlayers.length) : 60;
  const avgMorale = xiPlayers.length ? Math.round(moraleSum / xiPlayers.length) : 75;
  const chemistry = Math.max(30, Math.min(100, Math.round(60 + (positionalBonus / 2) + (avgMorale - 70) * 0.4)));

  return {
    avgRating,
    avgMorale,
    chemistry,
    effectiveRating: Math.round(avgRating * 0.8 + (chemistry / 100) * 15 + (manager.reputation / 100) * 5)
  };
}

/**
 * Simula un partido completo en Modo DT con eventos interactivos minuto a minuto
 */
function simulateDTMatch(manager, opponentName, teamTalk = null, inGameTactics = {}) {
  const oppNameStr = typeof opponentName === 'object' && opponentName ? opponentName.name : (opponentName || 'Rival');
  const clubName = manager.club || 'Tu Club';
  const opponentClub = findClub(oppNameStr) || { name: oppNameStr, media: 68 };
  const teamMetrics = calculateTeamChemistryAndRating(manager);
  const myRating = teamMetrics.effectiveRating;
  const oppRating = opponentClub.media || 68;

  // Modificadores de charla de vestuario: si no se pasa una explícita, se consume
  // la charla guardada por el DT (efecto de un solo partido).
  if (!teamTalk) {
    teamTalk = manager.lastTeamTalk || null;
    manager.lastTeamTalk = null;
  }
  let tacticalBoost = 0;
  if (teamTalk) {
    tacticalBoost += (teamTalk.focus || 0) + (teamTalk.composure || 0);
  }

  // Modificadores de estilo táctico y formación
  const formBonus = FORMATIONS[manager.formation]?.bonus || {};
  let attackWeight = (formBonus.attack || 1.0) * (manager.mentality === 'ofensiva' ? 1.2 : manager.mentality === 'ataque_total' ? 1.35 : manager.mentality === 'defensiva' ? 0.85 : 1.0);
  let defenseWeight = (formBonus.defense || 1.0) * (manager.mentality === 'defensiva' ? 1.25 : manager.mentality === 'ultra_defensiva' ? 1.4 : manager.mentality === 'ofensiva' ? 0.9 : 1.0);

  // Detección de Clásico / Rivalidad
  let classicData = null;
  try {
    const { getClassicData } = require('./classics.js');
    classicData = getClassicData(clubName, oppNameStr);
  } catch (e) {
    classicData = null;
  }

  // Cálculo de goles base
  const diff = (myRating + tacticalBoost) - oppRating;
  let myExpectedGoals = Math.max(0, 1.4 + diff * 0.08) * attackWeight;
  let oppExpectedGoals = Math.max(0, 1.2 - diff * 0.07) / defenseWeight;

  if (classicData && classicData.isClassic) {
    myExpectedGoals *= 1.1;
    oppExpectedGoals *= 1.1;
  }

  let myGoals = 0;
  let oppGoals = 0;
  const events = [];

  // 6 Ocasiones de gol simuladas minuto a minuto
  const minutes = [12, 28, 41, 57, 73, 88];
  const xi = (manager.startingXI || []).map(id => (manager.squad || []).find(p => p.id === id)).filter(Boolean);
  const strikers = xi.filter(p => p.position === 'DEL');
  const midfielders = xi.filter(p => p.position === 'MED');
  const defenders = xi.filter(p => p.position === 'DEF');
  const goalkeepers = xi.filter(p => p.position === 'POR');

  minutes.forEach(min => {
    const isMyChance = Math.random() < (myRating / (myRating + oppRating + 5));
    if (isMyChance) {
      const scorer = pick(strikers.length ? strikers : (xi.length ? xi : [{ name: 'Delantero' }]));
      const assister = pick(midfielders.length ? midfielders : (xi.length ? xi : [{ name: 'Volante' }]));
      const isGoal = Math.random() < (myExpectedGoals / 4);

      if (isGoal) {
        myGoals++;
        if (scorer && scorer.id) scorer.goals = (scorer.goals || 0) + 1;
        if (assister && assister.id && assister.id !== scorer?.id) assister.assists = (assister.assists || 0) + 1;
        events.push({
          minute: min,
          type: 'goal_my',
          title: `⚽ ¡GOOOOOOL DE ${clubName.toUpperCase()}!`,
          desc: `Minuto ${min}': Jugada ensayada de pizarra. ${assister ? `${assister.name} habilita con precisión y ` : ''}**${scorer ? scorer.name : 'Delantero'}** define cruzado al fondo de la red.`,
          scorer: scorer?.name,
          assister: assister?.name
        });
      } else {
        events.push({
          minute: min,
          type: 'chance_my',
          title: `🧤 ¡Casi llega el gol de ${clubName}!`,
          desc: `Minuto ${min}': Gran remate de ${scorer ? scorer.name : 'tu equipo'} que el arquero rival desvía al tiro de esquina.`
        });
      }
    } else {
      const isOppGoal = Math.random() < (oppExpectedGoals / 4);
      if (isOppGoal) {
        oppGoals++;
        events.push({
          minute: min,
          type: 'goal_opp',
          title: `❌ Gol de ${oppNameStr}`,
          desc: `Minuto ${min}': Desatención en el fondo de ${clubName}. El rival aprovecha el espacio y anota con remate rasante.`
        });
      } else {
        const gk = goalkeepers[0] || xi[0];
        events.push({
          minute: min,
          type: 'save_my',
          title: `🧤 ¡Atajadón de ${gk ? gk.name : 'tu portero'}!`,
          desc: `Minuto ${min}': Gran salvada bajo los 3 palos para evitar la caída del arco.`
        });
      }
    }
  });

  // Resultado
  const result = myGoals > oppGoals ? 'V' : myGoals < oppGoals ? 'D' : 'E';
  
  // Actualizar estadísticas del DT y del plantel
  manager.records.matches++;
  manager.records.goalsFor += myGoals;
  manager.records.goalsAgainst += oppGoals;
  manager.seasonStats.matches++;
  manager.seasonStats.goalsFor += myGoals;
  manager.seasonStats.goalsAgainst += oppGoals;

  if (result === 'V') {
    manager.records.wins++;
    manager.seasonStats.wins++;
    manager.seasonStats.points += 3;
    const classicBonus = classicData?.isClassic ? 2 : 0;
    manager.boardConfidence = Math.min(100, manager.boardConfidence + rand(2, 4) + classicBonus);
    manager.fanConfidence = Math.min(100, manager.fanConfidence + rand(3, 5) + classicBonus);
    manager.reputation = Math.min(99, manager.reputation + 0.5 + (classicBonus * 0.2));
    manager.recentForm.unshift('V');
  } else if (result === 'E') {
    manager.records.draws++;
    manager.seasonStats.draws++;
    manager.seasonStats.points += 1;
    manager.boardConfidence = Math.max(10, manager.boardConfidence - (diff > 5 ? 2 : 0));
    manager.recentForm.unshift('E');
  } else {
    manager.records.losses++;
    manager.seasonStats.losses++;
    const classicPenalty = classicData?.isClassic ? 2 : 0;
    manager.boardConfidence = Math.max(10, manager.boardConfidence - rand(3, 6) - classicPenalty);
    manager.fanConfidence = Math.max(10, manager.fanConfidence - rand(4, 7) - classicPenalty);
    manager.recentForm.unshift('D');
  }

  if (manager.recentForm.length > 5) manager.recentForm.pop();

  // Actualizar estadísticas de partidos jugados de los titulares
  const xiIds = new Set(xi.map(p => p.id));
  xi.forEach(p => {
    p.apps = (p.apps || 0) + 1;
    p.morale = Math.max(10, Math.min(100, p.morale + (result === 'V' ? 4 : result === 'E' ? 0 : -4)));
    const energy = typeof p.energy === 'number' ? p.energy : (typeof p.stamina === 'number' ? p.stamina : 100);
    p.energy = Math.max(35, energy - rand(8, 15));
    p.stamina = p.energy;
  });

  // Los suplentes y reservas recuperan energía entre partidos
  (manager.squad || []).forEach(p => {
    if (xiIds.has(p.id)) return;
    const energy = typeof p.energy === 'number' ? p.energy : (typeof p.stamina === 'number' ? p.stamina : 100);
    p.energy = Math.min(100, energy + rand(12, 20));
    p.stamina = p.energy;
  });

  // Solo los partidos de LIGA avanzan el calendario y la tabla de posiciones.
  // Los partidos de Copa Nacional, Libertadores/Champions, etc. NUNCA tocan la tabla de liga
  // (antes este llamado incondicional metía a los rivales de copa en la tabla y rompía todo).
  const isLeagueMatch = !manager.stage || manager.stage === 'liga';
  const leagueUpdate = isLeagueMatch
    ? advanceDTLeague(manager, {
        opponentName: oppNameStr,
        myGoals,
        oppGoals,
        result
      })
    : null;

  // Posibles ofertas espontáneas si el DT está teniendo una racha brutal
  if (manager.seasonStats.matches >= 5 && (manager.seasonStats.wins / manager.seasonStats.matches) >= 0.75) {
    if (!manager.jobOffers || manager.jobOffers.length === 0) {
      manager.jobOffers = generateManagerOffers(manager);
    }
  }

  // Generar preguntas para la rueda de prensa post-partido del DT
  const pressConference = generatePressConference(manager, oppNameStr, result, myGoals, oppGoals);

  return {
    result,
    myGoals,
    oppGoals,
    myClub: manager.club,
    opponentName: oppNameStr,
    classicData,
    events,
    pressConference,
    leagueUpdate,
    boardConfidence: manager.boardConfidence,
    fanConfidence: manager.fanConfidence,
    recentForm: manager.recentForm
  };
}

/**
 * Ordena la tabla de posiciones del modo DT
 */
function dtTableSorted(table) {
  if (!table) return [];
  const list = Array.isArray(table) ? table : Object.values(table);
  return list.slice().sort((a, b) => {
    if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
    const dgA = (a.gf || 0) - (a.gc || 0);
    const dgB = (b.gf || 0) - (b.gc || 0);
    if (dgB !== dgA) return dgB - dgA;
    return (b.gf || 0) - (a.gf || 0);
  });
}

/**
 * Clubes que componen la liga del DT esta temporada.
 * Si el club del DT es personalizado (no existe en la base de datos),
 * reemplaza al club más débil de la división para mantener la cantidad exacta de equipos.
 */
function dtLeagueClubs(manager) {
  const leagueClubs = getAllClubs().filter(c => c.leagueKey === manager.leagueKey);
  const myClub = { name: manager.club, media: manager.clubMedia || 65, leagueKey: manager.leagueKey };

  if (!leagueClubs.length) return [myClub];
  if (leagueClubs.some(c => c.name === manager.club)) return leagueClubs;

  const sorted = [...leagueClubs].sort((a, b) => (a.media || 0) - (b.media || 0));
  const replaced = sorted[0].name;
  return leagueClubs.map(c => (c.name === replaced ? myClub : c));
}

/**
 * Garantiza un fixture y una tabla de liga válidos en Modo DT.
 *
 * - La tabla SOLO contiene a los clubes de la liga (los rivales de copa nunca entran acá).
 * - El fixture NO se regenera al terminar la temporada (eso lo maneja advanceDTLeague al
 *   arrancar la temporada nueva); así se evita que la liga "se duplique" (PJ 30 en ligas de 15 fechas).
 * - Si detecta datos corruptos guardados por versiones anteriores (clubes de otras ligas
 *   mezclados en la tabla, PJ imposibles, fixture inválido), se auto-repara reiniciando
 *   la liga de la temporada en curso con los clubes correctos.
 */
function ensureDTFixture(manager) {
  const clubs = dtLeagueClubs(manager);
  const clubNames = clubs.map(c => c.name);
  const opponents = clubs.filter(c => c.name !== manager.club);

  // Cantidad de fechas esperadas: ida y vuelta si la liga es chica, solo ida si es grande
  const expectedRounds = opponents.length === 0 ? 4 : (opponents.length <= 8 ? opponents.length * 2 : opponents.length);

  const tableOk = Array.isArray(manager.table)
    && manager.table.length === clubNames.length
    && manager.table.every(t => t && clubNames.includes(t.club) && (t.pj || 0) <= expectedRounds);

  const fixtureOk = Array.isArray(manager.fixture)
    && manager.fixture.length === expectedRounds
    && (opponents.length === 0 || manager.fixture.every(n => clubNames.includes(n) && n !== manager.club))
    && (manager.matchdayIndex || 0) <= manager.fixture.length;

  if (!tableOk || !fixtureOk) {
    // Auto-reparación / inicio de temporada: tabla en cero solo con los clubes de la liga
    manager.table = clubs.map(c => ({
      club: c.name,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0
    }));

    if (opponents.length === 0) {
      // Fallback
      manager.fixture = ['Rival de Liga 1', 'Rival de Liga 2', 'Rival de Liga 3', 'Rival de Liga 4'];
    } else {
      // Mezclar rivales para que cada temporada tenga un calendario fresco
      const shuffled = [...opponents].sort(() => Math.random() - 0.5);
      const rounds = opponents.length <= 8 ? [...shuffled, ...[...opponents].sort(() => Math.random() - 0.5)] : shuffled;
      manager.fixture = rounds.map(c => c.name);
    }
    manager.matchdayIndex = 0;
  }

  manager.matchdayTotal = manager.fixture.length;

  const nextOpponent = manager.fixture[manager.matchdayIndex] || (opponents[0] ? opponents[0].name : 'Rival de Liga');
  return nextOpponent;
}

/**
 * Avanza la jornada de liga en el Modo DT y simula el resto de los partidos
 */
function advanceDTLeague(manager, matchResult) {
  if (!matchResult) {
    // Preparar siguiente temporada
    manager.season = (manager.season || 1) + 1;
    manager.seasonStats = {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
    manager.fixture = [];
    manager.table = [];
    manager.matchdayIndex = 0;
    manager.nationalCup = null;
    manager.cup = null;
    manager.qualifiedContinentalCup = null;
    manager.stage = 'liga';
    ensureDTFixture(manager);
    return {
      matchdayIndex: 0,
      matchdayTotal: manager.matchdayTotal || 16,
      season: manager.season,
      position: 1,
      totalClubs: manager.table.length,
      seasonEnded: false
    };
  }

  ensureDTFixture(manager);

  // Si la liga ya terminó, no se registra nada más en la tabla (los partidos siguientes son de copa)
  if (manager.matchdayIndex >= manager.fixture.length) {
    const sorted = dtTableSorted(manager.table || []);
    return {
      matchdayIndex: manager.matchdayIndex,
      matchdayTotal: manager.matchdayTotal,
      position: sorted.findIndex(t => t.club === manager.club) + 1,
      totalClubs: sorted.length,
      seasonEnded: true
    };
  }

  const oppName = (typeof matchResult.opponentName === 'object' && matchResult.opponentName)
    ? matchResult.opponentName.name
    : matchResult.opponentName;

  // 1. Actualizar el partido del DT y de su rival en la tabla
  let myRow = manager.table.find(t => t.club === manager.club);
  if (!myRow) {
    myRow = { club: manager.club, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
    manager.table.push(myRow);
  }

  // El rival solo suma en la tabla si pertenece a la liga (nunca rivales de copa)
  const oppRow = manager.table.find(t => t.club === oppName) || null;

  myRow.pj++;
  myRow.gf += matchResult.myGoals;
  myRow.gc += matchResult.oppGoals;
  myRow.dg = myRow.gf - myRow.gc;

  if (oppRow) {
    oppRow.pj++;
    oppRow.gf += matchResult.oppGoals;
    oppRow.gc += matchResult.myGoals;
    oppRow.dg = oppRow.gf - oppRow.gc;
  }

  if (matchResult.result === 'V') {
    myRow.g++;
    myRow.pts += 3;
    if (oppRow) oppRow.p++;
  } else if (matchResult.result === 'E') {
    myRow.e++;
    myRow.pts += 1;
    if (oppRow) {
      oppRow.e++;
      oppRow.pts += 1;
    }
  } else {
    myRow.p++;
    if (oppRow) {
      oppRow.g++;
      oppRow.pts += 3;
    }
  }

  // 2. Simular los demás partidos de la fecha en la liga entre clubes AI
  const otherClubs = manager.table.filter(t => t.club !== manager.club && t.club !== oppName);
  for (let i = 0; i < otherClubs.length - 1; i += 2) {
    const c1 = otherClubs[i];
    const c2 = otherClubs[i + 1];
    if (!c1 || !c2) continue;

    const g1 = rand(0, 3);
    const g2 = rand(0, 3);
    c1.pj++;
    c1.gf += g1;
    c1.gc += g2;
    c1.dg = c1.gf - c1.gc;

    c2.pj++;
    c2.gf += g2;
    c2.gc += g1;
    c2.dg = c2.gf - c2.gc;

    if (g1 > g2) {
      c1.g++;
      c1.pts += 3;
      c2.p++;
    } else if (g1 < g2) {
      c2.g++;
      c2.pts += 3;
      c1.p++;
    } else {
      c1.e++;
      c1.pts += 1;
      c2.e++;
      c2.pts += 1;
    }
  }

  // 3. Ordenar tabla de posiciones
  manager.table = dtTableSorted(manager.table);
  const currentPos = manager.table.findIndex(t => t.club === manager.club) + 1;

  // 4. Avanzar fecha
  manager.matchdayIndex++;
  let seasonEnded = false;
  let seasonTrophy = null;

  if (manager.matchdayIndex >= manager.fixture.length) {
    seasonEnded = true;
    if (currentPos === 1) {
      seasonTrophy = `🏆 Campeón ${manager.leagueName} (Temporada ${manager.season})`;
      if (!manager.records.trophies) manager.records.trophies = [];
      if (!manager.records.trophies.includes(seasonTrophy)) {
        manager.records.trophies.push(seasonTrophy);
        manager.reputation = Math.min(99, manager.reputation + 5);
        manager.boardConfidence = Math.min(100, manager.boardConfidence + 15);
        manager.budget += rand(10000000, 25000000);
      }
    }

    // Generar atractivas ofertas de clubes para el DT
    manager.jobOffers = generateManagerOffers(manager);
  }

  return {
    matchdayIndex: manager.matchdayIndex,
    matchdayTotal: manager.matchdayTotal,
    position: currentPos,
    totalClubs: manager.table.length,
    seasonEnded,
    seasonTrophy,
    offersCount: (manager.jobOffers || []).length
  };
}

/**
 * Genera ofertas de trabajo de otros clubes que quieren fichar al DT
 */
function generateManagerOffers(manager) {
  const allClubs = getAllClubs().filter(c => c.name !== manager.club);
  const rep = manager.reputation || 50;
  const trophiesCount = (manager.records.trophies || []).length;

  let candidates = [];

  if (rep >= 80 || trophiesCount >= 2) {
    // Ofertas de gigantes mundiales y continentales
    candidates = allClubs.filter(c => (c.media || 65) >= 76);
  } else if (rep >= 65) {
    // Clubes de primera división y proyectos ambiciosos
    candidates = allClubs.filter(c => (c.media || 65) >= 70 && (c.media || 65) <= 80);
  } else {
    // Clubes de nivel similar o buscando cambio de rumbo
    candidates = allClubs.filter(c => (c.media || 65) >= 60 && (c.media || 65) <= 73);
  }

  if (candidates.length < 3) {
    candidates = allClubs;
  }

  // Barajar y tomar 3-5 ofertas distintas
  const picked = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.min(5, candidates.length));

  return picked.map(club => {
    const league = getLeague(club.leagueKey) || { name: 'Liga', country: 'CHILE' };
    const baseBudget = Math.round(Math.pow((club.media || 65) / 10, 3) * 750000 + rand(3000000, 15000000));
    
    let expectation = 'Pelear en la mitad superior de la tabla';
    if ((club.media || 65) >= 80) expectation = 'Ganar la Liga y competir por la Copa Internacional';
    else if ((club.media || 65) >= 73) expectation = 'Clasificar a torneos continentales y llegar a semifinales';
    else expectation = 'Consolidar un proyecto táctico ganador y evitar el descenso';

    const pitchOptions = [
      `La junta directiva de **${club.name}** admira tu estilo táctico (${manager.tacticStyle || 'ofensivo'}) y te ofrece el mando total del primer equipo.`,
      `El presidente de **${club.name}** busca un técnico con liderazgo para iniciar una nueva era ganadora.`,
      `**${club.name}** te presenta un proyecto ambicioso con respaldo financiero para fichar a tus refuerzos predilectos.`
    ];

    return {
      club: club.name,
      clubMedia: club.media || 70,
      leagueKey: club.leagueKey,
      leagueName: league.name,
      country: league.country,
      budget: baseBudget,
      wageBudget: Math.round(baseBudget * 0.35),
      expectation,
      pitch: pick(pitchOptions)
    };
  });
}

/**
 * Acepta una oferta de contrato y transfiere al DT a su nuevo club
 */
function acceptManagerJobOffer(manager, targetClubName) {
  const targetOffer = (manager.jobOffers || []).find(o => o.club.toLowerCase() === targetClubName.toLowerCase());
  const newClub = findClub(targetClubName);

  if (!newClub && !targetOffer) {
    return { ok: false, message: `No se encontró el club "${targetClubName}".` };
  }

  const clubName = newClub ? newClub.name : targetOffer.club;
  const clubMedia = newClub ? (newClub.media || 70) : targetOffer.clubMedia;
  const leagueKey = newClub ? newClub.leagueKey : targetOffer.leagueKey;
  const league = getLeague(leagueKey) || { name: 'Liga', country: 'CHILE' };

  // Guardar historial del club anterior
  if (!manager.careerHistory) manager.careerHistory = [];
  manager.careerHistory.push({
    club: manager.club,
    league: manager.leagueName,
    seasons: manager.season,
    matches: manager.records.matches,
    wins: manager.records.wins,
    trophies: [...(manager.records.trophies || [])]
  });

  // Transferir al nuevo club
  manager.club = clubName;
  manager.clubMedia = clubMedia;
  manager.leagueKey = leagueKey;
  manager.leagueName = league.name;
  manager.country = league.country;

  // Generar nuevo plantel del club
  manager.squad = generateClubSquad(newClub || { name: clubName, media: clubMedia, leagueKey });
  
  // Seleccionar titulares y banca
  const sorted = [...manager.squad].sort((a, b) => b.overall - a.overall);
  const gk = sorted.find(p => p.position === 'POR') || sorted[0];
  const defs = sorted.filter(p => p.position === 'DEF').slice(0, 4);
  const mids = sorted.filter(p => p.position === 'MED').slice(0, 3);
  const fws = sorted.filter(p => p.position === 'DEL').slice(0, 3);
  const starting = [gk, ...defs, ...mids, ...fws].filter(Boolean).map(p => p.id);
  const bench = manager.squad.filter(p => !starting.includes(p.id)).map(p => p.id);

  manager.startingXI = starting;
  manager.bench = bench;
  manager.captainId = starting[0] || manager.squad[0].id;
  manager.penaltyTakerId = (fws[0] || starting[0] || manager.squad[0]).id;
  manager.freeKickTakerId = (mids[0] || starting[0] || manager.squad[0]).id;

  // Nuevo presupuesto
  manager.budget = targetOffer ? targetOffer.budget : Math.round(Math.pow((clubMedia || 65) / 10, 3) * 750000 + 5000000);
  manager.wageBudget = Math.round(manager.budget * 0.35);

  // Restablecer confianza y calendario para la nueva temporada
  manager.boardConfidence = 85;
  manager.fanConfidence = 80;
  manager.reputation = Math.min(99, manager.reputation + 2);
  manager.recentForm = [];
  manager.fixture = [];
  manager.table = [];
  manager.matchdayIndex = 0;
  manager.jobOffers = [];
  manager.nationalCup = null;
  manager.cup = null;
  manager.qualifiedContinentalCup = null;
  manager.stage = 'liga';

  // Crear fixture para el nuevo club
  ensureDTFixture(manager);

  return {
    ok: true,
    club: manager.club,
    league: manager.leagueName,
    country: manager.country,
    budget: manager.budget,
    squadCount: manager.squad.length
  };
}

/**
 * Genera una rueda de prensa interactiva para el Director Técnico
 */
function generatePressConference(manager, opponentName, result, myGoals, oppGoals) {
  const isWin = result === 'V';
  const isLoss = result === 'D';

  const questionText = isWin
    ? `Periodista de ESPN: "Profesor ${manager.name}, gran victoria ${myGoals}-${oppGoals} ante ${opponentName}. ¿Cuál fue la clave táctica del triunfo?"`
    : isLoss
    ? `Periodista de TyC Sports: "Profesor ${manager.name}, dura derrota ${myGoals}-${oppGoals} hoy. La hinchada se fue molesta. ¿Qué autocrítica hace de su planteo?"`
    : `Periodista de Fox Sports: "Profesor ${manager.name}, empate ${myGoals}-${oppGoals} muy disputado. ¿Siente que el resultado fue justo con lo visto en cancha?"`;

  const options = isWin
    ? [
        {
          label: 'Elogiar a los jugadores ("El mérito es 100% de los futbolistas que dejaron todo")',
          effect: { teamMorale: 5, fanConfidence: 3 },
          response: 'El vestuario agradece tu humildad. La química de equipo sube +5.'
        },
        {
          label: 'Destacar la estrategia táctica ("Estudiamos al rival toda la semana y salió a la perfección")',
          effect: { reputation: 1, boardConfidence: 4 },
          response: 'La directiva y la prensa elogian tu capacidad estratégica de primer nivel.'
        },
        {
          label: 'Pedir calma ("Aún no ganamos nada, hay que seguir con los pies en la tierra")',
          effect: { focus: 4, teamMorale: 2 },
          response: 'Mantienes al plantel enfocado sin relajarse.'
        }
      ]
    : isLoss
    ? [
        {
          label: 'Asumir la responsabilidad ("Yo soy el único culpable, los cambios no salieron")',
          effect: { teamMorale: 4, boardConfidence: -2 },
          response: 'Los jugadores valoran que des la cara por ellos y te respaldan en la interna.'
        },
        {
          label: 'Criticar al arbitraje ("Nos perjudicaron con fallos arbitrales dudosos")',
          effect: { fanConfidence: 2, fine: 15000 },
          response: 'La hinchada te apoya pero la federación te advierte por declaraciones polémicas.'
        },
        {
          label: 'Prometer trabajo duro ("Vamos a corregir esto el lunes a primera hora")',
          effect: { focus: 3, boardConfidence: 2 },
          response: 'La directiva ve tu compromiso por revertir el mal momento.'
        }
      ]
    : [
        {
          label: 'Valorar el punto ("Es una cancha difícil y sumamos ante un rival directo")',
          effect: { teamMorale: 2, boardConfidence: 1 },
          response: 'Declaración equilibrada que transmite tranquilidad.'
        },
        {
          label: 'Insatisfacción constructiva ("Merecimos más, nos faltó puntería en los últimos metros")',
          effect: { focus: 4 },
          response: 'Exiges mayor efectividad a tus delanteros para la próxima fecha.'
        }
      ];

  return {
    question: questionText,
    options
  };
}

/**
 * Calcula el veredicto y rango histórico de un Director Técnico al retirarse
 */
function getManagerRetirementVerdict(manager) {
  const records = manager.records || { matches: 0, wins: 0, draws: 0, losses: 0, trophies: [] };
  const totalMatches = records.matches || 0;
  const wins = records.wins || 0;
  const draws = records.draws || 0;
  const losses = records.losses || 0;
  const trophies = (records.trophies || []).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const reputation = manager.reputation || 50;

  let score = trophies * 350 + wins * 25 + draws * 8 + reputation * 10;
  let titulo = 'Paso Fugaz por la Dirección Técnica';
  let tier = 'Bronce';
  let emoji = '📋';

  if (trophies >= 8 || score >= 4000) {
    titulo = 'Leyenda Inmortal de los Banquillos (Hall of Fame)';
    tier = 'Inmortal';
    emoji = '👑';
  } else if (trophies >= 5 || score >= 2500) {
    titulo = 'Estratega Galáctico y Maestro Táctico';
    tier = 'Diamante';
    emoji = '⭐';
  } else if (trophies >= 3 || score >= 1500) {
    titulo = 'Director Técnico Consagrado y Campeón';
    tier = 'Oro';
    emoji = '🏆';
  } else if (trophies >= 1 || winRate >= 50 || score >= 800) {
    titulo = 'Especialista en Éxitos y Resultados';
    tier = 'Plata';
    emoji = '🥈';
  } else if (totalMatches >= 15) {
    titulo = 'Técnico de Oficio y Batalla';
    tier = 'Bronce';
    emoji = '🥉';
  }

  return {
    titulo,
    tier,
    emoji,
    score,
    matches: totalMatches,
    wins,
    draws,
    losses,
    winRate,
    trophies: records.trophies || [],
    trophiesCount: trophies,
    clubsManaged: manager.careerClubs || [manager.club],
    reputation
  };
}

/**
 * Retira a un Director Técnico formalmente
 */
function retireManager(manager) {
  const verdict = getManagerRetirementVerdict(manager);
  manager.retired = true;
  manager.retiredAt = Date.now();
  manager.verdict = verdict;
  return verdict;
}

/**
 * Simula una temporada completa de liga en Modo DT
 */
function simulateEntireDTSeason(manager) {
  if (manager.retired) {
    return { ok: false, message: 'Este Director Técnico ya está retirado.' };
  }

  ensureDTFixture(manager);
  manager.stage = 'liga';
  const totalFechas = manager.matchdayTotal || 16;
  const matchesSimulated = [];

  while (manager.matchdayIndex < totalFechas) {
    const opp = manager.fixture[manager.matchdayIndex];
    const before = manager.matchdayIndex;
    const res = simulateDTMatch(manager, opp);
    matchesSimulated.push(res);
    if (manager.matchdayIndex === before) break; // seguridad anti-bucle infinito
  }

  // Al finalizar la temporada, generamos ofertas para el nuevo periodo
  manager.jobOffers = generateManagerOffers(manager);
  
  const sortedTable = dtTableSorted(manager.table || []);
  const myPosition = sortedTable.findIndex(t => t.club === manager.club) + 1;
  const isChampion = myPosition === 1;

  return {
    ok: true,
    season: manager.season,
    matchesPlayed: matchesSimulated.length,
    position: myPosition,
    totalClubs: sortedTable.length,
    isChampion,
    trophyWon: isChampion ? `Campeón de ${manager.leagueName}` : null,
    table: sortedTable,
    offers: manager.jobOffers,
    records: manager.records,
    seasonStats: manager.seasonStats,
    boardConfidence: manager.boardConfidence,
    fanConfidence: manager.fanConfidence,
    budget: manager.budget
  };
}

/**
 * Alinea automáticamente a los mejores 11 jugadores según la formación actual
 */
function autoLineupSquad(manager) {
  const formationKey = manager.formation || '4-3-3';
  const formDef = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
  const squad = manager.squad || [];

  const gks = squad.filter(p => p.position === 'POR').sort((a, b) => b.overall - a.overall);
  const defs = squad.filter(p => p.position === 'DEF').sort((a, b) => b.overall - a.overall);
  const mids = squad.filter(p => p.position === 'MED').sort((a, b) => b.overall - a.overall);
  const fws = squad.filter(p => p.position === 'DEL').sort((a, b) => b.overall - a.overall);

  // Contar requerimientos de la formación
  let neededGK = 1;
  let neededDef = 4;
  let neededMid = 3;
  let neededFw = 3;

  if (formationKey === '4-4-2') { neededDef = 4; neededMid = 4; neededFw = 2; }
  else if (formationKey === '4-2-3-1') { neededDef = 4; neededMid = 5; neededFw = 1; }
  else if (formationKey === '3-5-2') { neededDef = 3; neededMid = 5; neededFw = 2; }
  else if (formationKey === '5-3-2') { neededDef = 5; neededMid = 3; neededFw = 2; }
  else if (formationKey === '3-4-3') { neededDef = 3; neededMid = 4; neededFw = 3; }

  const pickedGK = gks.slice(0, neededGK);
  const pickedDef = defs.slice(0, neededDef);
  const pickedMid = mids.slice(0, neededMid);
  const pickedFw = fws.slice(0, neededFw);

  const starting = [...pickedGK, ...pickedDef, ...pickedMid, ...pickedFw];
  
  // Si falta alguno por escasez de posición, rellenar con los mejores restantes
  if (starting.length < 11) {
    const remaining = squad.filter(p => !starting.some(s => s.id === p.id)).sort((a, b) => b.overall - a.overall);
    starting.push(...remaining.slice(0, 11 - starting.length));
  }

  const startingIds = starting.slice(0, 11).map(p => p.id);
  const benchIds = squad.filter(p => !startingIds.includes(p.id)).map(p => p.id);
  const avgOvr = starting.length ? Math.round(starting.reduce((sum, p) => sum + (p.overall || 60), 0) / starting.length) : 60;

  manager.startingXI = startingIds;
  manager.bench = benchIds;
  return { ok: true, startingCount: startingIds.length, benchCount: benchIds.length, avgOvr };
}

/**
 * Cambia la formación y/o estilo táctico del DT
 */
function changeManagerTactic(manager, formationKey, styleKey) {
  if (formationKey && FORMATIONS[formationKey]) {
    manager.formation = formationKey;
  }
  if (styleKey && TACTICAL_STYLES[styleKey]) {
    manager.tacticStyle = styleKey;
  }
  autoLineupSquad(manager);
  return {
    ok: true,
    formation: manager.formation,
    formationName: FORMATIONS[manager.formation]?.name || manager.formation,
    tacticStyle: manager.tacticStyle,
    styleName: TACTICAL_STYLES[manager.tacticStyle]?.name || manager.tacticStyle
  };
}

/**
 * Aplica una charla técnica de vestuario
 */
function deliverTeamTalk(manager, talkId) {
  const talk = CHARLAS_VESTUARIO[talkId] || CHARLAS_VESTUARIO.motivacional;
  manager.lastTeamTalk = {
    id: talk.id,
    label: talk.label,
    morale: talk.morale || 0,
    focus: talk.focus || 0,
    composure: talk.composure || 0,
    appliedAt: Date.now()
  };

  // La moral se aplica de inmediato a todo el plantel; el foco táctico/composure
  // se guarda y se consume en el próximo partido (simulateDTMatch).
  (manager.squad || []).forEach(p => {
    p.morale = Math.max(10, Math.min(100, (p.morale || 70) + (talk.morale || 0)));
  });

  return { ok: true, talk };
}

/**
 * Genera el mercado de fichajes con jugadores disponibles para contratar
 */
function getTransferMarketForManager(manager) {
  if (manager.transferMarket && manager.transferMarket.length > 0 && (Date.now() - (manager.transferMarketTimestamp || 0)) < 600000) {
    return manager.transferMarket;
  }

  const targetMedia = manager.clubMedia || 68;
  const positions = ['POR', 'DEF', 'MED', 'DEL'];
  const players = [];

  for (let i = 0; i < 6; i++) {
    const pos = positions[i % positions.length];
    const ovr = Math.min(92, Math.max(58, targetMedia + rand(-4, 7)));
    const pot = Math.min(95, ovr + rand(2, 9));
    const age = rand(19, 32);
    const baseValue = Math.round(Math.pow(ovr / 10, 3.4) * 80000 + rand(500000, 3000000));
    const wage = Math.round(baseValue * 0.08);

    players.push({
      id: `mkt_${Date.now()}_${i}`,
      name: randomPlayerName(),
      position: pos,
      overall: ovr,
      potential: pot,
      age,
      marketValue: baseValue,
      wage,
      stamina: rand(85, 100),
      energy: rand(85, 100),
      morale: rand(75, 95),
      goals: 0,
      assists: 0
    });
  }

  manager.transferMarket = players;
  manager.transferMarketTimestamp = Date.now();
  return players;
}

/**
 * Ficha a un jugador del mercado usando el presupuesto del club
 */
function signPlayerForManager(manager, playerIndex) {
  const market = getTransferMarketForManager(manager);
  const target = market[playerIndex];

  if (!target) {
    return { ok: false, reason: 'Jugador no encontrado en el mercado de pases.' };
  }

  if ((manager.budget || 0) < target.marketValue) {
    return {
      ok: false,
      reason: `Presupuesto insuficiente. Cuesta ${target.marketValue.toLocaleString('en-US')} y tienes ${(manager.budget || 0).toLocaleString('en-US')}.`
    };
  }

  manager.budget -= target.marketValue;
  const signedPlayer = {
    ...target,
    id: `sq_${Date.now()}_${rand(100, 999)}`,
    club: manager.club
  };

  manager.squad.push(signedPlayer);
  manager.bench.push(signedPlayer.id);
  market.splice(playerIndex, 1);
  manager.transferMarket = market;

  // Aumentar confianza directiva por refuerzo de jerarquía
  if (signedPlayer.overall >= (manager.clubMedia || 68)) {
    manager.boardConfidence = Math.min(100, manager.boardConfidence + 4);
    manager.fanConfidence = Math.min(100, manager.fanConfidence + 5);
  }

  return { ok: true, player: signedPlayer, remainingBudget: manager.budget };
}

/**
 * Promueve a un juvenil prometedor de la cantera al primer equipo
 */
function promoteYouthForManager(manager) {
  const positions = ['POR', 'DEF', 'MED', 'DEL'];
  const pos = pick(positions);
  const targetMedia = manager.clubMedia || 68;
  const ovr = Math.min(78, Math.max(58, targetMedia - rand(2, 6)));
  const pot = Math.min(94, ovr + rand(8, 16));
  const age = rand(16, 18);

  const prospect = {
    id: `academy_${Date.now()}_${rand(100, 999)}`,
    name: `${randomPlayerName()} (Canterano)`,
    position: pos,
    overall: ovr,
    potential: pot,
    age,
    marketValue: Math.round(Math.pow(ovr / 10, 3) * 60000 + 400000),
    wage: 25000,
    stamina: 100,
    energy: 100,
    morale: 95,
    goals: 0,
    assists: 0,
    isYouth: true
  };

  manager.squad.push(prospect);
  manager.bench.push(prospect.id);
  manager.fanConfidence = Math.min(100, manager.fanConfidence + 3);

  return { ok: true, prospect };
}

module.exports = {
  FORMATIONS,
  TACTICAL_STYLES,
  CHARLAS_VESTUARIO,
  newManager,
  transitionPlayerToManager,
  generateClubSquad,
  calculateTeamChemistryAndRating,
  simulateDTMatch,
  generatePressConference,
  ensureDTFixture,
  advanceDTLeague,
  dtTableSorted,
  generateManagerOffers,
  acceptManagerJobOffer,
  getManagerRetirementVerdict,
  retireManager,
  simulateEntireDTSeason,
  autoLineupSquad,
  changeManagerTactic,
  deliverTeamTalk,
  getTransferMarketForManager,
  signPlayerForManager,
  promoteYouthForManager
};


