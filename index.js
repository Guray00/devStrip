require('dotenv').config() 
const axios   = require('axios')
const cheerio = require('cheerio')
const random  = require('random')
const vm      = require('vm');
const { Telegraf } = require('telegraf')
const Nightmare = require('nightmare');

websites = ["monkeyuser", "commitstrip", "turnoff"]



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


async function commitstripScraper(){
    response   = await axios("http://www.commitstrip.com/?random=1")
    const html = response.data;                         // takes the html
    const $    = await cheerio.load(html)               // loads html in cheerio for parsing
        
    let res = await $(".entry-content").find("img").first().attr("src")    
    return res;
}


async function turnoffScraper(){
    /*response   = await axios("http://turnoff.us")
    const html = response.data;                         // takes the html
    const $    = await cheerio.load(html)               // loads html in cheerio for parsing
        
    let res = await $.html(response.data)
    console.log(res)*/

    const nightmare = Nightmare({
    show: false, // will show browser window
    openDevTools: false // will open dev tools in browser window 
    });

    let url = 'http://turnoff.us';
    const selector = '#random-link';

    await nightmare
            .goto(url)
            .wait(selector)
            .evaluate(selector => {
        return {
            random: document.querySelector(selector).getAttribute('href')
        };
    }, selector).end()
    .then(extracted => {
        url+=extracted.random
    });

    console.log(url)
    let html = await axios(url);
    const $  = await cheerio.load(html.data)  

    let res = await $(".post-content").find("img").first().attr("src")
    
    return "http://turnoff.us"+res
}


async function getRandom(){
    let rand = random.int(0, websites.length-1)
    let url = websites[rand]

    let image = ""//await monkeyUserScraper()

    if (url == "monkeyuser") {
        image = await monkeyUserScraper()
    }

    else if (url == "commitstrip"){
        image = await commitstripScraper()
    }

    else if (url == "turnoff") image = await turnoffScraper()

    return image
}



/*************************************************************

                      PROGRAM STARTS HERE                

**************************************************************/

if (process.env.TEST == "true"){
}

if (process.env.PRODUCTION == "true"){
    const bot = new Telegraf(process.env.BOT_TOKEN)


    const commands = Telegraf.Extra
    .markdown()
    .markup((m) => m.keyboard([
        [m.callbackButton('🎲 Random strip', 'randomStrip')],
        [m.callbackButton('🐒 MonkeyUser', 'monkeyuser'), m.callbackButton('CommitStrip', 'commitstrip')], 
        [m.callbackButton('TurnOff', 'turnoff')]
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



    /*************************************
     *              COMMANDS
     **************************************/

    bot.command('random', async(ctx) => {
        photo = await getRandom()
        ctx.replyWithPhoto(photo)
    })

    bot.command('monkeyuser', async(ctx) => {
        photo = await monkeyUserScraper()
        ctx.replyWithPhoto(photo)
    })

    bot.command('commitstrip', async(ctx) => {
        photo = await commitstripScraper()
        ctx.replyWithPhoto(photo)
    })


     /*************************************
     *              KEYBOARD
     **************************************/


    bot.hears("🎲 Random strip", async (ctx, next)=>{
        photo = await getRandom()
        ctx.replyWithPhoto(photo)
    })

    bot.hears("CommitStrip", async (ctx, next)=>{
        photo = await commitstripScraper()
        ctx.replyWithPhoto(photo)
    })

    bot.hears("🐒 MonkeyUser", async (ctx, next)=>{
        photo = await monkeyUserScraper()
        ctx.replyWithPhoto(photo)
    })

    bot.hears("TurnOff", async (ctx, next)=>{
        photo = await turnoffScraper()
        ctx.replyWithPhoto(photo)
    })


    bot.launch()

}
