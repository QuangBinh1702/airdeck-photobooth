export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TooltipBox {
  /** Final top-left of the tooltip (px), clamped to the viewport. */
  top: number;
  left: number;
  /** Placement actually used (may flip if there's no room). */
  placement: Placement;
}

const MARGIN = 12;

/** Clamp a value into [min, max]. */
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Compute a tooltip position for a target rect, preferring `placement` but
 * flipping to the opposite side when there isn't enough room, and clamping the
 * result inside the viewport. Pure — no DOM access.
 */
export function positionTooltip(
  target: Rect | null,
  tooltip: { width: number; height: number },
  viewport: Viewport,
  placement: Placement = 'bottom',
): TooltipBox {
  // Centered (no target, or explicit center).
  if (!target || placement === 'center') {
    return {
      top: clamp(
        (viewport.height - tooltip.height) / 2,
        MARGIN,
        Math.max(MARGIN, viewport.height - tooltip.height - MARGIN),
      ),
      left: clamp(
        (viewport.width - tooltip.width) / 2,
        MARGIN,
        Math.max(MARGIN, viewport.width - tooltip.width - MARGIN),
      ),
      placement: 'center',
    };
  }

  const spaceBelow = viewport.height - (target.top + target.height);
  const spaceAbove = target.top;
  const spaceRight = viewport.width - (target.left + target.width);
  const spaceLeft = target.left;

  let actual: Placement = placement;
  // Flip vertical placements when the chosen side lacks room.
  if (placement === 'bottom' && spaceBelow < tooltip.height + MARGIN && spaceAbove > spaceBelow) {
    actual = 'top';
  } else if (placement === 'top' && spaceAbove < tooltip.height + MARGIN && spaceBelow > spaceAbove) {
    actual = 'bottom';
  } else if (placement === 'right' && spaceRight < tooltip.width + MARGIN && spaceLeft > spaceRight) {
    actual = 'left';
  } else if (placement === 'left' && spaceLeft < tooltip.width + MARGIN && spaceRight > spaceLeft) {
    actual = 'right';
  }

  let top: number;
  let left: number;
  switch (actual) {
    case 'top':
      top = target.top - tooltip.height - MARGIN;
      left = target.left + target.width / 2 - tooltip.width / 2;
      break;
    case 'left':
      top = target.top + target.height / 2 - tooltip.height / 2;
      left = target.left - tooltip.width - MARGIN;
      break;
    case 'right':
      top = target.top + target.height / 2 - tooltip.height / 2;
      left = target.left + target.width + MARGIN;
      break;
    case 'bottom':
    default:
      top = target.top + target.height + MARGIN;
      left = target.left + target.width / 2 - tooltip.width / 2;
      break;
  }

  return {
    top: clamp(top, MARGIN, Math.max(MARGIN, viewport.height - tooltip.height - MARGIN)),
    left: clamp(left, MARGIN, Math.max(MARGIN, viewport.width - tooltip.width - MARGIN)),
    placement: actual,
  };
}
