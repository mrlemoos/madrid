export {
  NOTA_YDOC_FIELD,
  type ProseMirrorJSON,
  type YjsUpdate,
} from './lib/types.js';
export {
  seedYDocFromContent,
  foldUpdatesToDoc,
  yDocToContent,
  encodeDocAsSnapshot,
} from './lib/yjs-doc.js';
export {
  DEFAULT_COMPACTION_THRESHOLD,
  shouldCompact,
} from './lib/compaction.js';
