const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Create commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
    } else {
        logger.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

// Bot ready event
client.once('ready', async () => {
    logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
    
    // Set bot status
    client.user.setActivity('Game guides | /help for commands', { type: 'WATCHING' });
    
    // Register slash commands
    await registerCommands();
});

// Interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
        logger.info(`Command ${interaction.commandName} executed by ${interaction.user.tag}`);
    } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        
        const errorEmbed = {
            color: 0xff0000,
            title: '❌ Error',
            description: 'There was an error while executing this command!',
            timestamp: new Date().toISOString(),
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Register slash commands globally
async function registerCommands() {
    const commands = [];
    
    // Load command data
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        logger.info('Started refreshing application (/) commands.');
        logger.info(`Registering ${commands.length} commands.`);

        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error('Error registering commands:', error);
    }
}

// Error handling
process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    logger.error('DISCORD_TOKEN environment variable is required');
    process.exit(1);
    client.on(Events.InteractionCreate, async interaction => {
      if (interaction.commandName === 'guide') {
        await interaction.reply({ content: 'Your guide content here' });
      }
    });
    
}

client.login(token);
