const fs = require('fs');
module.exports = {
    DEBUG: (process.env.NODE_ENV != "production"),
    MAXTABNUMBER: 8,
    PORT: 8050,
    AUTORESTART : 86400,
    USERAGENTS: {
        DESKTOP: fs.readFileSync(__base + 'const/userAgents/desktop','utf8').split('\n'),
        MOBILE: fs.readFileSync(__base + 'const/userAgents/mobile','utf8').split('\n')
    },
    RESOLUTIONS : {
        DESKTOP: [
            [1280, 800],
            [1366, 768],
            [1440, 900],
            [1680, 1050],
            [1920, 1080]
        ],
        MOBILE: [
            [320, 640],
            [360, 640],
            [424, 753]
        ]
    }
};