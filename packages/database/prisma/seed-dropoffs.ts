import { loadEnvFile } from "node:process";

import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";

import { createPrismaClient } from "../src/prisma.js";

try {
  loadEnvFile(new URL("../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";
const prisma = createPrismaClient(databaseUrl);

const dropOffs = [
  [
    "dropoff_co1001",
    "CO-SIM-1001",
    "customer_priya_nair",
    "order_checkout_sim_1001",
    249900,
  ],
  [
    "dropoff_co1002",
    "CO-SIM-1002",
    "customer_kabir_shah",
    "order_checkout_sim_1002",
    129900,
  ],
  [
    "dropoff_co1003",
    "CO-SIM-1003",
    "customer_meera_iyer",
    "order_checkout_sim_1003",
    399900,
  ],
] as const;

try {
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { slug: DEMO_MERCHANT_SLUG },
  });
  const now = new Date();

  for (const [
    id,
    publicId,
    customerId,
    razorpayOrderId,
    amountPaise,
  ] of dropOffs) {
    await prisma.checkoutDropOff.upsert({
      create: {
        amountPaise,
        checkoutCreatedAt: now,
        currency: "INR",
        customerId,
        dataSource: "SIMULATED",
        id,
        lastUpdatedAt: now,
        merchantId: merchant.id,
        publicId,
        razorpayOrderId,
        status: "OPEN",
      },
      update: {},
      where: { publicId },
    });
  }
  console.info(`Ensured ${dropOffs.length} simulated checkout drop-offs.`);
} finally {
  await prisma.$disconnect();
}
