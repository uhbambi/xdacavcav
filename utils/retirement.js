'use strict';

/**
 * Sistema de Retiro a los 42 años
 * Permite elegir entre ceremonia de retiro o retiro inmediato
 */

function checkRetirementAge(player) {
  return {
    isRetirementAge: player.age >= 42,
    age: player.age
  };
}

function initiateRetirementDecision(player) {
  return {
    question: `🏆 ${player.name}, has llegado a los ${player.age} años. ¿Cómo te retiras de la carrera?`,
    options: [
      {
        id: 'ceremony',
        label: '🎬 Último Partido de Retiro (Ceremonia Especial)',
        description: 'Juega tu último partido con honores, minijuego garantizado y rating máximo.',
        effect: 'retirementCeremony'
      },
      {
        id: 'immediate',
        label: '⏹️ Retiro Inmediato',
        description: 'Termina tu carrera ahora mismo sin partido final.',
        effect: 'retireNow'
      }
    ]
  };
}

function setupRetirementCeremony(player) {
  player.retirementCeremony = true;
  player.age = 42;
  player.isLastMatch = true;
  
  return {
    message: `🎬 ¡Es tu último partido! Juega con todo tu corazón.`,
    lastOpponent: 'Un equipo de leyendas que viene especialmente a despedirte',
    minigameGuaranteed: true
  };
}

function applyRetirementCeremonyBonuses(player, matchResult) {
  const ceremonyRating = Math.max(9.5, matchResult.rating + 2.0);
  
  matchResult.rating = ceremonyRating;
  matchResult.motm = true;
  
  if (!player.career.awards) player.career.awards = [];
  player.career.awards.push(`👑 Se Retiró en la Cancha (Temporada ${player.season})`);
  
  if (!player.ceremonyBonus) player.ceremonyBonus = 5;
  
  player.retired = true;
  
  return {
    ceremonyRating,
    ceremonyMessage: `🏆 ¡Última actuación de leyenda! Rating: ${ceremonyRating}`,
    ceremonyAward: `👑 Se Retiró en la Cancha (Temporada ${player.season})`
  };
}

function generateRetirementEmbed(player, verdict) {
  let description = `🏆 **Rango de Leyenda:** ${verdict.titulo}\n\n`;
  
  if (player.retirementCeremony) {
    description += `*Se despidió en la cancha con honores, bajo los aplausos de la multitud.*\n\n`;
  }
  
  description += `📊 **Estadísticas Finales de Carrera:**\n`;
  description += `• Partidos Jugados: **${player.career.apps}**\n`;
  description += `• Goles: **${player.career.goals}** · Asistencias: **${player.career.assists}**\n`;
  description += `• Selección Nacional: **${player.career.caps}** PJ / **${player.career.nationalGoals}** goles\n`;
  description += `• Títulos Ganados: **${player.career.trophies.length}**\n`;
  description += `• Premios Individuales: **${player.career.awards.length}**\n`;
  description += `• Fortuna Acumulada: **$${(player.bank || 0).toLocaleString('en-US')}**\n\n`;
  
  if (player.career.trophies.length) {
    description += `🏆 **Títulos:**\n${player.career.trophies.slice(0, 5).map(t => `• ${t}`).join('\n')}\n\n`;
  }
  
  if (player.career.awards.length) {
    description += `🏅 **Premios:**\n${player.career.awards.slice(0, 5).map(a => `• ${a}`).join('\n')}\n\n`;
  }
  
  description += `¡Gracias por escribir tu historia! Puedes iniciar una nueva aventura con \`/crear-jugador\`.`;
  
  return description;
}

module.exports = {
  checkRetirementAge,
  initiateRetirementDecision,
  setupRetirementCeremony,
  applyRetirementCeremonyBonuses,
  generateRetirementEmbed
};