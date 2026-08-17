'use strict';

const { pick, rand } = require('./simulation.js');

const INFLUENCERS = [
  { handle: '@FabrizioRomanoBot', name: 'Fabrizio Romano ✅', verified: true },
  { handle: '@DiarioOle', name: 'Diario Olé ✅', verified: true },
  { handle: '@ElChiringuitoTV', name: 'El Chiringuito de Jugones ✅', verified: true },
  { handle: '@PrensaFutbol', name: 'PrensaFútbol ✅', verified: true },
  { handle: '@Marca', name: 'MARCA ✅', verified: true },
  { handle: '@433', name: '433 Fútbol 🌍', verified: true },
  { handle: '@HinchaRabioso99', name: 'Hincha Termo 🏟️', verified: false },
  { handle: '@AnalistaTactico', name: 'Mister Datos 📊', verified: false }
];

/**
 * Genera un feed de publicaciones de redes sociales (X / Twitter) tras el partido
 */
function generateSocialFeed(player, matchResult = {}) {
  const { goals = 0, assists = 0, rating = 6.5, isClassic = false, won = false, rival = 'Rival' } = matchResult;
  const posts = [];

  const likesBase = (player.popularityScore || 50) * rand(80, 450);
  const rtsBase = Math.round(likesBase * 0.22);

  if (goals >= 3) {
    posts.push({
      author: pick(INFLUENCERS.filter(i => i.verified)),
      text: `🎩 ¡HAT-TRICK HISTÓRICO! Qué locura lo de **${player.name}** hoy. Se lleva la pelota a la casa y pone de pie a todo el estadio. Simplemente de otra galaxia. 🔥⚽⚽⚽`,
      likes: `${(likesBase * 3.5 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 3.5 / 1000).toFixed(1)}K`,
      time: 'Hace 12m'
    });
  } else if (goals >= 1 && isClassic && won) {
    posts.push({
      author: pick(INFLUENCERS),
      text: `🔥 SILENCIÓ AL RIVAL. Gol decisivo de **${player.name}** en el Superclásico ante ${rival}. De estos partidos nacen los ídolos eternos. 👑💣`,
      likes: `${(likesBase * 2.2 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 2.0 / 1000).toFixed(1)}K`,
      time: 'Hace 24m'
    });
  } else if (rating >= 8.0) {
    posts.push({
      author: pick(INFLUENCERS),
      text: `⭐ Recital absoluto de **${player.name}** (${player.club}). Control del ritmo, visión y jerarquía pura en la cancha. Candidato firme a MVP del mes. 🪄🎩`,
      likes: `${(likesBase * 1.5 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 1.4 / 1000).toFixed(1)}K`,
      time: 'Hace 45m'
    });
  } else if (rating <= 5.2) {
    posts.push({
      author: { handle: '@HinchaExigente', name: 'Socio Vitalicio 😠', verified: false },
      text: `Desconocido hoy **${player.name}**. Muy bajo nivel, perdió pelotas clave y caminó en varias jugadas. Hay que meter más garra con esta camiseta! 📉🤬`,
      likes: `${(likesBase * 0.4 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 0.6 / 1000).toFixed(1)}K`,
      time: 'Hace 1h'
    });
  } else {
    posts.push({
      author: pick(INFLUENCERS),
      text: `Solvente partido de **${player.name}** en el esquema de ${player.club}. Cumpliendo con su rol y sumando minutos vitales en la temporada. ⚽👍`,
      likes: `${(likesBase * 0.8 / 1000).toFixed(1)}K`,
      rts: `${(rtsBase * 0.5 / 1000).toFixed(1)}K`,
      time: 'Hace 30m'
    });
  }

  // Añadir un comentario fan al azar
  const fanComments = [
    `"Te amo ${player.name}, no te vayas nunca de ${player.club} ❤️🙌"`,
    `"El mejor jugador de la liga por escándalo 🔥"`,
    `"Si sigue a este nivel lo llama la Selección Nacional al tiro 🇨🇱⭐"`,
    `"Preparen los millones porque en Europa ya están tomando nota 💼👀"`
  ];

  posts.push({
    author: { handle: `@fan_${player.name.toLowerCase().replace(/\s+/g, '')}`, name: 'Fan Club Oficial ⚡', verified: false },
    text: pick(fanComments),
    likes: `${rand(120, 950)}`,
    rts: `${rand(15, 140)}`,
    time: 'Hace 15m'
  });

  return posts;
}

/**
 * Formatea los posts para embed de Discord
 */
function formatSocialFeedEmbed(posts) {
  return posts.map(p =>
    `📱 **${p.author.name}** \`${p.author.handle}\` • *${p.time}*\n` +
    `> ${p.text}\n` +
    `❤️ ${p.likes} · 🔁 ${p.rts}`
  ).join('\n\n');
}

module.exports = {
  generateSocialFeed,
  formatSocialFeedEmbed
};
