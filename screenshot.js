const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const imageHandler = require('../utils/imageHandler');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Get a game guide screenshot')
        .addStringOption(option =>
            option.setName('guide')
                .setDescription('The Rise of Kingdoms guide type')
                .setRequired(true)
                .addChoices(
                    { name: 'Commander Guide', value: 'commander-guide' },
                    { name: 'Building Guide', value: 'building-guide' },
                    { name: 'Research Guide', value: 'research-guide' },
                    { name: 'Event Guide', value: 'event-guide' },
                    { name: 'Alliance Guide', value: 'alliance-guide' },
                    { name: 'Combat Guide', value: 'combat-guide' }
                ))
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Screenshot number (1-10)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),

    async execute(interaction) {
        await interaction.deferReply();

        const guide = interaction.options.getString('guide');
        const number = interaction.options.getInteger('number') || 1;
        const game = 'rise-of-kingdoms';

        try {
            // Get screenshot
            const screenshotResult = await imageHandler.getScreenshot(game, guide, number);

            if (!screenshotResult.success) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff6b6b)
                    .setTitle('❌ Screenshot Not Found')
                    .setDescription(screenshotResult.message)
                    .addFields({
                        name: 'Requested',
                        value: `Guide: ${guide.replace('-', ' ')}\nNumber: ${number}`,
                        inline: true
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            // Create attachment and embed
            const attachment = new AttachmentBuilder(screenshotResult.path, { 
                name: screenshotResult.filename 
            });

            const successEmbed = new EmbedBuilder()
                .setColor(0x4ecdc4)
                .setTitle(`📸 RISE OF KINGDOMS - ${guide.replace('-', ' ').toUpperCase()}`)
                .setDescription(`Screenshot #${number} for your requested guide`)
                .setImage(`attachment://${screenshotResult.filename}`)
                .addFields(
                    {
                        name: '📖 Guide Type',
                        value: guide.replace('-', ' '),
                        inline: true
                    },
                    {
                        name: '📋 Screenshot',
                        value: `#${number}`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.editReply({ 
                embeds: [successEmbed], 
                files: [attachment] 
            });

            logger.info(`Screenshot served: ${game}/${guide}-${number} to ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Error in screenshot command:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xff6b6b)
                .setTitle('❌ Internal Error')
                .setDescription('An unexpected error occurred while processing your request. Please try again later.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};