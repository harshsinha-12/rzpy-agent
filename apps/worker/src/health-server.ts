import { createServer, type Server } from "node:http";

import type { HealthSnapshot } from "@recoveryos/domain";

export async function startHealthServer(options: {
  getSnapshot(): Promise<HealthSnapshot>;
  host: string;
  port: number;
}): Promise<Server> {
  const server = createServer(async (request, response) => {
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const snapshot = await options.getSnapshot();
    response.writeHead(snapshot.status === "healthy" ? 200 : 503, {
      "content-type": "application/json",
    });
    response.end(JSON.stringify(snapshot));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
}
