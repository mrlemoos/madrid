export { TipTapEditor } from './components/tiptap-editor';
export type {
  TipTapEditorProps,
  AttachmentStorageOps,
  NotePdfDocContextValue,
} from './components/tiptap-editor';

export {
  NoteEditorCommandsProvider,
  useNoteEditorCommands,
} from './context/note-editor-commands';

export {
  NOTE_THEME_LABEL,
  NOTE_THEME_OPTIONS,
  noteThemeSelectValue,
  noteEditorFontFromThemeSelectValue,
  parseNoteEditorSettings,
  noteEditorSettingsToJson,
  filterNotesForNoteGraph,
  isNoteVisibleInNoteGraph,
  noteSurfaceClassNames,
  noteSurfaceFonts,
  noteSurfaceMaxWidthPx,
} from './lib/note-editor-settings';
export type {
  NoteEditorSettings,
  NotaSurfaceFontRole,
  NotaSurfaceMeasure,
} from './lib/note-editor-settings';

export { parseNoteLinkPath, hrefForNote } from '@nota/internal-note-link';
export { persistedDisplayTitle } from './lib/note-title';
export { safeOgImageSrcForPreview } from './lib/og-image-url';
export { findNoteMentionTrigger } from './lib/tiptap-note-mention';

export { NotaCodeBlock } from './components/tiptap/nota-code-block';
export { NotaLink } from './components/tiptap/nota-link';
export { convertLinkOnlyParagraphs } from './components/tiptap/link-preview-scan';
export { findFlightCodes, type FlightCodeMatch } from './lib/flight-code';

export {
  NotePdfThumbnailFrame,
  type NotePdfThumbnailPhase,
} from './components/tiptap/note-pdf-thumbnail-frame';

export {
  insertNoteLinkAtMentionRange,
  insertNoteLinkAtMentionRangeView,
  tryConfirmNoteMention,
} from './tiptap-note-mention-flow';
export type { NoteMentionConfirmRefs } from './tiptap-note-mention-flow';
