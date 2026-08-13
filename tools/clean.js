import { existsSync, rmSync } from "node:fs";
import { resolve, relative } from "node:path";

const root = resolve(".");
const generatedPaths = ["apps/web/dist", "apps/api/target"];

for (const generatedPath of generatedPaths) {
  const target = resolve(generatedPath);
  const relativeTarget = relative(root, target);
  if (!relativeTarget || relativeTarget.startsWith("..")) {
    throw new Error(`Refusing to clean an unsafe path: ${target}`);
  }
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

console.log("Generated frontend and backend files removed.");
