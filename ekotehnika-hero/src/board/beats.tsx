// The 14 beats of the hero storyboard, three keyframes each, as full size scenes and panel copy.
// Copy and positions follow studio/clients/ekotehnika/briefs/hero-rebuild/storyboard.html, the
// SERVICES array. Scene units are the storyboard's 360 by 225 space, see scene.tsx.
import type { ReactNode } from 'react';
import { C } from '../tokens';
import { ServiceIcon } from '../variants/v2/art';
import { MapCard } from './mapcard';
import { Big, Dots7, ModelCard, type PanelSpec } from './panel';
import { CheckRing, GROUND, Hall, LiftPlatform, Pallet, Pile, Rack, Seal, Stations, Streaks, Tag, Warn, lerp, FONT } from './scene';
import { BED, Boxed, DeliveryTruck, Fork, PalletTruckSide, PickerSide, ReachSide, Van } from './vehicles';
import { LoadSide } from '../variants/v2/art';

export type SceneOut = { children?: ReactNode; dim?: number; overlay?: ReactNode };
export type Beat = {
  id: string;
  title: string;
  service: string;
  rail?: (k: number) => number;
  panel: (k: number) => PanelSpec;
  scene: (k: number) => SceneOut;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// Easing for the live story. Every curve maps 0 to 0 and 1 to 1, so the board keyframes at k 0, 0.5
// and 1 are untouched and only the motion between them softens.
const seg = (k: number, a: number, b: number) => clamp((k - a) / (b - a));
const soft = (t: number) => t * t * (3 - 2 * t);
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
const bell = (t: number) => Math.sin(Math.PI * clamp(t));
// V2 walks through four zones. The board keyframes sit on zone 0 at k 0, zone 1 at 0.5 and zone 3 at 1,
// so the walk runs through zone 2 between them.
const zoneAt = (k: number) => (k < 0.5 ? k * 2 : 1 + (k - 0.5) * 4);
const PHONE = 'Prodaja +381 63 282-050';
const URGENT = 'Hitan servis +381 60 300 20 50';

// Reach truck, pallet truck and order picker placed by box, with their loads.
const reach = (x: number, w: number, opacity = 1, lift = 0) => (
  <Boxed x={x} w={w} x0={-182} x1={192} opacity={opacity}>
    <ReachSide lift={lift} load={lift > 0 ? <LoadSide x={68} y={4.2} kind="cartons" /> : undefined} />
  </Boxed>
);
const palletTruck = (x: number, w: number, opacity = 1, load = true) => (
  <Boxed x={x} w={w} x0={-52} x1={172} opacity={opacity}>
    <PalletTruckSide load={load} />
  </Boxed>
);
const picker = (x: number, w: number, opacity = 1, lift = 120) => (
  <Boxed x={x} w={w} x0={-182} x1={162} opacity={opacity}>
    <PickerSide lift={lift} load={<LoadSide x={20} y={4.2} kind="cartons" />} />
  </Boxed>
);

// A thin dock wall with roller doors behind the delivery truck, so the scene reads as a site.
function DockWall() {
  const doors = [166, 214, 262];
  return (
    <g>
      <rect x={140} y={92} width={222} height={GROUND - 92} fill={C.white} opacity={0.75} />
      <line x1={140} y1={92} x2={362} y2={92} stroke={C.tonedTextGrey} strokeWidth={0.35} opacity={0.45} />
      {doors.map((dx) => (
        <g key={dx}>
          <rect x={dx} y={118} width={36} height={GROUND - 118} fill={C.lightGrey} stroke={C.tonedTextGrey} strokeWidth={0.3} strokeOpacity={0.5} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={dx} y1={122 + i * 5.6} x2={dx + 36} y2={122 + i * 5.6} stroke={C.tonedTextGrey} strokeWidth={0.2} opacity={0.35} />
          ))}
        </g>
      ))}
    </g>
  );
}


