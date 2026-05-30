import { HAND, type HandLandmarks, type Landmark } from '@/types/landmarks';

/**
 * Build a synthetic 21-landmark hand for tests.
 *
 * Layout (normalized, non-mirrored): wrist at the bottom-center, fingers point
 * up the frame (decreasing y). Each finger is given MCP/PIP/DIP/TIP points that
 * are collinear (straight = extended) by default. Helpers below curl or pinch
 * specific fingers so we can assert finger-state detection deterministically.
 */
function blankHand(): HandLandmarks {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
}

function setPoint(hand: HandLandmarks, idx: number, p: Landmark): void {
  hand[idx] = p;
}

/** A neutral hand with all four fingers extended and thumb out. */
export function makeOpenHand(): HandLandmarks {
  const hand = blankHand();
  setPoint(hand, HAND.WRIST, { x: 0.5, y: 0.9, z: 0 });

  // Middle MCP defines hand scale (~0.2 from wrist).
  setPoint(hand, HAND.MIDDLE_MCP, { x: 0.5, y: 0.7, z: 0 });

  const finger = (
    mcp: number,
    pip: number,
    dip: number,
    tip: number,
    x: number,
  ) => {
    setPoint(hand, mcp, { x, y: 0.7, z: 0 });
    setPoint(hand, pip, { x, y: 0.6, z: 0 });
    setPoint(hand, dip, { x, y: 0.5, z: 0 });
    setPoint(hand, tip, { x, y: 0.4, z: 0 });
  };

  finger(HAND.INDEX_MCP, HAND.INDEX_PIP, HAND.INDEX_DIP, HAND.INDEX_TIP, 0.44);
  finger(
    HAND.MIDDLE_MCP,
    HAND.MIDDLE_PIP,
    HAND.MIDDLE_DIP,
    HAND.MIDDLE_TIP,
    0.5,
  );
  finger(HAND.RING_MCP, HAND.RING_PIP, HAND.RING_DIP, HAND.RING_TIP, 0.56);
  finger(HAND.PINKY_MCP, HAND.PINKY_PIP, HAND.PINKY_DIP, HAND.PINKY_TIP, 0.62);

  // Thumb extended out to the left side, roughly straight.
  setPoint(hand, HAND.THUMB_CMC, { x: 0.42, y: 0.82, z: 0 });
  setPoint(hand, HAND.THUMB_MCP, { x: 0.36, y: 0.78, z: 0 });
  setPoint(hand, HAND.THUMB_IP, { x: 0.31, y: 0.74, z: 0 });
  setPoint(hand, HAND.THUMB_TIP, { x: 0.26, y: 0.7, z: 0 });

  return hand;
}

/** Curl a finger by bending its tip/dip back toward the palm (sharp angle). */
export function curlFinger(
  hand: HandLandmarks,
  which: 'index' | 'middle' | 'ring' | 'pinky',
): HandLandmarks {
  const map = {
    index: [HAND.INDEX_MCP, HAND.INDEX_PIP, HAND.INDEX_DIP, HAND.INDEX_TIP],
    middle: [
      HAND.MIDDLE_MCP,
      HAND.MIDDLE_PIP,
      HAND.MIDDLE_DIP,
      HAND.MIDDLE_TIP,
    ],
    ring: [HAND.RING_MCP, HAND.RING_PIP, HAND.RING_DIP, HAND.RING_TIP],
    pinky: [HAND.PINKY_MCP, HAND.PINKY_PIP, HAND.PINKY_DIP, HAND.PINKY_TIP],
  } as const;
  const [, pip, dip, tip] = map[which];
  const pipPt = hand[pip]!;
  // Fold the tip back down past the PIP (creates a sharp angle => curled).
  hand[dip] = { x: pipPt.x, y: pipPt.y + 0.05, z: 0 };
  hand[tip] = { x: pipPt.x, y: pipPt.y + 0.1, z: 0 };
  return hand;
}

/** Make a closed fist (all fingers curled, thumb tucked). */
export function makeFist(): HandLandmarks {
  let hand = makeOpenHand();
  hand = curlFinger(hand, 'index');
  hand = curlFinger(hand, 'middle');
  hand = curlFinger(hand, 'ring');
  hand = curlFinger(hand, 'pinky');
  // Tuck the thumb in (sharp angle at IP).
  hand[HAND.THUMB_IP] = { x: 0.45, y: 0.74, z: 0 };
  hand[HAND.THUMB_TIP] = { x: 0.48, y: 0.72, z: 0 };
  return hand;
}

/** A "Victory" (✌️) shape: index + middle extended, ring + pinky curled. */
export function makeVictory(): HandLandmarks {
  let hand = makeOpenHand();
  hand = curlFinger(hand, 'ring');
  hand = curlFinger(hand, 'pinky');
  return hand;
}

/** Move the index tip onto the thumb tip to form a pinch. */
export function makePinch(): HandLandmarks {
  const hand = makeOpenHand();
  const thumbTip = hand[HAND.THUMB_TIP]!;
  hand[HAND.INDEX_TIP] = { x: thumbTip.x + 0.005, y: thumbTip.y + 0.005, z: 0 };
  return hand;
}
