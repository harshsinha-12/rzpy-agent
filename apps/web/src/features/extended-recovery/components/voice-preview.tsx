"use client";

import { useRef, useState } from "react";
import { publicApiUrl } from "@/config/env";
import styles from "./voice-preview.module.css";

export function VoicePreview({ caseId }: { caseId: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  async function play() {
    let next = url;
    if (!next) {
      setBusy(true);
      const response = await fetch(
        `${publicApiUrl}/extended-recovery/${caseId}/voice`,
        { method: "POST" },
      );
      const body = await response.json();
      setBusy(false);
      if (!response.ok) return;
      next = `${publicApiUrl}${body.audioUrl}`;
      setUrl(next);
    }
    audio.current!.src = next;
    await audio.current!.play();
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
    </div>
  );
}
