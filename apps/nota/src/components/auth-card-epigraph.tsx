import type { JSX } from 'react';
import { NotaLogo } from '@/components/nota-logo';
import { NotaCardDescription } from '@nota/design/card';

const serif = { fontFamily: '"Instrument Serif", serif' } as const;

export function AuthCardEpigraph(): JSX.Element {
  return (
    <>
      <div className="mb-3 flex justify-center">
        <NotaLogo className="size-14" />
      </div>
      <h1
        className="text-balance text-2xl font-normal leading-tight text-foreground sm:text-[1.65rem]"
        style={serif}
      >
        Think clearly. Write slowly.
      </h1>
      <NotaCardDescription className="mt-2 text-pretty">
        A quiet space for your thoughts, away from the noise.
      </NotaCardDescription>
    </>
  );
}
