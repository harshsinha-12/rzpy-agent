import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { RecoveryDetail } from "@/features/recoveries/components/recovery-detail";
import { fetchRecoveryCase } from "@/features/recoveries/fetchers";
import { ApiClientError } from "@/lib/api-client";

export const metadata: Metadata = {
  description: "Inspect a recovery case and its complete decision trail.",
  title: "Recovery case",
};

async function getRecovery(id: string) {
  try {
    return await fetchRecoveryCase(id);
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}

export default async function RecoveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const recovery = await getRecovery(id);

  return <RecoveryDetail recovery={recovery} />;
}
