module.exports = {
  apps: [
    {
      name: "number-one-booking-web",
      script: "node_modules/next/dist/bin/next",
      interpreter: "/home/ndiduser/.nvm/versions/node/v18.19.1/bin/node",
      args: "start",
      watch: false,
      max_memory_restart: "300M",
      exec_mode: "fork",
      env: {
        PORT: 5005,
        NODE_ENV: "production",
      },
    }
  ],
};