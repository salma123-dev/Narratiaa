import { existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

try { process.loadEnvFile(".env"); } catch { /* Defaults are sufficient for local development. */ }
const env = { ...process.env };
const javaHomes = [...(["C:\\Program Files\\Eclipse Adoptium"].filter(existsSync).flatMap((root) =>
  readdirSync(root).filter((name) => name.startsWith("jdk-21")).map((name) => join(root, name)))), env.JAVA_HOME].filter(Boolean);
if (javaHomes.length) {
  env.JAVA_HOME = javaHomes[0];
  env.Path = `${join(javaHomes[0], "bin")};${env.Path ?? ""}`;
}
const separator = process.platform === "win32" ? "\\" : "/";
const backendCommand = `mvn -f apps${separator}api${separator}pom.xml spring-boot:run`;
const backend = process.platform === "win32"
  ? spawn("cmd.exe", ["/d", "/s", "/c", backendCommand], { env, stdio: "inherit" })
  : spawn("sh", ["-c", backendCommand], { env, stdio: "inherit" });
const frontend = spawn("npm", ["run", "dev", "--prefix", "apps/web"], { env, stdio: "inherit", shell: process.platform === "win32" });
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; spawn("taskkill", ["/pid", String(backend.pid), "/t", "/f"], { stdio: "ignore" }); frontend.kill(); setTimeout(() => process.exit(code), 200); }
backend.on("exit", (code) => stop(code ?? 1)); frontend.on("exit", (code) => stop(code ?? 1));
process.on("SIGINT", () => stop(0)); process.on("SIGTERM", () => stop(0));
