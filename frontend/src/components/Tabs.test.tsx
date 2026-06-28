import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs.tsx';

describe('Tabs', () => {
  it('marks the active tab and emits the chosen tab on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs active="PLAYED" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: 'Played' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Wishlist' }));
    expect(onChange).toHaveBeenCalledWith('WISHLIST');
  });
});
