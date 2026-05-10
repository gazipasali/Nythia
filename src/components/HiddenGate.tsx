"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const SEQ = "nythia";
const P = [47, 114, 101, 112, 111, 114, 116, 115, 47, 113, 117, 97, 114, 116, 101, 114, 108, 121];

export function HiddenGate() {
  const router = useRouter();
  const buf = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handle = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key.length !== 1) return;
      buf.current += e.key.toLowerCase();
      if (buf.current.length > SEQ.length) {
        buf.current = buf.current.slice(-SEQ.length);
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        buf.current = "";
      }, 2000);
      if (buf.current === SEQ) {
        buf.current = "";
        router.push(String.fromCharCode(...P));
      }
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [handle]);

  return null;
}