// The pile of pallets with a fractional count. Pallet i drops in as n passes i, so the pile grows and
// clears without popping. Same layout as Pile in scene.tsx, five then four then three.
function SmoothPile({ n, x0 = 262, s = 0.14, base = GROUND }: { n: number; x0?: number; s?: number; base?: number }) {
  const pw = 120 * s;
  const rows = [5, 4, 3];
  const out: ReactNode[] = [];
  let c = 0;
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < rows[r]; i++, c++) {
      const a = clamp(n - c);
      if (a <= 0) continue;
      out.push(
        <g key={`${r}-${i}`} opacity={a} transform={`translate(0 ${-(1 - out3(a)) * 16})`}>
          <Pallet x={x0 + r * (pw / 2) + i * (pw + 0.2)} y={base - r * 80 * s} s={s} kind={c % 3 === 1 ? 'wrap' : 'cartons'} />
        </g>,
      );
    }
  }
  return <g>{out}</g>;
}

// The delivery truck's ramp at x 228, hinged 17 units up at the rear and 31.7 units long on the floor.
// A forklift on it is placed by its two wheels, so it tilts to the slope and both tyres stay on the
// surface. The wheel positions are the front tyre at the drawing origin and the rear one 158 units back.
const RAMP_TOP = 228;
const RAMP_FOOT = 196.3;
const surface = (x: number) => clamp((x - RAMP_FOOT) / (RAMP_TOP - RAMP_FOOT)) * BED;
function RampFork({ x, w, flip = false }: { x: number; w: number; flip?: boolean }) {
  const sc = w / 402;
  const ox = flip ? x + w - 218 * sc : x + 218 * sc;
  const xf = ox;
  const xr = flip ? ox + 158 * sc : ox - 158 * sc;
  const dy = surface(xf) - surface(xr);
  let a = Math.atan2(-dy, xf - xr) - (flip ? Math.PI : 0);
  if (a < -Math.PI) a += 2 * Math.PI;
  const mid = (surface(xf) + surface(xr)) / 2;
  return (
    <g transform={`translate(0 ${-mid}) rotate(${(a * 180) / Math.PI} ${(xf + xr) / 2} ${GROUND})`}>
      <Fork x={x} w={w} flip={flip} />
    </g>
  );
}

const tagIcon = (id: string) => (
  <g className="bd-tag-icon">
    <ServiceIcon id={id} color={C.ink} />
  </g>
);

