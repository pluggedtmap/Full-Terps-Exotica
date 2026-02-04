module.exports = {
    apps: [{
        name: "FullTerpsExotica",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 4005
        }
    }]
}
