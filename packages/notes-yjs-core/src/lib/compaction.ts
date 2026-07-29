/**
 * Compact the update log into a single snapshot once it grows past this many
 * rows. Keeps re-opens and late joiners from replaying the whole edit history.
 *
 * ponytail: naive fixed row-count threshold. It ignores per-update byte size,
 * so a note with many tiny updates compacts at the same point as one with few
 * large pastes. Upgrade to a byte-size budget only if telemetry shows the row
 * count is the wrong signal.
 */
export const DEFAULT_COMPACTION_THRESHOLD = 200;

/**
 * @param updateCount number of live (un-snapshotted) update rows for the note
 * @param threshold   row count at which to fold; defaults to {@link DEFAULT_COMPACTION_THRESHOLD}
 */
export function shouldCompact(
  updateCount: number,
  threshold: number = DEFAULT_COMPACTION_THRESHOLD,
): boolean {
  return updateCount > threshold;
}
