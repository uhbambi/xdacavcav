'use strict';

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const storage = require('../data/storage.js');
const { getEligibleCandidates, initializeBallonDOrVote, registerVote, closeBallonDOrVote, applyBallonDOrRewards } = require('../utils/ballonDor.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('votar-ballon-dor')
    .setDescription('Votación Comunitaria del Balón de Oro de la temporada')
    .addSubcommand(sub =>
      sub
        .setName('abrir')
        .setDescription('Abrir gala de votación del Balón de Oro con los mejores jugadores activos')
    )
    .addSubcommand(sub =>
      sub
        .setName('votar')
        .setDescription('Emitir tu voto por un candidato')
        .addIntegerOption(opt => opt.setName('candidato').setDescription('Número del candidato (1 a 10)').setRequired(true))
        .addStringOption(opt =>
          opt
            .setName('posicion')
            .setDescription('Categoría de voto')
            .setRequired(true)
            .addChoices(
              { name: '🥇 Oro (3 puntos)', value: 'gold' },
              { name: '🥈 Plata (2 puntos)', value: 'silver' },
              { name: '🥉 Bronce (1 punto)', value: 'bronze' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('gala')
        .setDescription('Ver la gala en vivo y tabla de votos actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('cerrar')
        .setDescription('Cerrar la votación y proclamar al ganador del Balón de Oro (Solo el creador o admin)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const ballonData = storage.getBallonDorData();

    if (sub === 'abrir') {
      const allPlayers = Object.values(storage.loadAll());
      if (allPlayers.length === 0) {
        return interaction.reply({ content: 'No hay jugadores registrados en el servidor todavía.', ephemeral: true });
      }

      // Candidatos ordenados por goles + rating
      const candidates = allPlayers
        .filter(p => !p.retired)
        .sort((a, b) => (b.overall * 2 + (b.seasonStats?.goals || 0) * 3) - (a.overall * 2 + (a.seasonStats?.goals || 0) * 3));

      const seasonNum = candidates[0]?.season || 1;
      const vote = initializeBallonDOrVote(seasonNum, candidates, { id: userId, name: interaction.user.username });
      ballonData.activeVote = vote;
      storage.setBallonDorData(ballonData);

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🌟 ¡SE ABRE LA VOTACIÓN DEL BALÓN DE ORO (TEMPORADA ${seasonNum})!`)
        .setDescription(
          `La comunidad elige al mejor futbolista del año. Vota con \`/votar-ballon-dor votar\`.\n` +
          `👑 Gala abierta por: **<@${userId}>**.\n\n` +
          `🏆 **Nominados Oficiales:**\n` +
          vote.candidates.map((c, i) => `${i + 1}. **${c.name}** (${c.overall} OVR) — ⚽ ${c.goals} Goles | 🅰️ ${c.assists} Asistencias | 🏟️ ${c.apps} PJ`).join('\n')
        )
        .setFooter({ text: 'Los votos suman: 🥇 Oro = 3pts, 🥈 Plata = 2pts, 🥉 Bronce = 1pt · Solo el creador puede cerrar la gala.' });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'votar') {
      const vote = ballonData.activeVote;
      if (!vote || vote.status !== 'open') {
        return interaction.reply({
          content: 'No hay una votación activa del Balón de Oro en este momento. Usa `/votar-ballon-dor abrir` para iniciarla.',
          ephemeral: true
        });
      }

      const candIndex = interaction.options.getInteger('candidato') - 1;
      const position = interaction.options.getString('posicion');

      if (candIndex < 0 || candIndex >= vote.candidates.length) {
        return interaction.reply({ content: 'Número de candidato inválido.', ephemeral: true });
      }

      const ok = registerVote(vote, userId, candIndex, position);
      if (!ok) {
        return interaction.reply({
          content: `Ya habías emitido tu voto de categoría ${position === 'gold' ? '🥇 Oro' : position === 'silver' ? '🥈 Plata' : '🥉 Bronce'}.`,
          ephemeral: true
        });
      }

      storage.setBallonDorData(ballonData);
      const cand = vote.candidates[candIndex];

      return interaction.reply({
        content: `✅ ¡Voto registrado! Le diste tu **${position === 'gold' ? '🥇 Oro (3 pts)' : position === 'silver' ? '🥈 Plata (2 pts)' : '🥉 Bronce (1 pt)'}** a **${cand.name}**.`,
        ephemeral: true
      });
    }

    if (sub === 'gala') {
      const vote = ballonData.activeVote;
      if (!vote) {
        return interaction.reply({
          content: 'No hay votación activa. Usa `/votar-ballon-dor abrir` para comenzar.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🌟 GALA DEL BALÓN DE ORO · TEMPORADA ${vote.season}`)
        .setDescription(
          `📊 **Candidatos y Votos Acumulados:**\n\n` +
          vote.candidates.map((c, i) => {
            const score = c.gold * 3 + c.silver * 2 + c.bronze * 1;
            return `${i + 1}. **${c.name}** (${c.overall} OVR)\n   ⭐ Puntos: **${score}** (🥇 ${c.gold / 3 || 0} | 🥈 ${c.silver / 2 || 0} | 🥉 ${c.bronze || 0})\n   📊 ⚽ ${c.goals}G · 🅰️ ${c.assists}A · 🏟️ ${c.apps}PJ`;
          }).join('\n\n')
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'cerrar') {
      const vote = ballonData.activeVote;
      if (!vote || vote.status !== 'open') {
        return interaction.reply({
          content: 'No hay ninguna votación activa del Balón de Oro para cerrar.',
          ephemeral: true
        });
      }

      // Solo el creador de la votación o un administrador de Discord puede cerrarla
      const isCreator = vote.creatorId === userId;
      const isAdmin = interaction.memberPermissions && interaction.memberPermissions.has('Administrator');
      if (!isCreator && !isAdmin) {
        return interaction.reply({
          content: `⚠️ Solo el organizador que abrió la gala (<@${vote.creatorId}>) o un Administrador puede cerrar la votación.`,
          ephemeral: true
        });
      }

      const result = closeBallonDOrVote(vote);
      ballonData.activeVote = null;
      ballonData.lastClosedVote = vote;
      storage.setBallonDorData(ballonData);

      // Si el ganador es un jugador registrado, otorgar trofeo y atributos
      let rewardText = '';
      if (result.winner) {
        const winningPlayer = storage.getPlayer(result.winner);
        if (winningPlayer) {
          const rewards = applyBallonDOrRewards(winningPlayer);
          storage.setPlayer(result.winner, winningPlayer);
          rewardText = `\n\n🎉 **Recompensas para ${winningPlayer.name}:**\n• Moral al máximo (+${rewards.moraleGain}%)\n• +${rewards.ritmoGain} Ritmo · +${rewards.tiroGain} Tiro\n• 🌟 Se añade el Balón de Oro a su palmarés histórico.`;
        }
      }

      // Registrar en récords históricos
      const records = storage.getRecords();
      if (!records.ballonDorWinners) records.ballonDorWinners = [];
      records.ballonDorWinners.push({
        season: vote.season,
        winnerId: result.winner,
        winnerName: result.winnerName,
        score: result.score,
        date: Date.now()
      });
      storage.setRecords(records);

      const podium = result.all.slice(0, 3);
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🏆 ¡CEREMONIA DE CLAUSURA: GANADOR DEL BALÓN DE ORO TEMPORADA ${vote.season}!`)
        .setDescription(
          `✨ **¡EL MUNDO DEL FÚTBOL SE RINDE ANTE ${result.winnerName.toUpperCase()}!** ✨\n\n` +
          `🥇 **1° Puesto (Balón de Oro):** **${podium[0]?.name || 'N/A'}** (${podium[0]?.score || 0} pts)\n` +
          `🥈 **2° Puesto:** **${podium[1]?.name || 'N/A'}** (${podium[1]?.score || 0} pts)\n` +
          `🥉 **3° Puesto:** **${podium[2]?.name || 'N/A'}** (${podium[2]?.score || 0} pts)\n` +
          rewardText
        )
        .setFooter({ text: `Gala cerrada por ${interaction.user.username} · Votación concluida con éxito.` });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
