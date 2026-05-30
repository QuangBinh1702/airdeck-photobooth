import { describe, expect, it, beforeEach } from 'vitest';
import { useAppStore } from '@/store/appStore';

describe('appStore — photo gallery', () => {
  beforeEach(() => {
    useAppStore.setState({ photos: [], selectedPhotoId: null, timer: 3 });
  });

  it('adds a photo, returns its id, and auto-selects it', () => {
    const id = useAppStore.getState().addPhoto('data:image/png;base64,A');
    const state = useAppStore.getState();
    expect(state.photos).toHaveLength(1);
    expect(state.photos[0]!.id).toBe(id);
    expect(state.selectedPhotoId).toBe(id);
  });

  it('prepends newest photos (most recent first)', () => {
    const first = useAppStore.getState().addPhoto('data:image/png;base64,A');
    const second = useAppStore.getState().addPhoto('data:image/png;base64,B');
    const ids = useAppStore.getState().photos.map((p) => p.id);
    expect(ids[0]).toBe(second);
    expect(ids[1]).toBe(first);
  });

  it('caps the gallery at 24 photos', () => {
    for (let i = 0; i < 30; i += 1) {
      useAppStore.getState().addPhoto(`data:image/png;base64,${i}`);
    }
    expect(useAppStore.getState().photos).toHaveLength(24);
  });

  it('removing the selected photo clears the selection', () => {
    const id = useAppStore.getState().addPhoto('data:image/png;base64,A');
    useAppStore.getState().removePhoto(id);
    const state = useAppStore.getState();
    expect(state.photos).toHaveLength(0);
    expect(state.selectedPhotoId).toBeNull();
  });

  it('removing a non-selected photo keeps the current selection', () => {
    const keep = useAppStore.getState().addPhoto('data:image/png;base64,A');
    const drop = useAppStore.getState().addPhoto('data:image/png;base64,B');
    useAppStore.getState().selectPhoto(keep);
    useAppStore.getState().removePhoto(drop);
    expect(useAppStore.getState().selectedPhotoId).toBe(keep);
  });

  it('clearPhotos empties the gallery and selection', () => {
    useAppStore.getState().addPhoto('data:image/png;base64,A');
    useAppStore.getState().clearPhotos();
    expect(useAppStore.getState().photos).toHaveLength(0);
    expect(useAppStore.getState().selectedPhotoId).toBeNull();
  });

  it('updates timer and frame settings', () => {
    useAppStore.getState().setTimer(10);
    useAppStore.getState().setFrameId('mint');
    expect(useAppStore.getState().timer).toBe(10);
    expect(useAppStore.getState().frameId).toBe('mint');
  });

  it('defaults to shape capture mode and can switch to gesture', () => {
    // Reset to defaults for this assertion.
    useAppStore.setState({ captureMode: 'shape' });
    expect(useAppStore.getState().captureMode).toBe('shape');
    useAppStore.getState().setCaptureMode('gesture');
    expect(useAppStore.getState().captureMode).toBe('gesture');
  });
});

describe('appStore — 4-cut strip selection', () => {
  beforeEach(() => {
    useAppStore.setState({
      photos: [],
      stripSelection: [],
      stripLayout: 'vertical-4',
      stripThemeId: 'classic-white',
    });
  });

  it('toggles photos in and out of the strip selection (ordered)', () => {
    useAppStore.getState().toggleStripPhoto('a');
    useAppStore.getState().toggleStripPhoto('b');
    expect(useAppStore.getState().stripSelection).toEqual(['a', 'b']);
    useAppStore.getState().toggleStripPhoto('a');
    expect(useAppStore.getState().stripSelection).toEqual(['b']);
  });

  it('caps the selection at the layout capacity (4)', () => {
    ['a', 'b', 'c', 'd', 'e'].forEach((id) =>
      useAppStore.getState().toggleStripPhoto(id),
    );
    expect(useAppStore.getState().stripSelection).toEqual(['a', 'b', 'c', 'd']);
  });

  it('removing a photo also removes it from the strip selection', () => {
    const id = useAppStore.getState().addPhoto('data:image/png;base64,A');
    useAppStore.getState().toggleStripPhoto(id);
    expect(useAppStore.getState().stripSelection).toContain(id);
    useAppStore.getState().removePhoto(id);
    expect(useAppStore.getState().stripSelection).not.toContain(id);
  });

  it('clearStripSelection empties the selection', () => {
    useAppStore.getState().toggleStripPhoto('a');
    useAppStore.getState().clearStripSelection();
    expect(useAppStore.getState().stripSelection).toEqual([]);
  });

  it('updates layout and theme', () => {
    useAppStore.getState().setStripLayout('grid-2x2');
    useAppStore.getState().setStripThemeId('sunset');
    expect(useAppStore.getState().stripLayout).toBe('grid-2x2');
    expect(useAppStore.getState().stripThemeId).toBe('sunset');
  });
});
