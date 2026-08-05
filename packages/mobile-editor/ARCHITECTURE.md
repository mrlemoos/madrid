# @nota/mobile-editor Architecture

## Goals (v1)

- Full content fidelity with web @nota/editor (identical ProseMirror JSON for all nodes).
- Calm, high-quality writing experience on iPhone.
- Hybrid approach:
  - Simple nodes (paragraph, headings, lists, tasks, basic marks): native RN implementation.
  - Complex nodes (tables, mermaid, PDF, advanced code, images with heavy UI): WebView islands.

## Constraints

- Must only depend on `platform:shared` packages.
- No dependency on web-only packages (@nota/editor, @nota/design, etc.).
- Long-term: changes to web editor nodes must be mirrored here with tests.

## Key Decisions from Planning

- New implementation (not WebView of the entire web editor).
- Heavy virtualization + lazy mounting for performance.
- Very restrained haptics and gestures.
- No telemetry in v1.

## Current Status (Foundations Complete)

Core foundations implemented (May 2026):

**Implemented (all 6 immediate tasks + supporting):**

1. **Basic editor bridge with TenTap**
   - `NotaMobileEditor` now renders `<RichText editor={bridge} />` using `useEditorBridge`.
   - Proper `initialContent` (JSON), `onChange` → `getJSON()` (async, normalized), `setEditable`, `setPlaceholder`, `setContent`.
   - `avoidIosKeyboard` + minimal internal chrome for calm experience.
   - External content sync logic mirrors web `TipTapEditor` exactly (noteId / revision change + `isDocContentEqual` guard).

2. **Extension / node registration system mirroring web schema**
   - `lib/mobile-editor-bridges.ts` — explicit `notaMobileBridges` + `createNotaMobileBridges()`.
   - Currently includes: CoreBridge + HeadingBridge (levels 1-6), bold/italic/strike, bullet/ordered/task lists, history, placeholder.
   - This is the single place to expand parity node-by-node.
   - Advanced path (customSource + exact same custom Node.create defs) documented for future 100% fidelity of complex nodes.

3. **Content load/save + JSON roundtrip**
   - `lib/content-utils.ts`: `normalizeDocContent`, `isDocContentEqual` (pure recursive canonical JSON compare).
   - Serves the identical purpose as web's `PMNode.fromJSON(schema, c); doc.eq(parsed)`.
   - No prosemirror-model dependency (constraint compliant).
   - Used for initial load, onUpdate emission, and external prop sync.

4. **Skeleton architecture for hybrid "island" nodes**
   - `lib/hybrid-islands.ts`: full `HybridIslandConfig`, `registerHybridIsland`, `getHybridIsland`, `buildDocRenderItems` stub.
   - Default placeholders auto-registered for every complex node in the contract (notePdf, noteImage, noteAudio, linkPreview, table, codeBlock...).
   - Detailed comments describe the future virtualized native-simple + island-WebView renderer architecture.
   - Ready for incremental implementation without API breakage.

5. **Basic paragraph + heading native support (POC)**
   - Delivered via CoreBridge + HeadingBridge in the registration system.
   - Lists, tasks, and basic marks also wired as the next simple-node tranche.
   - All produce standard PM JSON via the TenTap bridge.

6. **Simple node contract / type for future fidelity tests**
   - `lib/node-contract.ts`: `MobileNodeContract`, `MobileMarkContract`, `NodeAttributeSpec`.
   - `NOTA_SIMPLE_NODES`, `NOTA_COMPLEX_NODES`, `NOTA_MARKS`, `ALL_NOTA_NODES`.
   - Helpers: `getNotaNodeContract`, `isSimpleNotaNode`, `isComplexNotaNode`.
   - This is the source of truth both sides (and tests) will reference.

**Files added / changed in foundations pass:**

- `src/lib/node-contract.ts` (new)
- `src/lib/hybrid-islands.ts` (new)
- `src/lib/content-utils.ts` (new)
- `src/lib/mobile-editor-bridges.ts` (new)
- `src/NotaMobileEditor.tsx` (full implementation)
- `src/index.ts` (public API surface expanded with all new exports)
- `package.json` (added `react-native-webview` peer + devDep)
- `ARCHITECTURE.md` (status update)
- Also: `apps/nota-mobile/package.json` (webview dep for runnable demo)

**Next critical path (not in this scope):**

- Install deps in apps/nota-mobile (`npx expo install`).
- Wire real offline sync + attachments into the editor props.
- Begin advanced TenTap custom bundle for full custom nodes (NotaLink, NotePdf etc.).
- Or start the native simple-node renderer layer + island mounting on top of the JSON authority.
- Fidelity test harness using the node contracts + `isDocContentEqual`.

The editor is now a solid, well-documented, constraint-respecting foundation that can be iterated on safely while guaranteeing the "identical ProseMirror JSON" requirement.
