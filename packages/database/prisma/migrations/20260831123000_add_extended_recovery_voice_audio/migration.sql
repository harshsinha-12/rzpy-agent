ALTER TABLE "ExtendedRecoveryCase"
  ADD COLUMN "voiceAudio" BYTEA,
  ADD COLUMN "voiceAudioMime" TEXT,
  ADD COLUMN "voiceGeneratedAt" TIMESTAMP(3);
