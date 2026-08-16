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

const CHARLAS_VESTUARIO = [
  { id: 'motivacional', label: '🔥 Arenga Motivacional ("¡A dejar la vida en la cancha!")', morale: 6, stamina: -2, desc: 'Sube la intensidad y la moral del plantel.' },
  { id: 'tactica', label: '📋 Indicación Táctica ("Concentración máxima en las marcas")', focus: 5, morale: 2, desc: 'Mejora el orden y reduce errores defensivos.' },
  { id: 'tranquilidad', label: '🧘 Mensaje de Calma ("Jueguen sin presión, disfruten")', morale: 4, composure: 6, desc: 'Reduce el pánico ante rivales difíciles.' },
  { id: 'exigencia', label: '⚡ Reto y Exigencia ("¡No los veo con hambre de ganar!")', morale: -2, aggression: 7, desc: 'Mete presión al equipo; útil si venían jugando flojo.' }
];

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
  const opponentClub = findClub(opponentName) || { name: opponentName, media: 68 };
  const teamMetrics = calculateTeamChemistryAndRating(manager);
  const myRating = teamMetrics.effectiveRating;
  const oppRating = opponentClub.media || 68;

  // Modificadores de charla de vestuario
  let moraleDelta = 0;
  let tacticalBoost = 0;
  if (teamTalk) {
    moraleDelta += teamTalk.morale || 0;
    tacticalBoost += (teamTalk.focus || 0) + (teamTalk.composure || 0);
  }

  // Modificadores de estilo táctico y formación
  const formBonus = FORMATIONS[manager.formation]?.bonus || {};
  let attackWeight = (formBonus.attack || 1.0) * (manager.mentality === 'ofensiva' ? 1.2 : manager.mentality === 'ataque_total' ? 1.35 : manager.mentality === 'defensiva' ? 0.85 : 1.0);
  let defenseWeight = (formBonus.defense || 1.0) * (manager.mentality === 'defensiva' ? 1.25 : manager.mentality === 'ultra_defensiva' ? 1.4 : manager.mentality === 'ofensiva' ? 0.9 : 1.0);

  // Cálculo de goles base
  const diff = (myRating + tacticalBoost) - oppRating;
  let myExpectedGoals = Math.max(0, 1.4 + diff * 0.08) * attackWeight;
  let oppExpectedGoals = Math.max(0, 1.2 - diff * 0.07) / defenseWeight;

  let myGoals = 0;
  let oppGoals = 0;
  const events = [];

  // 6 Ocasiones de gol simuladas minuto a minuto
  const minutes = [12, 28, 41, 57, 73, 88];
  const xi = manager.startingXI.map(id => manager.squad.find(p => p.id === id)).filter(Boolean);
  const strikers = xi.filter(p => p.position === 'DEL');
  const midfielders = xi.filter(p => p.position === 'MED');
  const defenders = xi.filter(p => p.position === 'DEF');
  const goalkeepers = xi.filter(p => p.position === 'POR');

  minutes.forEach(min => {
    const isMyChance = Math.random() < (myRating / (myRating + oppRating + 5));
    if (isMyChance) {
      const scorer = pick(strikers.length ? strikers : xi);
      const assister = pick(midfielders.length ? midfielders : xi);
      const isGoal = Math.random() < (myExpectedGoals / 4);

      if (isGoal) {
        myGoals++;
        if (scorer) scorer.goals = (scorer.goals || 0) + 1;
        if (assister && assister.id !== scorer?.id) assister.assists = (assister.assists || 0) + 1;
        events.push({
          minute: min,
          type: 'goal_my',
          title: `⚽ ¡GOOOOOOL DE ${manager.club.toUpperCase()}!`,
          desc: `Minuto ${min}': Jugada ensayada de pizarra. ${assister ? `${assister.name} habilita con precisión y ` : ''}**${scorer ? scorer.name : 'Delantero'}** define cruzado al fondo de la red.`,
          scorer: scorer?.name,
          assister: assister?.name
        });
      } else {
        events.push({
          minute: min,
          type: 'chance_my',
          title: `🧤 ¡Casi llega el gol de ${manager.club}!`,
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
          title: `❌ Gol de ${opponentName}`,
          desc: `Minuto ${min}': Desatención en el fondo de ${manager.club}. El rival aprovecha el espacio y anota con remate rasante.`
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
    manager.boardConfidence = Math.min(100, manager.boardConfidence + rand(2, 4));
    manager.fanConfidence = Math.min(100, manager.fanConfidence + rand(3, 5));
    manager.reputation = Math.min(99, manager.reputation + 0.5);
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
    manager.boardConfidence = Math.max(10, manager.boardConfidence - rand(3, 6));
    manager.fanConfidence = Math.max(10, manager.fanConfidence - rand(4, 7));
    manager.recentForm.unshift('D');
  }

  if (manager.recentForm.length > 5) manager.recentForm.pop();

  // Actualizar estadísticas de partidos jugados de los titulares
  xi.forEach(p => {
    p.apps = (p.apps || 0) + 1;
    p.morale = Math.max(10, Math.min(100, p.morale + moraleDelta + (result === 'V' ? 4 : result === 'E' ? 0 : -4)));
    p.stamina = Math.max(50, p.stamina - rand(8, 15));
  });

  // Generar preguntas para la rueda de prensa post-partido del DT
  const pressConference = generatePressConference(manager, opponentName, result, myGoals, oppGoals);

  return {
    result,
    myGoals,
    oppGoals,
    myClub: manager.club,
    opponentName,
    events,
    pressConference,
    boardConfidence: manager.boardConfidence,
    fanConfidence: manager.fanConfidence,
    recentForm: manager.recentForm
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

module.exports = {
  FORMATIONS,
  TACTICAL_STYLES,
  CHARLAS_VESTUARIO,
  newManager,
  transitionPlayerToManager,
  generateClubSquad,
  calculateTeamChemistryAndRating,
  simulateDTMatch,
  generatePressConference
};
