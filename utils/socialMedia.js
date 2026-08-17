'use strict';

const { pick, rand } = require('./simulation.js');
const { formatMoney } = require('./economy.js');

const INFLUENCERS = [
  // Periodistas TOP mundiales
  { handle: '@FabrizioRomano', name: 'Fabrizio Romano ✅', verified: true, role: 'insider' },
  { handle: '@David_Ornstein', name: 'David Ornstein ✅', verified: true, role: 'insider' },
  { handle: '@2010MisterChip', name: 'MisterChip (Alexis) ✅', verified: true, role: 'stats' },
  { handle: '@OptaJavier', name: 'OptaJavier 📊', verified: true, role: 'stats' },
  { handle: '@MundoMaldini', name: 'Julio Maldonado (Maldini) ✅', verified: true, role: 'tactics' },
  
  // Medios & Programas Deportivos
  { handle: '@ElChiringuitoTV', name: 'El Chiringuito de Jugones ✅', verified: true, role: 'media' },
  { handle: '@DiarioOle', name: 'Diario Olé ✅', verified: true, role: 'media' },
  { handle: '@Marca', name: 'Diario MARCA ✅', verified: true, role: 'media' },
  { handle: '@433', name: '433 Fútbol 🌍', verified: true, role: 'media' },
  { handle: '@Sudanalytics_', name: 'Sudanalytics 🔎', verified: true, role: 'scout' },
  { handle: '@VarskySports', name: 'VarskySports ✅', verified: true, role: 'media' },

  // Panelistas & Creadores de Contenido
  { handle: '@TomasRoncero', name: 'Tomás Roncero 🤍', verified: true, role: 'pundit' },
  { handle: '@CarrozzaPolemica', name: 'Pablo Carrozza 🔥', verified: false, role: 'pundit' },
  { handle: '@DavooXeneizeJrs', name: 'Davoo Xeneize 🎙️', verified: true, role: 'streamer' },
  { handle: '@IbaiLlanos', name: 'Ibai Llanos 👑', verified: true, role: 'streamer' },
  { handle: '@CobraFutbol', name: 'La Cobra 🐍', verified: true, role: 'streamer' },

  // Memes, Shitposters & Termos
  { handle: '@OutContextFutbol', name: 'Out of Context Fútbol 🖼️', verified: false, role: 'meme' },
  { handle: '@HinchaTermo99', name: 'Hincha Termo 🏟️', verified: false, role: 'fan' },
  { handle: '@BanterFC', name: 'Troll Football World ⚽', verified: false, role: 'meme' }
];

/**
 * Retorna cuentas de hinchada / fan club según el club del jugador
 */
function getClubFanAccounts(clubName) {
  const clean = (clubName || '').toLowerCase();
  
  if (clean.includes('colo') || clean.includes('albo')) {
    return [
      { handle: '@SentimientoAlbo', name: 'Sentimiento Albo ⚪⚫', verified: true },
      { handle: '@GarraBlanca_cl', name: 'Garra Blanca Popular 🏁', verified: false }
    ];
  }
  if (clean.includes('universidad de chile') || clean.includes('la u') || clean.includes('azul')) {
    return [
      { handle: '@LaMagiaAzul', name: 'La Magia Azul 🦉🔵', verified: true },
      { handle: '@LosDeAbajoOficial', name: 'Los de Abajo 🔴🔵', verified: false }
    ];
  }
  if (clean.includes('catolica') || clean.includes('cruzados')) {
    return [
      { handle: '@CruzadosPasion', name: 'Cruzados Pasión ⚪🔵', verified: true },
      { handle: '@FranjaQuerida', name: 'La Franja Digital 🛡️', verified: false }
    ];
  }
  if (clean.includes('boca')) {
    return [
      { handle: '@BocaPasionPopular', name: 'Planeta Boca Juniors 🔵🟡', verified: true },
      { handle: '@La12Digital', name: 'La 12 Twittera 🎺', verified: false }
    ];
  }
  if (clean.includes('river')) {
    return [
      { handle: '@RiverLPM', name: 'La Página Millonaria 🔴⚪', verified: true },
      { handle: '@TuGratoNombre', name: 'River Monumental 🏟️', verified: false }
    ];
  }
  if (clean.includes('real madrid')) {
    return [
      { handle: '@MadridistasUnidos', name: 'Madrid Sports 👑🤍', verified: true },
      { handle: '@ReyesDeEuropa', name: 'Hinchada Merengue 🏆', verified: false }
    ];
  }
  if (clean.includes('barcelona') || clean.includes('barça')) {
    return [
      { handle: '@BarcaTimes', name: 'Barça Times 🔵🔴', verified: true },
      { handle: '@MundoBlaugrana', name: 'Som i Serem Culés ✨', verified: false }
    ];
  }
  if (clean.includes('city')) {
    return [
      { handle: '@CityXtra', name: 'City Xtra 🩵', verified: true },
      { handle: '@BlueMoonFeed', name: 'Blue Moon Rising 🌙', verified: false }
    ];
  }
  if (clean.includes('arsenal')) {
    return [
      { handle: '@GunnersNews', name: 'Gunners Daily 🔴⚪', verified: true },
      { handle: '@AFTV_Fan', name: 'AFTV Media 🎙️', verified: false }
    ];
  }

  // Genérico para cualquier otro club
  const tag = (clubName || 'Club').replace(/[^a-zA-Z0-9]/g, '');
  return [
    { handle: `@Comunidad_${tag}`, name: `Planeta ${clubName} 🛡️`, verified: false },
    { handle: `@LocosPor_${tag}`, name: `Hinchada Oficial ${clubName} 📣`, verified: false }
  ];
}

