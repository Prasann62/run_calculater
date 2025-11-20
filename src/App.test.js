import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Cricket Score title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Cricket Score/i);
  expect(titleElement).toBeInTheDocument();
});
