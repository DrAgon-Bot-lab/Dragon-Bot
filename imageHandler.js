const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class ImageHandler {
    constructor() {
        this.screenshotsDir = path.join(__dirname, '..', 'Guides');
        this.supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    }

    /**
     * Get a screenshot file path and validate its existence
     * @param {string} game - Game name
     * @param {string} guide - Guide type
     * @param {number} number - Screenshot number
     * @returns {Object} Result object with success status and file info
     */
    async getScreenshot(game, guide, number) {
        try {
            const gameDir = path.join(this.screenshotsDir, game);
            
            // Check if game directory exists
            try {
                await fs.access(gameDir);
            } catch (error) {
                return {
                    success: false,
                    message: `No screenshots available for "${game.replace('-', ' ')}".`
                };
            }

            // Look for the specific screenshot file
            const baseFilename = `${guide}-${number}`;
            let foundFile = null;
            let foundFormat = null;

            for (const format of this.supportedFormats) {
                const filename = baseFilename + format;
                const filePath = path.join(gameDir, filename);

                try {
                    await fs.access(filePath);
                    foundFile = filePath;
                    foundFormat = format;
                    break;
                } catch (error) {
                    // File doesn't exist with this format, try next
                    continue;
                }
            }

            if (!foundFile) {
                // Try to find any screenshots for this guide
                const files = await fs.readdir(gameDir);
                const guideFiles = files.filter(file => 
                    file.startsWith(`${guide}-`) && 
                    this.supportedFormats.some(format => file.endsWith(format))
                );

                if (guideFiles.length === 0) {
                    return {
                        success: false,
                        message: `No screenshots found for "${guide.replace('-', ' ')}" in ${game.replace('-', ' ')}.`
                    };
                } else {
                    const availableNumbers = guideFiles
                        .map(file => {
                            const match = file.match(new RegExp(`${guide}-(\\d+)`));
                            return match ? parseInt(match[1]) : null;
                        })
                        .filter(num => num !== null)
                        .sort((a, b) => a - b);

                    return {
                        success: false,
                        message: `Screenshot #${number} not found for "${guide.replace('-', ' ')}". Available: ${availableNumbers.join(', ')}`
                    };
                }
            }

            // Validate file size (max 8MB for Discord)
            const stats = await fs.stat(foundFile);
            const maxSize = 8 * 1024 * 1024; // 8MB

            if (stats.size > maxSize) {
                return {
                    success: false,
                    message: 'Screenshot file is too large to display in Discord (max 8MB).'
                };
            }

            return {
                success: true,
                path: foundFile,
                filename: baseFilename + foundFormat,
                size: stats.size,
                format: foundFormat
            };

        } catch (error) {
            logger.error('Error in getScreenshot:', error);
            return {
                success: false,
                message: 'An error occurred while retrieving the screenshot.'
            };
        }
    }

    /**
     * Get available screenshots for a game and guide
     * @param {string} game - Game name
     * @param {string} guide - Guide type
     * @returns {Array} Array of available screenshot numbers
     */
    async getAvailableScreenshots(game, guide) {
        try {
            const gameDir = path.join(this.screenshotsDir, game);
            const files = await fs.readdir(gameDir);
            
            const guideFiles = files.filter(file => 
                file.startsWith(`${guide}-`) && 
                this.supportedFormats.some(format => file.endsWith(format))
            );

            const numbers = guideFiles
                .map(file => {
                    const match = file.match(new RegExp(`${guide}-(\\d+)`));
                    return match ? parseInt(match[1]) : null;
                })
                .filter(num => num !== null)
                .sort((a, b) => a - b);

            return numbers;

        } catch (error) {
            logger.error('Error getting available screenshots:', error);
            return [];
        }
    }

    /**
     * Get all available games
     * @returns {Array} Array of game directory names
     */
    async getAvailableGames() {
        try {
            const items = await fs.readdir(this.screenshotsDir, { withFileTypes: true });
            return items
                .filter(item => item.isDirectory())
                .map(item => item.name);
        } catch (error) {
            logger.error('Error getting available games:', error);
            return [];
        }
    }

    /**
     * Initialize screenshots directory structure
     */
    async initializeDirectories() {
        const games = ['rise-of-kingdoms'];
        
        try {
            // Create main guides directory
            await fs.mkdir(this.screenshotsDir, { recursive: true });
            
            // Create game subdirectories
            for (const game of games) {
                const gameDir = path.join(this.screenshotsDir, game);
                await fs.mkdir(gameDir, { recursive: true });
            }

            logger.info('Guides directory structure initialized');
        } catch (error) {
            logger.error('Error initializing directories:', error);
        }
    }
}

module.exports = new ImageHandler();
