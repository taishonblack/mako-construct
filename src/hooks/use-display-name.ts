import { useState, useCallback } from "react";

const STORAGE_KEY = "mako-display-name";

export function useDisplayName() {
  const [displayName, setDisplayNameState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const setDisplayName = useCallback((name: string) => {
    setDisplayNameState(name);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  return { displayName, setDisplayName };
}

export function getDisplayName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}
