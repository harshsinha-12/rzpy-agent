export const PRODUCTION_DEMO_RESET_CONFIRMATION = "RESET_AURORA_RETAIL";

export function assertDemoSeedAllowed(input: {
  confirmation: string | undefined;
  nodeEnv: string | undefined;
}): void {
  if (input.nodeEnv !== "production") return;
  if (input.confirmation === PRODUCTION_DEMO_RESET_CONFIRMATION) return;

  throw new Error(
    "Production demo reset blocked. Use `pnpm db:migrate` for normal deploys. For an intentional reset, set ALLOW_DEMO_RESET=RESET_AURORA_RETAIL only for that one seed run.",
  );
}
