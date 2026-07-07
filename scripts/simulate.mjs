// Balance-sim bootstrap: loads the TS harness through Vite's SSR pipeline so
// it can import the game systems (and their JSON content) unmodified.
// Usage: node scripts/simulate.mjs [seedCount]
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const sim = await server.ssrLoadModule("/src/sim/simulate.ts");
  sim.main(Number(process.argv[2] ?? 200));
} finally {
  await server.close();
}
