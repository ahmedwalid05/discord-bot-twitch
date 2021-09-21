const Discord = require("discord.js");
const { loggers } = require("winston");
const logger = loggers.get("default");

class DiscordHandler {
  constructor(config, callback) {
    this.config = config;
    this.client = new Discord.Client();
    let client = this.client;
    this.allowedToWork = 1;
    this.taskPool = [];

    client.on("ready", () => {
      logger.info(`Logged in as ${client.user.tag}!`);
      if (callback) callback();
    });
    client.on("shardError", (error) => {
      logger.error("A websocket connection encountered an error:", error);
    });
    client.on("rateLimit", (rateLimitInfo) => {
      logger.warn(
        `Discord Has Rate limited you, please try again after ${
          rateLimitInfo.timeout / 1000
        }`
      );
    });

    client.on("error", (error) => {
      logger.error(`Error Occurred: ${error}`);
    });

    client.on("warn", (error) => {
      logger.warn(`Error Occurred: ${error}`);
    });
    client.login(this.config.discord_bot_token);
  }

  async changeName(name) {
    let channel = await this.client.channels
      .resolve(this.config.channel_Id)
      .fetch(true);

    if (name.toLowerCase().localeCompare(channel.name) == 0) {
      return Promise.reject({
        canceled: true,
        reason: "Channel Name is the same as the new channel name",
      });
    }
    this.lastChannelUpdateTime = Date.now();
    let promise = channel.edit({ name: name });
    logger.debug(`Changing Name to ${name}`);
    return promise;
  }

  async fireTaskQueue() {
    const task = this.taskPool[this.taskPool.length - 1];
    if (task) {
      this.taskPool = [];
      return task();
    }
    return Promise.reject({
      canceled: true,
      reason: "A new status was found",
    });
  }
  async waitForTimeAndChangeName(name) {
    logger.debug(`Scheduling a new channel change event`);

    this.taskPool.push(() => {
      return this.changeName(name);
    });

    if (this.lastChannelUpdateTime) {
      let timeDiff = Date.now() - this.lastChannelUpdateTime;
      let cooldown = this.config.cooldown_time * 1000 - timeDiff;
      if (cooldown > 0) {
        logger.info(`Sleeping For ${cooldown / 1000} seconds`);
        await this.sleep(cooldown);
      }
    }
    return this.fireTaskQueue();
  }
  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
module.exports = DiscordHandler;
