import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Gallery } from '@/components/Gallery';
import { useAppStore } from '@/store/appStore';

const PNG = 'data:image/png;base64,FAKE';

describe('Gallery', () => {
  beforeEach(() => {
    useAppStore.setState({ photos: [], selectedPhotoId: null, stripSelection: [] });
  });

  it('shows an empty state when there are no photos', () => {
    render(<Gallery />);
    expect(screen.getByText(/Chưa có ảnh nào/i)).toBeInTheDocument();
  });

  it('renders captured photos and marks the selected one', () => {
    const id = useAppStore.getState().addPhoto(PNG);
    render(<Gallery />);
    const items = screen.getAllByTestId('gallery-item');
    expect(items).toHaveLength(1);
    // addPhoto auto-selects the new photo.
    expect(items[0]).toHaveAttribute('aria-pressed', 'true');
    expect(useAppStore.getState().selectedPhotoId).toBe(id);
  });

  it('selects a photo on click', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addPhoto(PNG); // photo A (selected)
    const idB = useAppStore.getState().addPhoto(PNG); // photo B (now selected)
    useAppStore.getState().selectPhoto(null);

    render(<Gallery />);
    const items = screen.getAllByTestId('gallery-item');
    await user.click(items[1]!); // click the second (older = A)
    expect(useAppStore.getState().selectedPhotoId).not.toBe(null);
    // idB still exists in store
    expect(useAppStore.getState().photos.some((p) => p.id === idB)).toBe(true);
  });

  it('deletes a photo', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addPhoto(PNG);
    render(<Gallery />);
    await user.click(screen.getByTestId('gallery-delete'));
    expect(useAppStore.getState().photos).toHaveLength(0);
  });

  it('clears all photos', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addPhoto(PNG);
    useAppStore.getState().addPhoto(PNG);
    render(<Gallery />);
    await user.click(screen.getByRole('button', { name: /Xoá tất cả/i }));
    expect(useAppStore.getState().photos).toHaveLength(0);
  });

  it('toggles a photo into the 4-cut strip selection and shows its order', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ stripSelection: [] });
    const id = useAppStore.getState().addPhoto(PNG);
    render(<Gallery />);
    await user.click(screen.getByTestId('gallery-strip-toggle'));
    expect(useAppStore.getState().stripSelection).toEqual([id]);
    // Toggling again removes it.
    await user.click(screen.getByTestId('gallery-strip-toggle'));
    expect(useAppStore.getState().stripSelection).toEqual([]);
  });
});
