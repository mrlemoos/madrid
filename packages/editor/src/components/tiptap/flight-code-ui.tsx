import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import { fetchFlightInfo, type FlightInfo } from '../../lib/flight-client';
import type {
  FlightCodeHandlers,
  FlightCodeHandlersRef,
} from './flight-code-extension';

const FlightGlobe = lazy(() => import('./flight-globe'));

const HOVER_HIDE_DELAY_MS = 160;
const DIALOG_POLL_MS = 20_000;

type HoverState = { code: string; rect: DOMRect };

type FlightFetch =
  | { status: 'loading' }
  | { status: 'ready'; info: FlightInfo }
  | { status: 'missing' }
  | { status: 'error' };

/** Fetches flight info for a code; optionally polls while airborne (dialog use). */
function useFlightInfo(code: string | null, poll: boolean): FlightFetch {
  const [state, setState] = useState<FlightFetch>({ status: 'loading' });

  useEffect(() => {
    if (!code) return;
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const info = await fetchFlightInfo(code, controller.signal);
        if (!active) return;
        setState(info ? { status: 'ready', info } : { status: 'missing' });
        return info;
      } catch {
        if (active) setState({ status: 'error' });
        return null;
      }
    };

    setState({ status: 'loading' });
    let timer: ReturnType<typeof setInterval> | null = null;
    void load().then((info) => {
      if (active && poll && info?.airborne) {
        timer = setInterval(() => void load(), DIALOG_POLL_MS);
      }
    });

    return () => {
      active = false;
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [code, poll]);

  return state;
}

function statusLabel(info: FlightInfo): string {
  const route = [info.depIata, info.arrIata].filter(Boolean).join(' → ');
  if (info.airborne) {
    const alt =
      info.alt != null ? `${Math.round(info.alt).toLocaleString()} m` : '';
    return [route, info.status ?? 'En route', alt].filter(Boolean).join(' · ');
  }
  const when = info.depTime ? `departs ${info.depTime}` : (info.status ?? '');
  return [info.status ?? 'Scheduled', route, when].filter(Boolean).join(' · ');
}

function CodeHeading({ code }: { code: string }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <span aria-hidden>✈</span>
      {code}
    </span>
  );
}

function FlightBody({
  fetch,
  variant,
  width,
  height,
}: {
  fetch: FlightFetch;
  variant: 'flat' | 'globe';
  width: number;
  height: number;
}): JSX.Element {
  if (fetch.status === 'loading') {
    return <p className="text-sm text-muted-foreground">Locating flight…</p>;
  }
  if (fetch.status === 'missing') {
    return (
      <p className="text-sm text-muted-foreground">
        No live data for this flight right now.
      </p>
    );
  }
  if (fetch.status === 'error') {
    return (
      <p className="text-sm text-destructive">Couldn’t load flight tracking.</p>
    );
  }
  const info = fetch.info;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{statusLabel(info)}</p>
      <div className="overflow-hidden rounded-md border border-border/50">
        <Suspense
          fallback={<div style={{ width, height }} className="bg-muted/30" />}
        >
          <FlightGlobe
            variant={variant}
            width={width}
            height={height}
            position={
              info.lat != null && info.lng != null
                ? { lat: info.lat, lng: info.lng }
                : null
            }
            heading={info.dir}
          />
        </Suspense>
      </div>
    </div>
  );
}

function HoverCard({
  hover,
  onEnter,
  onLeave,
  onOpen,
}: {
  hover: HoverState;
  onEnter: () => void;
  onLeave: () => void;
  onOpen: (code: string) => void;
}): JSX.Element {
  const fetch = useFlightInfo(hover.code, false);
  const width = 300;
  const left = Math.max(
    8,
    Math.min(hover.rect.left, window.innerWidth - width - 8),
  );
  const top = hover.rect.bottom + 8;

  return (
    <div
      className="fixed z-50 w-[300px] cursor-pointer rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
      style={{ left, top }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => {
        onOpen(hover.code);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(hover.code);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex items-center justify-between">
        <CodeHeading code={hover.code} />
        <span className="text-[11px] text-muted-foreground">
          Click to expand
        </span>
      </div>
      <FlightBody fetch={fetch} variant="flat" width={276} height={150} />
    </div>
  );
}

function FlightDialog({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}): JSX.Element {
  const fetch = useFlightInfo(code, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Flight ${code}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg">
            <CodeHeading code={code} />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <FlightBody fetch={fetch} variant="globe" width={440} height={440} />
      </div>
    </div>
  );
}

/**
 * Wires flight-code hover/click to the UI. Returns a stable `handlersRef` to hand
 * to the `FlightCode` extension, and the `overlay` element to render alongside
 * the editor. Encapsulates all hover-timing + fetch + dialog state.
 */
export function useFlightCode(): {
  handlersRef: FlightCodeHandlersRef;
  overlay: JSX.Element;
} {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [dialogCode, setDialogCode] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => {
      setHover(null);
    }, HOVER_HIDE_DELAY_MS);
  }, [cancelHide]);

  const handlersRef = useRef<FlightCodeHandlers>({
    onHover: () => {},
    onHoverEnd: () => {},
    onOpen: () => {},
  });
  handlersRef.current = {
    onHover: (code, rect) => {
      cancelHide();
      setHover({ code, rect });
    },
    onHoverEnd: scheduleHide,
    onOpen: (code) => {
      cancelHide();
      setHover(null);
      setDialogCode(code);
    },
  };

  const overlay = (
    <>
      {hover ? (
        <HoverCard
          hover={hover}
          onEnter={cancelHide}
          onLeave={scheduleHide}
          onOpen={(code) => {
            cancelHide();
            setHover(null);
            setDialogCode(code);
          }}
        />
      ) : null}
      {dialogCode ? (
        <FlightDialog
          code={dialogCode}
          onClose={() => {
            setDialogCode(null);
          }}
        />
      ) : null}
    </>
  );

  return { handlersRef, overlay };
}
