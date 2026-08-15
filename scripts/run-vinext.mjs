import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

process.env.WRANGLER_LOG_PATH ??= ".wrangler/wrangler.log";
const command = process.argv[2] ?? "dev";
const cli = resolve(fileURLToPath(new URL("..", import.meta.url)), "node_modules/vinext/dist/cli.js");
const child = spawn(process.execPath, [cli, command, ...process.argv.slice(3)], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
