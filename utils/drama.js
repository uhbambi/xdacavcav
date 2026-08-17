'use strict';

const { rand, pick } = require('./simulation.js');

/**
 * Drama futbolístico: eventos pesados de carrera que aparecen como "momentos
 * decisivos" y se conectan con la personalidad del jugador.
 */

const DRAMA_MOMENTOS = [
  {
    id: 'pelea_dt',
    text: (p) => `🔥 Estalló una **pelea fuerte con el DT de ${p.club}** en plena práctica. Todo el plantel quedó en silencio.`,
    options: [
      { label: 'Disculparte en privado', effect: { morale: -3, attr: { fisico: 2 } }, resultText: 'Rompiste el hielo, pero quedó una tensión latente. Sumaste físico entrenando de más.' },
      { label: 'Sostener tu postura en público', effect: { morale: -8, extraOffers: 2 }, resultText: 'El vestuario quedó partido. La prensa habla de un quiebre y otros clubes llaman a tu representante.' }
    ]
  },
  {
    id: 'pelea_companero',
    text: (p) => `🥊 En el entrenamiento te agarraste a las manos con un **compañero del plantel de ${p.club}**.`,
    options: [
      { label: 'Dar la cara y pedir perdón al grupo', effect: { morale: 2, attr: { pase: 1 } }, resultText: 'El grupo valoró tu humildad. La química volvió de a poco.' },
      { label: 'Cortar la relación de raíz', effect: { morale: -5, attr: { regate: 2 } }, resultText: 'Te enfocaste en vos y entrenaste individualmente. Ganás en lo técnico, perdés en el vestuario.' }
    ]
  },
  {
    id: 'conflicto_contractual',
    text: (p) => `📄 **Conflicto contractual:** la dirigencia de ${p.club} quiere renovarte a la baja y vos pedís un aumento.`,
    options: [
      { label: 'Patear el tablero y exigir lo que valés', effect: { morale: -3, extraOffers: 3 }, resultText: 'La negociación se tensó, pero tu representante movió contactos: llegan más ofertas.' },
      { label: 'Bajar las pretensiones por el club', effect: { morale: 3, attr: { defensa: 1 } }, resultText: 'Renovaste por amor a la camiseta. La gente lo valora.' }
    ]
  },
  {
    id: 'filtracion_chat',
    text: () => '🕵️ **Se filtró un chat privado tuyo** criticando a un compañero y a la táctica del equipo.',
    options: [
      { label: 'Salir a pedir disculpas públicas', effect: { morale: -4 }, resultText: 'Controlaste el incendio, pero la imagen quedó golpeada.' },
      { label: 'Negar todo y señalar una edición', effect: { morale: 2, overallRisk: -1 }, resultText: 'La mitad te cree, la otra mitad sospecha. Ganás tiempo.' }
    ]
  },
  {
    id: 'entrevista_polemica',
    text: (p) => `🎙️ En una **entrevista polémica** declaraste que ${p.club} te queda chico y mirás de reojo a Europa.`,
    options: [
      { label: 'Mantener las declaraciones', effect: { morale: -6, extraOffers: 2 }, resultText: 'La hinchada está que arde, pero los clubes grandes te llamaron.' },
      { label: 'Bajar un cambio y aclarar que fue sacado de contexto', effect: { morale: 1 }, resultText: 'Calmaste las aguas a medias.' }
    ]
  },
  {
    id: 'suplencia_inesperada',
    text: (p) => `🪑 **Suplencia inesperada:** el DT te dejó en el banco para el próximo partido de ${p.club} sin darte explicaciones.`,
    options: [
      { label: 'Aceptarlo y entrenar el doble', effect: { morale: -3, attr: { fisico: 2 } }, resultText: 'Tragaste bronca y la transformaste en trabajo.' },
      { label: 'Plantarte y exigir explicaciones al DT', effect: { morale: -7, attr: { tiro: 1 } }, resultText: 'Quedó un cortocircuito público, pero demostraste carácter.' }
    ]
  },
  {
    id: 'capitan_lesionado',
    text: (p) => `🩹 El **capitán de ${p.club} se lesionó** de gravedad y la directiva mira quién toma el brazalete.`,
    options: [
      { label: 'Pedir la cinta y liderar', effect: { morale: 5, attr: { pase: 1, defensa: 1 } }, resultText: 'Te convertiste en el nuevo referente del vestuario.' },
      { label: 'Dejar que lo decida el grupo', effect: { morale: 1 }, resultText: 'Preferiste el perfil bajo por ahora.' }
    ]
  },
  {
    id: 'oferta_rival',
    text: (p) => `🕊️ **El máximo rival de ${p.club} preguntó por vos.** Una oferta que enciende a la hinchada.`,
    options: [
      { label: 'Rechazar de inmediato por lealtad', effect: { morale: 6, potential: 1 }, resultText: 'La hinchada te eleva a ídolo por tu lealtad.' },
      { label: 'Escuchar la propuesta', effect: { morale: -8, extraOffers: 2, bankBonus: 150000 }, resultText: 'La prensa explotó. Ganas plata, pero la tribuna no te perdona.' }
    ]
  },
  {
    id: 'hinchada_salida',
    text: (p) => `📢 **La hinchada pide tu salida:** en el último partido desplegaron una bandera exigiendo que dejes ${p.club}.`,
    options: [
      { label: 'Callar bocas con goles', effect: { morale: 3, attr: { tiro: 2 } }, resultText: 'Convertiste la bronca en combustible.' },
      { label: 'Pedir el pase a tu representante', effect: { morale: -5, extraOffers: 3 }, resultText: 'Activaste la maquinaria de salida.' }
    ]
  },
  {
    id: 'companero_puesto',
    text: (p) => `⚔️ **Un compañero te disputa el puesto:** llegó un refuerzo joven que juega en tu posición y pide titularidad.`,
    options: [
      { label: 'Competir y ganarte el lugar en cada práctica', effect: { morale: 2, attr: { ritmo: 1, fisico: 1 } }, resultText: 'Subiste tu nivel empujado por la competencia.' },
      { label: 'Presionar para que lo cedan a préstamo', effect: { morale: -3, attr: { defensa: 1 } }, resultText: 'La interna se puso tensa, pero aseguraste tu lugar.' }
    ]
  }
];

/**
 * Micro-drama que puede colgarse de un partido (flash en el embed).
 * Devuelve texto o null.
 */
function maybeDramaFlash(player, context = {}) {
  const { result = 'E' } = context;
  if (Math.random() > 0.14) return null;

  const flash = pick([
    `🗣️ **Cruce en el vestuario:** un compañero te recriminó una jugada y la discusión subió de tono.`,
    `📰 **Portada incómoda:** la prensa publicó declaraciones tuyas fuera de contexto.`,
    `😤 **El DT te miró mal** cuando te cambiaron: el banco de suplentes es un lugar frío.`,
    `💬 **Tu representante filtró** que hay clubes grandes siguiéndote de cerca.`,
    `🧊 **Tensión con el capitán:** no le gustó cómo festejaste tu gol en el vestuario.`
  ]);

  return result === 'D'
    ? flash
    : (Math.random() < 0.5 ? flash : null);
}

module.exports = {
  DRAMA_MOMENTOS,
  maybeDramaFlash
};
