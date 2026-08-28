export const productionWorkerHealthUrl =
  "https://recoveryosworker-production.up.railway.app/health";

function isUsableHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname.includes(".");
}

export function resolveWorkerHealthUrl(configuredUrl: string): string {
  try {
    const parsed = new URL(configuredUrl);
    if (!isUsableHostname(parsed.hostname)) {
      return productionWorkerHealthUrl;
    }

    parsed.pathname = "/health";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return productionWorkerHealthUrl;
  }
}
