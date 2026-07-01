/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@/tests/support/reactTesting';
import { ProfilePage } from '../src';

describe('user compatibility surface', () => {
  it('renders the shared account center search affordance', async () => {
    render(<ProfilePage />);

    expect(
      await screen.findByPlaceholderText(/search account settings/i)
    ).toBeTruthy();
  });
});