export const BEATS: Beat[] = [
  {
    id: 'U1',
    title: 'The hall, and the four services',
    service: '',
    rail: (k) => Math.max(0, (k - 0.5) * 2),
    panel: (k) => ({
      kick: 'Zvanični Linde partner za Srbiju i Crnu Goru',
      title: ['Linde viljuškari.', 'Prodaja, najam i servis', 'na jednom mestu.'],
      bullets: ['Novi i polovni viljuškari', 'Najam od jednog dana', 'Servis širom Srbije', 'Od 1997.'],
      under: PHONE,
      cta: 'Zatražite ponudu',
      op: Math.max(0.35, Math.min(1, k * 2.5)),
      dy: (1 - Math.min(1, k * 2.5)) * 8,
    }),
    scene: (k) => ({
      children: (
        <>
          <Hall top={46} />
          <Rack x={296} h={100} seed={1} />
          <Rack x={324} h={100} seed={2} />
          <Pallet x={274} />
          <Fork x={lerp(118, 204, out3(k))} w={66} />
        </>
      ),
    }),
  },
  {
    id: 'N1',
    title: 'The season hits',
    service: 'Najam',
    panel: (k) => ({
      kick: 'Najam',
      title: ['Sezona je počela.', 'Treba vam još jedan', 'viljuškar?'],
      bullets: ['Za sezonske špiceve', 'Za jedan posao ili celu godinu', 'I za probu pre kupovine'],
      cta: 'Zatražite ponudu za najam',
      op: k === 0 ? 0.35 : 1,
    }),
    scene: (k) => ({
      children: (
        <>
          <Hall />
          <SmoothPile n={lerp(3, 12, soft(k))} />
          <Fork x={158} w={62} />
        </>
      ),
    }),
  },
  {
    id: 'N2',
    title: 'Delivered within a day',
    service: 'Najam',
    panel: (k) => ({
      kick: 'Najam',
      title: ['Isporuka za 24 sata.'],
      block: <Big num="24" unit="h" ring={k} />,
      bullets: ['Besplatna dostava i preuzimanje', 'Pregled pre isporuke', 'Održavanje uključeno'],
      cta: 'Zatražite ponudu za najam',
    }),
    scene: (k) => {
      // The truck backs in, the ramp drops, then the forklift rolls down it to the pile.
      const arrive = seg(k, 0, 0.5);
      const lx = lerp(292, 228, out3(arrive));
      const rk = soft(seg(k, 0.5, 0.7));
      const roll = soft(seg(k, 0.7, 1));
      const fx = lerp(RAMP_TOP + 22, 151, roll);
      const inside = fx >= RAMP_TOP + 4;
      return {
        children: (
          <>
            <DockWall />
            <Pile n={12} x0={154} s={0.12} base={GROUND - 5} />
            <DeliveryTruck x={lx} ramp={rk}>
              {inside && <Fork x={fx - lx} w={46} y={-BED} g={0} flip />}
            </DeliveryTruck>
            {!inside && <RampFork x={fx} w={46} flip />}
            <Streaks x={lx + 126} y={150} op={0.9 * bell(arrive)} />
            <Streaks x={fx + 48} y={160} op={0.7 * bell(roll)} />
          </>
        ),
      };
    },
  },
  {
    id: 'N3',
    title: 'The peak ends, it goes home',
    service: 'Najam',
    panel: () => ({
      kick: 'Najam',
      title: ['Posao je gotov?', 'Mi dolazimo', 'po viljuškar.'],
      bullets: ['Od nekoliko sati do godinu dana', 'Zamena viljuškara tokom najma', 'Obuka vozača na zahtev'],
      cta: 'Zatražite ponudu za najam',
    }),
    scene: (k) => {
      // The pile clears while the forklift climbs the ramp, then the ramp lifts and the truck leaves.
      const climb = soft(seg(k, 0.1, 0.5));
      const fx = lerp(162, RAMP_TOP + 22, climb);
      const rk = 1 - soft(seg(k, 0.5, 0.7));
      const go = soft(seg(k, 0.6, 1));
      const lx = lerp(228, 296, go);
      const inside = fx >= RAMP_TOP;
      return {
        children: (
          <>
            <Hall />
            <SmoothPile n={12 * (1 - soft(seg(k, 0, 0.45)))} x0={154} s={0.12} base={GROUND - 5} />
            <DeliveryTruck x={lx} ramp={rk}>
              {inside && <Fork x={fx - 228} w={46} y={-BED} g={0} />}
            </DeliveryTruck>
            {!inside && <RampFork x={fx} w={46} />}
            <Streaks x={lx - 38} y={150} op={0.9 * bell(seg(k, 0.6, 1))} />
          </>
        ),
      };
    },
  },
  {
    id: 'P1',
    title: 'Your own truck, on a budget',
    service: 'Polovni',
    panel: (k) => ({
      kick: 'Polovni',
      title: ['Hoćete svoj viljuškar,', 'a novi nije', 'u budžetu?'],
      bullets: ['Bivši najam i lizing Linde vozila', 'Linde Approved Trucks'],
      cta: 'Zatražite ponudu za polovni',
      op: k === 0 ? 0.35 : 1,
    }),
    scene: (k) => ({
      children: (
        <>
          <Fork x={lerp(134, 206, soft(k))} w={82} k={0} scuffs={lerp(0.7, 1, k)} />
        </>
      ),
    }),
  },
  {
    id: 'P2',
    title: 'Seven steps of renewal',
    service: 'Polovni',
    panel: (k) => ({
      kick: 'Polovni',
      title: ['Obnovljen', 'u 7 koraka.'],
      block: <Dots7 done={Math.round(k * 7)} />,
      bullets: ['U Linde centrima u Evropi', 'Isti postupak za svaki'],
      cta: 'Zatražite ponudu za polovni',
    }),
    scene: (k) => {
      const done = Math.round(k * 7);
      return {
        children: (
          <>
            <Stations done={done} />
            <Fork x={lerp(158, 296, k)} w={54} k={k} y={-4} scuffs={1 - k} />
          </>
        ),
      };
    },
  },
  {
    id: 'P3',
    title: 'Sealed, and in your hall',
    service: 'Polovni',
    panel: () => ({
      kick: 'Polovni',
      title: ['Garancija.'],
      block: <Big num="6/12" unit="meseci" />,
      bullets: ['6 meseci ili 500 radnih sati', 'Produživo do 12 meseci', 'Paketi za bateriju, farbu, LED'],
      cta: 'Zatražite ponudu za polovni',
    }),
    scene: (k) => {
      const s = out3(clamp(k * 2));
      const hallK = soft(Math.max(0, (k - 0.5) * 2));
      const tx = lerp(196, 214, hallK);
      const size = 32 * lerp(0.5, 1, s);
      return {
        children: (
          <>
            <g opacity={hallK}>
              <Hall />
              <Pallet x={292} />
              <Pallet x={309} kind="wrap" />
            </g>
            <Fork x={tx} w={66} />
            <Seal cx={tx + 36} cy={112} size={size} />
          </>
        ),
      };
    },
  },
  {
    id: 'V1',
    title: 'The hall grows',
    service: 'Novi',
    panel: (k) => ({
      kick: 'Novi',
      title: ['Skladište raste.', 'Da li vaš viljuškar', 'raste s njim?'],
      bullets: ['Viši regali', 'Uži prolazi', 'Više paleta svaki dan'],
      cta: 'Zatražite ponudu',
      op: k === 0 ? 0.35 : 1,
    }),
    scene: (k) => {
      const top = lerp(64, 46, soft(k));
      const h = lerp(70, 128, soft(k));
      return {
        children: (
          <>
            <Hall top={top} />
            {[0, 1, 2, 3].map((i) => (
              <Rack key={i} x={232 + i * 29} h={h} w={22} seed={i + 1} />
            ))}
            <Fork x={158} w={54} />
          </>
        ),
      };
    },
  },
  {
    id: 'V2',
    title: 'One job, one model',
    service: 'Novi',
    panel: (k) => ({
      kick: 'Novi',
      title: ['96 Linde modela.', 'Ponuda po vašoj meri.'],
      bullets: ['Čeoni viljuškari', 'Retrak viljuškari', 'Paletari i slagači', 'Komisioneri'],
      bold: Math.round(zoneAt(k)),
      chip: { text: 'Elektro, dizel i TNG' },
      cta: 'Zatražite ponudu',
    }),
    scene: (k) => {
      const zf = zoneAt(k);
      const xs = [156, 204, 252, 300];
      const lab = ['Dvorište', 'Regali', 'Utovar', 'Prolaz'];
            return {
        children: (
          <>
            <g opacity={0.4}>
              <Rack x={206} h={104} w={20} seed={2} />
              <Rack x={304} h={104} w={20} seed={3} />
            </g>
            {[
              <Fork key="a" x={xs[0]} w={46} />,
              reach(xs[1], 44),
              palletTruck(xs[2], 40),
              picker(xs[3], 44),
            ].map((node, i) => (
              <g key={i}>
                <g opacity={0.4} filter="url(#bd-ghost)">
                  {node}
                </g>
                <g opacity={soft(clamp(1 - Math.abs(zf - i)))}>{node}</g>
              </g>
            ))}
            {lab.map((l, i) => (
              <g key={l}>
                <rect x={xs[i] + 3} y={GROUND + 4} width={38} height={0.9} rx={0.45} fill={Math.round(zf) === i ? C.ink : C.textGrey} opacity={lerp(0.3, 1, clamp(1 - Math.abs(zf - i)))} />
                <text x={xs[i] + 22} y={GROUND + 11.6} textAnchor="middle" fontFamily={FONT} fontSize={3.6} fontWeight={Math.round(zf) === i ? 600 : 400} fill={Math.round(zf) === i ? C.ink : C.textGrey}>
                  {l}
                </text>
              </g>
            ))}
          </>
        ),
      };
    },
  },
  {
    id: 'V3',
    title: 'A real model, a real spec',
    service: 'Novi',
    panel: () => ({
      kick: 'Novi, akcija',
      title: ['Linde MT15 C', 'elektro paletar.'],
      block: <ModelCard />,
      cta: 'Zatražite ponudu',
    }),
    scene: (k) => ({
      children: (
        <>
          <Hall />
          {palletTruck(lerp(166, 262, soft(k)), 62, 1, true)}
        </>
      ),
    }),
  },
  {
    id: 'S1',
    title: 'The line stops',
    service: 'Servis',
    panel: (k) => ({
      kick: 'Servis',
      title: ['Viljuškar je stao.', 'Stao je i posao.'],
      bullets: ['Hitne intervencije', 'Servisna vozila širom Srbije'],
      chip: { text: URGENT, dark: true },
      cta: 'Zakažite servis',
      op: k === 0 ? 0.35 : 1,
    }),
    scene: (k) => {
      // The truck brakes to a stop by k 0.5, the sign pops in as it stops, then its rings spread.
      const brake = seg(k, 0, 0.5);
      const x = lerp(164, 200, out3(brake));
      const sign = soft(seg(k, 0.3, 0.5));
      const ring = out3(seg(k, 0.5, 1));
      const wx = x + 38;
      const wy = 118;
      const wh = 26;
      return {
        dim: k * 0.08,
        children: (
          <>
            <Hall />
            <Pile n={8} x0={270} />
            <Fork x={x} w={66} />
            <Streaks x={x - 30} y={152} op={1 - brake} />
            {ring > 0 &&
              [1, 2].map((i) => (
                <circle key={i} cx={wx} cy={wy + wh * 0.08} r={wh * (0.5 + (0.28 + i * 0.3) * ring)} fill="none" stroke={C.ink} strokeWidth={0.45} opacity={(0.34 / i) * ring} />
              ))}
            {sign > 0 && (
              <g opacity={sign} transform={`translate(${wx} ${wy}) scale(${0.7 + 0.3 * sign}) translate(${-wx} ${-wy})`}>
                <Warn cx={wx} cy={wy} size={wh} />
              </g>
            )}
          </>
        ),
      };
    },
  },
  {
    id: 'S2',
    title: 'A van is on the way',
    service: 'Servis',
    panel: () => ({
      kick: 'Servis',
      title: ['Servis dolazi', 'do vas.'],
      bullets: ['Servisna vozila širom Srbije', 'Hitne intervencije', 'Servis i drugih marki'],
      chip: { text: URGENT, dark: true },
      cta: 'Zakažite servis',
    }),
    scene: (k) => ({ overlay: <MapCard k={k} /> }),
  },
  {
    id: 'S3',
    title: 'Pit stop, then back to work',
    service: 'Servis',
    panel: () => ({
      kick: 'Servis',
      title: ['Kao pit stop.', 'Nazad na posao.'],
      bullets: ['Redovno održavanje', 'Ugovori o punom servisu', 'Zakonski pregledi', '300+ tipova, i drugih marki'],
      cta: 'Zakažite servis',
    }),
    scene: (k) => {
      const out = soft(seg(k, 0.66, 1));
      const lift = lerp(14, 0, out);
      const ticks = Math.min(1, k * 1.5) * 5;
      const x = lerp(212, 300, out);
      const deck = 3.4 + lift + 3;
      const rings: [number, number][] = [[-46, 30], [-27, 6], [0, -3], [27, 6], [46, 30]];
      return {
        children: (
          <>
            <LiftPlatform x={198} w={98} lift={lift} />
            <Fork x={x} w={58} y={-lerp(deck, 0, out)} />
            <Streaks x={x - 34} y={150} op={0.9 * bell(seg(k, 0.66, 1))} />
            <g opacity={1 - soft(seg(k, 0.8, 1))}>
              {rings.map(([dx, dy], i) => {
                const a = soft(seg(ticks, i + 0.1, i + 0.5));
                return (
                  <g key={i}>
                    <g opacity={1 - a}>
                      <CheckRing cx={247 + dx} cy={dy + 80} done={false} />
                    </g>
                    {a > 0 && (
                      <g opacity={a}>
                        <CheckRing cx={247 + dx} cy={dy + 80} done />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </>
        ),
      };
    },
  },
  {
    id: 'K1',
    title: 'Four trucks, four services',
    service: '',
    rail: () => 1,
    panel: () => ({
      kick: 'Ekotehnika',
      title: ['Najam, polovni,', 'novi i servis.', 'Jedan partner.'],
      bullets: ['Od 1997.', '1.000+ klijenata', 'Zvanični Linde partner'],
      under: PHONE,
      cta: 'Zatražite ponudu',
    }),
    scene: (k) => {
      // The four trucks arrive one after another, 0 is always there, the rest rise in at these windows.
      const win = [1, soft(seg(k, 0.05, 0.25)), soft(seg(k, 0.3, 0.5)), soft(seg(k, 0.7, 0.9))];
      const TY = 104;
      const w = (label: string) => label.length * 2.2 + 11;
      const items: { node: ReactNode; tag: ReactNode; cx: number; top: number }[] = [
        { cx: 156 + 23, top: 163, node: <Fork key="a" x={156} w={46} />, tag: <Tag key="ta" x={156 + 23 - w('Najam') / 2} y={TY} label="Najam" icon={tagIcon('najam')} /> },
        { cx: 206 + 21, top: 141, node: <g key="b">{reach(206, 42)}</g>, tag: <Tag key="tb" x={206 + 21 - w('Novi') / 2} y={TY} label="Novi" icon={tagIcon('novi')} /> },
        {
          cx: 256 + 23,
          top: 163,
          node: (
            <g key="c">
              <Fork x={256} w={46} />
              <Seal cx={256 + 42} cy={141} size={9} />
            </g>
          ),
          tag: <Tag key="tc" x={256 + 23 - w('Polovni') / 2} y={TY} label="Polovni" icon={tagIcon('polovni')} />,
        },
        { cx: 304 + 22, top: 166, node: <Van key="d" x={304} w={44} />, tag: <Tag key="td" x={304 + 22 - w('Servis') / 2} y={TY} label="Servis" icon={tagIcon('servis')} /> },
      ];
      return {
        children: (
          <>
            <Hall />
            {items.map((i, j) =>
              win[j] > 0 ? (
                <g key={i.cx} opacity={win[j]} transform={`translate(0 ${(1 - win[j]) * 8})`}>
                  <line x1={i.cx} y1={TY + 7.4} x2={i.cx} y2={i.top - 5} stroke={C.tonedTextGrey} strokeWidth={0.25} strokeDasharray="0.1 1.1" strokeLinecap="round" opacity={0.8} />
                  {i.node}
                  {i.tag}
                </g>
              ) : null,
            )}
          </>
        ),
      };
    },
  },
];

export const byId = (id: string) => BEATS.find((b) => b.id === id);
