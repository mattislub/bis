module.exports = {
  apps: [{
    name: "api-seating",
    cwd: "/root/Seating-management",
    script: "server/index.js",
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      SMTP_HOST: "smtp.hostinger.com",
      SMTP_PORT: "465",
      SMTP_USER: "info@seatflow.online",
      SMTP_PASS: "613Ml#613",
      SMTP_FROM: "ניהול מושבים חכם<info@seatflow.online>"
    }
  }]
}
