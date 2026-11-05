/**
 * Pure physics & math helpers for the Cyber Obsidian Quantum Particle System
 * and Magnetic / Spotlight UI interactions.
 */

/**
 * Computes the cursor repulsion force vector acting on a particle at (px, py).
 * @param {number} px - Particle X
 * @param {number} py - Particle Y
 * @param {number} mx - Cursor X
 * @param {number} my - Cursor Y
 * @param {number} radius - Repulsion radius in px (e.g. 140)
 * @param {number} strength - Force multiplier (e.g. 0.85)
 * @returns {{ fx: number, fy: number, engaged: boolean }}
 */
export function computeRepulsionForce(px, py, mx, my, radius = 140, strength = 0.85) {
  if (!Number.isFinite(mx) || !Number.isFinite(my) || radius <= 0) {
    return { fx: 0, fy: 0, engaged: false };
  }
  const dx = px - mx;
  const dy = py - my;
  const distSq = dx * dx + dy * dy;
  const maxDistSq = radius * radius;
  if (distSq >= maxDistSq || distSq < 1e-4) {
    return { fx: 0, fy: 0, engaged: false };
  }
  const dist = Math.sqrt(distSq);
  const falloff = (radius - dist) / radius;
  const magnitude = falloff * falloff * strength;
  return {
    fx: (dx / dist) * magnitude,
    fy: (dy / dist) * magnitude,
    engaged: true,
  };
}

/**
 * Computes radial impulse from a click shockwave ring passing through (px, py).
 * @param {number} px - Particle X
 * @param {number} py - Particle Y
 * @param {number} wx - Wave origin X
 * @param {number} wy - Wave origin Y
 * @param {number} waveRadius - Current radius of expanding wave
 * @param {number} bandWidth - Thickness of wave front (e.g. 55)
 * @param {number} strength - Impulse strength (e.g. 2.8)
 * @returns {{ ix: number, iy: number }}
 */
export function computeShockwaveImpulse(
  px,
  py,
  wx,
  wy,
  waveRadius,
  bandWidth = 55,
  strength = 2.8
) {
  const dx = px - wx;
  const dy = py - wy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-3) return { ix: 0, iy: 0 };
  const delta = Math.abs(dist - waveRadius);
  if (delta > bandWidth) return { ix: 0, iy: 0 };
  const factor = (1 - delta / bandWidth) * strength;
  return {
    ix: (dx / dist) * factor,
    iy: (dy / dist) * factor,
  };
}

/**
 * Computes constellation line opacity between two particles given squared distance.
 * @param {number} distSq - Squared distance between particles
 * @param {number} maxDist - Maximum connection distance (e.g. 130)
 * @param {number} maxAlpha - Peak line opacity (e.g. 0.28)
 * @returns {number}
 */
export function computeConstellationAlpha(distSq, maxDist = 130, maxAlpha = 0.28) {
  const maxDistSq = maxDist * maxDist;
  if (distSq >= maxDistSq || distSq < 0) return 0;
  const ratio = 1 - Math.sqrt(distSq) / maxDist;
  return +(ratio * maxAlpha).toFixed(4);
}

/**
 * Computes target magnetic button offset when cursor approaches within threshold distance.
 * @param {number} cx - Button center X
 * @param {number} cy - Button center Y
 * @param {number} halfW - Button half width
 * @param {number} halfH - Button half height
 * @param {number} mx - Cursor X
 * @param {number} my - Cursor Y
 * @param {number} proximity - Attraction halo around button in px (default 40)
 * @param {number} pull - Pull factor (default 0.28)
 * @returns {{ tx: number, ty: number, active: boolean }}
 */
export function computeMagneticOffset(
  cx,
  cy,
  halfW,
  halfH,
  mx,
  my,
  proximity = 40,
  pull = 0.28
) {
  const dx = mx - cx;
  const dy = my - cy;
  const overX = Math.max(0, Math.abs(dx) - halfW);
  const overY = Math.max(0, Math.abs(dy) - halfH);
  const edgeDist = Math.hypot(overX, overY);

  if (edgeDist > proximity) {
    return { tx: 0, ty: 0, active: false };
  }
  const falloff = 1 - edgeDist / (proximity + 1);
  return {
    tx: dx * pull * falloff,
    ty: dy * pull * falloff,
    active: true,
  };
}
