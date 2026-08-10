import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button.js';

const meta = {
  title: 'Design/Button',
  component: Button,
  args: { children: 'Open note' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'outline',
        'secondary',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: [
        'default',
        'xs',
        'sm',
        'lg',
        'icon',
        'icon-xs',
        'icon-sm',
        'icon-lg',
      ],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} variant="default" />
      <Button {...args} variant="outline" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="ghost" />
      <Button {...args} variant="destructive" />
      <Button {...args} variant="link" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} size="xs" />
      <Button {...args} size="sm" />
      <Button {...args} size="default" />
      <Button {...args} size="lg" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Beam border while an action is in flight — `data-busy` + `aria-busy`, no spinner swap. */
export const Busy: Story = {
  args: { children: 'Transcribing…', 'aria-busy': true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} data-busy="true" variant="outline" />
      <Button {...args} data-busy="true" variant="secondary" />
    </div>
  ),
};
