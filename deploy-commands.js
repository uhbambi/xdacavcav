'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Falta DISCORD_TOKEN o CLIENT_ID en el archivo .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registrando ${commands.length} slash commands...`);

    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    await rest.put(route, { body: commands });

    console.log(
      GUILD_ID
        ? `Comandos registrados en el servidor ${GUILD_ID} (al tiro).`
        : 'Comandos registrados globalmente (pueden demorar hasta 1 hora en aparecer).'
    );
  } catch (error) {
    console.error(error);
  }
})();