/**
 * Genera un feed de publicaciones de redes sociales enriquecido cuyo tono y contenido
 * depende directamente del rendimiento individual (goles, asistencias, nota rating, expulsiones, clásicos)
 */
function generateSocialFeed(player, matchResult = {}) {
  const goals = matchResult.playerGoals ?? matchResult.goals ?? 0;
  const assists = matchResult.playerAssists ?? matchResult.assists ?? 0;
  const rating = typeof matchResult.rating === 'number' ? matchResult.rating : 6.5;
  const won = matchResult.result === 'V' || matchResult.won === true;
  const lost = matchResult.result === 'D' || matchResult.lost === true;
  const drew = matchResult.result === 'E' || matchResult.drew === true;
  const isClassic = Boolean(matchResult.isClassic);
  const isFinal = Boolean(matchResult.isFinal);
  const red = Boolean(matchResult.red);
  const cleanSheet = Boolean(matchResult.cleanSheet);
  const motm = Boolean(matchResult.motm);
  const opponent = matchResult.opponent || matchResult.rival || 'Rival';
  const eventType = matchResult.eventType || 'match';
  const extra = matchResult.extra || {};

  const posts = [];
  const clubFans = getClubFanAccounts(player.club);
  const fanAccount = pick(clubFans);

  const likesBase = Math.max(400, (player.popularityScore || 50) * rand(80, 480));
  const rtsBase = Math.round(likesBase * 0.24);

  // ──────────────── EVENTOS ESPECIALES DE MERCADO / HISTORIAL ────────────────

  if (eventType === 'transfer_rumor' || extra.rumorClub || (player.offers && player.offers.length > 0 && Math.random() < 0.6)) {
    const interestedClub = extra.rumorClub || (player.offers && player.offers[0]?.club) || player.offers[0] || 'un gigante europeo';
    posts.push({
      author: { handle: '@FabrizioRomano', name: 'Fabrizio Romano ✅', verified: true },
      text: `🚨 **EXCL**: ${interestedClub} have opened formal talks to sign **${player.name}** from ${player.club}. \n\nUnderstand personal terms are being discussed with his agent. Player keen on the move. Key hours ahead. 🔴⏳ #Transfers`,
      likes: `${(likesBase * 4.2 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 4.0 / 1000).toFixed(1)}K`,
      time: 'Hace 8m'
    });
    posts.push({
      author: fanAccount,
      text: `Por favor NO vendan a ${player.name} ahora... es el corazón de ${player.club}. ¡Pongan la cláusula y que paguen hasta el último euro! 😤💸`,
      likes: `${rand(400, 1800)}`,
      rts: `${rand(80, 350)}`,
      time: 'Hace 15m'
    });
    return posts;
  }

  if (eventType === 'transfer_confirmed' || extra.transferTo) {
    const dest = extra.transferTo || player.club;
    const fee = extra.fee ? formatMoney(extra.fee) : 'cifra millonaria';
    posts.push({
      author: { handle: '@FabrizioRomano', name: 'Fabrizio Romano ✅', verified: true },
      text: `🚨 **HERE WE GO!** **${player.name}** to **${dest}**, done deal and confirmed. \n\nAgreement reached for **${fee}** package fee. Medical tests booked, long term contract ready. Documents signed today. ✈️📄 #Transfers`,
      likes: `${(likesBase * 5.8 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 5.2 / 1000).toFixed(1)}K`,
      time: 'Hace 4m'
    });
    posts.push({
      author: { handle: '@DiarioOle', name: 'Diario Olé ✅', verified: true },
      text: `💣 BOMBAZO: ${player.name} da el gran salto y ya posa con los colores de ${dest}. Nuevo contrato millonario y desafío mayúsculo en su carrera.`,
      likes: `${(likesBase * 2.5 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 2.0 / 1000).toFixed(1)}K`,
      time: 'Hace 12m'
    });
    return posts;
  }

  if (player.injuredMatches > 0 && player.injury && player.injury.type === 'GRAVE') {
    posts.push({
      author: { handle: '@FabrizioRomano', name: 'Fabrizio Romano ✅', verified: true },
      text: `🏥 Tests confirmed injury for **${player.name}**. The player will be out for approx **${player.injuredMatches} matches**. \n\nHuge blow for ${player.club}. Speedy recovery! 🙏🩹`,
      likes: `${(likesBase * 1.8 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.5 / 1000).toFixed(1)}K`,
      time: 'Hace 25m'
    });
    posts.push({
      author: fanAccount,
      text: `¡Fuerza enorme ${player.name}! 🥺💔 Todo el pueblo de ${player.club} está con vos. ¡Te vamos a esperar para dar la vuelta olímpica juntos! 💪🏥`,
      likes: `${rand(500, 2200)}`,
      rts: `${rand(90, 450)}`,
      time: 'Hace 15m'
    });
    return posts;
  }

  // ──────────────── DEPENDIENDO DEL RENDIMIENTO EXACTO EN EL PARTIDO ────────────────

  // CASO 1: EXPULSIÓN CON TARJETA ROJA
  if (red) {
    posts.push({
      author: { handle: '@CarrozzaPolemica', name: 'Pablo Carrozza 🔥', verified: false },
      text: `¡IRRESPONSABLE TOTAL! Lo de **${player.name}** hoy dejando a ${player.club} con 10 hombres fue una vergüenza. Si fuera el DT le cobro una multa histórica y lo mando tres semanas a entrenar con la reserva. 🟥😡`,
      likes: `${(likesBase * 1.5 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.6 / 1000).toFixed(1)}K`,
      time: 'Hace 15m'
    });
    posts.push({
      author: fanAccount,
      text: `No podés ser tan infantil de hacerte echar así en un partido tan caliente ${player.name}... Nos condicionaste todo el partido hermano. Caliente es poco. 😤❌`,
      likes: `${rand(600, 2500)}`,
      rts: `${rand(120, 500)}`,
      time: 'Hace 12m'
    });
    posts.push({
      author: { handle: '@BanterFC', name: 'Troll Football World ⚽', verified: false },
      text: `Speedrun to the showers! 🚿💨 ${player.name} went straight to the dressing room after getting sent off vs ${opponent}. 🟥💀`,
      likes: `${(likesBase * 2.1 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.9 / 1000).toFixed(1)}K`,
      time: 'Hace 20m'
    });
    return posts;
  }

  // CASO 2: DIOS DEL FÚTBOL / MASTERCLASS HISTÓRICA (Rating >= 9.0 o Hat-Trick / Póker)
  if (rating >= 9.0 || goals >= 3) {
    posts.push({
      author: { handle: '@FabrizioRomano', name: 'Fabrizio Romano ✅', verified: true },
      text: `⭐️ What a masterclass! **${player.name}** with a brilliant performance today for ${player.club} (${goals} goals, rating: ${rating.toFixed(1)}). European elite clubs are already contacting his camp. World class talent. 🪄⚽️ #Talent`,
      likes: `${(likesBase * 4.2 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 3.9 / 1000).toFixed(1)}K`,
      time: 'Hace 10m'
    });
    posts.push({
      author: { handle: '@2010MisterChip', name: 'MisterChip (Alexis) ✅', verified: true },
      text: `HISTÓRICO: Actuación de época de ${player.name} con ${goals > 0 ? `${goals} goles y ` : ''}nota ${rating.toFixed(1)} ante ${opponent}. Hace más de una década no se registraba un impacto individual semejante en la liga. #DatoMisterChip 📈🎩`,
      likes: `${(likesBase * 2.4 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 2.1 / 1000).toFixed(1)}K`,
      time: 'Hace 18m'
    });
    posts.push({
      author: { handle: '@IbaiLlanos', name: 'Ibai Llanos 👑', verified: true },
      text: `Pero bueno lo de ${player.name} hoy qué es??? Está completamente demente este chaval, ha bailado a todo ${opponent}. Fíchenlo para el Madrid ya por favor. 🚬🥵`,
      likes: `${(likesBase * 5.1 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 3.8 / 1000).toFixed(1)}K`,
      time: 'Hace 22m'
    });
    posts.push({
      author: fanAccount,
      text: `PÓNGANLE UNA ESTATUA AFUERA DEL ESTADIO YA MISMO. Qué orgullo tenerte con nuestra camiseta ${player.name}, sos patrimonio del club ❤️👑🏆`,
      likes: `${rand(1200, 4800)}`,
      rts: `${rand(300, 1100)}`,
      time: 'Hace 14m'
    });
    return posts.slice(0, 3);
  }

  // CASO 3: HÉROE EN SUPERCLÁSICO (isClassic && (won || goals >= 1))
  if (isClassic && (won || goals >= 1)) {
    posts.push({
      author: { handle: '@ElChiringuitoTV', name: 'El Chiringuito de Jugones ✅', verified: true },
      text: `🚨 ¡LOCURA EN EL SUPERCLÁSICO! Gol consagratorio y cátedra de **${player.name}** ante ${opponent}. La hinchada desborda las calles de fiesta. ¿Nace un ídolo eterno de la institución? 🔥💣📺`,
      likes: `${(likesBase * 3.2 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 2.8 / 1000).toFixed(1)}K`,
      time: 'Hace 15m'
    });
    posts.push({
      author: fanAccount,
      text: `¡GRACIAS POR ESTA ALEGRÍA ${player.name.toUpperCase()}! 😭🤍💙 Callaste todo el estadio de ${opponent}. TE AMAMOS DE POR VIDA. ¡EL CLÁSICO ES NUESTRO! 🚬🏆`,
      likes: `${rand(900, 4200)}`,
      rts: `${rand(250, 950)}`,
      time: 'Hace 12m'
    });
    posts.push({
      author: { handle: '@OutContextFutbol', name: 'Out of Context Fútbol 🖼️', verified: false },
      text: `Los hinchas de ${opponent} viendo el festejo en la cara de sus propios defensas: 💀🤡⚰️`,
      likes: `${rand(1500, 6000)}`,
      rts: `${rand(400, 1600)}`,
      time: 'Hace 30m'
    });
    return posts.slice(0, 3);
  }

  // CASO 4: PARTIDAZO / MVP (Rating 8.0 - 8.9 o 2 Goles)
  if (rating >= 8.0 || goals >= 2 || (goals >= 1 && assists >= 1)) {
    posts.push({
      author: { handle: '@OptaJavier', name: 'OptaJavier 📊', verified: true },
      text: `${rating.toFixed(1)} - ${player.name} hoy vs ${opponent}: ${goals > 0 ? `${goals} goles, ` : ''}${assists > 0 ? `${assists} asistencias, ` : ''}8/9 regates exitosos y 5 pases clave. MVP indiscutido. #Recital 🪄`,
      likes: `${(likesBase * 2.1 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.8 / 1000).toFixed(1)}K`,
      time: 'Hace 35m'
    });
    posts.push({
      author: { handle: '@Sudanalytics_', name: 'Sudanalytics 🔎', verified: true },
      text: `🔎 **Scouting Report**: Nivel superlativo de ${player.name} (${player.age} años) en ${player.club}. Toma de decisiones impecable, aceleración en corto y visión periférica. 💎📈`,
      likes: `${(likesBase * 1.6 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.3 / 1000).toFixed(1)}K`,
      time: 'Hace 40m'
    });
    posts.push({
      author: { handle: '@CobraFutbol', name: 'La Cobra 🐍', verified: true },
      text: `No pero pará amigo, lo que juega ${player.name}... no me vengan con que es humo porque te pinta la cara todos los fines de semana. FÚTBOL CHAMPAGNE. 🍷🍾`,
      likes: `${rand(900, 4100)}`,
      rts: `${rand(150, 680)}`,
      time: 'Hace 28m'
    });
    posts.push({
      author: fanAccount,
      text: `Qué jugador señores. Cuando ${player.name} juega bien, todo ${player.club} juega bien. A seguir así! 🚀✨`,
      likes: `${rand(600, 2600)}`,
      rts: `${rand(100, 450)}`,
      time: 'Hace 20m'
    });
    return posts.slice(0, 3);
  }

  // CASO 5: PORTERO CON VALLA INVICTA
  if (player.position === 'POR' && cleanSheet && rating >= 7.2) {
    posts.push({
      author: { handle: '@OptaJavier', name: 'OptaJavier 📊', verified: true },
      text: `0 - ${player.name} completó 6 atajadas decisivas (3 dentro del área) y mantuvo el arco en cero ante ${opponent}. Muralla. #San${player.name.replace(/\s+/g, '')} 🧤🛡️`,
      likes: `${(likesBase * 1.7 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.4 / 1000).toFixed(1)}K`,
      time: 'Hace 25m'
    });
    posts.push({
      author: fanAccount,
      text: `¡Qué arquerazo tenemos por favor! Salvó 3 pelotas claras de gol. San ${player.name} en el arco de ${player.club}! 🧤🔒`,
      likes: `${rand(500, 2100)}`,
      rts: `${rand(90, 380)}`,
      time: 'Hace 18m'
    });
    return posts;
  }

  // CASO 6: BUEN PARTIDO / CUMPLIDOR DESTACADO (Rating 7.0 - 7.9 o Gol / Asistencia)
  if (rating >= 7.0 || goals === 1 || assists === 1) {
    posts.push({
      author: { handle: '@DiarioOle', name: 'Diario Olé ✅', verified: true },
      text: `Solvente y participativo: ${player.name} fue clave en la estructura de ${player.club} ante ${opponent}${goals > 0 ? ` anotando un valioso gol` : ''}. Sigue sumando rodaje con nota alta. ⚽📐`,
      likes: `${(likesBase * 1.1 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 0.8 / 1000).toFixed(1)}K`,
      time: 'Hace 30m'
    });
    posts.push({
      author: fanAccount,
      text: `Buen partido de ${player.name}. Siempre cumpliendo y dejando el alma en cada pelota dividida. ¡A seguir sumando para pelear arriba! 💪🔴⚪`,
      likes: `${rand(350, 1400)}`,
      rts: `${rand(60, 240)}`,
      time: 'Hace 18m'
    });
    posts.push({
      author: { handle: '@VarskySports', name: 'VarskySports ✅', verified: true },
      text: `El mapa de calor de ${player.name} refleja su despliegue físico y sacrificio táctico en el triunfo/empate de ${player.club}. Muy buen partido.`,
      likes: `${(likesBase * 0.9 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 0.6 / 1000).toFixed(1)}K`,
      time: 'Hace 24m'
    });
    return posts.slice(0, 3);
  }

  // CASO 7: PARTIDO REGULAR / DISCRETO (Rating 6.0 - 6.9)
  if (rating >= 6.0) {
    posts.push({
      author: { handle: '@Marca', name: 'Diario MARCA ✅', verified: true },
      text: `Tarde discreta de ${player.name} en el duelo ante ${opponent}. Bien neutralizado por los centrales rivales, aunque siempre solidario en la marca. (Nota: ${rating.toFixed(1)})`,
      likes: `${(likesBase * 0.7 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 0.4 / 1000).toFixed(1)}K`,
      time: 'Hace 35m'
    });
    posts.push({
      author: fanAccount,
      text: `No fue el mejor día de ${player.name}, pero el compromiso no se discute. A descansar y afinar la puntería para el siguiente partido. 🛡️⚽`,
      likes: `${rand(200, 950)}`,
      rts: `${rand(30, 150)}`,
      time: 'Hace 25m'
    });
    posts.push({
      author: { handle: '@HinchaTermo99', name: 'Hincha Termo 🏟️', verified: false },
      text: `Hoy no le llegó una pelota redonda a ${player.name}. Si no le tiran centros es imposible muchachos. 🤷‍♂️`,
      likes: `${rand(150, 700)}`,
      rts: `${rand(20, 90)}`,
      time: 'Hace 18m'
    });
    return posts.slice(0, 3);
  }

  // CASO 8: PARTIDO FLOJO (Rating 5.2 - 5.9)
  if (rating >= 5.2) {
    posts.push({
      author: { handle: '@CarrozzaPolemica', name: 'Pablo Carrozza 🔥', verified: false },
      text: `Flojísimo partido de **${player.name}** hoy ante ${opponent}. Caminó la cancha todo el segundo tiempo, displicente y desconectado del juego. (Nota: ${rating.toFixed(1)}) 📉😤`,
      likes: `${(likesBase * 1.1 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.2 / 1000).toFixed(1)}K`,
      time: 'Hace 45m'
    });
    posts.push({
      author: fanAccount,
      text: `Hay que poner más ganas... la camiseta de ${player.club} se respeta y se suda. Hoy fue un partido muy bajo de ${player.name}. A levantar la cabeza. 😤`,
      likes: `${rand(300, 1200)}`,
      rts: `${rand(50, 220)}`,
      time: 'Hace 20m'
    });
    posts.push({
      author: { handle: '@BanterFC', name: 'Troll Football World ⚽', verified: false },
      text: `MISSING PERSON ALERT: 🚨 \nName: ${player.name} \nLast seen: Warming up before the match against ${opponent}. \nReward if found playing football: €100. 🔍👻`,
      likes: `${(likesBase * 1.6 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.8 / 1000).toFixed(1)}K`,
      time: 'Hace 50m'
    });
    return posts.slice(0, 3);
  }

  // CASO 9: DESASTRE TOTAL / PAPELÓN (Rating < 5.2 o Derrota dura con gol en contra)
  posts.push({
    author: { handle: '@CarrozzaPolemica', name: 'Pablo Carrozza 🔥', verified: false },
    text: `¡PAPELÓN HISTÓRICO! Lo de **${player.name}** hoy no tiene perdón. Cero rebeldía, perdió todas las pelotas divididas y parecía que jugaba para ${opponent}. Un desastre absoluto. (Nota: ${rating.toFixed(1)}) 💀🤬`,
    likes: `${(likesBase * 1.6 / 1000).toFixed(1)}K`,
    rts: `${(rtsBase * 1.7 / 1000).toFixed(1)}K`,
    time: 'Hace 40m'
  });
  posts.push({
    author: { handle: '@BanterFC', name: 'Troll Football World ⚽', verified: false },
    text: `${player.name} heat map vs ${opponent} today: 0 shots, 0 dribbles, 100% hair gel. Disasterclass! 💀🤡`,
    likes: `${(likesBase * 2.3 / 1000).toFixed(1)}K`,
    rts: `${(rtsBase * 2.2 / 1000).toFixed(1)}K`,
    time: 'Hace 48m'
  });
  posts.push({
    author: fanAccount,
    text: `La peor actuación que le vi con los colores de ${player.club}. Si no tiene ganas de jugar que pida el cambio y coma banco. Muy caliente con esto. 😡❌`,
    likes: `${rand(500, 2400)}`,
    rts: `${rand(90, 480)}`,
    time: 'Hace 22m'
  });

  return posts.slice(0, 3);
}

/**
 * Formatea los posts para el embed de Discord con layout limpio y visual
 */
function formatSocialFeedEmbed(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return '📱 *No hay tweets recientes en el feed.*';
  }

  return posts.map(p => {
    const verifiedBadge = p.author.verified ? ' [✓]' : '';
    return (
      `𝕏 **${p.author.name}** \`${p.author.handle}\`${verifiedBadge} • *${p.time || 'Reciente'}*\n` +
      `> ${p.text.replace(/\n/g, '\n> ')}\n` +
      `❤️ ${p.likes} · 🔁 ${p.rts}`
    );
  }).join('\n\n────────────────\n\n');
}

module.exports = {
  INFLUENCERS,
  getClubFanAccounts,
  generateSocialFeed,
  formatSocialFeedEmbed
};
