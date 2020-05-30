require('dotenv').config() 
const axios   = require('axios')
const cheerio = require('cheerio')
const random  = require('random')
const vm      = require('vm');
const { Telegraf } = require('telegraf')

websites = ["https://www.monkeyuser.com"]



async function monkeyUserScraper(){
    response   = await axios("https://www.monkeyuser.com")
    const html = response.data;                         // takes the html
    const $    = await cheerio.load(html)               // loads html in cheerio for parsing
        
    /*
    To get the random page on monkeyuser, the author runs in realtime js. Therefore i download the script
    because it takes all the post in the website and then i choose one post from them, running in real time
    the script. Then i go to the page i wont and i take the url of the image of post.
    */

    scriptUrl  = await $($('script')[7]).html()

    const script = new vm.Script(scriptUrl);
    const sandbox = {posts: []};

    const context = new vm.createContext(sandbox);
    script.runInContext(context);

    url = "https://www.monkeyuser.com"+sandbox.posts[Math.floor(Math.random() * sandbox.posts.length)]

    let html2 = await axios(url);
    const $$  = await cheerio.load(html2.data)  

    let res = await $$(".content").find("img").first().attr("src")
   
    return res
}


async function getRandom(){
    let rand = random.int(0, websites.length-1)
    let url = websites[rand]

    let image = ""//await monkeyUserScraper()

    if (url == "https://www.monkeyuser.com") {
        image = await monkeyUserScraper()
    }

    return image
}



/*************************************************************

                      PROGRAM STARTS HERE                

**************************************************************/


const bot = new Telegraf(process.env.BOT_TOKEN)


const commands = Telegraf.Extra
  .markdown()
  .markup((m) => m.keyboard([
    m.callbackButton('🎲 Random strip', 'randomStrip')
  ]))


bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('Response time: %sms', ms)
})
  

bot.start((ctx) => {
    ctx.reply("Choose a command from the list!", commands)
})
 

bot.command('commands', (ctx) => {
    ctx.reply("Choose a command from the keyboard", commands)
})

bot.command('random', (ctx) => {
    photo = await getRandom()
    ctx.replyWithPhoto(photo)
})


bot.hears("🎲 Random strip", async (ctx, next)=>{
    photo = await getRandom()
    ctx.replyWithPhoto(photo)
})


bot.launch()


