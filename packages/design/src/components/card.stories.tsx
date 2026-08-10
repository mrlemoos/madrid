import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card.js';

const meta = {
  title: 'Design/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-xs">
      <CardHeader>
        <CardTitle>Weekly review</CardTitle>
        <CardDescription>Updated 2 minutes ago</CardDescription>
      </CardHeader>
      <CardContent>Three linked notes, one attachment.</CardContent>
    </Card>
  ),
};

/** Beam border while a job runs on the card's content (transcription, upload, sync). */
export const Busy: Story = {
  render: (args) => (
    <Card {...args} className="max-w-xs" data-busy="true" aria-busy>
      <CardHeader>
        <CardTitle>Morning recording</CardTitle>
        <CardDescription>Transcribing…</CardDescription>
      </CardHeader>
      <CardContent>Audio will be inserted when the job finishes.</CardContent>
    </Card>
  ),
};
