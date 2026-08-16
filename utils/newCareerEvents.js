'use strict';

const { pick, rand } = require('./simulation.js');
const { overallFrom, ATTR_LABELS } = require('./attributes.js');

/**
 * NUEVOS EVENTOS DE CARRERA
 * 
 * Agregar estos eventos al array EVENTOS_CARRERA en decisions.js
 * Incluye ofertas de Arabia, retiro a los 42 años, y dramas institucionales
 */

const NUEVOS_EVENTOS_CARRERA = [
  {
    id: 'oferta_arabia',
    text: (p) => `Un club de Arabia Saudí te ofrece un contrato jugoso: **${Math.round((p.salary || 50000) * 3.5).toLocaleString('es-CL')} pesos anuales**.`,
    options: [
      {
        label: '💰 Aceptar la oferta millonaria',
        effect: { morale: -1, attr: { ritmo: -1 } },
        resultText: 'Te vas a Arabia buscando la última gran recompensa. Tu nivel técnico baja un poco (menos competencia), pero tu banco se llena de dinero. ¡+50% sueldo permanente!',
        saudiMove: true
      },
      {
        label: '⚖️ Negociar con tu club actual',
        effect: { morale: 3, attr: { fisico: 1 } },
        resultText: 'Tu club te sube el sueldo un 20% para retener. Seguís donde sos feliz.'
      },
      {
        label: '❌ Rechazar y mantener el proyecto',
        effect: { morale: 5, potential: 1 },
        resultText: 'Rechazaste la tentación. Tu club y la hinchada te valoran mucho más: +1 Potencial, +5 moral.'
      }
    ]
  },
  {
    id: 'cambio_dt',
    text: (p) => `El DT de **${p.club}** renuncia. Llega un nuevo técnico con otra filosofía.`,
    options: [
      {
        label: '✅ Adaptarte al nuevo proyecto',
        effect: { morale: 2, attr: { pase: 1, defensa: 1 } },
        resultText: 'Te adaptaste bien. El nuevo DT confía en vos: +1 Pase, +1 Defensa.'
      },
      {
        label: '⚠️ Pedir la baja (buscar equipo)',
        effect: { morale: -3, extraOffers: 2 },
        resultText: 'No te llevás bien con el proyecto. Tu representante busca opciones: +2 ofertas de otros clubes.'
      }
    ]
  },
  {
    id: 'crisis_club',
    text: (p) => `Tu club tiene crisis financiera. Te piden bajar sueldo un 30%.`,
    options: [
      {
        label: '💔 Aceptar por lealtad',
        effect: { morale: 1, attr: { fisico: 2 } },
        resultText: 'Te quedaste con el club en tiempos difíciles. La hinchada te ama: +2 Físico de bonus.'
      },
      {
        label: '👋 Pedir la baja al mercado',
        effect: { morale: -2, extraOffers: 3 },
        resultText: 'Te fuiste. Tu representante mueve teléfonos y trae 3 ofertas nuevas.'
      }
    ]
  },
  {
    id: 'llamado_hinchada',
    text: (p) => p.seasonStats?.apps > 5 && p.seasonStats?.avgRatingSum / p.seasonStats?.apps < 6.5
      ? `Después de una racha de partidos malos, la hinchada de **${p.club}** te pide que te vayas.`
      : `La hinchada de **${p.club}** organiza un banderazo en tu honor. Te quieren más que nunca.`,
    options: [
      {
        label: '💪 Revancha: volver a jugar bien',
        effect: { morale: -2, attr: { ritmo: 2, fisico: 2 } },
        resultText: 'Te dolió. Al siguiente partido jugaste con rabia y conseguiste 2 goles: +2 Ritmo, +2 Físico.'
      },
      {
        label: '🏃 Pedir la baja inmediata',
        effect: { morale: -4, extraOffers: 2 },
        resultText: 'No soportaste la presión. Pediste irte y el representante busca opciones.'
      }
    ]
  },
  {
    id: 'retiro_42_anos',
    text: (p) => p.age >= 42
      ? `A los ${p.age} años, tu carrera llega al final. Elegí cómo querés cerrar esta historia.`
      : null, // Solo aparece a los 42+
    options: [
      {
        label: '🎬 Último Partido de Retiro (Ceremonia)',
        effect: { retired: true, retirementCeremony: true },
        resultText: 'Elegiste un clásico o un partido importante. Jugaste tu último partido con el público de pie. **¡LEYENDA QUE SE RETIRÓ EN LA CANCHA!** Tu veredicto subirá un título.'
      },
      {
        label: '🏁 Retiro Inmediato',
        effect: { retired: true },
        resultText: 'Decidiste parar acá. Tu veredicto se calcula según tu carrera.'
      }
    ]
  },
  {
    id: 'competencia_rivales',
    text: (p) => `En tu servidor hay otro jugador con una carrera activa. ¿Querés que sea tu rival en los clásicos?`,
    options: [
      {
        label: '⚔️ Aceptar rivalidad (más tensión)',
        effect: { rivalry: true, morale: 3, attr: { ritmo: 1, tiro: 1 } },
        resultText: 'Intensidad extra en los clásicos contra tu rival: +3 moral cuando ganas, -3 cuando pierdes. Rating +0.3 en esos partidos.'
      },
      {
        label: '😌 Jugar sin rivalidades',
        effect: { morale: 1 },
        resultText: 'Preferís el juego limpio sin competencias personales.'
      }
    ]
  },
  {
    id: 'objetivos_temporada_club',
    text: (p) => {
      const targets = ['Top 4 (Copa Continental)', 'Ganar la Liga', 'No descender', 'Semis de Copa'];
      const target = pick(targets);
      return `Tu club te plantea el objetivo de temporada: **${target}**. ¿Aceptás el desafío?`;
    },
    options: [
      {
        label: '🎯 Aceptar con presión',
        effect: { morale: 2, attr: { fisico: 1, pase: 1 }, seasonObjective: true },
        resultText: 'Asumiste el desafío. Si lo cumplís: +10% bonus salarial y +3 moral. Si no: -2 moral.'
      },
      {
        label: '😌 Jugar sin presión',
        effect: { morale: 3 },
        resultText: 'Preferís enfocarte en tu rendimiento individual.'
      }
    ]
  },
  {
    id: 'contrato_europa_llamado',
    text: () => 'Un club top de Europa te hace una oferta por 3 temporadas a nivel de Champions League.',
    options: [
      {
        label: '✈️ Ir a la aventura europea',
        effect: { attr: { regate: 2, tiro: 2, pase: 1 }, potential: 2, morale: -1 },
        resultText: 'Te vas a jugar en la élite mundial. Rating +0.2 en partidos de Champions. Potencial +2.'
      },
      {
        label: '🏠 Quedarte en la zona de confort',
        effect: { morale: 5, attr: { fisico: 1 } },
        resultText: 'Preferiste tu ambiente donde sos estrella. Morale +5.'
      }
    ]
  }
];

