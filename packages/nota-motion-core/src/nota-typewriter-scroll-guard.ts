/**
 * Suppresses typewriter-style caret alignment after the user manually scrolls
 * the note scroll root, until they interact with the editor again. Ignores
 * scroll events caused by programmatic scrollTo/scrollTop from the aligner.
 */
export function createTypewriterScrollUserGuard() {
  let userOverrodeScroll = false;
  let suppressNextScrollRootEvent = false;

  return {
    reset() {
      userOverrodeScroll = false;
      suppressNextScrollRootEvent = false;
    },

    onScrollRootScroll() {
      if (suppressNextScrollRootEvent) {
        suppressNextScrollRootEvent = false;
        return;
      }
      userOverrodeScroll = true;
    },

    beforeProgrammaticScroll() {
      suppressNextScrollRootEvent = true;
    },

    onEditorUserGesture() {
      userOverrodeScroll = false;
    },

    shouldSkipTypewriterAlign() {
      return userOverrodeScroll;
    },
  };
}

export type TypewriterScrollUserGuard = ReturnType<
  typeof createTypewriterScrollUserGuard
>;
