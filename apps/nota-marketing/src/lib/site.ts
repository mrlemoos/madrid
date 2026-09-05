/** Monorepo root on GitHub. Mirrors [package.json](../../../../package.json) `repository`. */
export const NOTA_GITHUB_REPO = 'https://github.com/mrlemoos/madrid';

/** Desktop builds and release assets (Electron). */
export const NOTA_GITHUB_RELEASES = `${NOTA_GITHUB_REPO}/releases`;
export const NOTA_GITHUB_LATEST = `${NOTA_GITHUB_REPO}/releases/latest`;

/** Own-domain download entry point. Redirect lives in [vercel.json](../../vercel.json). */
export const NOTA_DOWNLOAD_PATH = '/download';

/** Hosted vault; the quiet alternative for people who are not on a Mac yet. */
export const NOTA_APP_URL = 'https://app.getmadrid.app';

export const NOTA_AUTHOR_NAME = 'Leonardo Lemos';
export const NOTA_AUTHOR_URL = 'https://mrlemoos.dev';
