//Logger
const { format, loggers, transports, stream } = require('winston')
const { combine, timestamp, label, printf } = format;

loggers.add('default', {
    format: combine(
        timestamp(),
        printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })),
    transports: [
        new transports.Console({ 'timestamp': true })
    ]
})
const logger = loggers.get('default');

const config = require('./config/config');

// const DiscordHandler = require('./DiscordHandler')
this.lastChannelUpdateTime= Date.now()/1000

// const discordHandler = new DiscordHandler(config, async ()=>{
//     //Setting it the first Time 
//     for (let i =0 ;i<10; i++) {

//         await discordHandler.changeNameTo(i.toString());    
//         logger.info(`Done`)
//     }
//     // discordHandler.client.destroy();
// });
waitForTime = async (online) => {
    await sleep(1000)
    if (this.lastChannelUpdateTime) {
        
        console.log(timeout)
    }
}
waitForTime(true);
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   