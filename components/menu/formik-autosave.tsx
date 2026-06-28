"use client";

import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface FormikAutosaveProps {
  /** Persist the current form values. Should throw on failure. */
  onSave: (values: any) => Promise<void>;
  /** Notified as the save lifecycle progresses. */
  onStatusChange?: (status: AutosaveStatus) => void;
  /** Debounce window in ms before a save fires after the last change. */
  debounceMs?: number;
  /** Temporarily disable autosaving (e.g. while a row is mid-delete). */
  enabled?: boolean;
}

/**
 * Renderless Formik child that debounces saves. It only saves when the form is
 * valid and the serialized values differ from the last persisted snapshot, and
 * it serializes concurrent saves so the first create can never fire twice
 * before its id is captured. Must be rendered inside a <Formik> provider.
 */
export function FormikAutosave({
  onSave,
  onStatusChange,
  debounceMs = 1000,
  enabled = true,
}: FormikAutosaveProps) {
  const { values, isValid } = useFormikContext<any>();
  const serialized = JSON.stringify(values);

  // Snapshot of the last successfully saved (or initial) values. Initialized on
  // first render so the initial state never triggers an autosave.
  const baselineRef = useRef<string | null>(null);
  const valuesRef = useRef(values);
  const validRef = useRef(isValid);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSaveRef = useRef<() => Promise<void>>(async () => {});

  // Mirror the latest render values and the save implementation into refs
  // (after render, never during it) so the debounced timer always sees fresh
  // data without re-arming on every keystroke.
  useEffect(() => {
    valuesRef.current = values;
    validRef.current = isValid;

    runSaveRef.current = async () => {
      if (savingRef.current) {
        // A save is in flight — remember to re-check once it settles.
        pendingRef.current = true;
        return;
      }
      if (!validRef.current) return;

      const snapshot = JSON.stringify(valuesRef.current);
      if (snapshot === baselineRef.current) return;

      const snapshotValues = valuesRef.current;
      savingRef.current = true;
      onStatusChange?.("saving");
      try {
        await onSave(snapshotValues);
        // Baseline is the snapshot we just saved, NOT the current values, so any
        // edits made during the request are detected and saved on the next pass.
        baselineRef.current = snapshot;
        onStatusChange?.("saved");
      } catch {
        onStatusChange?.("error");
      } finally {
        savingRef.current = false;
        if (pendingRef.current) {
          pendingRef.current = false;
          if (
            validRef.current &&
            JSON.stringify(valuesRef.current) !== baselineRef.current
          ) {
            void runSaveRef.current();
          }
        }
      }
    };
  });

  useEffect(() => {
    if (baselineRef.current === null) {
      baselineRef.current = serialized;
      return;
    }
    if (!enabled) return;
    if (!isValid) return;
    if (serialized === baselineRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void runSaveRef.current(), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialized, isValid, enabled, debounceMs]);

  // Clear any pending timer on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return null;
}
