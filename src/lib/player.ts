"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Meeting } from "@/lib/model";
import type { Utterance } from "@/lib/model";

/**
 * Playback clock + synthesized voice bed.
 *
 * The capture layer is stubbed by design for this build (stated up front): the
 * "recording" is simulated with a clock, and the voice bed is generated with
 * Web Audio — a low, speech-cadenced hum whose pitch follows the active
 * speaker — so playback, transcript sync and clip sharing all behave exactly
 * as they would against a real recording.
 */
export function usePlayer(meeting: Meeting, initialTime = 0) {
  const [t, setT] = useState(initialTime);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(true);
  const raf = useRef<number>(0);
  const last = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // speaking color hash → base pitch, so voices differ per speaker
  const pitchOf = useCallback(
    (speakerId: string) => {
      let h = 0;
      for (let i = 0; i < speakerId.length; i++) h = (h * 31 + speakerId.charCodeAt(i)) >>> 0;
      return 88 + (h % 7) * 14;
    },
    []
  );

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(raf.current);
      return;
    }
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last.current) / 1000) * speed;
      last.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= meeting.duration) {
          setPlaying(false);
          return meeting.duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, meeting.duration]);

  // voice bed
  useEffect(() => {
    if (playing && !muted) {
      if (!ctxRef.current) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AC();
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 320;
        const gain = ctx.createGain();
        gain.gain.value = 0.0;
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start();
        ctxRef.current = ctx;
        oscRef.current = osc;
        gainRef.current = gain;
      }
      void ctxRef.current.resume();
      gainRef.current?.gain.setTargetAtTime(0.018, ctxRef.current.currentTime, 0.1);
    } else if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(0.0, ctxRef.current.currentTime, 0.05);
    }
  }, [playing, muted]);

  // follow the active speaker's pitch
  useEffect(() => {
    if (!oscRef.current || !ctxRef.current) return;
    const active = activeUtterance(meeting.transcript, t);
    if (active && playing) {
      const pitch = pitchOf(active.speaker);
      oscRef.current.frequency.setTargetAtTime(pitch, ctxRef.current.currentTime, 0.25);
      gainRef.current?.gain.setTargetAtTime(0.018, ctxRef.current.currentTime, 0.2);
    } else if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(0.0, ctxRef.current.currentTime, 0.15);
    }
  }, [t, playing, meeting.transcript, pitchOf]);

  useEffect(() => {
    return () => {
      try {
        oscRef.current?.stop();
        void ctxRef.current?.close();
      } catch {
        /* already closed */
      }
    };
  }, []);

  const seek = useCallback(
    (time: number) => {
      setT(Math.max(0, Math.min(meeting.duration, time)));
    },
    [meeting.duration]
  );

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && t >= meeting.duration) setT(0);
      return !p;
    });
  }, [t, meeting.duration]);

  const activeIdx = activeIndex(meeting.transcript, t);
  return { t, playing, speed, muted, seek, toggle, setSpeed, setMuted, activeIdx };
}

export function activeUtterance(transcript: Utterance[], t: number): Utterance | null {
  for (const u of transcript) {
    if (t >= u.t && t < u.t + u.dur + 0.4) return u;
  }
  return null;
}

export function activeIndex(transcript: Utterance[], t: number): number {
  let lo = 0;
  while (lo < transcript.length && transcript[lo].t <= t) lo++;
  return Math.max(0, lo - 1);
}