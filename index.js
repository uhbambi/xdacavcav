'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const engine = require('./game/engine.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

let client = null;
let isBotReady = false;

const commandsPath = path.join(__dirname, 'commands');
let commandFiles = [];
if (fs.existsSync(commandsPath)) {
  commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
}

async function deployCommands() {
  if (!CLIENT_ID || !DISCORD_TOKEN) {
    console.warn('⚠️  Falta CLIENT_ID o DISCORD_TOKEN en .env — no se pudieron registrar/actualizar los slash commands automaticamente.');
    return;
  }

  const commands = commandFiles.map(file => require(path.join(commandsPath, file)).data.toJSON());
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    console.log(`Registrando ${commands.length} slash commands...`);
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);
    await rest.put(route, { body: commands });
    console.log(
      GUILD_ID
        ? `✅ Comandos registrados en el servidor ${GUILD_ID} (al tiro).`
        : '✅ Comandos registrados globalmente (pueden demorar hasta 1 hora en aparecer la primera vez).'
    );
  } catch (error) {
    console.error('❌ No se pudieron registrar los slash commands:', error.message || error);
  }
}

async function startBot() {
  if (!process.env.DISCORD_TOKEN) {
    console.log('ℹ️  DISCORD_TOKEN no configurado. El simulador web está activo. Para conectar el bot de Discord, configura DISCORD_TOKEN en .env o Configuración.');
    return { success: false, reason: 'NO_TOKEN' };
  }

  try {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.commands = new Collection();

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      client.commands.set(command.data.name, command);
    }

    client.once(Events.ClientReady, c => {
      isBotReady = true;
      console.log(`✅ Bot conectado como ${c.user.tag}`);
    });

    client.on(Events.InteractionCreate, async interaction => {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction);
        } catch (error) {
          console.error(`Error ejecutando /${interaction.commandName}:`, error);
          const payload = { content: 'Ocurrio un error simulando eso. Intenta de nuevo.', ephemeral: true };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload);
          } else {
            await interaction.reply(payload);
          }
        }
        return;
      }

      if (interaction.isButton()) {
        const [action, ownerId, ...rest] = interaction.customId.split(':');

        if (ownerId && ownerId !== interaction.user.id) {
          await interaction.reply({ content: 'Este boton es de la carrera de otro jugador — usa tus propios comandos con `/crear-jugador`.', ephemeral: true });
          return;
        }

        try {
          let result;
          if (action === 'sim') {
            result = engine.simulateStep(interaction.user.id);
          } else if (action === 'fastseason') {
            result = engine.simulateEntireSeason(interaction.user.id);
          } else if (action === 'tactic') {
            result = engine.resolveTactic(interaction.user.id, rest.join(':'));
          } else if (action === 'mini') {
            result = engine.resolveMinigameChoice(interaction.user.id, rest.join(':'));
          } else if (action === 'penal') {
            result = engine.resolveShootoutKick(interaction.user.id, rest.join(':'));
          } else if (action === 'momento') {
            result = engine.resolveMomento(interaction.user.id, rest.join(':'));
          } else if (action === 'career') {
            result = engine.resolveCareerEvent(interaction.user.id, rest.join(':'));
          } else if (action === 'tabla') {
            result = engine.tableView(interaction.user.id);
            result.ephemeral = true;
          } else if (action === 'perfil') {
            result = engine.profileView(interaction.user.id);
            result.ephemeral = true;
          } else if (action === 'atributos') {
            result = engine.attributesView(interaction.user.id);
            result.ephemeral = true;
          } else if (action === 'shop') {
            if (rest[0] === 'buy') {
              result = engine.buyItemAction(interaction.user.id, rest[1]);
            } else {
              result = engine.shopView(interaction.user.id);
            }
          } else if (action === 'train') {
            result = engine.trainSkillAction(interaction.user.id, rest[0]);
          } else if (action === 'transfer') {
            result = engine.performTransfer(interaction.user.id, rest.join(':'));
          } else if (action === 'dt_sim') {
            result = engine.dtSimulateStep(interaction.user.id);
          } else if (action === 'dt_fastseason') {
            result = engine.dtSimulateEntireSeason(interaction.user.id);
          } else if (action === 'dt_tabla') {
            result = engine.dtTableView(interaction.user.id);
            result.ephemeral = true;
          } else if (action === 'dt_panel') {
            result = engine.dtPanelView(interaction.user.id);
            result.ephemeral = true;
          } else if (action === 'dt_ofertas') {
            result = engine.dtOffersView(interaction.user.id);
          } else if (action === 'dt_accept') {
            result = engine.dtAcceptOfferAction(interaction.user.id, rest[0]);
          } else if (action === 'dt_retirar') {
            result = engine.dtRetireAction(interaction.user.id);
          } else {
            return;
          }

          const payload = { content: result.content ?? '', embeds: result.embeds ?? [], components: result.components ?? [] };

          if (result.ephemeral) {
            await interaction.reply({ ...payload, ephemeral: true });
          } else if (!result.ok) {
            await interaction.reply({ ...payload, ephemeral: true });
          } else {
            await interaction.update(payload);
          }
        } catch (error) {
          console.error(`❌ Error procesando botón ${interaction.customId}:`, error.stack || error);
          const errorMsg = error?.message ? `Ocurrió un error: ${error.message}. Intenta de nuevo con el slash command.` : 'Ocurrió un error procesando eso. Intenta de nuevo con el slash command.';
          const payload = { content: errorMsg, ephemeral: true };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload);
          } else {
            await interaction.reply(payload);
          }
        }
      }
    });

    await deployCommands();
    await client.login(process.env.DISCORD_TOKEN);
    return { success: true };
  } catch (error) {
    console.error('⚠️  No se pudo conectar el bot a Discord:', error.message || error);
    return { success: false, error: error.message };
  }
}

function getBotStatus() {
  return {
    configured: Boolean(process.env.DISCORD_TOKEN),
    clientIdConfigured: Boolean(process.env.CLIENT_ID),
    ready: isBotReady,
    userTag: client && client.user ? client.user.tag : null,
    commandsCount: commandFiles.length
  };
}

// Si se ejecuta directamente con `node index.js`
if (require.main === module) {
  startBot();
}

module.exports = { startBot, getBotStatus, deployCommands };

