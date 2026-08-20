export const dependencyNames = ["postgres", "redis"] as const;

export type DependencyName = (typeof dependencyNames)[number];
export type ServiceName = "api" | "worker";
export type ServiceStatus = "healthy" | "degraded";

export interface DependencyHealth {
  error: string | null;
  status: "up" | "down";
}

export interface HealthSnapshot {
  dependencies: Record<DependencyName, DependencyHealth>;
  service: ServiceName;
  status: ServiceStatus;
  timestamp: string;
}
