import { useMemo, type JSX } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Icon } from '@getmadrid/design/icon';
import { buttonVariants } from '@getmadrid/design/button';
import { NOTA_POPUP_MOTION_CLASS } from '@getmadrid/design/popup-motion';
import { cn } from '@/lib/utils';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import { type Theme, useTheme } from '@getmadrid/design/theme';

const itemClass = cn(
  'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
);

export function ThemeMenu(): JSX.Element {
  const { theme, setTheme } = useTheme();
  const { t } = useNotaTranslator();
  const themeLabel = useMemo(
    (): Record<Theme, string> => ({
      light: t('Light'),
      dark: t('Dark'),
      system: t('System'),
    }),
    [t],
  );

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        type="button"
        aria-label={t('Theme')}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'default' }),
          'min-w-30 justify-between gap-2 px-2.5 font-normal',
        )}
      >
        <span className="truncate">{themeLabel[theme]}</span>
        <Icon
          name="arrow-narrow-down"
          size={14}
          className="shrink-0 text-muted-foreground"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup
            className={cn(
              'z-50 min-w-(--anchor-width) overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md',
              NOTA_POPUP_MOTION_CLASS,
            )}
          >
            <Menu.Viewport>
              <Menu.RadioGroup
                value={theme}
                onValueChange={(value: string) => {
                  if (
                    value === 'light' ||
                    value === 'dark' ||
                    value === 'system'
                  ) {
                    setTheme(value);
                  }
                }}
              >
                <Menu.RadioItem
                  value="light"
                  closeOnClick
                  className={itemClass}
                >
                  <Icon
                    name="bulb"
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">{t('Light')}</span>
                  <Menu.RadioItemIndicator className="flex size-4 shrink-0 items-center justify-center">
                    <Icon name="simple-checked" size={14} />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
                <Menu.RadioItem value="dark" closeOnClick className={itemClass}>
                  <Icon
                    name="moon"
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">{t('Dark')}</span>
                  <Menu.RadioItemIndicator className="flex size-4 shrink-0 items-center justify-center">
                    <Icon name="simple-checked" size={14} />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
                <Menu.RadioItem
                  value="system"
                  closeOnClick
                  className={itemClass}
                >
                  <Icon
                    name="cpu"
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">{t('System')}</span>
                  <Menu.RadioItemIndicator className="flex size-4 shrink-0 items-center justify-center">
                    <Icon name="simple-checked" size={14} />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Viewport>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
