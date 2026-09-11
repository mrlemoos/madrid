import type { Folder, Note, UserPreferences } from '@getmadrid/database-types';
import { hrefForNote } from '@getmadrid/internal-note-link';

/**
 * Invented vault used only by the `/hero-stage` recording surface.
 *
 * Nothing here touches Supabase or Clerk: the marketing hero is filmed against
 * fabricated notes so no real vault, note title, or account detail is ever in
 * frame. Ids are fixed so a re-recording produces the same graph layout.
 */

const USER_ID = 'hero-stage';
const AT = '2026-04-12T09:00:00.000Z';

/** `parseNoteLinkPath` only matches well-formed UUIDs, so the fakes keep that shape. */
function demoId(n: number): string {
  const tail = String(n).padStart(2, '0');
  return `5ca1ab1e-0000-4000-8000-0000000000${tail}`;
}

export const NOTE_IDS = {
  commonplace: demoId(1),
  montaigne: demoId(2),
  marginalia: demoId(3),
  essayForm: demoId(4),
  attention: demoId(5),
  walking: demoId(6),
  readingList: demoId(7),
  letters: demoId(8),
} as const;

const FOLDER_IDS = {
  reading: demoId(20),
  notebook: demoId(21),
} as const;

type Inline = { type: 'text'; text: string; marks?: unknown[] };

function text(value: string): Inline {
  return { type: 'text', text: value };
}

/** A text node carrying the same link mark the `@` flow writes. */
function noteLink(label: string, noteId: string): Inline {
  return {
    type: 'text',
    text: label,
    marks: [{ type: 'link', attrs: { href: hrefForNote(noteId) } }],
  };
}

function paragraph(...inline: Inline[]): unknown {
  return { type: 'paragraph', content: inline };
}

function doc(...blocks: unknown[]): unknown {
  return { type: 'doc', content: blocks };
}

function note(
  id: string,
  title: string,
  folderId: string | null,
  content: unknown,
): Note {
  return {
    id,
    user_id: USER_ID,
    title,
    content: content as Note['content'],
    created_at: AT,
    updated_at: AT,
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: folderId,
    share_token: null,
  };
}

export const DEMO_FOLDERS: Folder[] = [
  {
    id: FOLDER_IDS.reading,
    user_id: USER_ID,
    name: 'Reading',
    parent_id: null,
    tint: 'amber',
    created_at: AT,
    updated_at: AT,
  },
  {
    id: FOLDER_IDS.notebook,
    user_id: USER_ID,
    name: 'Notebook',
    parent_id: null,
    tint: 'sage',
    created_at: AT,
    updated_at: AT,
  },
];

/**
 * The note the camera writes into. It opens with the title set and the body
 * empty so the recorder can type the whole paragraph on film.
 */
export const OPEN_NOTE_TITLE = 'On keeping a commonplace book';

export const DEMO_NOTES: Note[] = [
  note(
    NOTE_IDS.commonplace,
    OPEN_NOTE_TITLE,
    FOLDER_IDS.reading,
    doc(paragraph(text(''))),
  ),
  note(
    NOTE_IDS.montaigne,
    'Montaigne',
    FOLDER_IDS.reading,
    doc(
      paragraph(
        text('He read with a pen, and the '),
        noteLink('marginalia', NOTE_IDS.marginalia),
        text(' became the book.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.marginalia,
    'Marginalia',
    FOLDER_IDS.reading,
    doc(
      paragraph(
        text('Arguing in the margin is still reading. See '),
        noteLink('Montaigne', NOTE_IDS.montaigne),
        text('.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.essayForm,
    'The essay as a form',
    FOLDER_IDS.reading,
    doc(
      paragraph(
        text('An attempt, not a verdict. '),
        noteLink('Montaigne', NOTE_IDS.montaigne),
        text(' called them trials, and kept a '),
        noteLink('commonplace book', NOTE_IDS.commonplace),
        text(' alongside.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.attention,
    'Notes on attention',
    FOLDER_IDS.notebook,
    doc(
      paragraph(
        text('What you return to is what you are thinking about. '),
        noteLink('Walking as thinking', NOTE_IDS.walking),
        text(' says the same thing more slowly.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.walking,
    'Walking as thinking',
    FOLDER_IDS.notebook,
    doc(
      paragraph(
        text('An hour out is an hour of '),
        noteLink('attention', NOTE_IDS.attention),
        text(' you did not have to defend.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.letters,
    'Letters, unsent',
    FOLDER_IDS.notebook,
    doc(
      paragraph(
        text('Written to no one, which is why they are honest. Filed under '),
        noteLink('attention', NOTE_IDS.attention),
        text('.'),
      ),
    ),
  ),
  note(
    NOTE_IDS.readingList,
    'Reading list, spring',
    null,
    doc(
      paragraph(
        noteLink('The essay as a form', NOTE_IDS.essayForm),
        text(', then '),
        noteLink('Montaigne', NOTE_IDS.montaigne),
        text(' again, slowly.'),
      ),
    ),
  ),
];

/** Candidates offered by the `@` menu, in the order the recorder expects. */
export const MENTION_CANDIDATES: Note[] = DEMO_NOTES.filter(
  (n) => n.id !== NOTE_IDS.commonplace,
);

export const DEMO_PREFERENCES: UserPreferences = {
  user_id: USER_ID,
  display_name: null,
  locale: 'en-GB',
  welcome_seeded: true,
  onboarding_version: 1,
  delete_empty_folders: false,
  emoji_replacer_enabled: false,
  open_todays_note_shortcut: true,
  semantic_search_enabled: false,
  show_note_backlinks: true,
  show_writing_activity_graph: false,
  writing_activity_color: 'amber',
  writing_activity_days: [],
  updated_at: AT,
};
