import { spawn } from "node:child_process";

function start(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env
  });
}

const api = start("pnpm", ["parcial:dev"]);
const web = start("pnpm", ["dev:web"]);

const shutdown = (signal) => {
  api.kill(signal);
  web.kill(signal);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
