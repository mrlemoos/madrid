export {
  NOTA_YDOC_FIELD,
  type ProseMirrorJSON,
  type YjsUpdate,
} from './lib/types';
export {
  seedYDocFromContent,
  foldUpdatesToDoc,
  yDocToContent,
  encodeDocAsSnapshot,
} from './lib/yjs-doc';
export { DEFAULT_COMPACTION_THRESHOLD, shouldCompact } from './lib/compaction';
