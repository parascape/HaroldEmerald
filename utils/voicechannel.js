const {GuildMember} = require("discord.js");

const isInVoiceChannel = async (interaction) => {
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
        await interaction.reply({
            content: '❌ | You need to be in a voice channel first!',
            ephemeral: true,
        });
        return false;
    }

    const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
    
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        await interaction.reply({
            content: '❌ | I need permissions to join and speak in your voice channel!',
            ephemeral: true,
        });
        return false;
    }

    if (
        interaction.guild.members.me.voice.channelId &&
        interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
        await interaction.reply({
            content: '❌ | You need to be in the same voice channel as me!',
            ephemeral: true,
        });
        return false;
    }

    return true;
}

module.exports = {
    isInVoiceChannel
};