/**
 * Madrid icon wrapper: drop-in replacement for HugeiconsIcon over itshover animated icons.
 *
 * @remarks
 * Import from the package subpath only: `import { Icon } from '@getmadrid/design/icon'`.
 * Pick an icon by its `name`; the underlying components live under `@getmadrid/design/icons`
 * and are registered in {@link NOTA_ICONS}.
 *
 * @packageDocumentation
 */

import type {
  ForwardRefExoticComponent,
  HTMLAttributes,
  JSX,
  RefAttributes,
} from 'react';

import type { AnimatedIconHandle, AnimatedIconProps } from '../icons/types.js';
import { cn } from '../lib/utils.js';
import {
  AlignCenterIcon,
  AppleBrandLogoIcon,
  ArrowNarrowDownIcon,
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  ArrowNarrowUpIcon,
  BookIcon,
  BrainCircuitIcon,
  BulbIcon,
  ChartBarIcon,
  ClockIcon,
  CpuIcon,
  FileDescriptionIcon,
  FolderIcon,
  GearIcon,
  GithubIcon,
  HistoryCircleIcon,
  HomeIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LinkIcon,
  LogoutIcon,
  MoonIcon,
  MousePointer2Icon,
  PenIcon,
  SimpleCheckedIcon,
  SparklesIcon,
  StackIcon,
  TrashIcon,
  UserPlusIcon,
  Volume2Icon,
} from '../icons/index.js';

/**
 * An itshover animated icon component (forwardRef + hover motion).
 */
export type AnimatedIcon = ForwardRefExoticComponent<
  AnimatedIconProps & RefAttributes<AnimatedIconHandle>
>;

/**
 * Every icon addressable by {@link Icon}'s `name`.
 *
 * @remarks
 * Listed explicitly rather than derived, so each name is greppable and an unknown
 * one is a compile error. Referencing the registry pulls the whole set into the
 * bundle; that is the trade for a serialisable {@link IconName}.
 */
export const NOTA_ICONS = {
  'align-center': AlignCenterIcon,
  'apple-brand-logo': AppleBrandLogoIcon,
  'arrow-narrow-down': ArrowNarrowDownIcon,
  'arrow-narrow-left': ArrowNarrowLeftIcon,
  'arrow-narrow-right': ArrowNarrowRightIcon,
  'arrow-narrow-up': ArrowNarrowUpIcon,
  book: BookIcon,
  'brain-circuit': BrainCircuitIcon,
  bulb: BulbIcon,
  'chart-bar': ChartBarIcon,
  clock: ClockIcon,
  cpu: CpuIcon,
  'file-description': FileDescriptionIcon,
  folder: FolderIcon,
  gear: GearIcon,
  github: GithubIcon,
  'history-circle': HistoryCircleIcon,
  home: HomeIcon,
  layers: LayersIcon,
  'layout-dashboard': LayoutDashboardIcon,
  library: LibraryIcon,
  link: LinkIcon,
  logout: LogoutIcon,
  moon: MoonIcon,
  'mouse-pointer-2': MousePointer2Icon,
  pen: PenIcon,
  'simple-checked': SimpleCheckedIcon,
  sparkles: SparklesIcon,
  stack: StackIcon,
  trash: TrashIcon,
  'user-plus': UserPlusIcon,
  'volume-2': Volume2Icon,
} as const satisfies Record<string, AnimatedIcon>;

/**
 * Name of a registered icon. Serialisable, so command tables and other data can
 * carry an icon without importing a component.
 */
export type IconName = keyof typeof NOTA_ICONS;

/**
 * Props for {@link Icon}.
 */
export type IconProps = HTMLAttributes<HTMLSpanElement> & {
  /** Registered icon name, e.g. `"arrow-narrow-right"` */
  name: IconName;
  /** Pixel size passed to the icon */
  size?: number;
  /** Stroke width passed to the icon */
  strokeWidth?: number;
  /** Icon colour (defaults to currentColor inside the icon) */
  color?: string;
};

/**
 * Renders a registered itshover icon with normalised size, stroke, and class props.
 *
 * @remarks
 * Layout, colour, rotation, and `data-*` attributes apply to the outer span so
 * itshover icons keep their internal motion root unchanged.
 *
 * @example
 * ```tsx
 * import { Icon } from '@getmadrid/design/icon';
 *
 * <Icon name="arrow-narrow-right" size={16} className="text-muted-foreground" />
 * ```
 */
export function Icon({
  name,
  size = 24,
  className,
  color,
  strokeWidth,
  ...rest
}: IconProps): JSX.Element {
  const Glyph = NOTA_ICONS[name];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        className,
      )}
      {...rest}
    >
      <Glyph size={size} color={color} strokeWidth={strokeWidth} />
    </span>
  );
}
