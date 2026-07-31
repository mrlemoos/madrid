// world-atlas ships TopoJSON data files without types. We cast the topology at
// the use site, so an opaque default export is enough.
declare module 'world-atlas/countries-110m.json' {
  const topology: unknown;
  export default topology;
}
