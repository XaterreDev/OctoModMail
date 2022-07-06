const { Client, Intents } = require("discord.js"),
    client = new Client({
        intents: new Intents(32767),
        partials: ["CHANNEL", "GUILD_MEMBER", "GUILD_SCHEDULED_EVENT", "MESSAGE", "REACTION", "USER"],
        allowedMentions: {
            parse: ["users"]
        }
    }),
    { writeFileSync } = require("fs"),
    config = require("./config.json");

client.modmails = require("./modmails.json");

client.on("ready", () => {
    console.log(`${client.guilds.cache.get(config.guild).memberCount} membres !`);
    setInterval(() => {
        client.user.setActivity(`mes dm`, { type: "WATCHING" });
    }, 5000);
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "DM") {
        if (!Object.entries(client.modmails).find((modmail) => modmail.user === message.author.id)) {
            if (config.blacklist.includes(message.author.id)) return;
            client.guilds.cache.get(config.guild).channels.create(`modmail-${Object.entries(client.modmails).length + 1}`).then((channel) => {
                message.channel.send(`<a:iconNickname:843551307474010162>  Bonjour, vous allez être mis(e) en relation avec le support dans le salon <#${channel.id}>.`);
                channel.permissionOverwrites.create(config.guild, { "VIEW_CHANNEL": false });
                config.roles.forEach((role) => {
                    channel.permissionOverwrites.create(role, { VIEW_CHANNEL: true });
                });
                channel.permissionOverwrites.create(message.author.id, { VIEW_CHANNEL: true })
                client.modmails[channel.id] = message.author.id;
                writeFileSync(__dirname + "/modmails.json", JSON.stringify(client.modmails));
                channel.send({
                    embeds: [{
                        author: { name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) },
                        title: `\`Raison:\` ${message.content}`,
                        description: `\n\`Sommaire:\`\n \n \`❌\` = Fermer le **ModMail**. \n \`➕\` = Ajouter un utilisateur au **ModMail**. (indisponible)`,
                        color: "#202020"
                    }],
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            style: "PRIMARY",
                            label: "❌",
                            customId: "close"                       
                        }]
                    }]
                });
            });
        }
    }
});

client.on("interactionCreate", (interaction) => {
    if (interaction.isButton() && interaction.customId === "close") {
        interaction.channel.delete();
        delete client.modmails[interaction.channelId];
    }
});

client.login(config.token);