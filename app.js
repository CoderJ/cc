global.__base = __dirname + '/';
const Koa = require('koa');
const app = new Koa();
const json = require('koa-json');
const bodyparser = require('koa-bodyparser')();
const router = require('koa-router')();
const onError = require('koa-onerror');


const Page = require(__base + 'lib/browser.js');

let openAPage = async (url) => {
    let content;
    try {
        let page = new Page();
        await page.init();
        content = await page.getContent(url);
        await page.close();
    } catch (e) { 
        console.log(e);
    }

    return content;
};

let main = async function () { 
    for (let i = 0; i < 100; i++) { 
        openAPage('https://www.baidu.com/');
    }
}
//main();
app.use(bodyparser);
app.use(json());
app.use(onError());


router.get(/.*/, async(ctx, next) => {
    let url = ctx.url.replace(/^\//, '');
    if (!/^https*\:\/\//.test(url)) {
        ctx.status = 404;
        ctx.body = '';
        return false;
    }
    let content = await openAPage(url);
    ctx.body = content;
});


app.use(router.routes(), router.allowedMethods());

module.exports = app;