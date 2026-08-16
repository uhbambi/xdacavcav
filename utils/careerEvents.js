'use strict';

const { pick, rand } = require('./simulation.js');

/**
 * Nuevos Eventos de Carrera - Ampliación del sistema de decisiones
 */

const NEW_CAREER_EVENTS = [
  {
    id: 'arabia_offer',
    text: (p) => `🇸🇦 Un club de Arabia Saudita te ofrece un contrato de $${(p.overall * 50000).toLocaleString('en-US')}/año durante 3 años.`,
    options: [
      {
        label: '✍️ Aceptar la oferta millonaria',
        effect: { morale: 3, extraOffers: 1, saudiOffer: true },
        resultText: 'Negociaste con Arabia. Recibirás ofertas de clubes sauditas en futuros mercados.'
      },
      {
        label: '💰 Negociar mejor contrato',
        effect: { morale: 5, extraOffers: 2 },
        resultText: 'Pusiste precio alto. Tu representante negoció condiciones premium.'
      },
      {
        label: '❌ Rechazar y quedarse en Europa',
        effect: { morale: 2 },
        resultText: 'Priorizaste tu carrera en grandes ligas europeas.'
      }
    ]
  },
  {
    id: 'manager_change',
    text: (p) => `El técnico de ${p.club} fue despedido. Llega un nuevo DT con idea diferente.`,
    options: [
      {
        label: '✅ Adaptarse rápido al nuevo proyecto',
        effect: { morale: 3, attr: { pase: 1 } },
        resultText: 'Te adaptaste bien. El nuevo técnico confía en ti.'
      },
      {
        label: '🔄 Pedir ser transferido',
        effect: { morale: -2, extraOffers: 3 },
        resultText: 'Pediste que te transfieran. Salen ofertas de otros clubes.'
      }
    ]
  },
  {
    id: 'financial_crisis',
    text: (p) => `${p.club} enfrenta crisis financiera. Te piden bajar tu sueldo 30%.`,
    options: [
      {
        label: '🤝 Sacrificarte por lealtad',
        effect: { morale: 8, attr: { fisico: 1 } },
        resultText: 'Tu lealtad te honra. El club no lo olvida.'
      },
      {
        label: '🚪 Rechazar y buscar equipo',
        effect: { morale: 3, extraOffers: 2 },
        resultText: 'Priorizaste tu valor. Salen ofertas de otros clubes.'
      }
    ]
  },
  {
    id: 'fan_conflict',
    text: (p) => `La hinchada de ${p.club} tiene conflicto contigo por tu rendimiento.`,
    options: [
      {
        label: '💪 Callarte jugando bien',
        effect: { morale: 2, attr: { tiro: 1, regate: 1 } },
        resultText: 'Respondiste en la cancha. La hinchada se ganó de nuevo.'
      },
      {
        label: '🎤 Enfrentarte públicamente',
        effect: { morale: -5 },
        resultText: 'Las cosas se pusieron tóxicas. Tu moral bajó.'
      }
    ]
  },
  {
    id: 'europe_offer',
    text: (p) => `Un gran club europeo te ofrece jugar en la Champions League.`,
    options: [
      {
        label: '🌍 Aceptar la aventura europea',
        effect: { morale: 10, potential: 3 },
        resultText: '¡Vás a jugar en Europa! Tu potencial creció con esta oportunidad.'
      },
      {
        label: '🏠 Quedarte en tu continente',
        effect: { morale: 3 },
        resultText: 'Preferiste consolidarte en tu liga.'
      }
    ]
  },
  {
    id: 'contract_extension',
    text: (p) => `${p.club} te ofrece renovar con bono importante por objetivos.`,
    options: [
      {
        label: '✍️ Firmar y comprometerse',
        effect: { morale: 6 },
        resultText: 'Renovaste. Tranquilidad económica y respaldo del club.'
      },
      {
        label: '⏳ Esperar mejor oferta',
        effect: { morale: 0, extraOffers: 2 },
        resultText: 'Preferiste esperar. Salen más ofertas en el mercado.'
      }
    ]
  },
  {
    id: 'superagent',
    text: () => `Un superagente internacional te ofrece representación premium.`,
    options: [
      {
        label: '🤝 Confiar en él',
        effect: { extraOffers: 2 },
        resultText: 'Ahora eres representado por un top agent. Más ofertas de élite.'
      },
      {
        label: '🚫 Mantener tu representante actual',
        effect: { morale: 2 },
        resultText: 'Preferiste la confianza con quien trabajas hace años.'
      }
    ]
  },
  {
    id: 'injury_surgery',
    text: () => `Arrastrás una molestia crónica. Necesitás operarte ahora o infiltrarte.`,
    options: [
      {
        label: '🏥 Operarte correctamente',
        effect: { injuryStart: 4, attr: { fisico: 3 }, morale: -1 },
        resultText: 'Te operaste. Perderás 4 partidos pero volvés mucho mejor.'
      },
      {
        label: '💉 Infiltrarte y jugar',
        effect: { morale: 3, injuryRisk: 0.25 },
        resultText: 'Seguís jugando... pero el riesgo de una lesión grave es alto.'
      }
    ]
  }
];

function maybePickNewCareerEvent(chance = 0.5) {
  if (Math.random() > chance) return null;
  return pick(NEW_CAREER_EVENTS);
}

function getNewCareerEventById(id) {
  return NEW_CAREER_EVENTS.find(e => e.id === id);
}

module.exports = {
  NEW_CAREER_EVENTS,
  maybePickNewCareerEvent,
  getNewCareerEventById
};