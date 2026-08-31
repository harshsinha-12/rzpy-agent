import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { createPrismaClient } from "../src/prisma.js";

try {
  loadEnvFile(new URL("../../../.env", import.meta.url));
} catch {}

const prisma = createPrismaClient(
  process.env.DATABASE_URL ??
    "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos",
);
const now = new Date();

const demos = [
  {
    publicId: "SUB-SIM-1001",
    reference: "sub_sim_aurora_1001",
    kind: "SUBSCRIPTION" as const,
    customerRef: "customer_priya_nair",
    customerName: "Priya Nair",
    customerEmail: "priya.nair@example.com",
    amountPaise: 249900,
    status: "DRAFT_READY" as const,
    dueAt: null,
    reason:
      "Cycle is pending after issuer-side decline. Merchant selected a copyable payment-method-update draft; no delivery is sent.",
    draftSubject: "Update your payment method for Aurora Retail",
    draftBody:
      "Hi Priya, your Aurora Retail subscription cycle of ₹2,499.00 is pending. Please update your payment method to continue.\n\nRegards,\nAurora Retail",
    voiceScript: null,
  },
  {
    publicId: "UDH-SIM-1001",
    reference: "udhaar_sim_aurora_1001",
    kind: "UDHAAR" as const,
    customerRef: "customer_meera_iyer",
    customerName: "Meera Iyer",
    customerEmail: "meera.iyer@example.com",
    amountPaise: 399900,
    status: "DRAFT_READY" as const,
    dueAt: new Date("2026-09-30T12:00:00.000Z"),
    reason:
      "Promise-to-pay reminder is scheduled before month-end. The Hindi-first copy and voice script are previews only.",
    draftSubject: "Mahine ke end tak udhaar settlement reminder",
    draftBody:
      "Namaste Meera, aapka ₹3,999.00 ka udhaar 30 September tak due hai. Kripya month-end se pehle settlement complete karein.\n\nAurora Retail",
    voiceScript:
      "Namaste Meera ji. Aapka Aurora Retail ka teen hazaar nau sau ninyanve rupaye ka udhaar tees September tak due hai. Kripya month-end se pehle settlement complete kar dijiye. Dhanyavaad.",
  },
];

async function main() {
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { slug: "aurora-retail" },
  });
  for (const demo of demos) {
    const { customerEmail, customerName, customerRef, ...caseData } = demo;
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_externalRef: {
          merchantId: merchant.id,
          externalRef: customerRef,
        },
      },
      update: { email: customerEmail, name: customerName, updatedAt: now },
      create: {
        id: `seed_${customerRef}`,
        merchantId: merchant.id,
        externalRef: customerRef,
        email: customerEmail,
        name: customerName,
        optedOut: false,
        dataSource: "SIMULATED",
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.extendedRecoveryCase.upsert({
      where: { publicId: caseData.publicId },
      update: {
        ...caseData,
        customerId: customer.id,
        merchantId: merchant.id,
        currency: "INR",
        dataSource: "SIMULATED",
        updatedAt: now,
      },
      create: {
        ...caseData,
        id: randomUUID(),
        customerId: customer.id,
        merchantId: merchant.id,
        currency: "INR",
        dataSource: "SIMULATED",
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  console.log("Ensured 2 SIMULATED extended recovery cases");
}

main().finally(() => prisma.$disconnect());
