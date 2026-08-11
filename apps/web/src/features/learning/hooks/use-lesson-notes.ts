'use client';

import { useEffect, useRef, useState } from 'react';

interface StoredNote {
  text: string;
  savedAt: number;
}

const AUTOSAVE_DELAY_MS = 500;

function storageKey(lessonId: string): string {
  return `joel-academy-lesson-notes:${lessonId}`;
}

function readNote(lessonId: string): StoredNote | null {
  try {
    const raw = localStorage.getItem(storageKey(lessonId));
    return raw ? (JSON.parse(raw) as StoredNote) : null;
  } catch {
    return null;
  }
}

/**
 * There is no lesson-notes endpoint anywhere on the backend (confirmed) -
 * this is an honestly-scoped local-only feature, persisted per lesson in
 * `localStorage` on this device only, same pattern already used for
 * Settings' language/timezone. Not synced across devices.
 */
export function useLessonNotes(lessonId: string | undefined) {
  const [text, setText] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!lessonId) {
      setText('');
      setSavedAt(null);
      return;
    }
    const stored = readNote(lessonId);
    setText(stored?.text ?? '');
    setSavedAt(stored?.savedAt ?? null);
  }, [lessonId]);

  function updateText(value: string) {
    setText(value);
    if (!lessonId) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      localStorage.setItem(storageKey(lessonId), JSON.stringify({ text: value, savedAt: now }));
      setSavedAt(now);
    }, AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { text, savedAt, updateText };
}
