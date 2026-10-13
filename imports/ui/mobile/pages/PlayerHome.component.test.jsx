import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../languages/LanguageProvider';
import { PlayerHome } from './PlayerHome';

function renderPlayerHome(props = {}) {
  return render(
    <LanguageProvider>
      <PlayerHome {...props} />
    </LanguageProvider>
  );
}

describe('PlayerHome', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('requires a player name and a game code before joining', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderPlayerHome({ onStart });

    await user.click(screen.getByRole('button', { name: 'Enter Game →' }));
    expect(screen.getByRole('alert').textContent).toContain(
      'Player name required'
    );

    await user.type(screen.getByLabelText('Player Name'), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Enter Game →' }));
    expect(screen.getByRole('alert').textContent).toContain(
      'Game code required'
    );
    expect(onStart).not.toHaveBeenCalled();
  });

  it('accepts four-digit codes, filters non-digits, and trims the player name', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderPlayerHome({ onStart });

    await user.type(screen.getByLabelText('Player Name'), '  Ada  ');
    await user.type(screen.getByLabelText('Game Code'), '12ab34');
    expect(screen.getByLabelText('Game Code').value).toBe('1234');

    await user.click(screen.getByRole('button', { name: 'Enter Game →' }));

    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith('Ada', '1234');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('prepopulates a QR join code and marks it as scanned', () => {
    renderPlayerHome({ initialCode: '8421' });

    expect(screen.getByLabelText('Game Code').value).toBe('8421');
    expect(screen.getByText('✓ Scanned via QR')).toBeTruthy();
  });

  it('shows server errors and disables the submit button while joining', () => {
    renderPlayerHome({ loading: true, serverError: 'This game is full' });

    expect(screen.getByRole('alert').textContent).toContain(
      'This game is full'
    );
    expect(screen.getByRole('button', { name: 'Joining...' }).disabled).toBe(
      true
    );
  });

  it('validates the code format even if browser input validation is bypassed', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderPlayerHome({ onStart });

    await user.type(screen.getByLabelText('Player Name'), 'Grace');
    fireEvent.change(screen.getByLabelText('Game Code'), {
      target: { value: '123' },
    });
    fireEvent.submit(screen.getByLabelText('Player Name').closest('form'));

    expect(screen.getByRole('alert').textContent).toContain(
      'Enter the 4-digit game code'
    );
    expect(onStart).not.toHaveBeenCalled();
  });
});
