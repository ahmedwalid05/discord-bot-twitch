//Twitch Library
const { EventSubListener, ReverseProxyAdapter } = require("@twurple/eventsub");
const { ApiClient } = require("@twurple/api");
const { ClientCredentialsAuthProvider } = require("@twurple/auth");

//config file
const config = require("./config/config");

const { logger } = require("./init");

//Discord Bot Handler
const DiscordHandler = require("./DiscordHandler");

//Variable to limit number of name changes
let lastCheckedStatus = false;

async function start() {
  const clientId = config.twitch_clientId;
  const accessToken = config.twitch_accessToken;
  const authProvider = new ClientCredentialsAuthProvider(clientId, accessToken);
  const apiClient = new ApiClient({ authProvider });

  const user = await apiClient.users.getUserByName(config.twitch_user_id);
  if (!user) {
    logger.error("User Not Found");
    return;
  }

  const adapter = new ReverseProxyAdapter({
    hostName: config.external_hostname,
    port: config.internal_port,
  });

  const listener = new EventSubListener({
    adapter,
    apiClient,
    secret: config.twitch_randomSecret,
  });

  const discordHandler = new DiscordHandler(config, async () => {
    //Setting it the first Time
    const stream = await apiClient.streams.getStreamByUserId(user.id);
    handleStreamStatusChanged(!!stream);
  });

  const handleStreamStatusChanged = async (isOnline) => {
    if (lastCheckedStatus == isOnline) {
      logger.debug(`Stream Status Changed, but Name will not be changed`);
      return;
    }
    lastCheckedStatus = isOnline;

    var name = (isOnline ? config.online_text : config.offline_text).toString();

    logger.info(`Stream Status Changed: ${name}`);
    discordHandler
      .waitForTimeAndChangeName(name)
      .then(() => {
        logger.info(`Changing Channel Name Done: ${name}`);
      })
      .catch((err) => {
        if (err.canceled) {
          logger.debug(`Canceled: ${err.reason}`);
        } else {
          logger.error(err);
        }
      });
  };
  await apiClient.eventSub.deleteAllSubscriptions();

  await listener.subscribeToStreamOnlineEvents(user.id, () =>
    handleStreamStatusChanged(true)
  );

  await listener.subscribeToStreamOfflineEvents(user.id, () =>
    handleStreamStatusChanged(false)
  );

  try {
    await listener.listen();
    logger.info("Subbed To Twitch Listener");
  } catch (error) {
    if (error.message !== "subscription already exists") logger.error(error);
    else logger.debug(error);
  }
}
start();
