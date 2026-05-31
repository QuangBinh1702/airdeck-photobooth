import type { FaceAnchors } from '@/features/photo/faceAnchors';
import {
  drawBunnyEars,
  drawCatEars,
  drawClownNose,
  drawCrown,
  drawGlasses,
  drawMustache,
  drawTopHat,
} from '@/features/photo/accessoryArt';

/** Where on the face an accessory attaches. */
export type AnchorPoint = 'eyes' | 'aboveHead' | 'nose' | 'mouth';

export interface Accessory {
  id: string;
  label: string;
  /** Small emoji used only in the picker button (not drawn on the face). */
  icon: string;
  anchor: AnchorPoint;
  /** Scale multiplier applied to the reference unit. */
  scale: number;
  /** Reference unit: eye distance (false) or face width (true). */
  scaleByFaceWidth: boolean;
  /** Vertical nudge along the face's down-axis, in reference units. */
  offsetY: number;
  /** Vector renderer drawing the accessory centered in unit space. */
  render: (ctx: CanvasRenderingContext2D) => void;
}

export const ACCESSORIES: Accessory[] = [
  {
    id: 'glasses',
    label: 'Kính',
    icon: '👓',
    anchor: 'eyes',
    scale: 1.0,
    scaleByFaceWidth: false,
    offsetY: 0.02,
    render: (ctx) => drawGlasses(ctx, { tint: null, frame: '#1f2937' }),
  },
  {
    id: 'sunglasses',
    label: 'Kính râm',
    icon: '🕶️',
    anchor: 'eyes',
    scale: 1.0,
    scaleByFaceWidth: false,
    offsetY: 0.02,
    render: (ctx) =>
      drawGlasses(ctx, { tint: 'rgba(20,30,60,0.92)', frame: '#0b0b0b' }),
  },
  {
    id: 'tophat',
    label: 'Mũ',
    icon: '🎩',
    anchor: 'aboveHead',
    scale: 1.0,
    scaleByFaceWidth: true,
    offsetY: 0,
    render: drawTopHat,
  },
  {
    id: 'crown',
    label: 'Vương miện',
    icon: '👑',
    anchor: 'aboveHead',
    scale: 1.0,
    scaleByFaceWidth: true,
    offsetY: 0.1,
    render: drawCrown,
  },
  {
    id: 'bunny',
    label: 'Tai thỏ',
    icon: '🐰',
    anchor: 'aboveHead',
    scale: 1.0,
    scaleByFaceWidth: true,
    offsetY: 0.05,
    render: drawBunnyEars,
  },
  {
    id: 'cat',
    label: 'Tai mèo',
    icon: '🐱',
    anchor: 'aboveHead',
    scale: 1.0,
    scaleByFaceWidth: true,
    offsetY: 0.05,
    render: drawCatEars,
  },
  {
    id: 'mustache',
    label: 'Ria mép',
    icon: '🥸',
    anchor: 'mouth',
    scale: 1.0,
    scaleByFaceWidth: false,
    offsetY: -0.28,
    render: drawMustache,
  },
  {
    id: 'clown',
    label: 'Mũi hề',
    icon: '🔴',
    anchor: 'nose',
    scale: 1.0,
    scaleByFaceWidth: false,
    offsetY: 0,
    render: drawClownNose,
  },
];

export function getAccessoryById(id: string): Accessory | undefined {
  return ACCESSORIES.find((a) => a.id === id);
}

/**
 * Resolved placement for an accessory: the anchor point, the reference scale
 * and the head roll. The renderer translates/rotates/scales the context to
 * this frame, then calls the accessory's vector `render`.
 */
export interface AccessoryPlacement {
  /** Accessory id (so the renderer can look up the vector art). */
  id: string;
  /** Anchor center (normalized 0..1 image coords). */
  x: number;
  y: number;
  /** Reference length in normalized units (eye distance or face width × scale). */
  unit: number;
  /** Rotation in radians (head roll). */
  rotation: number;
}

/** Compute the anchor placement for an accessory on a face. */
export function placeAccessory(
  accessory: Accessory,
  face: FaceAnchors,
): AccessoryPlacement {
  const refLen = accessory.scaleByFaceWidth
    ? face.faceWidth
    : face.eyeDistance;
  const unit = refLen * accessory.scale;

  // Face basis: "down" is perpendicular to the eye line.
  const downX = -Math.sin(face.rollRad);
  const downY = Math.cos(face.rollRad);

  let baseX = face.eyeCenter.x;
  let baseY = face.eyeCenter.y;
  switch (accessory.anchor) {
    case 'eyes':
      baseX = face.eyeCenter.x;
      baseY = face.eyeCenter.y;
      break;
    case 'aboveHead': {
      // Above the forehead by ~0.6 of the reference, along the up-axis.
      baseX = face.foreheadTop.x - downX * unit * 0.6;
      baseY = face.foreheadTop.y - downY * unit * 0.6;
      break;
    }
    case 'nose':
      baseX = face.noseTip.x;
      baseY = face.noseTip.y;
      break;
    case 'mouth':
      baseX = face.mouthTop.x;
      baseY = face.mouthTop.y;
      break;
  }

  // Apply the vertical offset along the face down-axis.
  const offset = accessory.offsetY * refLen;
  return {
    id: accessory.id,
    x: baseX + downX * offset,
    y: baseY + downY * offset,
    unit,
    rotation: face.rollRad,
  };
}
