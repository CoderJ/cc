const puppeteer = require('puppeteer');
const fs = require('fs');
const EventEmitter = require('events');

const CONSTANTS = require(__base + 'const/index');
const generateId = () => { 
    let dateTime = new Date().getTime().toString(16);
    let randomStr = parseInt(Math.random() * 256 * 256).toString(16);
    let complete = (str,len) => { 
        return new Array(len - str.length + 1).join("0") + str
    }
    return complete(dateTime, 12) + complete(randomStr, 4);
}
const defaultOptions = {
    platform: "DESKTOP" // DESKTOP | MOBILE,
    //resolutions : [[1280,800]]
    //userAgents : ['']
};

let browser;
let browserStarting = false;
let pageEvent = new EventEmitter();
pageEvent.setMaxListeners(0);
let pageNumber = 0;
let pageQueue = [];
pageEvent.on('browserStarted', () => { 
    if (pageQueue.length > 0) { 
        for (let i = 0; i < CONSTANTS.MAXTABNUMBER; i++) { 
            if (pageQueue.length == 0) { 
                break;
            }
            let item = pageQueue.shift();
            pageEvent.emit('wait'+item);
        }

    }    
})
pageEvent.on('close', () => {
    if (pageQueue.length > 0) { 
        let item = pageQueue.shift();
        pageEvent.emit('wait'+item);
    }
});

class Page {
    constructor(options) {
        this.options = Object.assign({}, defaultOptions, options);
        this._id = generateId();
    }
    async startBrowser() {
        if (!browserStarting) {
            browserStarting = true;
            console.log("Starting the browser");
            browser = await puppeteer.launch({
                headless: !CONSTANTS.DEBUG
            });
            browserStarting = false;
            console.log("Browser started");
            pageEvent.emit('browserStarted');
        }
    }
    async init() {
        if (!browser) { 
            pageQueue.push(this._id);
            this.startBrowser();
            await this.wait();
            await this.init();
        }else if (CONSTANTS.MAXTABNUMBER && pageNumber < CONSTANTS.MAXTABNUMBER) {
            pageNumber++;
            this.page = await browser.newPage();
            await this.changeUA();
        } else {
            pageQueue.push(this._id);
            await this.wait();
            await this.init();
        }

    }
    async changeUA() {
        this.resolutions = this.options.resolutions || CONSTANTS.RESOLUTIONS[this.options.platform];
        let resolution = this.resolutions[parseInt(Math.random() * this.resolutions.length)];
        await this.page.setViewport({
            width: resolution[0],
            height: resolution[1]
        });
        this.userAgents = this.options.userAgents || CONSTANTS.USERAGENTS[this.options.platform];
        let userAgent = this.userAgents[parseInt(Math.random() * this.userAgents.length)];
        await this.page.setUserAgent(userAgent);
    }

    async getContent(url) {
        let startTime = new Date();
        let content;
        console.log(pageNumber, pageQueue.length, url, this._id);
        try {
            await this.page.goto(url, {
                timeout: 5000,
                waitUntil: 'load'
            });
            content = await this.page.content();
        } catch (e) { 
            console.log('Get Content Error:', e);
        }

        if (CONSTANTS.DEBUG) {
            fs.writeFileSync(__base + 'tmp/' + new Date().getTime() + '_' + url.replace(/\//g, '_') + '.html', content);
        }
        console.log(pageNumber,pageQueue.length,url, this._id, ((content||"").length / 1024).toFixed(2) + 'K', (new Date() - startTime) );
        return content;
    }
    wait() {
        return new Promise((resolve) => {
            pageEvent.on('wait'+this._id, () => {
                resolve();
            });
        })
    }
    async close() {
        await this.page.close();
        pageNumber--;
        pageEvent.emit('close');
    }
}

module.exports = Page;