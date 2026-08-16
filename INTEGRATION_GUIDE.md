'use strict';

/**
 * GUÍA DE INTEGRACIÓN - Nuevas Features de El Ídolo Copero
 * 
 * Este archivo documenta cómo integrar todos los nuevos sistemas
 * creados para expandir la jugabilidad del bot.
 */

// ============================================================
// 1. SISTEMA DE RACHAS (streaks.js)
// ============================================================

/*
DÓNDE USARLO:
- En game/engine.js, después de simular cada partido
- En cualquier lugar donde se registre un resultado

CÓMO USARLO:

```javascript
const { recordMatchResult, getStreakBonuses, getStreakEmoji, getRecentResults } = require('../utils/streaks.js');

// Después de que el jugador juega un partido:
recordMatchResult(player, matchResult.result); // 'V', 'D', o 'E'

// Obtener bonos para aplicar al próximo partido:
const bonuses = getStreakBonuses(player);
if (bonuses.ratingBonus !== 0) {
  matchRating += bonuses.ratingBonus;
  if (bonuses.moraleBonus !== 0) {
    player.morale += bonuses.moraleBonus;
  }
}

// Mostrar en /perfil:
const emoji = getStreakEmoji(player); // 🔥, 📉, ➖
const recent = getRecentResults(player); // ✅❌✅...
```

EFECTOS:
- 3+ victorias seguidas: +0.2 rating, +1-3 moral
- 5+ victorias: 🔥🔥🔥 +0.4 rating, +3 moral
- 3+ derrotas seguidas: -0.2 rating, -1-3 moral
- 5+ derrotas: 📉📉📉 -0.4 rating, -3 moral, pánico
*/

// ============================================================
// 2. BALÓN DE ORO EN VOTACIÓN (ballonDor.js)
// ============================================================

/*
DÓNDE USARLO:
- Al final de cada temporada en el servidor
- En un comando como /votar-ballon-dor

CÓMO USARLO:

```javascript
const { 
  getEligibleCandidates, 
  initializeBallonDOrVote,
  closeBallonDOrVote,
  applyBallonDOrRewards,
  formatBallonDOrResults
} = require('../utils/ballonDor.js');

// 1. Al final de temporada, obtener candidatos
const players = loadAllPlayers();
const candidates = getEligibleCandidates(players, currentSeason);

// 2. Iniciar votación (24 horas, reacciones 🥇 🥈 🥉)
let vote = initializeBallonDOrVote(currentSeason, candidates);
// Publicar embed en Discord con candidatos
// Usuarios votan con reacciones

// 3. Después de 24h, cerrar votación
const { winner, score } = closeBallonDOrVote(vote);

// 4. Aplicar premios al ganador
const winnerPlayer = loadPlayer(winner);
const rewards = applyBallonDOrRewards(winnerPlayer);
// winnerPlayer.morale +15
// winnerPlayer.attributes.ritmo +2
// winnerPlayer.attributes.tiro +2
// Award agregado al historial

// 5. Mostrar resultados
const results = formatBallonDOrResults(vote, candidates);
// embed con 🥇🥈🥉 y puntos de votación
```

CANDIDATOS ELEGIBLES:
- Mínimo 5 partidos jugados esa temporada
- No estar retirado
- Cualquier posición y nivel
*/

// ============================================================
// 3. NUEVOS EVENTOS DE CARRERA (newCareerEvents.js)
// ============================================================

/*
DÓNDE USARLO:
- Agregar a EVENTOS_CARRERA en decisions.js
- Aparecen al cerrar temporada (30% de chance)

EVENTOS NUEVOS:

1. OFERTA DE ARABIA (nivel 28+)
   - 3 opciones: Aceptar (rica), Negociar (medio), Rechazar (lealtad)
   - Efectos: sueldo, moral, atributos

2. CAMBIO DE DT
   - Nuevo técnico llega
   - Adaptarte o pedir baja

3. CRISIS FINANCIERA DEL CLUB
   - Te piden bajar sueldo 30%
   - Quedarte por lealtad o irte

4. CONFLICTO CON HINCHADA
   - Si rendiste mal: piden tu salida
   - Si rendiste bien: banderazo

5. RETIRO A LOS 42 AÑOS ★★★ IMPORTANTE
   - Opción 1: ÚLTIMO PARTIDO DE RETIRO (ceremonia especial)
     - Rating máximo garantizado
     - Veredicto especial: "Leyenda que se fue en la cancha"
   - Opción 2: Retiro inmediato

6. RIVALIDAD CON OTRO JUGADOR
   - Detectar si hay otro jugador activo en el server
   - Intensidad extra en clásicos

7. OBJETIVOS DE TEMPORADA
   - Club te pide: Top 4, Ganar liga, No descender, etc.
   - Bonus: +10% sueldo si cumplís
   - Malus: -2 moral si no cumplís

8. CONTRATO EUROPA
   - Oferta de club top europeo
   - Aventura o quedarse
*/

