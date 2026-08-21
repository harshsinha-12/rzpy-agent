import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Stopping API");
  await app.close();
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.API_HOST, port: env.listenPort });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
