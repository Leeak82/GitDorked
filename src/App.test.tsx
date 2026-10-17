import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { githubTools } from './core';

describe('App interactions', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('switches among all primary views', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Repo Tools' }));
    expect(screen.getByRole('heading', { name: 'Repository Tools' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recipes' }));
    expect(screen.getByRole('heading', { name: 'Owned Repository Baseline' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Saved' }));
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Catalog' }));
    expect(screen.getByLabelText('Catalog and query builder')).toBeInTheDocument();
  });

  it('persists a favorite into the Saved view', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Add Favorite' }));
    await user.click(screen.getByRole('button', { name: 'Saved' }));

    expect(screen.getByRole('button', { name: 'Public Documents By Domain' })).toBeInTheDocument();
  });

  it('generates repo URLs and exercises Copy/Open controls for every repo tool', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Repo Tools' }));
    await user.type(screen.getByLabelText('GitHub repository URL'), 'https://github.com/example/repo');

    const gitDiagramCard = screen.getByRole('heading', { name: 'GitDiagram' }).closest('article');
    expect(gitDiagramCard).not.toBeNull();
    expect(within(gitDiagramCard!).getByText('https://gitdiagram.com/example/repo')).toBeInTheDocument();

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.url-tool-card'));
    expect(cards).toHaveLength(githubTools.length);

    for (const card of cards) {
      await user.click(within(card).getByRole('button', { name: 'Copy URL' }));
      await user.click(within(card).getByRole('button', { name: 'Open' }));
    }

    expect(screen.getByText(/opened in a new tab\.$/)).toBeInTheDocument();
  });
});
