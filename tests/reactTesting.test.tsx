/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from './support/reactTesting';

describe('reactTesting support', () => {
  it('renders React content and exposes screen queries without testing-library peers', async () => {
    const delayedLabel = 'Loaded from React test support';

    const Harness = () => {
      const [ready, setReady] = React.useState(false);

      React.useEffect(() => {
        queueMicrotask(() => {
          setReady(true);
        });
      }, []);

      return (
        <div>
          <span data-testid="status">{ready ? delayedLabel : 'loading'}</span>
          <input placeholder="Search account settings" />
        </div>
      );
    };

    const view = render(<Harness />);

    expect(view.getByTestId('status').textContent).toBe('loading');

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe(delayedLabel);
    });

    await expect(screen.findByPlaceholderText(/search account settings/i)).resolves.toBeTruthy();
    expect(screen.getAllByText(delayedLabel)).toHaveLength(1);
    expect(vi.isMockFunction(waitFor)).toBe(false);
  });
});
