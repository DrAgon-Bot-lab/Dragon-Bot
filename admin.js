const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const imageHandler = require('../utils/imageHandler');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for managing game guides')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available guides and screenshots')
)
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a specific screenshot')
                .addStringOption(option =>
                    option.setName('guide')
                        .setDescription('The guide type')
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
                        .setDescription('Screenshot number to delete')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(50)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('Upload a new screenshot guide')
                .addStringOption(option =>
                    option.setName('guide')
                        .setDescription('The guide type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Commander Guide', value: 'commander-guide' },
                            { name: 'Building Guide', value: 'building-guide' },
                            { name: 'Research Guide', value: 'research-guide' },
                            { name: 'Event Guide', value: 'event-guide' },
                            { name: 'Alliance Guide', value: 'alliance-guide' },
                            { name: 'Combat Guide', value: 'combat-guide' }
                        ))
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('The screenshot image to upload')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Screenshot number (will auto-assign if not specified)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(50))),

    async execute(interaction) {
        // Check if user has administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff6b6b)
                .setTitle('❌ Access Denied')
                .setDescription('You need Administrator permissions to use this command.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'list':
                    await handleListCommand(interaction);
                    break;
                case 'delete':
                    await handleDeleteCommand(interaction);
                    break;
                case 'upload':
                    await handleUploadCommand(interaction);
                    break;
                default:
                    await interaction.reply({ 
                        content: 'Unknown subcommand.', 
                        ephemeral: true 
                    });
            }
        } catch (error) {
            logger.error('Error in admin command:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xff6b6b)
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while executing the admin command.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};

async function handleListCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const game = 'rise-of-kingdoms';
    const guides = getGameGuides(game);
    
    const listEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📋 Rise of Kingdoms Guide Management - Available Screenshots')
        .setTimestamp();

    let totalScreenshots = 0;
    let fieldValue = '';

    for (const guide of guides) {
        const screenshots = await imageHandler.getAvailableScreenshots(game, guide);
        if (screenshots.length > 0) {
            const guideDisplayName = guide.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            fieldValue += `• ${guideDisplayName}: ${screenshots.length} screenshots (${screenshots.join(', ')})\n`;
            totalScreenshots += screenshots.length;
        }
    }

    if (totalScreenshots === 0) {
        fieldValue = '• No screenshots available yet\n';
    }

    listEmbed.setDescription(`Total screenshots: ${totalScreenshots}`);
    listEmbed.addFields({
        name: 'Available Guides',
        value: fieldValue,
        inline: false
    });

    await interaction.editReply({ embeds: [listEmbed] });
}

async function handleDeleteCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const game = 'rise-of-kingdoms';
    const guide = interaction.options.getString('guide');
    const number = interaction.options.getInteger('number');

    // Try to find and delete the screenshot
    const screenshotResult = await imageHandler.getScreenshot(game, guide, number);
    
    if (!screenshotResult.success) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('❌ Screenshot Not Found')
            .setDescription(`No screenshot found for ${guide.replace('-', ' ')} #${number}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
    }

    try {
        await fs.unlink(screenshotResult.path);
        
        const successEmbed = new EmbedBuilder()
            .setColor(0x4ecdc4)
            .setTitle('✅ Screenshot Deleted')
            .setDescription(`Successfully deleted screenshot #${number} for ${guide.replace('-', ' ')}`)
            .addFields({
                name: 'Deleted File',
                value: screenshotResult.filename,
                inline: true
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
        logger.info(`Screenshot deleted: ${game}/${guide}-${number} by ${interaction.user.tag}`);

    } catch (error) {
        logger.error('Error deleting screenshot:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('❌ Delete Failed')
            .setDescription('Failed to delete the screenshot file.')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleUploadCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const game = 'rise-of-kingdoms';
    const guide = interaction.options.getString('guide');
    let number = interaction.options.getInteger('number');
    const attachment = interaction.options.getAttachment('image');

    // Validate attachment
    if (!attachment.contentType?.startsWith('image/')) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('❌ Invalid File Type')
            .setDescription('Please upload a valid image file (PNG, JPG, GIF, etc.).')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
    }

    // Check file size (Discord limit is 8MB)
    if (attachment.size > 8 * 1024 * 1024) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('❌ File Too Large')
            .setDescription('Image file must be smaller than 8MB.')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
    }

    // Auto-assign number if not specified
    if (!number) {
        const existingScreenshots = await imageHandler.getAvailableScreenshots(game, guide);
        number = existingScreenshots.length > 0 ? Math.max(...existingScreenshots) + 1 : 1;
    }

    try {
        // Download and save the image
        const response = await fetch(attachment.url);
        const buffer = await response.arrayBuffer();
        
        const fileExtension = path.extname(attachment.name) || '.png';
        const filename = `${guide}-${number}${fileExtension}`;
        const gameDir = path.join(__dirname, '..', 'Guides', game);
        const filePath = path.join(gameDir, filename);

        // Ensure directory exists
        await fs.mkdir(gameDir, { recursive: true });
        
        // Save the file
        await fs.writeFile(filePath, Buffer.from(buffer));

        const successEmbed = new EmbedBuilder()
            .setColor(0x4ecdc4)
            .setTitle('✅ Screenshot Uploaded')
            .setDescription(`Successfully uploaded screenshot #${number} for ${guide.replace('-', ' ')}`)
            .addFields(
                {
                    name: 'File Info',
                    value: `Name: ${filename}\nSize: ${(attachment.size / 1024).toFixed(2)} KB`,
                    inline: true
                },
                {
                    name: 'Usage',
                    value: `/screenshot guide:${guide} number:${number}`,
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
        logger.info(`Screenshot uploaded: ${game}/${guide}-${number} by ${interaction.user.tag}`);

    } catch (error) {
        logger.error('Error uploading screenshot:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff6b6b)
            .setTitle('❌ Upload Failed')
            .setDescription('Failed to save the screenshot file.')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

function getGameGuides(game) {
    const validCombinations = {
        'rise-of-kingdoms': ['commander-guide', 'building-guide', 'research-guide', 'event-guide', 'alliance-guide', 'combat-guide']
    };
    
    return validCombinations[game] || [];
}