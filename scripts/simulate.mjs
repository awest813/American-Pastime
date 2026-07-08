// Balance-sim bootstrap: loads the TS harness through Vite's SSR pipeline so
// it can import the game systems (and their JSON content) unmodified.
// Usage: node scripts/simulate.mjs [seedCount]          — full curve report
//        node scripts/simulate.mjs [seedCount] ablation — gear value study
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const sim = await server.ssrLoadModule("/src/sim/simulate.ts");
  const seeds = Number(process.argv[2] ?? 200);
  if (process.argv[3] === "ablation") sim.ablation(seeds);
  else sim.main(seeds);
} finally {
  await server.close();
}
