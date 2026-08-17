import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '../..');

describe('Electron package does not embed the Next app', () => {
  it('electron-builder.yml does not copy apps/nota/dist', () => {
    // Arrange
    const yml = fs.readFileSync(
      path.join(APP_ROOT, 'electron-builder.yml'),
      'utf8',
    );

    // Act / Assert — packaged shell loads the hosted SPA; local Next/Vite
    // output must not be bundled.
    expect(yml).not.toMatch(/nota\/dist/);
    expect(yml).not.toMatch(/\.\.\/nota\/dist/);
  });

  it('electron:pack and electron:release do not depend on @nota/nota build', () => {
    // Arrange
    const pkg = JSON.parse(
      fs.readFileSync(path.join(APP_ROOT, 'package.json'), 'utf8'),
    ) as {
      nx: {
        targets: Record<
          string,
          { dependsOn?: Array<{ target?: string; projects?: string }> }
        >;
      };
    };

    // Act
    for (const target of ['electron:pack', 'electron:release'] as const) {
      const dependsOn = pkg.nx.targets[target]?.dependsOn ?? [];
      const notaBuildDeps = dependsOn.filter(
        (dep) =>
          dep.target === 'build' &&
          (dep.projects === 'nota' || dep.projects === '@nota/nota'),
      );

      // Assert
      expect(notaBuildDeps, target).toEqual([]);
    }
  });

  it('release-electron workflow does not inject NEXT_PUBLIC_* for a Next build', () => {
    // Arrange
    const yml = fs.readFileSync(
      path.join(REPO_ROOT, '.github/workflows/release-electron.yml'),
      'utf8',
    );

    // Act / Assert — no client env needed once the web app is not built here.
    expect(yml).not.toMatch(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:/);
    expect(yml).not.toMatch(/Verify Next client env/);
  });

  it('release-electron workflow pre-creates the GitHub release and avoids gh release edit', () => {
    // Arrange
    const yml = fs.readFileSync(
      path.join(REPO_ROOT, '.github/workflows/release-electron.yml'),
      'utf8',
    );

    // Act
    const usesNotesScript = yml.includes('tools/github-release-notes.mjs');
    const usesReleaseEdit = /gh release edit/.test(yml);

    // Assert — `gh release edit` PATCHes tag_name; GitHub 422s when a
    // duplicate release already owns that tag (electron-builder race).
    expect(usesNotesScript).toBe(true);
    expect(usesReleaseEdit).toBe(false);
    expect(yml).toMatch(/github-release-notes\.mjs ensure/);
    expect(yml).toMatch(/github-release-notes\.mjs notes/);
  });
});
