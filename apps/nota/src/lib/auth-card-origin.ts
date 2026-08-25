/** sessionStorage key for the landing "Continue with email" box. */
export const AUTH_CARD_ORIGIN_KEY = 'nota-auth-card-origin';

/** Drop a leftover origin if navigation took longer than this. */
export const AUTH_CARD_ORIGIN_MAX_AGE_MS = 4_000;

export type AuthCardOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
  at: number;
};

export type AuthCardOriginStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type AuthCardInvert = {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
};

let rememberedOrigin: AuthCardOrigin | null = null;

function defaultStore(): AuthCardOriginStore | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function isOrigin(value: unknown): value is AuthCardOrigin {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const origin = value as AuthCardOrigin;
  return (
    Number.isFinite(origin.top) &&
    Number.isFinite(origin.left) &&
    Number.isFinite(origin.width) &&
    origin.width > 0 &&
    Number.isFinite(origin.height) &&
    origin.height > 0 &&
    Number.isFinite(origin.radius) &&
    Number.isFinite(origin.at)
  );
}

function readRadiusPx(trigger: Element): number {
  const view = trigger.ownerDocument.defaultView;
  if (!view) {
    return 0;
  }
  const raw = view.getComputedStyle(trigger).borderTopLeftRadius;
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? px : 0;
}

/** FLIP invert: place the rest-sized card over the trigger box. */
export function authCardInvertTransform(
  origin: Pick<AuthCardOrigin, 'top' | 'left' | 'width' | 'height'>,
  last: Pick<DOMRectReadOnly, 'top' | 'left' | 'width' | 'height'>,
): AuthCardInvert | null {
  if (last.width < 1 || last.height < 1) {
    return null;
  }
  return {
    translateX: origin.left - last.left,
    translateY: origin.top - last.top,
    scaleX: origin.width / last.width,
    scaleY: origin.height / last.height,
  };
}

export function captureAuthCardOrigin(
  trigger: Element,
  store: AuthCardOriginStore | null = defaultStore(),
  now: number = Date.now(),
): void {
  if (!store) {
    return;
  }
  const box = trigger.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) {
    return;
  }
  const origin: AuthCardOrigin = {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
    radius: readRadiusPx(trigger),
    at: now,
  };
  store.setItem(AUTH_CARD_ORIGIN_KEY, JSON.stringify(origin));
}

/** Read-and-clear. Returns null when missing, malformed, or stale. */
export function takeAuthCardOrigin(
  store: AuthCardOriginStore | null = defaultStore(),
  now: number = Date.now(),
  maxAgeMs: number = AUTH_CARD_ORIGIN_MAX_AGE_MS,
): AuthCardOrigin | null {
  if (store) {
    const raw = store.getItem(AUTH_CARD_ORIGIN_KEY);
    store.removeItem(AUTH_CARD_ORIGIN_KEY);
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isOrigin(parsed) && now - parsed.at <= maxAgeMs) {
          rememberedOrigin = parsed;
        } else {
          rememberedOrigin = null;
        }
      } catch {
        rememberedOrigin = null;
      }
    }
  }
  if (rememberedOrigin && now - rememberedOrigin.at <= maxAgeMs) {
    return rememberedOrigin;
  }
  rememberedOrigin = null;
  return null;
}

/** Drop a remembered origin after the morph has started (or been skipped). */
export function forgetAuthCardOrigin(): void {
  rememberedOrigin = null;
}
