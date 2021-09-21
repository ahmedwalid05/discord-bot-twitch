//config file
const config = require("./config/config");

//Logger
const { format, loggers, transports } = require("winston");
const { combine, timestamp, printf } = format;

loggers.add("default", {
  format: combine(
    timestamp(),
    printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console({ timestamp: true, level: "info" }),
    config.log_filename
      ? new transports.File({
          timestamp: true,
          level: "debug",
          filename: config.log_filename,
        })
      : false,
  ],
});
const logger = loggers.get("default");

function checkConfig() {
  let requiredItems = [
    "external_hostname",
    "internal_port",
    "channel_Id",
    "twitch_user_id",
    "offline_text",
    "online_text",
    "discord_bot_token",
    "twitch_clientId",
    "twitch_accessToken",
    "cooldown_time",
    "twitch_randomSecret",
  ];
  for (let i = 0; i < requiredItems.length; i++) {
    let item = requiredItems[i];
    if (!config[item]) {
      logger.warn(`Please Include '${item}' in the config.json file`);
      return false;
    }
  }

  return true;
}

if (!checkConfig()) {
  logger.error("Config Check failed\nExisting");
  throw new Error("Config Check failed");
} else {
  logger.info("Config Check Passed");
}

module.exports = {
  logger,
};
