import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './search-bar';

describe('SearchBar', () => {
  it('synchronizes internal state with defaultValue changes', () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchBar defaultValue="initial" onSearch={onSearch} debounceMs={50} />,
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('initial');

    rerender(<SearchBar defaultValue="updated" onSearch={onSearch} debounceMs={50} />);
    expect(input.value).toBe('updated');
  });

  it('triggers onSearch when Enter key is pressed', async () => {
    const onSearch = vi.fn();
    render(<SearchBar defaultValue="" onSearch={onSearch} debounceMs={300} />);

    const input = screen.getByRole('searchbox');
    await userEvent.type(input, 'React{Enter}');

    expect(onSearch).toHaveBeenCalledWith('React');
  });

  it('clears search input when clear button is clicked', async () => {
    const onSearch = vi.fn();
    render(<SearchBar defaultValue="python" onSearch={onSearch} debounceMs={50} />);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await userEvent.click(clearButton);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(onSearch).toHaveBeenCalledWith('');
  });
});
