import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * The sign-in panel's art, in WebGL: the site's rings and dot field, alive.
 * An orthographic scene in screen pixels. A grid of points carries a wave
 * that rolls out from the top-right corner, with a brighter pulse every
 * few seconds; seven rings breathe around that corner and a ripple runs
 * out through them; an indigo glow sits at the source; the whole field
 * leans a little toward the pointer. Reduced motion renders one frame.
 */
const SPACING = 22;
const LAVENDER = new THREE.Color('#b3b5f5');
const INK = new THREE.Color('#122433');
const INDIGO = new THREE.Color('#4042d2');

const VERT = /* glsl */ `
  attribute float aDist;
  uniform float uTime, uPulse, uSize, uAlpha;
  varying float vA;
  void main() {
    float wave = 0.5 + 0.5 * sin(aDist * 0.045 - uTime * 1.5);
    float env = exp(-aDist * 0.0016);
    float pulse = exp(-pow((aDist - uPulse) / 30.0, 2.0));
    vA = (0.08 + 0.34 * wave * env + 0.6 * pulse * (0.3 + env)) * uAlpha;
    gl_PointSize = uSize * (1.0 + pulse * 1.4);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.28, d);
    gl_FragColor = vec4(uColor, a * vA);
  }
`;

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(64,66,210,0.75)');
  grad.addColorStop(0.35, 'rgba(64,66,210,0.35)');
  grad.addColorStop(1, 'rgba(64,66,210,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** `light`: ink dots and indigo rings on the light panel, and no glow, since the panel's own flares carry the colour there. */
export function AuthScene({ light = false }: { light?: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100);
    camera.position.z = 10;
    const world = new THREE.Group();
    scene.add(world);

    // the source: where the rings come from, near the top-right corner
    const origin = new THREE.Vector2(0, 0);
    let w = 0, h = 0;

    // rings
    const rings = new THREE.Group();
    world.add(rings);
    const ringMats: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < 7; i++) {
      const r = 110 + i * 112;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 180; k++) {
        const a = (k / 180) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: light ? INDIGO : LAVENDER, transparent: true, opacity: (0.55 - i * 0.065) * (light ? 0.75 : 1) });
      ringMats.push(mat);
      rings.add(new THREE.LineLoop(geo, mat));
    }
    // the ripple: one more ring, run out through the others
    const rippleGeo = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 181 }, (_, k) => new THREE.Vector3(Math.cos((k / 180) * Math.PI * 2), Math.sin((k / 180) * Math.PI * 2), 0)),
    );
    const rippleMat = new THREE.LineBasicMaterial({ color: light ? INDIGO : LAVENDER, transparent: true, opacity: 0 });
    const ripple = new THREE.LineLoop(rippleGeo, rippleMat);
    world.add(ripple);

    // the glow at the source
    // Double-sided: the camera's flipped y reverses winding, and a culled quad is an invisible glow.
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat);
    glow.visible = !light;
    world.add(glow);

    // the dot field
    const uniforms = { uTime: { value: 0 }, uPulse: { value: 0 }, uSize: { value: 2.4 * dpr }, uAlpha: { value: light ? 0.55 : 1 }, uColor: { value: light ? INK : LAVENDER } };
    const dotMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
    let dots: THREE.Points | null = null;

    const layout = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h;
      camera.updateProjectionMatrix();
      origin.set(w - 60, 80);
      rings.position.set(origin.x, origin.y, 0);
      ripple.position.set(origin.x, origin.y, 0);
      glow.position.set(origin.x, origin.y, -1);
      glow.scale.set(Math.max(w, h) * 0.9, Math.max(w, h) * 0.9, 1);
      if (dots) { world.remove(dots); dots.geometry.dispose(); }
      const cols = Math.ceil(w / SPACING) + 1, rows = Math.ceil(h / SPACING) + 1;
      const pos = new Float32Array(cols * rows * 3);
      const dist = new Float32Array(cols * rows);
      let n = 0;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const px = x * SPACING + 6, py = y * SPACING + 6;
        pos[n * 3] = px; pos[n * 3 + 1] = py; pos[n * 3 + 2] = 0;
        dist[n] = Math.hypot(px - origin.x, py - origin.y);
        n++;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aDist', new THREE.BufferAttribute(dist, 1));
      dots = new THREE.Points(geo, dotMat);
      world.add(dots);
    };
    layout();
    const ro = new ResizeObserver(() => { layout(); if (reduced) render(0); });
    ro.observe(el);

    // the lean toward the pointer
    const target = new THREE.Vector2();
    const lean = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width - 0.5) * -18, ((e.clientY - r.top) / r.height - 0.5) * -18);
    };
    const onLeave = () => target.set(0, 0);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    const render = (t: number) => {
      uniforms.uTime.value = t;
      uniforms.uPulse.value = (t * 170) % Math.max(w, h) * 1.4;
      const breathe = 1 + Math.sin(t * 0.7) * 0.015;
      rings.scale.set(breathe, breathe, 1);
      ringMats.forEach((m, i) => { m.opacity = (0.55 - i * 0.065) * (light ? 0.75 : 1) * (0.85 + 0.15 * Math.sin(t * 0.9 + i * 0.6)); });
      const rp = (t % 8) / 8;
      const rr = 60 + rp * Math.max(w, h) * 1.5;
      ripple.scale.set(rr, rr, 1);
      rippleMat.opacity = (rp < 0.08 ? rp / 0.08 * 0.7 : Math.max(0, 0.7 * (1 - (rp - 0.08) / 0.7))) * (light ? 0.7 : 1);
      glowMat.opacity = 0.85 + 0.15 * Math.sin(t * 0.8);
      lean.lerp(target, 0.06);
      world.position.set(lean.x, lean.y, 0);
      renderer.render(scene, camera);
    };

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      render((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    if (reduced) render(0);
    else raf = requestAnimationFrame(loop);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      renderer.dispose();
      dotMat.dispose();
      rippleGeo.dispose();
      ringMats.forEach((m) => m.dispose());
      rings.children.forEach((c) => (c as THREE.LineLoop).geometry.dispose());
      glowMat.map?.dispose();
      glowMat.dispose();
      glow.geometry.dispose();
      renderer.domElement.remove();
    };
  }, [light]);

  return <div ref={host} className="auth__scene" aria-hidden="true" />;
}
