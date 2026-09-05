import { useCallback, useRef, useState, type JSX } from 'react';
import { Icon } from '@getmadrid/design/icon';
import { Button } from '@getmadrid/design/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@getmadrid/design/dialog';
import { cn } from '@getmadrid/design/utils';
import {
  NOTE_THEME_LABEL,
  NOTE_THEME_OPTIONS,
  noteEditorFontFromThemeSelectValue,
  noteThemeSelectValue,
  type NoteEditorSettings,
} from '@getmadrid/editor';

type NoteLayoutMenuProps = {
  settings: NoteEditorSettings;
  onSettingsChange: (next: NoteEditorSettings) => void;
  disabled?: boolean;
  bannerAttachmentId?: string | null;
  bannerSignedUrl?: string | null;
  onBannerChange?: (attachmentId: string | null) => void;
  onBannerUpload?: (file: File) => Promise<string>;
};

export function NoteLayoutMenu({
  settings,
  onSettingsChange,
  disabled,
  bannerAttachmentId,
  bannerSignedUrl,
  onBannerChange,
  onBannerUpload,
}: NoteLayoutMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onBannerUpload || !onBannerChange) return;
      // Reset input so the same file can be re-selected
      e.target.value = '';
      setUploading(true);
      try {
        const attachmentId = await onBannerUpload(file);
        onBannerChange(attachmentId);
      } catch (err) {
        console.error('Failed to upload banner:', err);
      } finally {
        setUploading(false);
      }
    },
    [onBannerUpload, onBannerChange],
  );

  const selectClass = cn(
    'mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground',
    'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={disabled}
        aria-label="Note layout"
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Icon name="mouse-pointer-2" size={18} />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-[22%] w-[min(100vw-2rem,18rem)] max-w-none translate-y-0 gap-0 p-3 sm:max-w-none"
      >
        <DialogHeader>
          <DialogTitle>Note layout</DialogTitle>
        </DialogHeader>
        <div className="mt-3 space-y-3">
          <div>
            <label
              htmlFor="nota-note-layout-font"
              className="text-xs font-medium text-muted-foreground"
            >
              {NOTE_THEME_LABEL}
            </label>
            <select
              id="nota-note-layout-font"
              className={selectClass}
              value={noteThemeSelectValue(settings)}
              onChange={(e) => {
                onSettingsChange({
                  ...settings,
                  font: noteEditorFontFromThemeSelectValue(e.target.value),
                });
              }}
            >
              {NOTE_THEME_OPTIONS.map((opt) => (
                <option key={opt.value || 'london'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="nota-note-layout-measure"
              className="text-xs font-medium text-muted-foreground"
            >
              Column width
            </label>
            <select
              id="nota-note-layout-measure"
              className={selectClass}
              value={settings.measure ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onSettingsChange({
                  ...settings,
                  measure:
                    v === ''
                      ? undefined
                      : (v as NonNullable<NoteEditorSettings['measure']>),
                });
              }}
            >
              <option value="">Standard</option>
              <option value="narrow">Narrow</option>
              <option value="wide">Wide</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={settings.showInNoteGraph !== false}
              disabled={disabled}
              onChange={(e) => {
                const visible = e.target.checked;
                onSettingsChange({
                  ...settings,
                  showInNoteGraph: visible ? undefined : false,
                });
              }}
              className="size-3.5 shrink-0 rounded border-input accent-primary"
            />
            <span>Show in note graph</span>
          </label>
          {onBannerChange && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Banner image
              </span>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  void handleBannerFileChange(e);
                }}
              />
              {bannerAttachmentId ? (
                <div className="mt-1 flex items-center gap-2">
                  {bannerSignedUrl && (
                    <img
                      src={bannerSignedUrl}
                      alt="Banner preview"
                      className="h-8 w-14 rounded border border-border object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={disabled}
                    onClick={() => {
                      onBannerChange(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full"
                  disabled={disabled || uploading}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : 'Add banner image'}
                </Button>
              )}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onSettingsChange({});
              onBannerChange?.(null);
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
