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
          voiceAudio: true,
          voiceAudioMime: true,
          voiceGeneratedAt: true,
          voiceScript: true,
          customer: { select: { email: true, name: true } },
        },
        where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
      });
    },
    async findForVoice(id) {
      return prisma.extendedRecoveryCase.findFirst({
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
          voiceAudio: true,
          voiceAudioMime: true,
          voiceGeneratedAt: true,
          voiceScript: true,
          customer: { select: { email: true, name: true } },
        },
        where: {
          merchant: { slug: DEMO_MERCHANT_SLUG },
          OR: [{ id }, { publicId: id }],
        },
      });
    },
    async saveVoice({ audio, id, mime }) {
      await prisma.extendedRecoveryCase.update({
        data: {
          voiceAudio: Buffer.from(audio),
          voiceAudioMime: mime,
          voiceGeneratedAt: new Date(),
          updatedAt: new Date(),
        },
        where: { publicId: id },
      });
    },
  };
}
