// TODO(modularize): de-dupe with /app-navigation-core/todays-note `dailyNoteDisplayTitle`
// once the todays-note / journal date cluster is extracted into a shared package. Kept as a
// local copy here so `study-note-title` stays a pure `platform:shared` module instead of
// reaching upward into the app.

/** Title for a daily note: local calendar date, e.g. "4 March 2026". */
export function dailyNoteDisplayTitle(at: Date): string {
  return at.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