/**
 * Función para aplicar el efecto especial del retiro a los 42 años
 */
function checkRetirementCeremony(player) {
  if (player.age >= 42 && !player.retired) {
    return {
      isRetirementAge: true,
      mustDecide: true,
      message: `A los ${player.age} años, tu carrera profesional llega a su final. Elegí cómo querés cerrar esta historia legendaria.`
    };
  }
  return { isRetirementAge: false, mustDecide: false };
}

/**
 * Aplicar bonus de clásico (rivalidad histórica)
 */
function getClassicBonus(player, opponentName) {
  // Clásicos históricos
  const CLASICOS = {
    'Boca Juniors': ['River Plate'],
    'River Plate': ['Boca Juniors'],
    'Real Madrid': ['FC Barcelona'],
    'FC Barcelona': ['Real Madrid'],
    'Flamengo': ['Fluminense', 'Vasco da Gama'],
    'Fluminense': ['Flamengo'],
    'Vasco da Gama': ['Flamengo'],
    'AC Milan': ['Inter Milan'],
    'Inter Milan': ['AC Milan'],
    'Manchester United': ['Manchester City', 'Liverpool'],
    'Manchester City': ['Manchester United'],
    'Liverpool': ['Manchester United', 'Everton'],
    'Everton': ['Liverpool']
  };

  const rivals = CLASICOS[player.club] || [];
  const isClassic = rivals.includes(opponentName);

  if (isClassic) {
    return {
      isClassic: true,
      ratingBonus: 0.3,
      moraleBonus: 5,
      moraleWinBonus: 5,
      moraleLossBonus: -5,
      salaryBonus: 1.3
    };
  }

  return { isClassic: false, ratingBonus: 0, moraleBonus: 0, salaryBonus: 1.0 };
}

/**
 * Calcular bonus de racha (años 39-42)
 */
function getVeteranBonus(player) {
  if (player.age >= 39) {
    const yearsLeft = 42 - player.age + 1;
    return {
      yearsLeft,
      isVeteran: true,
      text: `⏳ Te quedan aprox. ${yearsLeft} temporada(s) de élite.`
    };
  }
  return { isVeteran: false };
}

module.exports = {
  NUEVOS_EVENTOS_CARRERA,
  checkRetirementCeremony,
  getClassicBonus,
  getVeteranBonus
};
