import { describe, expect, it } from 'vitest';
import {
  POSE_TEMPLATES,
  matchPose,
  type PoseTemplate,
} from '@/features/photo/poseMatch';
import { POSE, type PoseLandmarks } from '@/types/landmarks';

/** Build a 33-point pose with specific landmarks set. */
function makePose(set: Partial<Record<number, { x: number; y: number }>>): PoseLandmarks {
  const pose: PoseLandmarks = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));
  for (const [idx, p] of Object.entries(set)) {
    pose[Number(idx)] = { x: p!.x, y: p!.y, z: 0 };
  }
  return pose;
}

const tPose = POSE_TEMPLATES.find((t) => t.id === 't-pose')!;

describe('matchPose — T-Pose', () => {
  it('scores high when arms are horizontal (~90 deg at shoulders)', () => {
    // Right angle at each shoulder formed by hip (below) and elbow (to side).
    const pose = makePose({
      [POSE.LEFT_HIP]: { x: 0.45, y: 0.8 },
      [POSE.LEFT_SHOULDER]: { x: 0.45, y: 0.5 },
      [POSE.LEFT_ELBOW]: { x: 0.2, y: 0.5 },
      [POSE.RIGHT_HIP]: { x: 0.55, y: 0.8 },
      [POSE.RIGHT_SHOULDER]: { x: 0.55, y: 0.5 },
      [POSE.RIGHT_ELBOW]: { x: 0.8, y: 0.5 },
    });
    const res = matchPose(pose, tPose, 0.75);
    expect(res.matched).toBe(true);
    expect(res.score).toBeGreaterThan(0.75);
  });

  it('scores low when arms hang straight down', () => {
    const pose = makePose({
      [POSE.LEFT_HIP]: { x: 0.45, y: 0.8 },
      [POSE.LEFT_SHOULDER]: { x: 0.45, y: 0.5 },
      [POSE.LEFT_ELBOW]: { x: 0.45, y: 0.7 }, // ~180 deg, not 90
      [POSE.RIGHT_HIP]: { x: 0.55, y: 0.8 },
      [POSE.RIGHT_SHOULDER]: { x: 0.55, y: 0.5 },
      [POSE.RIGHT_ELBOW]: { x: 0.55, y: 0.7 },
    });
    const res = matchPose(pose, tPose, 0.75);
    expect(res.matched).toBe(false);
  });

  it('reports per-joint scores for UI feedback', () => {
    const pose = makePose({
      [POSE.LEFT_HIP]: { x: 0.45, y: 0.8 },
      [POSE.LEFT_SHOULDER]: { x: 0.45, y: 0.5 },
      [POSE.LEFT_ELBOW]: { x: 0.2, y: 0.5 },
    });
    const res = matchPose(pose, tPose);
    expect(Object.keys(res.perJoint)).toContain('left-shoulder');
    expect(res.perJoint['left-shoulder']).toBeGreaterThan(0.5);
  });

  it('gives zero score for an empty template (no angles)', () => {
    const empty: PoseTemplate = { id: 'x', label: 'x', angles: [] };
    expect(matchPose(makePose({}), empty).score).toBe(0);
  });
});
