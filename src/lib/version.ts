// Version helpers for Fart Counter PWA.
// Update discovery/application lives in src/lib/update-chain.ts (v1.9.3):
// quiet source-chain probes (Vercel -> GitHub Pages -> local), no redirects.

export const APP_VERSION = "1.9.3";

export interface VersionInfo {
  version: string;
  updatedAt?: string;
  changelogUrl?: string;
}

/**
 * Compare two SemVer versions.
 * Returns: 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}
