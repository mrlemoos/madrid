'use client';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@getmadrid/design/button';
import { createTranslator, type LocalePreference } from '@getmadrid/i18n';

type Props = {
  children: ReactNode;
  locale?: LocalePreference;
};

type State = { error: Error | null };

function ErrorBoundaryFallback({
  error,
  locale,
  onRetry,
}: {
  error: Error;
  locale?: LocalePreference;
  onRetry: () => void;
}) {
  const { t } = createTranslator(locale ?? null);
  return (
    <div className="flex h-dvh min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-background px-6 text-center text-sm text-foreground">
      <p className="max-w-sm text-muted-foreground">
        {t(
          'Something went wrong loading Madrid. You can try again or reload the app.',
        )}
      </p>
      <pre className="max-h-40 max-w-full overflow-auto rounded-md border border-border bg-muted/30 p-3 text-left font-mono text-xs text-foreground">
        {error.message}
      </pre>
      <Button type="button" variant="outline" onClick={onRetry}>
        {t('Try again')}
      </Button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          locale={this.props.locale}
          onRetry={() => {
            this.setState({ error: null });
          }}
        />
      );
    }
    return this.props.children;
  }
}