// ============================================================
// 4. SISTEMA DE RIVALIDADES (rivalries.js)
// ============================================================

/*
DÓNDE USARLO:
- Después de detectar que hay 2 jugadores activos
- En cada partido entre ellos

CÓMO USARLO:

```javascript
const {
  initializeHeadToHead,
  recordHeadToHeadMatch,
  getHeadToHeadStats,
  detectRivalryStatus,
  getRivalryMoraleBonus,
  getRivalryBadge
} = require('../utils/rivalries.js');

// 1. Detectar si hay rivalidad
const rivalry = detectRivalryStatus(player1, player2);
// Retorna:
// - level: 0-4 (0=nada, 1=país, 2=liga, 3=compañero, 4=mismo puesto)
// - intensityMultiplier: 1.0 a 2.0
// - type: 'domestic', 'teammate', etc.
// - text: descripción

// 2. Si hay rivalidad, aplicar bonus:
if (rivalry.level > 0) {
  // Rating +0.3 en ese partido
  matchRating += 0.3;
  
  // Moral bonus después
  const moraleBonus = getRivalryMoraleBonus(result, rivalry.level);
  player.morale += moraleBonus;
}

// 3. Registrar enfrentamiento
recordHeadToHeadMatch(player, rivalUserId, result, goals, goalsAgainst);

// 4. Mostrar H2H en /perfil:
const h2h = getHeadToHeadStats(player, rivalUserId);
// { matches: 5, wins: 3, draws: 1, losses: 1, goalDiff: 2, winRate: 60 }

const badge = getRivalryBadge(player, rivalName);
// "⚔️ Rival: 3V-1E-1D vs Juan (te ganan)"
```

TIPOS DE RIVALIDAD:
- Compañero de equipo (mismo club) = +2.0x intensidad
- Mismo puesto en misma liga = +1.5x
- Misma liga = +1.3x
- Mismo país = +1.1x
*/

// ============================================================
// 5. CLÁSICOS HISTÓRICOS (newCareerEvents.js)
// ============================================================

/*
DÓNDE USARLO:
- En simulateMatch(), cuando detectas que es un clásico

CLÁSICOS CONFIGURADOS:
- Boca vs River
- Real Madrid vs Barcelona
- Flamengo vs Fluminense, Vasco
- Milan vs Inter
- Manchester United vs City, Liverpool
- etc.

CÓMO USARLO:

```javascript
const { getClassicBonus } = require('../utils/newCareerEvents.js');

const classicData = getClassicBonus(player, opponentClub);

if (classicData.isClassic) {
  // Rating +0.3
  matchRating += classicData.ratingBonus;
  
  // Más goles esperados (intensidad 1.5x)
  myGoals = Math.ceil(myGoals * 1.3);
  oppGoals = Math.ceil(oppGoals * 1.3);
  
  // Moral bonus/malus exagerado
  if (result === 'V') moraleBonus = classicData.moraleWinBonus; // +5
  if (result === 'D') moraleBonus = classicData.moraleLossBonus; // -5
  
  // Sueldo 30% más ese mes
  salary *= classicData.salaryBonus; // 1.3
}
```

EFECTOS DEL CLÁSICO:
- Rating +0.3
- Goles +30% intensidad
- Moral: +5 si ganas, -5 si pierdes
- Sueldo: +30%
- Minijuego garantizado (no depende de azar)
*/

// ============================================================
// 6. MINIJUEGOS CONTEXTUALES
// ============================================================

/*
DÓNDE USARLO:
- En utils/minigames.js, modificar lógica de aparición

CAMBIOS:
1. En clásicos: minijuego 5 botones (en vez de 3)
2. Último partido antes de retiro: minijuego GARANTIZADO
3. Clásicos de Arabia: opciones especiales "Soborno/Juego Limpio"

CÓMO:

```javascript
// En simulateMatch():
const isClassic = getClassicBonus(player, opponent).isClassic;
if (isClassic) {
  // Pasar importance=2 (final) para garantizar minijuego
  options.importance = 2;
}

// Si es último partido:
if (player.age === 42 && player.retirementCeremony) {
  // Minijuego SIEMPRE aparece
  player.pendingMinigame = pickMinigame(player.position);
}
```
*/

// ============================================================
// 7. SISTEMA DE RETIRO A LOS 42 AÑOS ★★★ PRINCIPAL
// ============================================================

