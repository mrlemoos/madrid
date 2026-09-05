export {};

declare global {
  interface Window {
    /** Present when running inside the Madrid Electron shell (preload). */
    nota?: {
      subscribeMenubarActions(cb: (payload: unknown) => void): () => void;
      subscribeUpdateStatus(cb: (payload: unknown) => void): () => void;
      checkForUpdates(): Promise<{
        ok: boolean;
        reason?: 'development' | 'not-initialised' | 'check-failed';
      }>;
      quitAndInstall(): Promise<boolean>;
      /** macOS only: show/hide the native traffic-light buttons (no-op elsewhere). */
      setWindowButtonVisibility?(visible: boolean): Promise<void>;
    };
  }
}
