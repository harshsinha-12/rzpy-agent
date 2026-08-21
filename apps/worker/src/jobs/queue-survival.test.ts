import { Queue, Worker } from "bullmq";
import { afterAll, describe, expect, it } from "vitest";

import { createBullMqConnectionOptions } from "../queues/connection.js";
import { defaultRecoveryJobOptions } from "../queues/job-options.js";

describe("BullMQ recovery jobs", () => {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6380";
  const queueName = `recovery-orchestration-test-${Date.now()}`;
  const connection = createBullMqConnectionOptions(redisUrl);
  const created: Array<{ close: () => Promise<void> }> = [];

  afterAll(async () => {
    await Promise.all(created.map((item) => item.close()));
  });

  it("keeps a job in Redis after the producer closes so a later worker can run it", async () => {
    const producer = new Queue(queueName, { connection });
    created.push(producer);
    await producer.add(
      "survive-restart",
      { token: "step-8" },
      {
        ...defaultRecoveryJobOptions({ attempts: 3 }),
        jobId: "stable-restart",
      },
    );
    await producer.close();

    const processed = await new Promise<{ token: string }>(
      (resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Worker did not pick up the persisted job.")),
          8_000,
        );
        const worker = new Worker(
          queueName,
          async (job) => {
            clearTimeout(timer);
            resolve(job.data as { token: string });
          },
          { connection },
        );
        created.push(worker);
      },
    );

    expect(processed).toEqual({ token: "step-8" });
  });
});
