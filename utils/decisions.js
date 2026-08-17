'use strict';

const { pick, rand } = require('./simulation.js');
const { overallFrom, ATTR_LABELS } = require('./attributes.js');

/**
 * Decisiones de la carrera.
 *
 * MOMENTOS: aparecen despues de un partido, son chicos pero se acumulan.
 * EVENTOS_CARRERA: aparecen al cerrar la temporada y pesan de verdad
 * (potencial, atributos, foco de entrenamiento, moral, riesgo de lesion).
 *
 * Efectos posibles en `effect`:
 *   morale: +/- moral
 *   attr: { tiro: +3, fisico: -1, ... } sube/baja atributos concretos
 *   potential: +/- techo del jugador
 *   trainingFocus: atributo que se entrena todo el año (crece mas rapido)
 *   injuryRisk: probabilidad de lesionarte de una y perderte partidos
 *   overallRisk / overallBonus: ajustes directos (legacy, siguen funcionando)
 */

const MOMENTOS = [
  {
    id: 'entrevista_post',
    text: (p) => `Los periodistas te paran a la salida del camarín y te preguntan por tu nivel en **${p.club}**.`,
    options: [
      { label: 'Hablar con humildad', effect: { morale: 3 }, resultText: 'Tu humildad cae bien en el camarín. Sube tu moral.' },
      { label: 'Tirarte flor y media', effect: { morale: 6, overallRisk: -1 }, resultText: 'Quedaste como figura en la prensa, pero algunos compañeros te miraron feo.' }
    ]
  },
  {
    id: 'dt_bronca',
    text: () => 'El DT te llama a la oficina — no le gustó algo de tu actitud en la semana.',
    options: [
      { label: 'Pedir disculpas y entrenar extra', effect: { morale: -2, attr: { fisico: 2 } }, resultText: 'Bajoneado, pero le metiste más fierro a los entrenos: subiste físico.' },
      { label: 'Defender tu postura', effect: { morale: 5, injuryRisk: 0 }, resultText: 'Te la jugaste — el plantel te bancó, pero quedaste marcado con el DT.' }
    ]
  },
  {
    id: 'hinchada',
    text: (p) => `Un grupo de la hinchada de **${p.club}** te espera afuera del estadio para saludarte.`,
    options: [
      { label: 'Quedarte a firmar camisetas', effect: { morale: 4 }, resultText: 'La gente te adora un poco más.' },
      { label: 'Irte rápido, estás cansado', effect: { morale: -1 }, resultText: 'Nadie se enojó, pero perdiste una chance de conectar con la hinchada.' }
    ]
  },
  {
    id: 'gym_extra',
    text: () => 'El preparador físico te ofrece un plan extra de gimnasio para los martes y jueves.',
    options: [
      { label: 'Meterle al gimnasio a fondo', effect: { attr: { fisico: 2 }, morale: -1 }, resultText: 'Terminás muerto, pero ganaste masa muscular y potencia: +2 Físico.' },
      { label: 'Priorizar velocidad y descanso', effect: { morale: 3, attr: { ritmo: 2 } }, resultText: 'Llegás más fresco y veloz a los partidos: +2 Ritmo.' }
    ]
  },
  {
    id: 'tiros_libres',
    text: () => 'Después del entrenamiento podés quedarte a practicar pelota parada solo.',
    options: [
      { label: 'Quedarte pateando al arco', effect: { attr: { tiro: 2 } }, resultText: 'Cada vez le pegás con más rosca y potencia: +2 Tiro.' },
      { label: 'Quedarte con los volantes tocando', effect: { attr: { pase: 2 } }, resultText: 'Tu precisión en corto y largo mejoró notablemente: +2 Pase.' }
    ]
  },
  {
    id: 'sesion_gambeta',
    text: () => 'En la práctica hay un torneo de fútbol reducido y 1 contra 1.',
    options: [
      { label: 'Encarar y tirar lujos', effect: { attr: { regate: 2 }, morale: 2 }, resultText: 'Dejaste a todos pagando en el reducido: +2 Regate.' },
      { label: 'Jugar a un toque seguro', effect: { attr: { pase: 1, vision: 1 }, morale: 1 }, resultText: 'Excelente lectura de juego: +1 Pase.' }
    ]
  },
  {
    id: 'analisis_video',
    text: () => 'El cuerpo técnico ofrece una sesión voluntaria de videoanálisis táctico de los rivales.',
    options: [
      { label: 'Estudiar los movimientos tácticos', effect: { attr: { pase: 2, defensa: 1 } }, resultText: 'Mejoraste tu posicionamiento y visión de cancha: +2 Pase, +1 Defensa.' },
      { label: 'Descansar la cabeza', effect: { morale: 3 }, resultText: 'Te despejaste y llegás con la mente limpia.' }
    ]
  },
  {
    id: 'duelo_defensivo_entreno',
    text: () => 'El ayudante de campo busca voluntarios para entrenar coberturas, cortes y juego aéreo.',
    options: [
      { label: 'Meter pierna fuerte y aprender a marcar', effect: { attr: { defensa: 2, fisico: 1 } }, resultText: 'Te hiciste impasable en los mano a mano: +2 Defensa, +1 Físico.' },
      { label: 'Cuidar las piernas para el fin de semana', effect: { morale: 2 }, resultText: 'Evitaste golpes innecesarios.' }
    ]
  },
  {
    id: 'velocidad_sprints',
    text: () => 'El preparador físico arma un circuito especial de aceleración y piques cortos.',
    options: [
      { label: 'Hacer todas las pasadas al 100%', effect: { attr: { ritmo: 2 }, morale: -1 }, resultText: 'Quedaste exhausto pero volás en la cancha: +2 Ritmo.' },
      { label: 'Regular el esfuerzo', effect: { morale: 1 }, resultText: 'Mantuviste el ritmo parejo.' }
    ]
  },
  {
    id: 'arquero_reflejos_moment',
    text: (p) => p.position === 'POR' ? 'El entrenador de arqueros te propone un desafío con pelotas de tenis a quemarropa.' : 'El profe propone un desafío de definición rápida a un toque.',
    options: [
      { label: 'Aceptar el desafío de máxima exigencia', effect: { attr: { defensa: 2, fisico: 1 } }, resultText: 'Reflejos felinos y reacción inmediata: +2 Atributo defensivo, +1 Físico.' },
      { label: 'Hacer el entreno convencional', effect: { morale: 2 }, resultText: 'Cumpliste con la rutina del día.' }
    ]
  },
  {
    id: 'fiesta',
    text: () => 'Los compañeros te invitan a un asado el sábado a la noche, en plena semana de partido.',
    options: [
      { label: 'Ir un rato, sin excesos', effect: { morale: 4 }, resultText: 'Buena onda con el grupo y llegaste bien al partido.' },
      { label: 'Quedarte en casa cuidándote', effect: { morale: -1, attr: { fisico: 2 } }, resultText: 'Aburrido, pero llegaste como una máquina: +2 Físico.' }
    ]
  },
  {
    id: 'nutricion_suplementos',
    text: () => 'El nutricionista del club te recomienda un plan de suplementación e hidratación deportiva.',
    options: [
      { label: 'Seguir la dieta estricta', effect: { attr: { fisico: 2, ritmo: 1 } }, resultText: 'Tu resistencia física y recuperación mejoraron: +2 Físico, +1 Ritmo.' },
      { label: 'Comer lo de siempre', effect: { morale: 2 }, resultText: 'Seguís disfrutando de tus comidas favoritas.' }
    ]
  },
  {
    id: 'lesion_companero',
    text: () => 'Un compañero de puesto se lesionó. El DT te pregunta si te animás a jugar mas minutos.',
    options: [
      { label: 'Meterle con todo', effect: { morale: 2, attr: { fisico: 1, defensa: 1 }, injuryRisk: 0.10 }, resultText: 'Aprovechaste la chance para mostrarte: +1 Físico, +1 Defensa.' },
      { label: 'Cuidarte, no arriesgar de más', effect: { morale: -1 }, resultText: 'Jugaste tranquilo, sin sobresaltos.' }
    ]
  },
  {
    id: 'penal_ultimo',
    text: (p) => `En el vestuario se discute quién patea los penales de **${p.club}**.`,
    options: [
      { label: 'Pedir la responsabilidad', effect: { morale: 3, attr: { tiro: 2 } }, resultText: 'Sos el pateador designado: +2 Tiro.' },
      { label: 'Dejársela al capitán', effect: { morale: 0 }, resultText: 'Preferiste no cargar con esa mochila.' }
    ]
  },
  {
    id: 'redes',
    text: () => 'Un video tuyo se hace viral y te llueven comentarios (buenos y malos).',
    options: [
      { label: 'Contestar a los haters', effect: { morale: -4 }, resultText: 'Te metiste en una pelea inútil y quedaste caliente toda la semana.' },
      { label: 'Ignorar y enfocarte en entrenar', effect: { morale: 2, attr: { regate: 1, tiro: 1 } }, resultText: 'Cabeza fría y concentración: +1 Regate, +1 Tiro.' }
    ]
  }
];

