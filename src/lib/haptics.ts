// Haptics (vibration) helper

export function vibrate(pattern: number | number[] = 50): void {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function vibrateFart(): void {
  // short double-buzz
  vibrate([30, 20, 40]);
}

export function vibrateWater(): void {
  vibrate(20);
}

export function vibrateAchievement(): void {
  vibrate([60, 40, 60, 40, 120]);
}
