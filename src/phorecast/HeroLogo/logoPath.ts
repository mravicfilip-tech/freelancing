import * as THREE from 'three';

/** The Phorecast mark, as supplied: a single closed path in a 652 × 761 box. */
export const LOGO_VIEWBOX = { width: 652, height: 761 };
export const LOGO_PATH =
  'M338.749 0.00531647C379.696 0.124545 420.228 8.2784 458.063 24.0198C496.179 39.8779 530.812 63.1224 559.985 92.4242C589.157 121.727 612.298 156.516 628.086 194.801C643.874 233.086 652 274.12 652 315.559C652 356.999 643.874 398.032 628.086 436.318C612.298 474.603 589.157 509.389 559.985 538.692C530.812 567.994 496.179 591.238 458.063 607.096C420.228 622.838 379.696 630.991 338.749 631.111V761C294.264 761 250.216 752.197 209.117 735.098C168.018 717.999 130.672 692.936 99.2165 661.34C67.7612 629.745 42.8082 592.235 25.7847 550.954C8.76125 509.673 8.26198e-05 465.428 0 420.746V131.713H131.128V420.746H131.538C131.538 448.078 136.898 475.143 147.311 500.394C157.724 525.646 172.989 548.59 192.23 567.916C211.471 587.243 234.313 602.575 259.453 613.035C284.313 623.378 310.937 628.751 337.839 628.87V499.036C361.826 499.036 385.579 494.29 407.74 485.07C429.902 475.849 450.041 462.335 467.003 445.297C483.965 428.26 497.42 408.034 506.6 385.774C515.779 363.514 520.504 339.654 520.504 315.559C520.504 291.465 515.78 267.605 506.6 245.345C497.42 223.085 483.965 202.859 467.003 185.821C450.041 168.784 429.902 155.269 407.74 146.049C385.579 136.829 361.827 132.083 337.839 132.082V131.713H131.128V0H338.749V0.00531647Z';

/** Minimal SVG path-data reader: M/L/H/V/C/Z, absolute and relative — all the mark uses. */
function parsePath(d: string): THREE.Path {
  const path = new THREE.Path();
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    switch (cmd) {
      case 'M': x = num(); y = num(); path.moveTo(x, y); sx = x; sy = y; cmd = 'L'; break;
      case 'm': x += num(); y += num(); path.moveTo(x, y); sx = x; sy = y; cmd = 'l'; break;
      case 'L': x = num(); y = num(); path.lineTo(x, y); break;
      case 'l': x += num(); y += num(); path.lineTo(x, y); break;
      case 'H': x = num(); path.lineTo(x, y); break;
      case 'h': x += num(); path.lineTo(x, y); break;
      case 'V': y = num(); path.lineTo(x, y); break;
      case 'v': y += num(); path.lineTo(x, y); break;
      case 'C': {
        const c1x = num(), c1y = num(), c2x = num(), c2y = num();
        x = num(); y = num();
        path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
        break;
      }
      case 'c': {
        const c1x = x + num(), c1y = y + num(), c2x = x + num(), c2y = y + num();
        x += num(); y += num();
        path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
        break;
      }
      case 'Z':
      case 'z': path.closePath(); x = sx; y = sy; cmd = ''; break;
      default: i++; // unsupported command: skip the token rather than loop forever
    }
  }
  return path;
}

/**
 * The mark's outline as `samples` evenly spaced points, centred on the origin, height 1, y up.
 * Even spacing (arc length, not curve parameter) keeps the ribs and the travelling pulse uniform.
 */
export function logoOutline(samples: number): THREE.Vector2[] {
  const path = parsePath(LOGO_PATH);
  const { width, height } = LOGO_VIEWBOX;
  const s = 1 / height;
  // getSpacedPoints returns samples + 1 points, the last one closing the loop.
  return path
    .getSpacedPoints(samples)
    .slice(0, samples)
    .map((p) => new THREE.Vector2((p.x - width / 2) * s, (height / 2 - p.y) * s));
}
