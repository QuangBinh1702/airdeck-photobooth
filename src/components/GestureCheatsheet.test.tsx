import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GestureCheatsheet } from '@/components/GestureCheatsheet';
import { useAppStore } from '@/store/appStore';

describe('GestureCheatsheet', () => {
  beforeEach(() => {
    useAppStore.setState({ mode: 'photo', captureMode: 'shape' });
  });

  it('shows the shape list in photo + shape mode', () => {
    useAppStore.setState({ mode: 'photo', captureMode: 'shape' });
    render(<GestureCheatsheet />);
    expect(screen.getByText(/Cử chỉ · Hình học/i)).toBeInTheDocument();
    expect(screen.getByText('Tam giác')).toBeInTheDocument();
    expect(screen.getByText('Vòng tròn')).toBeInTheDocument();
    expect(screen.getByText('Khung 3D')).toBeInTheDocument();
  });

  it('shows the hand-sign list in photo + gesture mode', () => {
    useAppStore.setState({ mode: 'photo', captureMode: 'gesture' });
    render(<GestureCheatsheet />);
    expect(screen.getByText(/Cử chỉ · Cử chỉ tay/i)).toBeInTheDocument();
    expect(screen.getByText('Victory')).toBeInTheDocument();
    expect(screen.getByText('Call me')).toBeInTheDocument();
    // Shape-only labels should not appear here.
    expect(screen.queryByText('Tam giác')).not.toBeInTheDocument();
  });

  it('shows the intent mapping in cursor mode', () => {
    useAppStore.setState({ mode: 'cursor' });
    render(<GestureCheatsheet />);
    expect(screen.getByText(/Cử chỉ · cursor/i)).toBeInTheDocument();
    expect(screen.getByText('cursor.click')).toBeInTheDocument();
  });
});
