// ─────────────────────────────────────────────────────────────
// Camera spline helpers
// ─────────────────────────────────────────────────────────────

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Camera waypoints.
 * Z grows positively as the "virtual camera" flies forward;
 * the world transform inverts it so cards approach the viewer.
 */
export const CAM_PATH: Vec3[] = [
    { x: 0, y: 0, z: 0 }, // card-0
    { x: -320, y: 90, z: 1500 }, // card-1
    { x: 280, y: -70, z: 3000 }, // card-2
    // { x: 280, y: -70, z: 3000 }, // ease-out tail — stops at card-2
];

/** Progress values on the spline where each card is centred (matches CAM_PATH indices 0, 1, 2) */
export const CARD_PROGRESS = [0, 1 / 2, 1] as const;

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
        0.5 *
        (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
}

/**
 * Map t ∈ [0, 1] to a position on the Catmull-Rom spline defined by `path`.
 * Boundary condition: duplicates start/end points to prevent NaN at edges.
 */
export function splinePoint(path: Vec3[], t: number): Vec3 {
    const n = path.length - 1; // segment count
    const clamped = Math.min(Math.max(t, 0), 1);
    const raw = clamped * n;
    const i = Math.min(Math.floor(raw), n - 1);
    const localT = raw - i;

    // Duplicate boundary points to satisfy Catmull-Rom requirements.
    // Non-null assertions are safe: indices are clamped to [0, n] above.
    const p0 = path[i === 0 ? 0 : i - 1]!;
    const p1 = path[i]!;
    const p2 = path[i + 1]!;
    const p3 = path[i >= n - 1 ? n : i + 2]!;

    return {
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT),
        z: catmullRom(p0.z, p1.z, p2.z, p3.z, localT),
    };
}

export function clamp(v: number, lo: number, hi: number): number {
    return Math.min(Math.max(v, lo), hi);
}
