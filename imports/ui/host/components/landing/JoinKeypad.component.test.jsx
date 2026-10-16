import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../../languages/LanguageProvider';
import JoinKeypad from './JoinKeypad';

const SESSION = { playerId: 'p1', gameId: 'g1' };
const meteorError = (code) => Object.assign(new Error(code), { error: code });

function renderKeypad(join = vi.fn().mockResolvedValue(SESSION)) {
  const onJoined = vi.fn();
  render(
    <LanguageProvider>
      <JoinKeypad join={join} onJoined={onJoined} />
    </LanguageProvider>
  );
  return {
    join,
    onJoined,
    name: screen.getByLabelText('Player Name'),
    code: screen.getByLabelText('Room code from the big screen, 4 digits'),
    enter: screen.getByRole('button', { name: 'Enter game' }),
    status: () => screen.getByRole('status').textContent,
  };
}

describe('JoinKeypad', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reduced motion: no shake, and no pause on "room found" before leaving.
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('asks for a name first', async () => {
    const user = userEvent.setup();
    const { join, code, enter, status } = renderKeypad();

    await user.type(code, '4821');
    expect(status()).toBe('Now add your name');
    await user.click(enter);

    expect(status()).toBe('Player name required');
    expect(join).not.toHaveBeenCalled();
  });

  it('rejects a short code and says how many digits are missing', async () => {
    const user = userEvent.setup();
    const { join, name, enter, status } = renderKeypad();

    await user.type(name, 'Ada');
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(enter);

    expect(status()).toBe('Code needs 4 digits. 2 more');
    expect(join).not.toHaveBeenCalled();
  });

  it('keeps digits only, from typing or the on-screen keys', async () => {
    const user = userEvent.setup();
    const { code } = renderKeypad();

    await user.type(code, '4a8 2');
    expect(code.value).toBe('482');
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '9' })); // already full
    expect(code.value).toBe('4821');
    await user.click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(code.value).toBe('482');
    await user.click(screen.getByRole('button', { name: 'Clear code' }));
    expect(code.value).toBe('');
  });

  it('joins with the trimmed name and hands the session on', async () => {
    const user = userEvent.setup();
    const { join, onJoined, name, code, enter, status } = renderKeypad();

    await user.type(name, '  Ada  ');
    await user.type(code, '4821');
    expect(status()).toBe('Ready. Press enter game');
    await user.click(enter);

    expect(join).toHaveBeenCalledWith('Ada', '4821');
    await waitFor(() =>
      expect(onJoined).toHaveBeenCalledWith({
        ...SESSION,
        playerName: 'Ada',
        gameCode: '4821',
      })
    );
  });

  it.each([
    ['not-found', 'Game not found, or it has already started'],
    ['full', 'This game is full'],
  ])('shows a %s error from the server on the keypad', async (err, text) => {
    const user = userEvent.setup();
    const { onJoined, name, code, enter, status } = renderKeypad(
      vi.fn().mockRejectedValue(meteorError(err))
    );

    await user.type(name, 'Ada');
    await user.type(code, '4821');
    await user.click(enter);

    await waitFor(() => expect(status()).toBe(text));
    expect(onJoined).not.toHaveBeenCalled();
  });
});
