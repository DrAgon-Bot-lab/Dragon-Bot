// Command configuration and validation rules
module.exports = {
    games: {
        'minecraft': {
            name: 'Minecraft',
            guides: ['building-guide', 'crafting-guide'],
            description: 'Building and crafting guides for Minecraft'
        },
        'valorant': {
            name: 'Valorant',
            guides: ['map-callouts', 'agent-abilities'],
            description: 'Map callouts and agent ability guides for Valorant'
        },
        'league-of-legends': {
            name: 'League of Legends',
            guides: ['item-builds', 'champion-combos'],
            description: 'Item builds and champion combo guides for League of Legends'
        }
    },

    guides: {
        'building-guide': {
            name: 'Building Guide',
            description: 'Step-by-step building tutorials and techniques',
            games: ['minecraft']
        },
        'crafting-guide': {
            name: 'Crafting Guide',
            description: 'Crafting recipes and materials guide',
            games: ['minecraft']
        },
        'map-callouts': {
            name: 'Map Callouts',
            description: 'Map locations and callout names',
            games: ['valorant']
        },
        'agent-abilities': {
            name: 'Agent Abilities',
            description: 'Agent skills and ability usage guides',
            games: ['valorant']
        },
        'item-builds': {
            name: 'Item Builds',
            description: 'Recommended item builds for champions',
            games: ['league-of-legends']
        },
        'champion-combos': {
            name: 'Champion Combos',
            description: 'Champion ability combos and techniques',
            games: ['league-of-legends']
        }
    },

    // Validation functions
    isValidGame: function(game) {
        return game in this.games;
    },

    isValidGuide: function(guide) {
        return guide in this.guides;
    },

    isValidCombination: function(game, guide) {
        return this.isValidGame(game) && 
               this.isValidGuide(guide) && 
               this.games[game].guides.includes(guide);
    },

    getGameGuides: function(game) {
        return this.isValidGame(game) ? this.games[game].guides : [];
    },

    getGuideGames: function(guide) {
        return this.isValidGuide(guide) ? this.guides[guide].games : [];
    },

    // Get formatted display names
    getGameDisplayName: function(game) {
        return this.isValidGame(game) ? this.games[game].name : game;
    },

    getGuideDisplayName: function(guide) {
        return this.isValidGuide(guide) ? this.guides[guide].name : guide;
    }

    const commands = [
      // Existing commands
      new SlashCommandBuilder()
        .setName('screenshot')  // Your new command
        .setDescription('Guide')
        .toJSON()
    ];
};
