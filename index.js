//Twitch Library
const { SimpleAdapter, ReverseProxyAdapter, WebHookListener } = require('twitch-webhooks');
const { ApiClient, HelixStream } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
//config file
const config = require('./config/config');


//Logger
const { format, loggers, transports } = require('winston')
const { combine, timestamp, label, printf } = format;

loggers.add('default', {
    format: combine(
        timestamp(),
        printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })),
    transports: [
        new transports.Console({ 'timestamp': true, level: 'info' }),
        (config.log_filename)?new transports.File({ 'timestamp': true, level: 'debug', filename: config.log_filename }):false,

    ]
})
const logger = loggers.get('default');



//Discord Bot Handler
const DiscordHandler = require('./DiscordHandler')

//Variable to limit number of name changes 
var lastCheckedStatus = false;


function checkConfig() {
    let requiredItems = ["hostname", "port", "channel_Id",
        "twitch_user_id", "offline_text", "online_text", "discord_bot_token", "twitch_clientId",
        "twitch_accessToken", "cooldown_time"]
    for (let i = 0; i < requiredItems.length; i++) {
        let item = requiredItems[i];
        if (!config[item]) {
            logger.warn(`Please Include '${item}' in the config.json file`)
            return false;
        }
    }

    return true;

}
async function start() {
    // console.log(checkConfig())
    if (!checkConfig()) {

        logger.error("Config Check failed\nExisting")
        return;
    }
    logger.info("Config Check Passed")

    const clientId = config.twitch_clientId
    const accessToken = config.twitch_accessToken;
    const authProvider = new ClientCredentialsAuthProvider(clientId, accessToken);
    const apiClient = new ApiClient({ authProvider });
    const user = await apiClient.kraken.users.getUserByName(config.twitch_user_id)
    if (!user) {
        logger.error("User Not Found");
        return;
    }


    const listener = new WebHookListener(apiClient, new SimpleAdapter({
        hostName: config.hostname,
        listenerPort: config.port,

    }));


    const discordHandler = new DiscordHandler(config, async () => {
        //Setting it the first Time 
        let twitchChannel = await apiClient.kraken.channels.getChannel(user);
        let stream = await twitchChannel.getStream();
        lastCheckedStatus = !!stream;
        handleStreamChange(stream);
    });


    const subscription = await listener.subscribeToStreamChanges(user._data._id, async (stream) => {
        if (!!stream != lastCheckedStatus) {
            handleStreamChange(stream)
        } else {
            logger.debug(`Stream Status Changed. Name will not be changed`)
        }
        lastCheckedStatus = !!stream;

    });
    const handleStreamChange = async (stream) => {
        var name = (!!stream ? config.online_text : config.offline_text).toString();

        logger.info(`Stream Status Changed: ${name}`);
        discordHandler.waitForTime(name).then(() => {
            // logger.info(`Changing Channel Name Done: ${name}`)
        }).
            catch((err) => {
                if (err.canceled) {
                    logger.debug(`Canceled: ${err.reason}`)
                } else {
                    logger.error(err)
                }

            })
    }
    logger.info('Subbed To Twitch Listener')
    listener.listen();
}
start()