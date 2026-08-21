import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import type { PrismaClient } from "@recoveryos/database";

import type { ListRecoveryCasesQuery } from "./schemas.js";
import type {
  RecoveryCaseDetailRecord,
  RecoveryCaseListRecord,
  RecoveryCaseRepository,
} from "./types.js";

const actionSelect = {
  actionType: true,
  attemptNumber: true,
  confidence: true,
  createdAt: true,
  dataSource: true,
  executedAt: true,
  id: true,
  input: true,
  output: true,
  policyDecision: true,
  policyReason: true,
  proposedBy: true,
  razorpayReference: true,
  reason: true,
  result: true,
  scheduledFor: true,
} as const;

const listSelect = {
  actions: {
    orderBy: { createdAt: "desc" as const },
    select: actionSelect,
    take: 1,
  },
  amountAtRiskPaise: true,
  currency: true,
  dataSource: true,
  diagnosis: true,
  failureCategory: true,
  id: true,
  lastUpdatedAt: true,
  openedAt: true,
  paymentEvent: {
    select: {
      errorDescription: true,
      errorReason: true,
      errorSource: true,
      paymentMethod: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      status: true,
    },
  },
  publicId: true,
  recoverabilityBand: true,
  recoverabilityScore: true,
  recoveredAmountPaise: true,
  status: true,
} as const;

function createWhere(query: ListRecoveryCasesQuery) {
  return {
    merchant: { slug: DEMO_MERCHANT_SLUG },
    ...(query.dataSource ? { dataSource: query.dataSource } : {}),
    ...(query.failureCategory
      ? { failureCategory: query.failureCategory }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    paymentEvent: {
      ...(query.errorSource
        ? {
            errorSource: {
              equals: query.errorSource,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
    },
    ...(query.search
      ? {
          OR: [
            {
              publicId: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              paymentEvent: {
                razorpayOrderId: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              paymentEvent: {
                razorpayPaymentId: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };
}

export function createRecoveryCaseRepository(
  prisma: PrismaClient,
): RecoveryCaseRepository {
  return {
    async findById(id) {
      const record = await prisma.recoveryCase.findFirst({
        select: {
          ...listSelect,
          actions: {
            orderBy: { createdAt: "asc" },
            select: actionSelect,
          },
          auditEvents: {
            orderBy: { occurredAt: "asc" },
            select: {
              actionId: true,
              actor: true,
              dataSource: true,
              decision: true,
              eventType: true,
              id: true,
              input: true,
              occurredAt: true,
              output: true,
              reasoning: true,
            },
          },
          closedAt: true,
          customer: {
            select: {
              dataSource: true,
              externalRef: true,
              name: true,
              optedOut: true,
            },
          },
          paymentEvent: {
            select: {
              ...listSelect.paymentEvent.select,
              amountPaise: true,
              currency: true,
              errorCode: true,
              errorStep: true,
              eventType: true,
              occurredAt: true,
            },
          },
        },
        where: {
          merchant: { slug: DEMO_MERCHANT_SLUG },
          OR: [{ id }, { publicId: id }],
        },
      });

      return record as RecoveryCaseDetailRecord | null;
    },

    async list(query) {
      const where = createWhere(query);
      const orderBy =
        query.sortBy === "amountAtRiskPaise"
          ? { amountAtRiskPaise: query.sortOrder }
          : { lastUpdatedAt: query.sortOrder };
      const [totalItems, items] = await Promise.all([
        prisma.recoveryCase.count({ where }),
        prisma.recoveryCase.findMany({
          orderBy: [orderBy, { publicId: "asc" }],
          select: listSelect,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          where,
        }),
      ]);

      return {
        items: items as RecoveryCaseListRecord[],
        totalItems,
      };
    },
  };
}
