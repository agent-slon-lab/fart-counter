// Local Notifications scheduler for Fart Counter
// Uses the Notification API + a self-managed timer (since PWA can't run native cron).
// Works while the PWA tab is open. For background push, a real service worker
// + push subscription would be needed — out of scope for offline-first.

import type { Language } from "./i18n";
import { translations } from "./i18n";
import { getFactOfDay } from "./facts";

type NotifKind = "evening" | "water" | "achievement" | "morning" | "gentle";

interface ScheduledNotif {
  kind: NotifKind;
  fireAt: number; // epoch ms
  title: string;
  body: string;
}

let timerId: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function ensurePermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === "granted");
}

export async function requestNotificationPermission(): Promise<boolean> {
  return ensurePermission();
}

export function notificationsSupported(): boolean {
  return typeof Notification !== "undefined";
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/** Schedule the next evening (21:00) reminder. */
function scheduleEvening(lang: Language): ScheduledNotif | null {
  const t = translations[lang];
  const now = new Date();
  const next = new Date(now);
  next.setHours(21, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return {
    kind: "evening",
    fireAt: next.getTime(),
    title: t.notif_evening_title,
    body: t.notif_evening_body,
  };
}

/** Schedule the next morning (9:00) greeting with fact of the day. */
function scheduleMorning(lang: Language): ScheduledNotif | null {
  const t = translations[lang];
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return {
    kind: "morning",
    fireAt: next.getTime(),
    title: t.notif_morning_title,
    body: `${t.notif_morning_body} ${getFactOfDay(lang, next)}`,
  };
}

/** Schedule next gentle reminder (4 hours from now). */
function scheduleGentle(lang: Language): ScheduledNotif | null {
  const t = translations[lang];
  return {
    kind: "gentle",
    fireAt: Date.now() + 4 * 3600 * 1000,
    title: t.notif_gentle_reminder_title,
    body: t.notif_gentle_reminder_body,
  };
}

/** Schedule next water reminder (2 hours from now). */
function scheduleWater(lang: Language): ScheduledNotif | null {
  const t = translations[lang];
  return {
    kind: "water",
    fireAt: Date.now() + 2 * 3600 * 1000,
    title: t.notif_water_title,
    body: t.notif_water_body,
  };
}

function fireNotif(n: ScheduledNotif) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(n.title, {
      body: n.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: n.kind,
    });
  } catch {
    // ignore
  }
}

/**
 * Install / refresh the notification scheduler based on current settings.
 * Call this on app start and whenever settings change.
 */
export function installNotifications(opts: {
  enabled: boolean;
  evening: boolean;
  water: boolean;
  morning?: boolean;
  gentle?: boolean;
  lang: Language;
}): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  if (!opts.enabled) {
    installed = false;
    return;
  }

  // Try to ensure permission (no-op if already decided)
  void ensurePermission().then((granted) => {
    if (!granted) return;
    scheduleNext(opts);
  });
  installed = true;
}

function scheduleNext(opts: {
  enabled: boolean;
  evening: boolean;
  water: boolean;
  morning?: boolean;
  gentle?: boolean;
  lang: Language;
}) {
  if (!opts.enabled) return;
  const candidates: ScheduledNotif[] = [];
  if (opts.evening) {
    const n = scheduleEvening(opts.lang);
    if (n) candidates.push(n);
  }
  if (opts.water) {
    const n = scheduleWater(opts.lang);
    if (n) candidates.push(n);
  }
  if (opts.morning) {
    const n = scheduleMorning(opts.lang);
    if (n) candidates.push(n);
  }
  if (opts.gentle) {
    const n = scheduleGentle(opts.lang);
    if (n) candidates.push(n);
  }
  if (candidates.length === 0) return;
  candidates.sort((a, b) => a.fireAt - b.fireAt);
  const next = candidates[0];
  const delay = Math.max(1000, next.fireAt - Date.now());
  timerId = setTimeout(() => {
    fireNotif(next);
    // reschedule
    scheduleNext(opts);
  }, delay);
}

export function isNotificationsInstalled(): boolean {
  return installed;
}

/** Fire an achievement notification immediately. */
export function fireAchievementNotification(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "achievement",
    });
  } catch {
    // ignore
  }
}
