const Discord = require('discord.js');
const { format, loggers, transports } = require('winston')
const logger = loggers.get('default')

class DiscordHandler {

  constructor(config, callback) {

    this.config = config;
    this.client = new Discord.Client();
    let client = this.client;
    this.allowedToWork = 1;

    client.on('ready', () => {
      logger.info(`Logged in as ${client.user.tag}!`);
      if (callback)
        callback();
    });
    // client.on('raw', console.log);
    client.on('shardError', error => {
      logger.error('A websocket connection encountered an error:', error);
    });
    client.on('rateLimit', (rateLimitInfo) => {
      logger.warn(`Discord Has Rate limited you, please try again after ${rateLimitInfo.timeout / 1000}`)
    })
    // client.on('debug', (info) => {
    //   console.log(info);
    // })
    client.on('error', (error) => {
      logger.error(`Error Occurred: ${error}`)
    })

    client.on('warn', (error) => {
      logger.warn(`Error Occurred: ${error}`)
    })
    client.login(this.config.discord_bot_token);
  }

  async changeName(name) {
    logger.debug
    this.allowedToWork--;
    if (this.allowedToWork > 0) {
      return Promise.reject({
        canceled: true,
        reason: "A new status was found"
      })
    }
    let channel = await this.client.channels.resolve(this.config.channel_Id).fetch(true);
    // let name = (online ? this.config.online_text : this.config.offline_text);

    if (name.toLowerCase().localeCompare(channel.name) == 0) {
      return Promise.reject({
        canceled: true,
        reason: "Channel Name is the same as the new channel name"
      })
    }
    this.lastChannelUpdateTime = Date.now();
    let promise = channel.edit({ name: name })
    logger.debug(`Changing Name to ${name}`)
    return promise;
    // return Promise.resolve();
  }

  async waitForTime(name) {
    logger.debug(`Scheduling a new channel change event`)
    // this.valueToExecute = name;
    if (this.lastChannelUpdateTime) {
      let timeDiff = Date.now() - this.lastChannelUpdateTime;
      let cooldown = this.config.cooldown_time * 1000 - timeDiff;
      this.allowedToWork++;
      if (cooldown > 0) {
        logger.info(`Sleeping For ${cooldown / 1000} seconds`)
        await this.sleep(cooldown);
      }

    }
    return this.changeName(name);

    // return promise
  }
  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

}
module.exports = DiscordHandler