const EVENTOS_CARRERA = [
  {
    id: 'foco_entrenamiento',
    text: () => 'Pretemporada: el cuerpo técnico te deja elegir en qué te vas a enfocar todo el año.',
    options: [
      { label: '🎯 Entrenar definición letal', effect: { trainingFocus: 'tiro', attr: { tiro: 3 } }, resultText: 'Todo el año a patear al arco: +3 Tiro inmediato y mayor crecimiento.' },
      { label: '🅿️ Entrenar pase y visión', effect: { trainingFocus: 'pase', attr: { pase: 3 } }, resultText: 'Vas a manejar el juego: +3 Pase inmediato y mayor crecimiento.' },
      { label: '💪 Entrenar físico y resistencia', effect: { trainingFocus: 'fisico', attr: { fisico: 3 } }, resultText: 'Más músculo y potencia: +3 Físico inmediato y mayor crecimiento.' },
      { label: '⚡ Entrenar ritmo y aceleración', effect: { trainingFocus: 'ritmo', attr: { ritmo: 3 } }, resultText: 'Velocidad pura: +3 Ritmo inmediato y mayor crecimiento.' }
    ]
  },
  {
    id: 'masterclass_leyenda',
    text: (p) => `Una leyenda histórica del fútbol de **${p.nationality}** te invita a un campamento intensivo de 2 semanas.`,
    options: [
      { label: 'Entrenar técnica y golpeo', effect: { attr: { tiro: 3, regate: 2 }, potential: 2 }, resultText: '¡Clase magistral de técnica! +3 Tiro, +2 Regate, +2 Potencial.' },
      { label: 'Entrenar visión y táctica', effect: { attr: { pase: 3, defensa: 2 }, potential: 2 }, resultText: '¡Entendimiento total del juego! +3 Pase, +2 Defensa, +2 Potencial.' },
      { label: 'Entrenar potencia y reflejos', effect: { attr: { fisico: 3, ritmo: 2 }, potential: 2 }, resultText: '¡Acondicionamiento de élite mundial! +3 Físico, +2 Ritmo, +2 Potencial.' }
    ]
  },
  {
    id: 'preparador_personal',
    text: () => 'Tenés la oportunidad de contratar a un preparador físico y biomecánico personal durante todo el año.',
    options: [
      { label: 'Contratar al preparador de élite', effect: { attr: { fisico: 3, ritmo: 2 }, potential: 1, morale: 3 }, resultText: 'Tu estado atlético es impecable: +3 Físico, +2 Ritmo, +1 Potencial.' },
      { label: 'Ahorrar el dinero', effect: { morale: 1 }, resultText: 'Seguís con la rutina estándar del club.' }
    ]
  },
  {
    id: 'clinica_especializada',
    text: (p) => p.position === 'POR'
      ? 'Un preparador de arqueros de Champions League dicta una clínica de atajadas y achiques.'
      : 'Un especialista internacional en regates y definición dicta una clínica avanzada.',
    options: [
      { label: 'Inscribirte y darlo todo', effect: { attr: { defensa: 3, tiro: 2, regate: 2 }, potential: 2 }, resultText: 'Subiste tu nivel técnico drásticamente: +3 Defensa/Atajada, +2 Tiro/Regate.' },
      { label: 'Tomarte vacaciones completas', effect: { morale: 8 }, resultText: 'Desconectaste 100% y volvés con la moral por las nubes.' }
    ]
  },
  {
    id: 'presion_dt',
    text: (p) => `El DT de **${p.club}** quiere que seas el nuevo líder del plantel.`,
    options: [
      { label: 'Aceptar el rol de líder', effect: { morale: 6, attr: { pase: 2, fisico: 2 }, potential: 2 }, resultText: 'Te pusiste el equipo al hombro: +2 Pase, +2 Físico, +2 Potencial.' },
      { label: 'Preferir bajo perfil por ahora', effect: { morale: 2 }, resultText: 'Seguís enfocado sin la presión extra.' }
    ]
  },
  {
    id: 'pedir_10',
    text: (p) => `Con la salida de un referente, hay lugar para pedir el dorsal 10 en **${p.club}**.`,
    options: [
      { label: 'Pedir la camiseta 10', effect: { morale: 5, attr: { regate: 3, tiro: 1 }, potential: 2 }, resultText: 'Te pusiste la 10 — toda la exigencia pasa por vos: +3 Regate, +1 Tiro, +2 Potencial.' },
      { label: 'Dejarla pasar', effect: { morale: 0 }, resultText: 'Preferiste no aumentar la presión todavía.' }
    ]
  },
  {
    id: 'renovacion',
    text: (p) => `La dirigencia de **${p.club}** te ofrece renovar con un premio grande por objetivos.`,
    options: [
      { label: 'Firmar la renovación', effect: { morale: 6 }, resultText: 'Tranquilidad económica y respaldo del club.' },
      { label: 'Esperar ofertas del exterior', effect: { morale: -3, extraOffers: 2 }, resultText: 'Quedó picante con la dirigencia, pero tu representante movió el teléfono: van a llegar más ofertas.' }
    ]
  },
  {
    id: 'representante',
    text: () => 'Un representante top te ofrece manejar tu carrera a cambio de un porcentaje alto.',
    options: [
      { label: 'Firmar con él', effect: { extraOffers: 2, morale: 2 }, resultText: 'Ahora te mueven en clubes más grandes: más ofertas cada mercado.' },
      { label: 'Seguir con tu representante de siempre', effect: { morale: 3 }, resultText: 'Menos ruido, gente de confianza.' }
    ]
  },
  {
    id: 'cirugia',
    text: () => 'Arrastrás una molestia crónica. El médico te propone operarte ahora y perderte el arranque.',
    options: [
      { label: 'Operarte y recuperarte bien', effect: { injuryStart: 3, attr: { fisico: 4 }, morale: -2 }, resultText: 'Te perdés las primeras fechas, pero volvés como un toro: +4 Físico.' },
      { label: 'Infiltrarte y seguir jugando', effect: { morale: 2, injuryRisk: 0.30 }, resultText: 'Seguís en cancha… con el riesgo de que explote en cualquier momento.' }
    ]
  },
  {
    id: 'seleccion',
    text: (p) => `El técnico de la selección de **${p.nationality}** te llama para decirte que te sigue de cerca.`,
    options: [
      { label: 'Comprometerte con la selección', effect: { morale: 5, potential: 2, capsBoost: 2, attr: { ritmo: 1, pase: 1 } }, resultText: 'Vas a viajar en cada fecha FIFA: +2 Potencial, +1 Ritmo, +1 Pase.' },
      { label: 'Priorizar el club', effect: { morale: 1, attr: { fisico: 2 } }, resultText: 'Descansás más y rendís mejor en el club: +2 Físico.' }
    ]
  },
  {
    id: 'oferta_arabia',
    text: (p) => `🇸🇦 Un club de Arabia Saudí te presenta una oferta astronómica: ¡**$${Math.round((p.salary || 50000) * 3.5).toLocaleString('en-US')}**/año más premios por gol!`,
    options: [
      {
        label: '💰 Aceptar la oferta millonaria (+350% salario)',
        effect: { morale: -2, attr: { ritmo: -1, pase: 1 }, salaryMultiplier: 3.5, bankBonus: 500000 },
        resultText: 'Firmaste en Arabia. Tu cuenta bancaria estalla de millones y eres el rey del vestuario: ¡Salario multiplicado x3.5 y $500,000 de prima de fichaje!'
      },
      {
        label: '⚖️ Negociar aumento en tu club actual',
        effect: { morale: 4, attr: { fisico: 1 }, salaryMultiplier: 1.25 },
        resultText: 'Tu club actual te mejoró el contrato un +25% para no perderte. Te quedas como ídolo.'
      },
      {
        label: '❌ Rechazar por competir en la élite',
        effect: { morale: 6, potential: 2 },
        resultText: 'Rechazaste los petrodólares. La prensa internacional y la hinchada aplauden tu lealtad competitiva: +2 Potencial, +6 Moral.'
      }
    ]
  },
  {
    id: 'inversion_negocios',
    text: (p) => `Tienes suficiente capital acumulado ($${(p.bank || 50000).toLocaleString('en-US')}). Un socio te propone invertir en un proyecto extra-futbolístico.`,
    options: [
      {
        label: '🏢 Abrir cadena de restaurantes y marca de ropa',
        effect: { morale: 4, bankBonus: 120000 },
        resultText: 'Tu marca personal es un éxito rotundo fuera de la cancha: +$120,000 en dividendos y mayor fama.'
      },
      {
        label: '🏎️ Comprar superdeportivos y mansión de lujo',
        effect: { morale: 8, attr: { regate: 1 } },
        resultText: 'Vives la vida de estrella al 100%. Llegas al entreno en Ferrari con la moral por las nubes.'
      },
      {
        label: '🏟️ Fundar academia de fútbol formativo para niños',
        effect: { morale: 6, potential: 1, attr: { vision: 1 } },
        resultText: 'Creaste tu propia escuela de fútbol: respeto unánime de la sociedad y madurez deportiva.'
      }
    ]
  },
  {
    id: 'cambio_dt_club',
    text: (p) => `Renunció el cuerpo técnico de **${p.club}**. Llega un nuevo DT con una pizarra muy exigente.`,
    options: [
      {
        label: '✅ Adaptarte a su esquema táctico',
        effect: { morale: 3, attr: { pase: 2, defensa: 1 } },
        resultText: 'Te ganaste la titularidad indiscutida con el nuevo DT: +2 Pase, +1 Defensa.'
      },
      {
        label: '⚠️ Pedir traspaso si no te garantiza minutos',
        effect: { morale: -2, extraOffers: 3 },
        resultText: 'Tu representante activó contactos y consiguió 3 sondeos de clubes importantes.'
      }
    ]
  },
  {
    id: 'academia',
    text: () => 'Te invitan a pasar la pretemporada en la academia de un club top de Europa.',
    options: [
      { label: 'Ir a entrenar afuera', effect: { attr: { regate: 3, ritmo: 2, tiro: 2 }, potential: 3, morale: -1 }, resultText: 'Volviste con otra cabeza y nivel europeo: +3 Regate, +2 Ritmo, +2 Tiro, +3 Potencial.' },
      { label: 'Quedarte con el plantel', effect: { morale: 5 }, resultText: 'El grupo valoró que te quedaras.' }
    ]
  }
];

