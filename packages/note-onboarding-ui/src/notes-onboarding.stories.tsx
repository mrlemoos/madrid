import type { Meta, StoryObj } from '@storybook/react-vite';

import { createTranslator } from '@getmadrid/i18n';

import { NotesOnboarding } from './notes-onboarding';

const { t } = createTranslator('en-GB');

const meta = {
  title: 'Nota/Onboarding',
  component: NotesOnboarding,
  args: {
    onComplete: () => Promise.resolve(),
    t,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NotesOnboarding>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
