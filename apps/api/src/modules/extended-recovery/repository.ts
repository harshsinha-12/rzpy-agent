import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import type { PrismaClient } from "@recoveryos/database";

import type { ExtendedRecoveryRepository } from "./types.js";

export function createExtendedRecoveryRepository(
  prisma: PrismaClient,
): ExtendedRecoveryRepository {
  return {
    async list() {
      return prisma.extendedRecoveryCase.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          amountPaise: true,
          currency: true,
          dataSource: true,
          draftBody: true,
          draftSubject: true,
          dueAt: true,
          kind: true,
          publicId: true,
          reason: true,
          reference: true,
          status: true,
          voiceScript: true,
          customer: { select: { email: true, name: true } },
        },
        where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
      });
    },
  };
}
