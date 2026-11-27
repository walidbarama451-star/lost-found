import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraCaptureModal } from '@/features/items/components/CameraCaptureModal';
import { ImageUploader } from '@/features/items/components/ImageUploader';

describe('ImageUploader camera integration', () => {
  it('initially renders single "Upload a photo" button', () => {
    render(<ImageUploader files={[]} onFilesChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /upload a photo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('changes to pick between taking and adding when tapped/clicked', async () => {
    const user = userEvent.setup();
    render(<ImageUploader files={[]} onFilesChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /upload a photo/i }));

    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add from files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('reverts back to single option when clicking Cancel', async () => {
    const user = userEvent.setup();
    render(<ImageUploader files={[]} onFilesChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /upload a photo/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /upload a photo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /take photo/i })).not.toBeInTheDocument();
  });

  it('disables "Upload a photo" when remaining allowed photos is 0', () => {
    render(
      <ImageUploader
        files={[]}
        onFilesChange={vi.fn()}
        existingCount={5}
        maxImages={5}
      />,
    );

    expect(screen.getByRole('button', { name: /upload a photo/i })).toBeDisabled();
  });

  it('disables "Upload a photo" when disabled prop is true', () => {
    render(<ImageUploader files={[]} onFilesChange={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: /upload a photo/i })).toBeDisabled();
  });

  it('opens camera modal when choosing "Take photo"', async () => {
    const user = userEvent.setup();
    render(<ImageUploader files={[]} onFilesChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /upload a photo/i }));
    await user.click(screen.getByRole('button', { name: /take photo/i }));
    expect(screen.getByRole('dialog', { name: /camera photo capture/i })).toBeInTheDocument();
  });
});

describe('CameraCaptureModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal dialog when open', () => {
    render(
      <CameraCaptureModal
        open={true}
        onClose={vi.fn()}
        onCapture={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: /camera photo capture/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument();
  });

  it('calls onClose when clicking cancel or close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <CameraCaptureModal
        open={true}
        onClose={onClose}
        onCapture={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error and fallback button if getUserMedia is rejected', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
      writable: true,
    });

    const onFallback = vi.fn();

    render(
      <CameraCaptureModal
        open={true}
        onClose={vi.fn()}
        onCapture={vi.fn()}
        onFallback={onFallback}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/unable to start camera/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /use device file picker/i })).toBeInTheDocument();

    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
      writable: true,
    });
  });
});
