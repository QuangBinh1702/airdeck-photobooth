import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hud } from '@/components/Hud';
import { useAppStore } from '@/store/appStore';

describe('Hud', () => {
  beforeEach(() => {
    useAppStore.setState({
      fps: 0,
      handsDetected: 0,
      currentGesture: null,
      cameraStatus: 'idle',
      engineStatus: 'idle',
    });
  });

  it('renders engine status fields', () => {
    render(<Hud />);
    expect(screen.getByTestId('hud-camera')).toHaveTextContent('idle');
    expect(screen.getByTestId('hud-engine')).toHaveTextContent('idle');
    expect(screen.getByTestId('hud-gesture')).toHaveTextContent('—');
  });

  it('reflects store updates for fps, hands and gesture', () => {
    useAppStore.setState({
      fps: 30,
      handsDetected: 1,
      currentGesture: 'Victory',
      cameraStatus: 'ready',
      engineStatus: 'ready',
    });
    render(<Hud />);
    expect(screen.getByTestId('hud-fps')).toHaveTextContent('30');
    expect(screen.getByTestId('hud-hands')).toHaveTextContent('1');
    expect(screen.getByTestId('hud-gesture')).toHaveTextContent('Victory');
    expect(screen.getByTestId('hud-camera')).toHaveTextContent('ready');
  });
});
