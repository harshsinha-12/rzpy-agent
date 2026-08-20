import type { ConnectionOptions } from "bullmq";

export function createBullMqConnectionOptions(
  redisUrl: string,
): ConnectionOptions {
  const url = new URL(redisUrl);
  const database = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0;
  const options: ConnectionOptions = {
    db: Number.isNaN(database) ? 0 : database,
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
  };

  if (url.username) {
    options.username = decodeURIComponent(url.username);
  }
  if (url.password) {
    options.password = decodeURIComponent(url.password);
  }
  if (url.protocol === "rediss:") {
    options.tls = {};
  }

  return options;
}
