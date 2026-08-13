import { existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

try { process.loadEnvFile(".env"); } catch { /* Production platforms inject variables. */ }
const env = { ...process.env }; const root = "C:\\Program Files\\Eclipse Adoptium";
const detected = existsSync(root) ? readdirSync(root).find((name) => name.startsWith("jdk-21")) : null;
const java = detected ? join(root, detected, "bin", "java.exe") : "java";
const child = spawn(java, ["-jar", "apps/api/target/narratiaa-api-1.0.0.jar"], { env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
