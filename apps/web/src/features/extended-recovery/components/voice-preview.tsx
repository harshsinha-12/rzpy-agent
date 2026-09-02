"use client";

import { useRef, useState } from "react";
import styles from "./voice-preview.module.css";

type VoiceResponse = {
  audioUrl?: unknown;
  error?: { message?: unknown };
};

async function readVoiceResponse(response: Response): Promise<VoiceResponse> {
  try {
    return (await response.json()) as VoiceResponse;
  } catch {
    return {};
  }
}

export function VoicePreview({ caseId }: { caseId: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function play() {
    setError(null);

    try {
      let next = url;
      if (!next) {
        setBusy(true);
        const response = await fetch(
          `/api/extended-recovery/${encodeURIComponent(caseId)}/voice`,
          { method: "POST" },
        );
        const body = await readVoiceResponse(response);

        if (!response.ok) {
          throw new Error(
            typeof body.error?.message === "string"
              ? body.error.message
              : "Voice preview could not be generated.",
          );
        }
        if (typeof body.audioUrl !== "string") {
          throw new Error("Voice preview returned an invalid audio URL.");
        }

        next = body.audioUrl;
        setUrl(next);
      }

      if (!audio.current) {
        throw new Error("The audio player is unavailable.");
      }

      audio.current.src = next;
      await audio.current.play();
    } catch (cause) {
      setPlaying(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "Voice preview could not be played.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <audio
        ref={audio}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button
        className={styles.button}
        disabled={busy}
        onClick={() => void play()}
        type="button"
      >
        <span className={`${styles.wave} ${playing ? styles.playing : ""}`}>
          {[1, 2, 3, 4, 5].map((bar) => (
            <i key={bar} />
          ))}
        </span>
        {busy
          ? "Generating voice…"
          : playing
            ? "Playing preview"
            : "Play Hinglish voice preview"}
      </button>
      <span className={styles.note}>OpenAI-generated preview · not sent</span>
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
