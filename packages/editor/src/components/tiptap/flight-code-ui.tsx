import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  HoverCard,
  HoverCardPortal,
  HoverCardPositioner,
  HoverCardPopup,
} from '@getmadrid/design/hover-card';
// FlightGlobe is a light wrapper that lazy-loads its own d3-geo + atlas chunk,
// so a static import here doesn't pull that weight into the editor's chunk.
import { FlightGlobe } from '@getmadrid/design/flight-globe';
import { fetchFlightInfo, type FlightInfo } from '../../lib/flight-client';
import type {
  FlightCodeHandlers,
  FlightCodeHandlersRef,
} from './flight-code-extension';

const HOVER_HIDE_DELAY_MS = 160;
const DIALOG_POLL_MS = 20_000;

type HoverState = { code: string; anchor: HTMLElement };

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
        if (!active) return null;
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

interface CodeHeadingProps {
  code: string;
}

function CodeHeading({ code }: CodeHeadingProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold">
      <span aria-hidden>✈</span>
      {code}
    </span>
  );
}

interface FlightBodyProps {
  fetch: FlightFetch;
  variant: 'flat' | 'globe';
  width: number;
  height: number;
}

function FlightBody({
  fetch,
  variant,
  width,
  height,
}: FlightBodyProps): JSX.Element {
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
      </div>
    </div>
  );
}

interface HoverCardProps {
  hover: HoverState;
  onCardEnter: () => void;
  onCardLeave: () => void;
  onDismiss: () => void;
  onOpen: (code: string) => void;
}

function FlightHoverCard({
  hover,
  onCardEnter,
  onCardLeave,
  onDismiss,
  onOpen,
}: HoverCardProps): JSX.Element {
  const fetch = useFlightInfo(hover.code, false);

  return (
    <HoverCard
      open
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <HoverCardPortal>
        <HoverCardPositioner
          anchor={hover.anchor}
          side="bottom"
          align="start"
          sideOffset={8}
        >
          <HoverCardPopup
            className="w-[300px] cursor-pointer p-3"
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
            onClick={() => {
              onOpen(hover.code);
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <CodeHeading code={hover.code} />
              <span className="text-[11px] text-muted-foreground">
                Click to expand
              </span>
            </div>
            <FlightBody fetch={fetch} variant="flat" width={276} height={150} />
          </HoverCardPopup>
        </HoverCardPositioner>
      </HoverCardPortal>
    </HoverCard>
  );
}

interface FlightDialogProps {
  code: string;
  onClose: () => void;
}

function FlightDialog({ code, onClose }: FlightDialogProps): JSX.Element {
  const fetch = useFlightInfo(code, true);

  return (
    <Dialog.Root
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[60] w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl outline-none">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-lg">
              <CodeHeading code={code} />
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              ✕
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Live flight tracking for {code}
          </Dialog.Description>
          <FlightBody fetch={fetch} variant="globe" width={440} height={440} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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

  const openDialog = useCallback(
    (code: string) => {
      cancelHide();
      setHover(null);
      setDialogCode(code);
    },
    [cancelHide],
  );

  const handlersRef = useRef<FlightCodeHandlers | null>(null);
  handlersRef.current = {
    onHover: (code, anchor) => {
      cancelHide();
      setHover({ code, anchor });
    },
    onHoverEnd: scheduleHide,
    onOpen: openDialog,
  };

  const overlay = (
    <>
      {hover ? (
        <FlightHoverCard
          hover={hover}
          onCardEnter={cancelHide}
          onCardLeave={scheduleHide}
          onDismiss={() => {
            setHover(null);
          }}
          onOpen={openDialog}
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
