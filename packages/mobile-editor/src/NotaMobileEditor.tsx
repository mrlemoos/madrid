import { useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  RichText,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';

import type { MobileEditorProps } from './index';
import {
  createNotaMobileBridges,
  type BridgeExtension,
} from './lib/mobile-editor-bridges';
import {
  normalizeDocContent,
  isDocContentEqual,
  type PMJSONDoc,
} from './lib/content-utils';
import type { HybridIslandConfig } from './lib/hybrid-islands';

// Re-export useful pieces so hosts can extend without deep imports
export type { EditorBridge, BridgeExtension, HybridIslandConfig, PMJSONDoc };

/**
 * NotaMobileEditor
 *
 * The core rich text editing surface for the Nota iPhone app.
 *
 * Foundations (this implementation):
 * - TenTap (useEditorBridge + RichText) as the editing engine and WebView bridge.
 * - Explicit bridge registration (mobile-editor-bridges.ts) — the beginning of
 *   a schema mirroring system for the web @nota/editor.
 * - Proper JSON roundtrips using normalize + isDocContentEqual (pure, no web deps).
 * - External content sync (note switches, offline merges, revisions) using the
 *   same pattern as the web TipTapEditor (isDocContentEqual guard before setContent).
 * - Skeleton for the hybrid island model (see hybrid-islands.ts + ARCHITECTURE.md).
 * - Proof-of-concept native-path support for paragraph + headings (and lists/tasks)
 *   via the chosen TenTap bridges.
 *
 * Fidelity guarantee:
 * - When the exact same set of extensions is active on both sides, TenTap's
 *   getJSON() produces standard ProseMirror JSON that is structurally identical
 *   to web editor.getJSON().
 * - The registration system + contracts exist precisely so we can add nodes
 *   one-by-one while keeping that invariant.
 *
 * Calm experience notes (already reflected):
 * - No default heavy toolbar shipped inside the component (hosts compose a minimal
 *   keyboard accessory view using the exposed EditorBridge commands).
 * - avoidIosKeyboard enabled.
 * - Future: heavy virtualization only for the hybrid renderer phase.
 *
 * Complex nodes today:
 * - Rendered inside the TenTap WebView (temporary, full fidelity via future
 *   advanced custom bundle).
 * - The island registration system is already populated with placeholders so
 *   the hybrid architecture can be built against a real API immediately.
 */
export function NotaMobileEditor({
  content,
  onUpdate,
  noteId,
  editorBodyCss,
  placeholder = 'Start writing...',
  editable = true,
  style,
  bridgeExtensions: extraBridges,
}: MobileEditorProps & {
  placeholder?: string;
  editable?: boolean;
  style?: ViewStyle;
  /**
   * Optional extra bridges to append (advanced use only).
   * Prefer extending via the registration system in lib/mobile-editor-bridges.
   */
  bridgeExtensions?: BridgeExtension[];
}) {
  const prevNoteIdRef = useRef<string | undefined>(undefined);
  const prevContentSigRef = useRef<string | undefined>(undefined);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Compose the full set of bridges for this editor instance.
  // The core list is the "mirrors web schema" registration point.
  // (Computed once per render; stable for the lifetime of the component instance.)
  const bridges: BridgeExtension[] = extraBridges?.length
    ? [...createNotaMobileBridges(), ...extraBridges]
    : createNotaMobileBridges();

  // The bridge is the primary editor API surface (commands, getJSON, setContent, etc.)
  const editor = useEditorBridge({
    bridgeExtensions: bridges,
    initialContent: normalizeDocContent(content),
    autofocus: false,
    avoidIosKeyboard: true,
    editable,
    onChange: () => {
      // TenTap recommends not shipping the content on every keystroke to
      // reduce bridge traffic. We still want immediate sync for notes-offline.
      // In a follow-up we can add light debouncing here if needed.
      void editor.getJSON().then((json: unknown) => {
        // Always emit the normalized doc shape
        const normalized = normalizeDocContent(json);
        onUpdateRef.current(normalized);
      });
    },
  });

  // Keep editable in sync (rarely changes)
  useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);

  // Runtime placeholder updates (matches web editor)
  useEffect(() => {
    if (placeholder) {
      editor.setPlaceholder(placeholder);
    }
  }, [editor, placeholder]);

  useEffect(() => {
    if (!editorBodyCss) {
      return;
    }
    editor.injectCSS(editorBodyCss, 'nota-note-body');
  }, [editor, editorBodyCss]);

  // External content sync — mirrors the logic in packages/editor TipTapEditor exactly
  // (isDocContentEqual guard + setContent only on real change or note switch).
  useEffect(() => {
    const normalized = normalizeDocContent(content);
    const contentSig = JSON.stringify(normalized); // cheap signature for quick guard

    const noteChanged = noteId !== prevNoteIdRef.current;
    const revisionChanged = contentSig !== prevContentSigRef.current;

    if (noteChanged || revisionChanged) {
      prevNoteIdRef.current = noteId;
      prevContentSigRef.current = contentSig;

      // Only push if structurally different (prevents cursor jump / unnecessary work)
      void editor.getJSON().then((currentJson: unknown) => {
        if (!isDocContentEqual(currentJson, normalized)) {
          editor.setContent(normalized);
        }
      });
    }
  }, [editor, content, noteId]);

  // The hybrid island registry is already live (defaults registered on import of hybrid-islands).
  // Future code extends via registerHybridIsland({ nodeName: '...', ... }).

  return (
    <View style={[styles.container, style]}>
      <RichText
        editor={editor}
        // Calm, minimal styling — theme tokens will come from a future
        // platform-neutral design package (never @nota/design).
        style={styles.richText}
        containerStyle={styles.richTextContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
  },
  richTextContainer: {
    flex: 1,
  },
  richText: {
    // Matches the calm, high-quality writing experience goal.
    // No heavy chrome. Selection / caret provided by TenTap.
  },
});

/**
 * NOTE on creating bridges outside the component:
 * Because useEditorBridge is a React hook, hosts that need a standalone bridge
 * (e.g. for a custom toolbar living in a sibling component) should call
 * useEditorBridge themselves inside their own component, passing
 * createNotaMobileBridges() (or a concatenation) as the bridgeExtensions array.
 *
 * Example in a toolbar component:
 *   const editor = useEditorBridge({ bridgeExtensions: createNotaMobileBridges() });
 *   // then <Touchable onPress={() => editor.toggleHeading(1)} />
 *
 * This pattern keeps everything using the single registration system.
 */
