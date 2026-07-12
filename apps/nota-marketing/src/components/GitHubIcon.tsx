import type { JSX } from 'react';
import { NotaIcon } from '@nota/web-design/icon';
import { GithubIcon } from '@nota/web-design/icons';

type GitHubIconProps = {
  className?: string;
};

export function GitHubIcon({
  className = 'size-5',
}: GitHubIconProps): JSX.Element {
  return (
    <span className={className} aria-hidden>
      <NotaIcon icon={GithubIcon} size={20} />
    </span>
  );
}
