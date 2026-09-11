import type * as THREE from 'three';

export interface TreatmentContext {
  /** Rotates with rest + idle + pointer + scroll; scaled to the mark's height in pixels by its parent. */
  pivot: THREE.Group;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
}

/** What the scene knows each frame; treatments read it, never write it. */
export interface FrameState {
  /** Entrance, 0-1. */
  progress: number;
  /** Seconds since the loop started. */
  time: number;
  /** ScrollTrigger progress, 0-1. */
  scroll: number;
  /** Smoothed pointer, -1..1 across the host. */
  pointer: THREE.Vector2;
  /** The mark's height in CSS pixels (the pivot's scale). */
  size: number;
  dpr: number;
  /** Drawing-buffer size in device pixels. */
  resolution: THREE.Vector2;
  /** Camera distance to the mark's centre, CSS pixels. */
  viewDist: number;
}

export interface Treatment {
  /** Physically based: colour management on, sRGB output, ACES tone mapping, MSAA. Off for the raw-hex line/point shaders. */
  readonly physical: boolean;
  readonly maxPixelRatio: number;
  /** 'draw': the mark appears in its final pose. 'rise': it turns and lifts into place as it appears. */
  readonly entrance: 'draw' | 'rise';
  build(ctx: TreatmentContext): void;
  /** After a resize: pixel-dependent uniforms, size-dependent material values. */
  layout(f: FrameState): void;
  /** Every frame, after the scene has posed the pivot. */
  update(f: FrameState): void;
  dispose(): void;
}
