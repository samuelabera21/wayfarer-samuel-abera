import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

function log(msg) {
  console.log(`\x1b[36m▶\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function run(cmd, cwd = rootDir) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

console.log("\n\x1b[1m🚀 Wayfarer Setup Starting...\x1b[0m\n");

// 1. Ensure .env files exist
const backendEnv = path.join(rootDir, "backend", ".env");
const backendExample = path.join(rootDir, "backend", ".env.example");
if (!fs.existsSync(backendEnv) && fs.existsSync(backendExample)) {
  fs.copyFileSync(backendExample, backendEnv);
  success("Created backend/.env from backend/.env.example");
}

const frontendEnv = path.join(rootDir, "frontend", ".env.local");
const frontendExample = path.join(rootDir, "frontend", ".env.example");
if (!fs.existsSync(frontendEnv) && fs.existsSync(frontendExample)) {
  fs.copyFileSync(frontendExample, frontendEnv);
  success("Created frontend/.env.local from frontend/.env.example");
}

// 2. Install dependencies
log("Installing backend dependencies...");
run(`${npmCmd} --prefix backend install`);

log("Installing frontend dependencies...");
run(`${npmCmd} --prefix frontend install`);

// 3. Prisma generate & push schema
log("Generating Prisma client and syncing database schema...");
run(`${npmCmd} --prefix backend exec prisma generate`);
run(`${npmCmd} --prefix backend exec prisma db push`);

// 4. Seed database
log("Seeding database (11 places, 3 travellers, guided tour slots)...");
run(`${npmCmd} --prefix backend run seed`);

console.log("\n\x1b[32;1m✔ Wayfarer setup completed successfully!\x1b[0m");
console.log("Run \x1b[1mnpm run dev\x1b[0m to start both frontend and backend.\n");