// Drama futbolístico: eventos pesados que amplían el banco de momentos decisivos.
const { DRAMA_MOMENTOS } = require('./drama.js');
MOMENTOS.push(...DRAMA_MOMENTOS);

function maybePickMomento(chance = 0.35) {
  if (Math.random() > chance) return null;
  return pick(MOMENTOS);
}

function maybePickCareerEvent(chance = 0.7) {
  if (Math.random() > chance) return null;
  return pick(EVENTOS_CARRERA);
}

/** Aplica el efecto de una opcion elegida. Devuelve un texto extra si pasó algo notorio. */
function applyEffect(player, effect) {
  if (!effect) return '';
  const notes = [];

  if (typeof effect.morale === 'number') {
    player.morale = Math.max(10, Math.min(100, player.morale + effect.morale));
  }

  if (effect.attr) {
    for (const [key, delta] of Object.entries(effect.attr)) {
      const current = player.attributes[key] ?? 50;
      player.attributes[key] = Math.max(20, Math.min(99, current + delta));
      notes.push(`${ATTR_LABELS[key] || key} ${delta >= 0 ? '+' : ''}${delta}`);
    }
  }

  if (typeof effect.overallBonus === 'number') {
    player.attributes.fisico = Math.min(99, (player.attributes.fisico ?? 50) + effect.overallBonus);
  }
  if (typeof effect.overallRisk === 'number' && Math.random() < 0.4) {
    player.attributes.fisico = Math.max(20, (player.attributes.fisico ?? 50) + effect.overallRisk);
  }

  if (typeof effect.potential === 'number') {
    player.potential = Math.max(player.overall, Math.min(99, player.potential + effect.potential));
    notes.push(`Potencial ${effect.potential >= 0 ? '+' : ''}${effect.potential}`);
  }

  if (effect.trainingFocus) {
    player.trainingFocus = effect.trainingFocus;
    notes.push(`Foco de entrenamiento: ${ATTR_LABELS[effect.trainingFocus]}`);
  }

  if (typeof effect.extraOffers === 'number') {
    player.extraOffers = (player.extraOffers || 0) + effect.extraOffers;
  }

  if (effect.saudiOffer) {
    player.saudiOffer = true;
  }

  if (typeof effect.salaryMultiplier === 'number') {
    player.salary = Math.round((player.salary || 50000) * effect.salaryMultiplier);
    notes.push(`Nuevo salario: $${player.salary.toLocaleString('en-US')}/año`);
  }

  if (typeof effect.bankBonus === 'number') {
    player.bank = (player.bank || 0) + effect.bankBonus;
    notes.push(`Banco: +$${effect.bankBonus.toLocaleString('en-US')}`);
  }

  if (typeof effect.capsBoost === 'number') {
    player.nationalCommitment = true;
  }

  if (typeof effect.injuryStart === 'number') {
    player.injuredMatches = Math.max(player.injuredMatches || 0, effect.injuryStart);
    notes.push(`Te perdés ${effect.injuryStart} partidos`);
  }

  if (typeof effect.injuryRisk === 'number' && effect.injuryRisk > 0 && Math.random() < effect.injuryRisk) {
    const matches = rand(2, 5);
    player.injuredMatches = Math.max(player.injuredMatches || 0, matches);
    notes.push(`🚑 Te lesionaste: ${matches} partidos afuera`);
  }

  player.overall = Math.min(player.potential, overallFrom(player.attributes, player.position));

  return notes.join(' · ');
}

module.exports = { MOMENTOS, EVENTOS_CARRERA, maybePickMomento, maybePickCareerEvent, applyEffect };
