'use strict';

const { rand, pick, npcName } = require('./simulation.js');

/**
 * Minijuegos de jugadas decisivas.
 * Para arqueros (POR), son 100% jugadas defensivas y de atajadas bajo los tres palos.
 * Para jugadores de campo, son jugadas de ataque, definición, pase y corte salvador.
 * En finales de Copa/Champions/Libertadores/Mundial se activan jugadas épicas de alta dificultad.
 */

const MINIGAMES = {
  // ──────────────────────── ARQUEROS (POR) ────────────────────────
  atajar_penal: {
    title: '🧤 ¡PENAL EN CONTRA!',
    prompt: (ctx) => `Minuto ${ctx.minute}': cobran penal para ${ctx.opponent}. El pateador estrella se prepara y vos te plantás en la línea. ¿Hacia dónde te tirás?`,
    attr: 'defensa',
    reward: 'atajada',
    options: [
      { label: 'Volar al palo izquierdo', emoji: '↖️' },
      { label: 'Aguantar al medio', emoji: '⬆️' },
      { label: 'Volar al palo derecho', emoji: '↗️' }
    ],
    win: (p) => `🧤 ¡ATAJADÓN HISTÓRICO! **${p.name}** adivinó la punta y desvió el penal.`,
    lucky: (p) => `🧤 **${p.name}** rozó el balón con la punta de los dedos y pegó en el poste. ¡Se salvó el equipo!`,
    lose: (p) => `⚽ El pateador engañó por completo a **${p.name}** y la puso al otro lado.`,
    unlucky: (p) => `😖 **${p.name}** adivinó el palo pero el remate fue tan esquinado que entró igual.`
  },
  atajada_mano_a_mano: {
    title: '🧤 Mano a mano frente al delantero',
    prompt: (ctx) => `Minuto ${ctx.minute}': el delantero de ${ctx.opponent} se escapa solo y queda cara a cara con vos. ¿Cómo achicás el arco?`,
    attr: 'defensa',
    reward: 'atajada',
    options: [
      { label: 'Achique en cruz tapando todo', emoji: '🛡️' },
      { label: 'Aguantar de pie y tapar abajo', emoji: '🧤' },
      { label: 'Salir rápido a cortar al piso', emoji: '🦵' }
    ],
    win: (p) => `🧤 ¡MONUMENTAL **${p.name}**! Tapó el mano a mano con el pecho y ahogó el grito de gol.`,
    lucky: (p) => `🧤 El remate rebotó en la pierna de **${p.name}** y se fue al córner. ¡Salvada providencial!`,
    lose: (p) => `⚽ El delantero definió con categoría al rincón y **${p.name}** no pudo llegar.`,
    unlucky: (p) => `😖 **${p.name}** achicó bien pero la pelota se le escurrió por debajo de los brazos.`
  },
  volada_angulo: {
    title: '🦅 Bombazo al ángulo en contra',
    prompt: (ctx) => `Minuto ${ctx.minute}': tiro libre con rosca venenosa de ${ctx.opponent} que busca el ángulo superior. ¿Cómo reaccionás?`,
    attr: 'fisico',
    reward: 'atajada',
    options: [
      { label: 'Volada a mano cambiada', emoji: '🦅' },
      { label: 'Estirada potente a dos manos', emoji: '👐' },
      { label: 'Desvío con la punta de los dedos al córner', emoji: '👆' }
    ],
    win: (p) => `🧤 ¡VOLADA ESPECTACULAR de **${p.name}**! La sacó del ángulo en la foto del partido.`,
    lucky: (p) => `🧤 **${p.name}** llegó con lo justo a desviarla y el travesaño terminó de salvarla.`,
    lose: (p) => `⚽ Bombazo inalcanzable al ángulo. **${p.name}** voló pero no llegó.`,
    unlucky: (p) => `😖 **${p.name}** se estiró pero el tiro llevaba demasiada rosca y se metió pegado al palo.`
  },
  descolgar_centro: {
    title: '🧱 Córner peligroso al área chica',
    prompt: (ctx) => `Minuto ${ctx.minute}': centro cerrado de ${ctx.opponent} cargado de gente en el área chica. ¿Qué hacés?`,
    attr: 'fisico',
    reward: 'atajada',
    options: [
      { label: 'Salir con los puños a despejar lejos', emoji: '👊' },
      { label: 'Saltar entre todos y descolgarla arriba', emoji: '🤲' },
      { label: 'Quedarte bajo los tres palos atento', emoji: '🥅' }
    ],
    win: (p) => `🧤 ¡Imponente **${p.name}**! Salió con autoridad por el aire y dominó el área.`,
    lucky: (p) => `🧤 **${p.name}** alcanzó a manotearla entre la multitud y despejó el peligro.`,
    lose: (p) => `⚽ Anticiparon a **${p.name}** en la salida y cabecearon al gol.`,
    unlucky: (p) => `😖 **${p.name}** dudó en la salida y la jugada terminó en gol rival.`
  },
  achique_urgencia: {
    title: '⚡ Salida de arquero-líbero',
    prompt: (ctx) => `Minuto ${ctx.minute}': pelotazo largo a la espalda de tus centrales. El delantero rival corre embalado. ¿Cómo salís?`,
    attr: 'ritmo',
    reward: 'atajada',
    options: [
      { label: 'Salir fuera del área a despejar de cabeza', emoji: '🤾' },
      { label: 'Barrida limpia con los pies al balón', emoji: '🦶' },
      { label: 'Esperar en la medialuna perfilado', emoji: '⏳' }
    ],
    win: (p) => `🧤 ¡Corte magistral de **${p.name}** cual Neuer! Anticipó afuera del área y limpió la jugada.`,
    lucky: (p) => `🧤 Trancó con alma y vida, la pelota rebotó y se fue al lateral. ¡Respiró el equipo!`,
    lose: (p) => `⚽ El delantero punteó el balón justo antes y definió con el arco libre.`,
    unlucky: (p) => `😖 **${p.name}** calculó mal el pique y el atacante quedó solo con pelota dominada.`
  },
  final_atajada_consagracion: {
    title: '🏆 ¡ATAJADA DE CAMPEONATO EN LA FINAL!',
    prompt: (ctx) => `Minuto 90+3' en la GRAN FINAL: ${ctx.opponent} tiene el gol del título a quemarropa. ¡El destino de la copa está en tus manos!`,
    attr: 'defensa',
    reward: 'atajada',
    options: [
      { label: 'Reflejo milagroso estirando la pierna', emoji: '🦵' },
      { label: 'Volada agónica al poste de la consagración', emoji: '🌟' },
      { label: 'Tapar con el pecho y atenazar el rebote', emoji: '🛡️' }
    ],
    win: (p) => `🏆👑 ¡¡¡ATAJADA HISTÓRICA DE **${p.name}**!!! ¡La atajada del siglo que vale un título continental!`,
    lucky: (p) => `🏆 **${p.name}** la desvió con el talón al córner en el último segundo. ¡Salvada de gloria!`,
    lose: (p) => `⚽ Tristeza en la final: el remate fue inatajable y se clavó en la red.`,
    unlucky: (p) => `😖 **${p.name}** tocó la pelota pero la potencia del tiro la metió dentro.`
  },

  // ──────────────────────── JUGADORES DE CAMPO ────────────────────────
  penal: {
    title: '🥅 ¡PENAL a favor!',
    prompt: (ctx) => `Minuto ${ctx.minute}': cobran penal para **${ctx.club}** contra ${ctx.opponent}. Agarrás la pelota vos. ¿Dónde la ponés?`,
    attr: 'tiro',
    reward: 'gol',
    options: [
      { label: 'Palo izquierdo colocado', emoji: '↖️' },
      { label: 'Al medio, fuerte al techo', emoji: '⬆️' },
      { label: 'Palo derecho esquinado', emoji: '↗️' }
    ],
    win: (p) => `⚽ **${p.name}** la clava y el arquero se tiró al otro palo. ¡GOOOOL!`,
    lucky: (p) => `⚽ El arquero adivinó, pero **${p.name}** le pegó con tanta fuerza que se le escapó. ¡GOL!`,
    lose: (p) => `🧤 El arquero adivinó el palo y le tapó el penal a **${p.name}**.`,
    unlucky: (p) => `😖 **${p.name}** eligió bien pero la mandó rozando el travesaño afuera.`
  },
  mano_a_mano: {
    title: '⚡ Mano a mano con el arquero',
    prompt: (ctx) => `Minuto ${ctx.minute}': te quedás solo frente al arquero de ${ctx.opponent}. Tenés menos de un segundo para decidir.`,
    attr: 'regate',
    reward: 'gol',
    options: [
      { label: 'Definir cruzado al palo lejano', emoji: '🎯' },
      { label: 'Picarla suave con clase', emoji: '🪂' },
      { label: 'Gambetear y sacarte al arquero', emoji: '🕺' }
    ],
    win: (p) => `⚽ **${p.name}** define con frialdad absoluta y la manda a guardar. ¡GOLAZO!`,
    lucky: (p) => `⚽ El arquero llegó a rozarla pero la pelota terminó entrando mansita. ¡GOL de **${p.name}**!`,
    lose: (p) => `🧤 El arquero aguantó de pie y tapó el mano a mano de **${p.name}**.`,
    unlucky: (p) => `😖 **${p.name}** definió bien pero el tiro besó el poste y se fue afuera.`
  },
  tiro_libre: {
    title: '🎯 Tiro libre al borde del área',
    prompt: (ctx) => `Minuto ${ctx.minute}': falta peligrosa contra ${ctx.opponent}. La barrera está armada y vos parado frente al balón.`,
    attr: 'tiro',
    reward: 'gol',
    options: [
      { label: 'Rosca al ángulo superior', emoji: '🌀' },
      { label: 'Bombazo seco sobre la barrera', emoji: '💥' },
      { label: 'Tiro rasante por debajo de la barrera', emoji: '🐍' }
    ],
    win: (p) => `⚽ ¡GOLAZO DE TIRO LIBRE de **${p.name}**! Al ángulo donde duermen las arañas.`,
    lucky: (p) => `⚽ Rozó en la barrera, descolocó al arquero y terminó adentro. ¡GOL de **${p.name}**!`,
    lose: (p) => `🧱 La barrera rival se elevó y bloqueó el tiro libre de **${p.name}**.`,
    unlucky: (p) => `😖 El tiro libre de **${p.name}** se estrelló en el travesaño.`
  },
  bombazo_larga_distancia: {
    title: '🚀 Bombazo desde fuera del área',
    prompt: (ctx) => `Minuto ${ctx.minute}': te queda picando un balón suelto a 30 metros del arco de ${ctx.opponent}. ¡Armás la pierna!`,
    attr: 'tiro',
    reward: 'gol',
    options: [
      { label: 'Misil teledirigido al ángulo', emoji: '🚀' },
      { label: 'Disparo con tres dedos y comba', emoji: '📐' },
      { label: 'Remate rasante con sobrepique', emoji: '⚡' }
    ],
    win: (p) => `⚽ ¡¡QUÉ GOLAZO!! ¡Bombazo descomunal de **${p.name}** desde 30 metros! Inatajable.`,
    lucky: (p) => `⚽ El arquero dio rebote ante semejante cañonazo y la pelota se le metió en el arco. ¡GOL!`,
    lose: (p) => `🧤 El arquero rival voló y mandó el cañonazo de **${p.name}** al córner.`,
    unlucky: (p) => `😖 El remate de **${p.name}** se fue por milímetros arriba del horizontal.`
  },
  gambeta_desequilibrante: {
    title: '🕺 Duelo individual 1 vs 1',
    prompt: (ctx) => `Minuto ${ctx.minute}': encarás al último defensor de ${ctx.opponent} dentro del área grande. ¿Qué lujo tirás?`,
    attr: 'regate',
    reward: 'gol',
    options: [
      { label: 'Bicicleta veloz y cambio de ritmo', emoji: '🚴' },
      { label: 'Enganche seco hacia tu pierna hábil', emoji: '⚡' },
      { label: 'Caño / túnel de fantasía', emoji: '🪄' }
    ],
    win: (p) => `⚽ ¡Pura magia! **${p.name}** desparramó al central y definió a placer. ¡GOLAZO!`,
    lucky: (p) => `⚽ En el forcejeo la pelota le quedó servida y **${p.name}** fusiló al arquero. ¡GOL!`,
    lose: (p) => `🚫 El defensor aguantó bien y le quitó el balón limpiamente a **${p.name}**.`,
    unlucky: (p) => `😖 **${p.name}** hizo una jugada sensacional pero el remate final salió mordido.`
  },
  pase_filtrado_magico: {
    title: '🪄 Visión de juego y pase entre líneas',
    prompt: (ctx) => `Minuto ${ctx.minute}': levantás la cabeza y ves la diagonal perfecta de tu compañero ante la zaga de ${ctx.opponent}.`,
    attr: 'pase',
    reward: 'asistencia',
    options: [
      { label: 'Pase pinchado por arriba de los centrales', emoji: '🪂' },
      { label: 'Pase filtrado de tres dedos al ras del piso', emoji: '📐' },
      { label: 'Taconazo sorpresa de espaldas', emoji: '👠' }
    ],
    win: (p) => `🅰️ ¡ASISTENCIA DE LUJO! Pase milimétrico de **${p.name}** para el gol de ${npcName()}.`,
    lucky: (p) => `🅰️ La defensa rival pifió al intentar cortar el pase de **${p.name}** y ${npcName()} no perdonó.`,
    lose: (p) => `🚫 La zaga de ${ctx.opponent} leyó el pase y despejó el peligro.`,
    unlucky: (p) => `😖 Asistencia perfecta de **${p.name}**, pero ${npcName()} erró el gol cantado.`
  },
  centro_area: {
    title: '🏃 Contragolpe letal',
    prompt: (ctx) => `Minuto ${ctx.minute}': comandás el contragolpe de **${ctx.club}** contra ${ctx.opponent} con superioridad numérica.`,
    attr: 'pase',
    reward: 'asistencia',
    options: [
      { label: 'Pase entre líneas al delantero', emoji: '🅿️' },
      { label: 'Centro rasante al corazón del área', emoji: '↩️' },
      { label: 'Cambio de frente al extremo que entra solo', emoji: '🔄' }
    ],
    win: (p) => `🅰️ ¡Golazo de contraataque! Centro perfecto de **${p.name}** y ${npcName()} infla las redes.`,
    lucky: (p) => `🅰️ Centro con desvío que descolocó a todos y terminó en gol, asistencia de **${p.name}**.`,
    lose: (p) => `🚫 El último defensor cortó el avance de **${p.name}**.`,
    unlucky: (p) => `😖 La jugada era inmejorable pero el remate final se estrelló en el palo.`
  },
  cabezazo: {
    title: '🗿 Córner a favor',
    prompt: (ctx) => `Minuto ${ctx.minute}': centro bombeado al área de ${ctx.opponent}. Subís a ganar en las alturas. ¿A qué zona atacás?`,
    attr: 'fisico',
    reward: 'gol',
    options: [
      { label: 'Anticipar al primer palo', emoji: '1️⃣' },
      { label: 'Ganar en el punto penal entre los centrales', emoji: '2️⃣' },
      { label: 'Martillar al segundo palo', emoji: '3️⃣' }
    ],
    win: (p) => `⚽ ¡CABEZAZO IMPONENTE de **${p.name}** al fondo de la red! ¡GOL de pelota parada!`,
    lucky: (p) => `⚽ Rebotó en la espalda del defensor y **${p.name}** la empujó como sea. ¡GOL!`,
    lose: (p) => `🚫 El central rival se impuso por arriba y despejó de cabeza.`,
    unlucky: (p) => `😖 **${p.name}** ganó en el salto pero el cabezazo se fue besando el larguero.`
  },
  corte_defensivo_extremo: {
    title: '🛡️ Salvada heroica en defensa',
    prompt: (ctx) => `Minuto ${ctx.minute}': el atacante de ${ctx.opponent} remata con el arco a su merced. ¡Sos la última esperanza!`,
    attr: 'defensa',
    reward: 'atajada',
    options: [
      { label: 'Barrida limpia al piso arriesgando todo', emoji: '🦵' },
      { label: 'Bloquear arrojando el cuerpo como muro', emoji: '🧱' },
      { label: 'Despeje acrobático sobre la línea de gol', emoji: '🤸' }
    ],
    win: (p) => `🛡️ ¡HEROICO **${p.name}**! Se arrojó como un león y salvó el gol sobre la línea.`,
    lucky: (p) => `🛡️ El balón rebotó milagrosamente en **${p.name}** y se fue al córner. ¡Salvación!`,
    lose: (p) => `⚽ El remate superó el cierre desesperado de **${p.name}** y fue gol rival.`,
    unlucky: (p) => `😖 **${p.name}** llegó al cruce pero el rebote terminó favoreciendo al delantero.`
  },
  final_gol_historico: {
    title: '🏆 ¡EL GOL DEL CAMPEONATO EN LA FINAL!',
    prompt: (ctx) => `Minuto 90+2' de la GRAN FINAL: te cae la pelota en la frontal del área de ${ctx.opponent}. ¡El trofeo está a un toque!`,
    attr: 'tiro',
    reward: 'gol',
    options: [
      { label: 'Volea furiosa de primera al ángulo', emoji: '🚀' },
      { label: 'Definición sutil al rincón más lejano', emoji: '🎯' },
      { label: 'Amagar al arquero y definir con el alma', emoji: '🌟' }
    ],
    win: (p) => `🏆👑 ¡¡¡GOL HISTÓRICO DE **${p.name}** EN LA FINAL!!! ¡Directo a los libros dorados del fútbol!`,
    lucky: (p) => `🏆 El remate dio en el poste, rebotó en la espalda del arquero y ENTRÓ. ¡GOL DEL TÍTULO de **${p.name}**!`,
    lose: (p) => `🧤 El arquero rival hizo la atajada del partido y le ahogó el gol del título a **${p.name}**.`,
    unlucky: (p) => `😖 El remate de la consagración de **${p.name}** se estrelló en el travesaño.`
  },
  final_tiro_libre_epico: {
    title: '🏆 ¡TIRO LIBRE FINAL PARA LA GLORIA!',
    prompt: (ctx) => `Minuto 90+4' en la GRAN FINAL: última jugada del partido. Tiro libre frontal ante ${ctx.opponent}. ¿Cómo lo ejecutás?`,
    attr: 'tiro',
    reward: 'gol',
    options: [
      { label: 'Acariciarla con rosca por encima de la barrera', emoji: '✨' },
      { label: 'Fierrazo potentísimo al palo del arquero', emoji: '💥' },
      { label: 'Tiro bajo engañando el salto de la barrera', emoji: '🐍' }
    ],
    win: (p) => `🏆👑 ¡¡GOOOOOOOOOOL DE TIRO LIBRE DE **${p.name}** EN EL ÚLTIMO SEGUNDO!! ¡CAMPEONES!`,
    lucky: (p) => `🏆 La pelota picó antes, engañó al arquero y terminó en la red. ¡GOL DE CAMPEONATO!`,
    lose: (p) => `🧱 La barrera saltó y desvió el tiro libre final.`,
    unlucky: (p) => `😖 El tiro libre de **${p.name}** pegó en el ángulo superior y no quiso entrar.`
  }
};

