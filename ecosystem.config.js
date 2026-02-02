module.exports = {
    apps: [{
        name: "BigClouds",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 3002
        }
    }]
}