/*
DÓNDE USARLO:
- En developPlayer() en player.js
- Al cerrar cada temporada

CÓMO IMPLEMENTAR:

```javascript
const { checkRetirementCeremony } = require('../utils/newCareerEvents.js');

// En developPlayer(), después de sumar puntos:
const retirementCheck = checkRetirementCeremony(player);

if (retirementCheck.isRetirementAge) {
  // Mostrar decisión de retiro en Discord
  // Dar 2 opciones:
  // 1. Último Partido de Retiro (ceremonia)
  // 2. Retiro Inmediato
  
  player.pendingRetirementDecision = true;
  return { ...result, retirementDecision: retirementCheck };
}

// Si elige ÚLTIMO PARTIDO:
if (player.retirementCeremony) {
  // Próximo partido es importante (importance=2)
  // Minijuego garantizado
  // Rating máximo posible (95-99)
  
  // Al terminar:
  // - Post-partido con emoticones y ceremonia
  // - Veredicto especial: "Leyenda que se fue en la cancha"
  // - +5 títulos en veredicto final
}

// Si elige RETIRO INMEDIATO:
// - Veredicto normal según stats
// - Sin ceremonia
```

VEREDICTO ESPECIAL (RETIRO EN LA CANCHA):
- Muestra un embed especial con lágrimas, aplausos
- Agrega automáticamente +5 a la puntuación de veredicto
- Badge permanente: "🏆 Se Retiró en la Cancha (Temporada X)"
*/

// ============================================================
// 8. HISTORIAL COMPLETO DE CARRERA
// ============================================================

/*
DÓNDE USARLO:
- Nuevo comando: /historial-completo

QEUR MOSTRAR:
- Timeline de todas las temporadas
- Clubes donde jugaste (años)
- Goles y asistencias por temporada
- Títulos ganados
- Decisiones importantes (Arabia, retiro, etc.)
- Récords personales

ESTRUCTURA:

```javascript
const career = {
  seasonHistory: [
    {
      season: 1,
      club: "San Lorenzo",
      level: "Segunda División",
      apps: 25,
      goals: 8,
      assists: 3,
      avgRating: 6.8,
      awards: ["Jugador Revelación"]
    },
    // ... más temporadas
  ],
  milestones: [
    { season: 5, type: "Primera vez en clásico", result: "Victoria" },
    { season: 10, type: "Oferta Arabia", choice: "Rechazado" },
    // ...
  ]
};
```
*/

// ============================================================
// 9. INTEGRACIÓN EN game/engine.js
// ============================================================

/*
PASOS PARA INTEGRAR TODO:

1. Importar todos los módulos al principio:
```javascript
const { recordMatchResult, getStreakBonuses } = require('../utils/streaks.js');
const { registerBallonDOrVote } = require('../utils/ballonDor.js');
const { recordHeadToHeadMatch, detectRivalryStatus } = require('../utils/rivalries.js');
const { 
  getClassicBonus, 
  checkRetirementCeremony,
  getVeteranBonus 
} = require('../utils/newCareerEvents.js');
```

2. En la función de simular partido:
- Detectar si es clásico: getClassicBonus()
- Detectar si hay rivalidad: detectRivalryStatus()
- Aplicar bonos de racha: getStreakBonuses()
- Registrar resultado: recordMatchResult()
- Registrar H2H si hay rival: recordHeadToHeadMatch()

3. Al terminar temporada:
- Verificar retiro: checkRetirementCeremony()
- Si hay candidatos, iniciar votación de Balón de Oro
- Generar nuevos eventos de carrera (Arabia, clásicos, etc.)

4. En /perfil, mostrar:
- Emoji de racha (getStreakEmoji)
- Badge de rival (getRivalryBadge)
- Badge de veterano (getVeteranBonus)
*/

// ============================================================
// RESUMEN RÁPIDO
// ============================================================

/*
✅ streaks.js - Racha de partidos (3+ ganados/perdidos)
✅ ballonDor.js - Votación de Balón de Oro (24h, reacciones)
✅ newCareerEvents.js - Arabia, retiro, clásicos, objetivos
✅ rivalries.js - Head-to-head entre jugadores del server

TODO ESTO VA A:
- Mejorar la tensión y drama del juego
- Crear competencia entre jugadores reales
- Añadir sentido de "campeonazo" cuando ganas
- Permitir retiros épicos a los 42 años
- Añadir tensión con ofertas millonarias

PRÓXIMO PASO: Integrar en game/engine.js y commands/
*/

module.exports = {
  INTEGRATION_GUIDE: true
};