/** Minijuegos disponibles según posición y si es gran final */
function poolFor(position, isFinal = false) {
  if (position === 'POR') {
    if (isFinal) return ['final_atajada_consagracion', 'atajar_penal', 'atajada_mano_a_mano'];
    return ['atajada_mano_a_mano', 'atajar_penal', 'volada_angulo', 'descolgar_centro', 'achique_urgencia'];
  }

  if (isFinal) {
    if (position === 'DEF') return ['final_gol_historico', 'corte_defensivo_extremo', 'cabezazo', 'penal'];
    if (position === 'MED') return ['final_gol_historico', 'final_tiro_libre_epico', 'pase_filtrado_magico', 'bombazo_larga_distancia'];
    return ['final_gol_historico', 'final_tiro_libre_epico', 'mano_a_mano', 'penal', 'gambeta_desequilibrante'];
  }

  if (position === 'DEF') {
    return ['cabezazo', 'corte_defensivo_extremo', 'centro_area', 'penal'];
  }
  if (position === 'MED') {
    return ['tiro_libre', 'pase_filtrado_magico', 'bombazo_larga_distancia', 'centro_area', 'gambeta_desequilibrante', 'penal'];
  }
  return ['mano_a_mano', 'penal', 'tiro_libre', 'gambeta_desequilibrante', 'bombazo_larga_distancia', 'cabezazo'];
}

