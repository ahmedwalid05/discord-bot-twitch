const Discord = require('discord.js');


class DiscordHandler {

  constructor(config, callback) {
    this.config = config;
    this.client = new Discord.Client();
    let client = this.client;

    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
      if (callback)
        callback();
    });
    // client.on('raw', console.log);
    client.on('shardError', error => {
      console.error('A websocket connection encountered an error:', error);
    });
    client.on('rateLimit', (rateLimitInfo) => {
      console.log(`Discord Has Rate limited you, please try again after ${rateLimitInfo.timeout / 1000}`)
    })
    // client.on('debug', (info) => {
    //   console.log(info);
    // })
    client.on('error', (error) => {
      console.log(error)
    }
    )

    client.login(this.config.discord_bot_token);
  }

  async changeName(online) {
    let channel = await this.client.channels.resolve(this.config.channel_Id).fetch(true);
    let name = (online ? this.config.online_text : this.config.offline_text);
    console.log(`Stream Changed Status: ${name}`);
    return channel.edit({ name: name})
  }


}
module.exports = DiscordHandler