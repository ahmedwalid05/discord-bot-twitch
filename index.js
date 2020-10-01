const { SimpleAdapter, ReverseProxyAdapter, WebHookListener } = require('twitch-webhooks');
const { ApiClient, HelixStream } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');

const config = require('./config/config');

const DiscordHandler = require('./DiscordHandler')



function checkConfig() {
    let requiredItems = ["hostname", "port", "channel_Id",
        "twitch_user_id", "offline_text", "online_text", "discord_bot_token", "twitch_clientId",
        "twitch_accessToken"]
    for (let i = 0; i < requiredItems.length; i++) {
        let item = requiredItems[i];
        if (!config[item]) {
            console.log(`Please Include '${item}' in the config.json file`)
            return false;
        }
    }

    return true;

}
async function start() {
    // console.log(checkConfig())
    if (!checkConfig()) {

        console.log("Exiting");
        return;
    }


    const clientId = config.twitch_clientId
    const accessToken = config.twitch_accessToken;
    const authProvider = new ClientCredentialsAuthProvider(clientId, accessToken);
    const apiClient = new ApiClient({ authProvider });
    const user = await apiClient.kraken.users.getUserByName(config.twitch_user_id)
    if (!user) {
        console.log("User Not Found");
        return;
    }


    const listener = new WebHookListener(apiClient, new SimpleAdapter({
        hostName: config.hostname,
        listenerPort: config.port,

    }));


    const discordHandler = new DiscordHandler(config, async ()=>{
        //Setting it the first Time 
        let twitchChannel = await apiClient.kraken.channels.getChannel(user);
        let stream = await twitchChannel.getStream();
        discordHandler.changeName(stream);
    });

    

    

    const subscription = await listener.subscribeToStreamChanges(user._data._id, async (stream) => {
        discordHandler.changeName(stream).then(() => {
            console.log("Changing Name Done")
        }).
            catch((err) => {
                console.log(err)
            })

    });
    console.log('Subbed To Listener')
    listener.listen();
}
start()