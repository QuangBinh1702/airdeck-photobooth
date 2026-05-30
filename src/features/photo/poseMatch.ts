import { POSE, type PoseLandmarks } from '@/types/landmarks';
import { angleDeg, clamp } from '@/lib/geometry';

/**
 * A pose template is a set of target joint angles (in degrees). We score how
 * closely the live pose matches by comparing each angle and averaging.
 *
 * Using joint angles (rather than raw landmark positions) makes matching
 * invariant to where the person stands and how big they appear in frame.
 */
export interface JointAngleSpec {
  name: string;
  /** Landmark indices a-b-c; the angle is measured at b. */
  joints: [number, number, number];
  /** Desired angle in degrees. */
  target: number;
  /** Allowed deviation (deg) before the score for this joint hits zero. */
  tolerance: number;
}

export interface PoseTemplate {
  id: string;
  label: string;
  angles: JointAngleSpec[];
}

export interface PoseMatchResult {
  /** Overall match in [0,1]. */
  score: number;
  /** Per-joint score in [0,1] for UI feedback. */
  perJoint: Record<string, number>;
  /** True when score >= the supplied threshold. */
  matched: boolean;
}

/** Built-in pose templates for the photo studio. */
export const POSE_TEMPLATES: PoseTemplate[] = [
  {
    id: 'both-hands-up',
    label: 'Both hands up',
    angles: [
      {
        name: 'left-arm',
        joints: [POSE.LEFT_HIP, POSE.LEFT_SHOULDER, POSE.LEFT_ELBOW],
        target: 160,
        tolerance: 35,
      },
      {
        name: 'right-arm',
        joints: [POSE.RIGHT_HIP, POSE.RIGHT_SHOULDER, POSE.RIGHT_ELBOW],
        target: 160,
        tolerance: 35,
      },
    ],
  },
  {
    id: 't-pose',
    label: 'T-Pose',
    angles: [
      {
        name: 'left-shoulder',
        joints: [POSE.LEFT_HIP, POSE.LEFT_SHOULDER, POSE.LEFT_ELBOW],
        target: 90,
        tolerance: 30,
      },
      {
        name: 'right-shoulder',
        joints: [POSE.RIGHT_HIP, POSE.RIGHT_SHOULDER, POSE.RIGHT_ELBOW],
        target: 90,
        tolerance: 30,
      },
    ],
  },
];

/**
 * Score how well a live pose matches a template.
 * @param threshold overall score required for `matched` (default 0.75).
 */
export function matchPose(
  pose: PoseLandmarks,
  template: PoseTemplate,
  threshold = 0.75,
): PoseMatchResult {
  const perJoint: Record<string, number> = {};
  let sum = 0;
  let counted = 0;

  for (const spec of template.angles) {
    const [ai, bi, ci] = spec.joints;
    const a = pose[ai];
    const b = pose[bi];
    const c = pose[ci];
    if (!a || !b || !c) {
      perJoint[spec.name] = 0;
      counted += 1;
      continue;
    }
    const actual = angleDeg(a, b, c);
    const error = Math.abs(actual - spec.target);
    // Linear falloff: 0 error => 1.0, error >= tolerance => 0.0.
    const jointScore = clamp(1 - error / spec.tolerance, 0, 1);
    perJoint[spec.name] = jointScore;
    sum += jointScore;
    counted += 1;
  }

  const score = counted === 0 ? 0 : sum / counted;
  return { score, perJoint, matched: score >= threshold };
}
