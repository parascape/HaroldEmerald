const {ApplicationCommandOptionType} = require('discord.js');
const {useMainPlayer} = require('discord-player');
const {isInVoiceChannel} = require('../utils/voicechannel');
const {authorize, getFileStream, getFileMetadata, extractFileId} = require('../utils/googleDrive');

module.exports = {
    name: 'play',
    description: 'Play a song from YouTube or Google Drive in your channel!',
    options: [
        {
            name: 'query',
            type: ApplicationCommandOptionType.String,
            description: 'The song you want to play (YouTube URL/search or Google Drive URL)',
            required: true,
        },
    ],
    async execute(interaction) {
        const {default: Conf} = await import('conf');
        try {
            const inVoiceChannel = isInVoiceChannel(interaction);
            if (!inVoiceChannel) {
                return;
            }

            await interaction.deferReply();

            const player = useMainPlayer();
            const query = interaction.options.getString('query');

            // Check if it's a Google Drive URL
            if (query.includes('drive.google.com')) {
                try {
                    const fileId = extractFileId(query);
                    if (!fileId) {
                        return void interaction.followUp({
                            content: '❌ | Invalid Google Drive URL!',
                        });
                    }

                    const auth = await authorize();
                    const metadata = await getFileMetadata(auth, fileId);
                    
                    if (!metadata.mimeType.startsWith('audio/') && !metadata.mimeType.startsWith('video/')) {
                        return void interaction.followUp({
                            content: '❌ | The file must be an audio or video file!',
                        });
                    }

                    const stream = await getFileStream(auth, fileId);
                    const config = new Conf({projectName: 'volume'});

                    await player.play(interaction.member.voice.channel.id, stream, {
                        nodeOptions: {
                            metadata: {
                                title: metadata.name,
                                channel: interaction.channel,
                                client: interaction.guild?.members.me,
                                requestedBy: interaction.user.username,
                            },
                            leaveOnEmptyCooldown: 300000,
                            leaveOnEmpty: true,
                            leaveOnEnd: false,
                            bufferingTimeout: 0,
                            volume: config.get('volume') || 10,
                        },
                    });

                    return void interaction.followUp({
                        content: `⏱ | Loading your track: ${metadata.name}...`,
                    });
                } catch (error) {
                    console.error('Google Drive error:', error);
                    return void interaction.followUp({
                        content: '❌ | Error playing from Google Drive: ' + error.message,
                    });
                }
            }

            // Default YouTube behavior
            const searchResult = await player.search(query);
            if (!searchResult.hasTracks()) 
                return void interaction.followUp({content: '❌ | No results were found!'});

            try {
                const config = new Conf({projectName: 'volume'});

                await player.play(interaction.member.voice.channel.id, searchResult, {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild?.members.me,
                            requestedBy: interaction.user.username,
                        },
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEmpty: true,
                        leaveOnEnd: false,
                        bufferingTimeout: 0,
                        volume: config.get('volume') || 10,
                    },
                });

                await interaction.followUp({
                    content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...`,
                });
            } catch (error) {
                await interaction.editReply({
                    content: 'An error has occurred!',
                });
                return console.log(error);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to execute that command: ' + error.message,
            });
        }
    }
};
