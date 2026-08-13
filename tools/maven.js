import { existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

try { process.loadEnvFile(".env"); } catch { /* Spring Boot defaults apply. */ }
const env = { ...process.env };
const root = "C:\\Program Files\\Eclipse Adoptium";
const detected = existsSync(root) ? readdirSync(root).find((name) => name.startsWith("jdk-21")) : null;
if (detected) { env.JAVA_HOME = join(root, detected); env.Path = `${join(env.JAVA_HOME, "bin")};${env.Path ?? ""}`; }
const goal = process.argv.slice(2).join(" ") || "spring-boot:run";
const command = `mvn -f apps${process.platform === "win32" ? "\\" : "/"}api${process.platform === "win32" ? "\\" : "/"}pom.xml ${goal}`;
const child = process.platform === "win32" ? spawn("cmd.exe", ["/d", "/s", "/c", command], { env, stdio: "inherit" }) : spawn("sh", ["-c", command], { env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
