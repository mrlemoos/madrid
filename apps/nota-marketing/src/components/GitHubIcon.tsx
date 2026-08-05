import type { JSX } from 'react';
import { NotaIcon } from '@nota/design/icon';

type GitHubIconProps = {
  className?: string;
};

export function GitHubIcon({
  className = 'size-5',
}: GitHubIconProps): JSX.Element {
  return (
    <span className={className} aria-hidden>
      <NotaIcon name="github" size={20} />
    </span>
  );
}
