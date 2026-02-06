export async function register() {
  // Run only on the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Avoid halting startup in local/dev when the license key isn't present.
  if (!process.env.NEW_RELIC_LICENSE_KEY) return;

  // New Relic's Node agent is CommonJS; dynamic import works fine here.
  await import("newrelic");
}
