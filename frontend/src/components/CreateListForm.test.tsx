import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateListForm } from './CreateListForm.tsx';

describe('CreateListForm', () => {
  it('reveals an input and creates a list with the typed title', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<CreateListForm onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Create List' }));
    await user.type(screen.getByLabelText('List title'), 'Top 10 of 2024');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith('Top 10 of 2024');
  });

  it('does not create with a blank title', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<CreateListForm onCreate={onCreate} />);

    await user.click(screen.getByRole('button', { name: 'Create List' }));
    await user.type(screen.getByLabelText('List title'), '   ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});
