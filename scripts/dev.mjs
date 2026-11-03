import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\n\x1b[1m🚀 Starting Wayfarer Services...\x1b[0m");
console.log("  • Backend:  \x1b[34mhttp://localhost:4000\x1b[0m");
console.log("  • Frontend: \x1b[36mhttp://localhost:3000\x1b[0m\n");

const backend = spawn(npmCmd, ["--prefix", "backend", "run", "dev"], {
  cwd: rootDir,
  stdio: "inherit",
});

const frontend = spawn(npmCmd, ["--prefix", "frontend", "run", "dev"], {
  cwd: rootDir,
  stdio: "inherit",
});

function shutdown() {
  console.log("\n\x1b[33mShutting down Wayfarer services...\x1b[0m");
  if (isWindows) {
    if (backend.pid) spawn("taskkill", ["/pid", backend.pid.toString(), "/f", "/t"]);
    if (frontend.pid) spawn("taskkill", ["/pid", frontend.pid.toString(), "/f", "/t"]);
  } else {
    backend.kill("SIGTERM");
    frontend.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

backend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Backend process exited with code ${code}`);
  }
});

frontend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Frontend process exited with code ${code}`);
  }
});