/**
 * Crea un minijuego pendiente.
 */
function createMinigame(player, context) {
  const isFinal = context.isFinal || false;
  const type = pick(poolFor(player.position, isFinal));
  const def = MINIGAMES[type];
  return {
    type,
    winningIndex: rand(0, def.options.length - 1),
    minute: isFinal ? rand(88, 94) : rand(25, 89),
    club: context.club,
    opponent: context.opponent,
    competition: context.competition || '',
    isFinal
  };
}

function minigameDef(type) {
  return MINIGAMES[type] || null;
}

/**
 * Resuelve el botón apretado.
 * Devuelve { success, reward, text, moraleDelta } — `reward` es 'gol' | 'asistencia' | 'atajada'.
 */
function resolveMinigame(player, pending, choiceIndex) {
  const def = MINIGAMES[pending.type];
  if (!def) return { success: false, reward: null, text: 'La jugada se diluyó.', moraleDelta: 0 };

  const attrValue = (player.attributes && player.attributes[def.attr]) || 50;
  const picked = Number(choiceIndex);
  const guessedRight = picked === pending.winningIndex;

  let success;
  let text;
  if (guessedRight) {
    // Si es final es más exigente
    const baseMiss = pending.isFinal ? 0.48 : 0.40;
    const missChance = Math.max(0.04, baseMiss - attrValue / 170);
    if (Math.random() < missChance) {
      success = false;
      text = def.unlucky(player, pending);
    } else {
      success = true;
      text = def.win(player, pending);
    }
  } else {
    // Si elegiste mal, con mucho atributo podés salvarla pero en finales es muy difícil
    const divisor = pending.isFinal ? 500 : 380;
    const luckyChance = Math.max(0.01, attrValue / divisor);
    if (Math.random() < luckyChance) {
      success = true;
      text = def.lucky(player, pending);
    } else {
      success = false;
      text = def.lose(player, pending);
    }
  }

  return {
    success,
    reward: success ? def.reward : null,
    text,
    moraleDelta: success ? (pending.isFinal ? 10 : 5) : (pending.isFinal ? -6 : -3)
  };
}

module.exports = { MINIGAMES, createMinigame, minigameDef, resolveMinigame, poolFor };
