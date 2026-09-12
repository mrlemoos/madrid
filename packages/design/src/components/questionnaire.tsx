/**
 * Multi-step questionnaire primitives from shadcn's Base UI registry.
 *
 * @remarks
 * Import from `@getmadrid/design/questionnaire`.
 */

import * as React from 'react';
import {
  Questionnaire as QuestionnairePrimitive,
  type QuestionnaireItemDefinition,
} from '@shadcn/react/questionnaire';

import { buttonVariants, type ButtonProps } from './button.js';
import { cn } from '../lib/utils.js';

export type { QuestionnaireItemDefinition };

export function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn('flex min-w-0 flex-col gap-5', className)}
      {...props}
    />
  );
}

export function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn('text-xs tabular-nums text-muted-foreground', className)}
      {...props}
    />
  );
}

export function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn('flex min-w-0 flex-col gap-3 border-0 p-0', className)}
      {...props}
    />
  );
}

export function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        'font-serif text-2xl font-normal tracking-[-0.025em]',
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn('text-sm/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

export function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn('grid gap-2', className)}
      {...props}
    />
  );
}

export function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'group/questionnaire-choice relative flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-sm/relaxed outline-none transition-colors hover:bg-muted/50',
        'data-checked:border-primary/40 data-checked:bg-primary/10 data-invalid:border-destructive has-[>input:focus-visible]:ring-2 has-[>input:focus-visible]:ring-ring/30',
        'data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 translate-y-1 items-center justify-center rounded-full border border-input text-[10px] text-primary-foreground group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary"
      >
        <span className="hidden group-data-checked/questionnaire-choice:block">
          ✓
        </span>
      </span>
      <QuestionnairePrimitive.ChoiceLabel className="flex min-w-0 flex-1 flex-col gap-0.5">
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
    </QuestionnairePrimitive.Choice>
  );
}

export function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn('text-xs/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

export function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn('text-xs/relaxed text-destructive', className)}
      {...props}
    />
  );
}

export function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    />
  );
}

type QuestionnaireButtonProps = Pick<ButtonProps, 'size' | 'variant'>;

export function QuestionnairePrevious({
  className,
  size = 'default',
  variant = 'ghost',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  QuestionnaireButtonProps) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function QuestionnaireSkip({
  className,
  size = 'default',
  variant = 'ghost',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  QuestionnaireButtonProps) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function QuestionnaireNext({
  className,
  size = 'lg',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  QuestionnaireButtonProps) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}

export function QuestionnaireSubmit({
  className,
  size = 'lg',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  QuestionnaireButtonProps) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}
