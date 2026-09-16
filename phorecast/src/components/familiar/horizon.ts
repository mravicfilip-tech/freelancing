// The WebGL horizon layer.
//
// Loads three on demand, probes for a context, and adds a canvas inside the
// band that screens the halftone/dither stack over the CSS glow. Every failure
// path is silent and leaves the static design untouched: no context, a throwing
// renderer, a lost context or reduced motion all simply mean no canvas.

import type { WebGLRenderer, ShaderMaterial, Mesh, Scene, OrthographicCamera } from 'three';
import vertexShader from './shaders/horizon.vert.glsl?raw';
import fragmentShader from './shaders/horizon.frag.glsl?raw';

export interface HorizonLayer {
  readonly canvas: HTMLCanvasElement;
  /** Draw one frame. `bloom` is the entrance, `breath` the slow swell (-1..1). */
  render(time: number, bloom: number, breath: number): void;
  dispose(): void;
}

/** A throwaway context, released at once so it does not count against the limit. */
function hasWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return false;
    (gl.getExtension('WEBGL_lose_context') as { loseContext(): void } | null)?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the layer inside `band`, under `chips` so the pills stay on top.
 * Resolves to null whenever WebGL is unavailable — the caller keeps the CSS glow.
 */
export async function createHorizon(band: HTMLElement, chips: HTMLElement | null): Promise<HorizonLayer | null> {
  if (!hasWebGL()) return null;

  let THREE: typeof import('three');
  try {
    THREE = await import('three');
  } catch {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'fam__horizon-gl';
  canvas.setAttribute('aria-hidden', 'true');
  // Styled from here rather than the stylesheet: the element only exists when the
  // shader does, so the static design has nothing to carry.
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
    mixBlendMode: 'screen',
  } satisfies Partial<CSSStyleDeclaration>);

  let renderer: WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) {
    renderer.dispose();
    return null;
  }

  const scene: Scene = new THREE.Scene();
  const camera: OrthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material: ShaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uBloom: { value: 0 },
      uBreath: { value: 0 },
      uCrest: { value: 37 },
      uRx: { value: 3018 },
      uRy: { value: 1334 },
      uWarm: { value: new THREE.Color('#fff3e4') },
      uDeep: { value: new THREE.Color('#d1541c') },
    },
  });
  const mesh: Mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const size = () => {
    const w = Math.max(1, Math.round(band.clientWidth));
    const h = Math.max(1, Math.round(band.clientHeight));
    // One design pixel, the unit the stylesheet places the ellipse in.
    const u = w / 1920;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    material.uniforms.uRes.value.set(w, h);
    material.uniforms.uCrest.value = 37 * u;
    material.uniforms.uRx.value = 3018 * u;
    material.uniforms.uRy.value = 1334 * u;
  };
  size();

  const observer = new ResizeObserver(size);
  observer.observe(band);

  let lost = false;
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    canvas.style.display = 'none';
  };
  canvas.addEventListener('webglcontextlost', onLost);

  band.insertBefore(canvas, chips);

  return {
    canvas,
    render(time, bloom, breath) {
      if (lost) return;
      material.uniforms.uTime.value = time;
      material.uniforms.uBloom.value = bloom;
      material.uniforms.uBreath.value = breath;
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
