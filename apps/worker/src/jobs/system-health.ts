export interface SystemHealthJobResult {
  processedAt: string;
  worker: "ready";
}

export function processSystemHealthJob(): Promise<SystemHealthJobResult> {
  return Promise.resolve({
    processedAt: new Date().toISOString(),
    worker: "ready",
  });
}
