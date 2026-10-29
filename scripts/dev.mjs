import { watch } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { buildSite, root } from "./build.mjs";

await buildSite();
const server = spawn(process.execPath, [path.join(root, "scripts/serve.mjs"), "dist"], { cwd: root, stdio: "inherit" });
let timer;
let builds = Promise.resolve();
const watchers = ["src", "content"].map(dir => watch(path.join(root, dir), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    builds = builds.then(buildSite).catch(error => console.error(error.message));
  }, 150);
}));
function close() {
  watchers.forEach(watcher => watcher.close());
  clearTimeout(timer);
  server.kill();
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
server.on("exit", code => { close(); process.exit(code ?? 0); });
