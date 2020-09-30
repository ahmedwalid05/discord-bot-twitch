const { SimpleAdapter, ReverseProxyAdapter, WebHookListener } = require('twitch-webhooks');
const { ApiClient, HelixStream } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');

const config = require('./config/config');
const DiscordHandler = new (require('./DiscordHandler'))(config)


 
function checkConfig(){
    let requiredItems = ["hostname", "port","channel_Id",
    "twitch_user_id","offline_text","online_text","discord_bot_token","twitch_clientId",
    "twitch_accessToken"]
    requiredItems.forEach(item => {
        console.log(`Please Include 'item' in the config.json file`)
    })
     

} 
async function start() {


    const clientId = config.twitch_clientId
    const accessToken = config.twitch_accessToken;
    const authProvider = new ClientCredentialsAuthProvider(clientId, accessToken);
    const apiClient = new ApiClient({ authProvider });
    const user = await apiClient.kraken.users.getUserByName(config.twitch_user_id)


    const listener = new WebHookListener(apiClient, new SimpleAdapter({
        hostName: config.hostname,
        listenerPort: config.port,

    }));




    const subscription = await listener.subscribeToStreamChanges(user._data._id, async (stream) => {
        console.log(`Stream Status Changed: ${stream ? "Online" : "Offline"}`)
        DiscordHandler.changeName(stream).then(() => {
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