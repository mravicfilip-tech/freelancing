// One still keyframe of the hero storyboard at 1440 by 900. Route /?board=<beatId>&k=<0|0.5|1>.
// No scroll, no pin, no animation. The frame is the wireframe from the storyboard at full size.
import { Nav } from '../ui/Nav';
import { BEATS, byId } from './beats';
import { Panel, Rail } from './panel';
import { Scene } from './scene';
import './board.css';

export function Board() {
  const q = new URLSearchParams(window.location.search);
  const beat = byId(q.get('board') ?? '') ?? BEATS[0];
  const raw = Number(q.get('k') ?? 0);
  const k = raw >= 0.75 ? 1 : raw >= 0.25 ? 0.5 : 0;
  const scene = beat.scene(k);
  return (
    <div className="bd" data-beat={beat.id} data-k={k}>
      <Scene dim={scene.dim} overlay={scene.overlay}>
        {scene.children}
      </Scene>
      <Nav theme="segment" />
      <Panel spec={beat.panel(k)} />
      <Rail active={beat.service} op={beat.rail ? beat.rail(k) : 1} />
    </div>
  );
}
