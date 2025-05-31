const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands and guide information'),

    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🏰 Rise of Kingdoms Guide Bot - Help')
            .setDescription('Get Rise of Kingdoms guide screenshots instantly with slash commands!')
            .addFields(
                {
                    name: '📸 /screenshot',
                    value: 'Get a specific Rise of Kingdoms guide screenshot\n' +
                           '• **guide**: Select the guide type\n' +
                           '• **number**: Screenshot number (1-10, optional)',
                    inline: false
                },
                {
                    name: '🎮 Available Guides',
                    value: '**Rise of Kingdoms:**\n' +
                           '• Commander Guide\n' +
                           '• Building Guide\n' +
                           '• Research Guide\n' +
                           '• Event Guide\n' +
                           '• Alliance Guide\n' +
                           '• Combat Guide',
                    inline: false
                },
                {
                    name: '📝 Usage Examples',
                    value: '`/screenshot guide:Commander Guide number:1`\n' +
                           '`/screenshot guide:Building Guide`\n' +
                           '`/screenshot guide:Research Guide number:3`',
                    inline: false
                },
                {
                    name: '💡 Tips',
                    value: '• Each guide has multiple screenshots (1-10)\n' +
                           '• If no number is specified, screenshot #1 is shown\n' +
                           '• Screenshots are organized by guide type\n' +
                           '• Use autocomplete to see available options',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Need more help? Contact the server admins!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed] });
    },
};
