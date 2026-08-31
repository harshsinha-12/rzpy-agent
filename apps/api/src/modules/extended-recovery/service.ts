import type {
  ExtendedRecoveryRepository,
  ExtendedRecoveryService,
} from "./types.js";
import { notFoundError } from "../../lib/errors.js";

export function createExtendedRecoveryService(
  repository: ExtendedRecoveryRepository,
  openAiApiKey: string,
): ExtendedRecoveryService {
  return {
    async list() {
      const records = await repository.list();
      return {
        data: records.map((record) => ({
          ...record,
          dueAt: record.dueAt?.toISOString() ?? null,
        })),
      };
    },
    async generateVoice(id) {
      const record = await repository.findForVoice(id);
      if (!record) {
        throw notFoundError(
          "EXTENDED_RECOVERY_NOT_FOUND",
          `Recovery case ${id} was not found.`,
        );
      }
      if (record.status !== "DRAFT_READY" || !record.voiceScript) {
        throw new Error(
          "Voice preview is not policy-ready for this recovery case.",
        );
      }
      if (record.voiceAudio)
        return { audioUrl: `/extended-recovery/${record.publicId}/voice` };
      if (!openAiApiKey)
        throw new Error("OpenAI voice generation is not configured.");
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "coral",
          input: record.voiceScript,
          instructions:
            "Speak warmly and clearly in Hinglish. This is a recovery reminder, never a debt threat.",
        }),
      });
      if (!response.ok) throw new Error("OpenAI voice generation failed.");
      await repository.saveVoice({
        audio: new Uint8Array(await response.arrayBuffer()),
        id: record.publicId,
        mime: "audio/mpeg",
      });
      return { audioUrl: `/extended-recovery/${record.publicId}/voice` };
    },
    async getVoice(id) {
      const record = await repository.findForVoice(id);
      if (!record?.voiceAudio || !record.voiceAudioMime) return null;
      return { audio: record.voiceAudio, mime: record.voiceAudioMime };
    },
  };
}
