/**
 * @nota/mobile-editor
 *
 * React Native editor implementation for Nota iPhone app.
 * Must produce identical ProseMirror JSON to the web @nota/editor
 * for full content fidelity.
 *
 * Architecture (per v1 plan):
 * - Core nodes: native RN implementation where possible (via TenTap bridges today)
 * - Complex nodes (tables, mermaid, pdf, advanced code, images): hybrid WebView islands
 * - Only depends on platform:shared packages + RN/TenTap glue.
 * - No @nota/editor, @nota/design, or other web-only packages.
 */

// Public editor interface
export interface MobileEditorProps {
  content: unknown;
  onUpdate: (content: unknown) => void;
  noteId: string;
  userId: string;
  /** Injected into the TenTap WebView (note body typography). */
  editorBodyCss?: string;
  // Future: attachments, mention candidates, storage ops, navigation callbacks, etc.
}

// Main component
export { NotaMobileEditor } from './NotaMobileEditor';

// Re-export the bridge + extension system (the "registration" surface)
export {
  createNotaMobileBridges,
  notaMobileBridges,
  type BridgeExtension,
} from './lib/mobile-editor-bridges';

// Content roundtrip + equality (Node.fromJSON + doc.eq equivalent, pure JS)
export {
  normalizeDocContent,
  isDocContentEqual,
  getTopLevelNodeTypes,
  isSimpleOnlyDoc,
  type PMJSONDoc,
  type PMJSONNode,
} from './lib/content-utils';

// Node contract (for fidelity tests + hybrid dispatch)
export {
  type MobileNodeContract,
  type MobileMarkContract,
  type NodeAttributeSpec,
  NOTA_SIMPLE_NODES,
  NOTA_COMPLEX_NODES,
  NOTA_MARKS,
  ALL_NOTA_NODES,
  getNotaNodeContract,
  isSimpleNotaNode,
  isComplexNotaNode,
} from './lib/node-contract';

// Hybrid island skeleton architecture
export {
  registerHybridIsland,
  getHybridIsland,
  getAllRegisteredIslands,
  buildDocRenderItems,
  type HybridIslandConfig,
  type DocRenderItem,
} from './lib/hybrid-islands';

// Re-export shared types that mobile editor must understand (re-export from the workspace package)
export type { Note, NoteAttachment } from '@nota/database-types';

// Also re-export EditorBridge type for hosts building toolbars/commands
export type { EditorBridge } from '@10play/tentap-editor';
