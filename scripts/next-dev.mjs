import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const forwarded = [];
const args = process.argv.slice(2);

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];

  if (argument === "--host") {
    forwarded.push("--hostname", args[index + 1]);
    index += 1;
    continue;
  }

  if (argument === "--strictPort") continue;
  forwarded.push(argument);
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextBin, "dev", ...forwarded], { stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
