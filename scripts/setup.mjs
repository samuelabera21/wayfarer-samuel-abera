import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

function log(msg) {
  console.log(`\x1b[36m▶\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function run(cmd, cwd = rootDir) {
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

console.log("\n\x1b[1m🚀 Wayfarer Setup Starting...\x1b[0m\n");

// 1. Ensure .env files exist
const backendEnv = path.join(backendDir, ".env");
const backendExample = path.join(backendDir, ".env.example");
if (!fs.existsSync(backendEnv) && fs.existsSync(backendExample)) {
  fs.copyFileSync(backendExample, backendEnv);
  success("Created backend/.env from backend/.env.example");
}

const frontendEnv = path.join(frontendDir, ".env.local");
const frontendExample = path.join(frontendDir, ".env.example");
if (!fs.existsSync(frontendEnv) && fs.existsSync(frontendExample)) {
  fs.copyFileSync(frontendExample, frontendEnv);
  success("Created frontend/.env.local from frontend/.env.example");
}

// 2. Install dependencies
log("Installing backend dependencies...");
run(`${npmCmd} install`, backendDir);

log("Installing frontend dependencies...");
run(`${npmCmd} install`, frontendDir);

// 3. Prisma generate & push schema directly inside backend folder
log("Generating Prisma client and syncing database schema...");
run(`${npmCmd} exec prisma generate`, backendDir);
run(`${npmCmd} exec prisma db push`, backendDir);

// 4. Seed database
log("Seeding database (11 places, 3 travellers, guided tour slots)...");
run(`${npmCmd} run seed`, backendDir);

console.log("\n\x1b[32;1m✔ Wayfarer setup completed successfully!\x1b[0m");
console.log("Run \x1b[1mnpm run dev\x1b[0m to start both frontend and backend.\n");
