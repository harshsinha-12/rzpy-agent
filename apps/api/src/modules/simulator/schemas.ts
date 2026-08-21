import { z } from "zod";

export const runSimulationBodySchema = z.object({
  paymentCount: z.number().int().min(250).max(500).optional(),
  seed: z.number().int().safe().optional(),
});
