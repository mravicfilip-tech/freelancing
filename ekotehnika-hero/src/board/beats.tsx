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
          <Fork x={lerp(118, 204, k)} w={66} />
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
          <Pile n={Math.round(lerp(3, 12, k))} />
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
      const lx = k < 0.5 ? lerp(292, 228, k * 2) : 228;
      const rk = k < 0.5 ? 0 : Math.min(1, (k - 0.5) * 3);
      const out = k >= 1;
      return {
        children: (
          <>
            <DockWall />
            <Pile n={12} x0={154} s={0.12} base={GROUND - 5} />
            <DeliveryTruck x={lx} ramp={rk}>
              {!out && <Fork x={22} w={46} y={-BED} g={0} flip />}
            </DeliveryTruck>
            {out && <Fork x={151} w={46} flip />}
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
      const lx = k <= 0.5 ? 228 : lerp(228, 296, (k - 0.5) * 2);
      const rk = k <= 0.5 ? 1 : 1 - (k - 0.5) * 2;
      const inside = k >= 0.5;
      return {
        children: (
          <>
            <Hall />
            <Pile n={Math.round(lerp(12, 0, Math.min(1, k * 2)))} x0={154} s={0.12} base={GROUND - 5} />
            <DeliveryTruck x={lx} ramp={rk}>
              {inside && <Fork x={22} w={46} y={-BED} g={0} />}
            </DeliveryTruck>
            {!inside && <Fork x={162} w={46} />}
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
          <Fork x={lerp(134, 206, k)} w={82} k={0} scuffs={lerp(0.7, 1, k)} />
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
            <Fork x={lerp(158, 296, k)} w={54} k={done / 7} y={-4} scuffs={1 - done / 7} />
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
      const s = clamp(k * 2);
      const hallK = Math.max(0, (k - 0.5) * 2);
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
      const top = lerp(64, 46, k);
      const h = lerp(70, 128, k);
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
      bold: k === 0 ? 0 : k < 1 ? 1 : 3,
      chip: { text: 'Elektro, dizel i TNG' },
      cta: 'Zatražite ponudu',
    }),
    scene: (k) => {
      const z = k === 0 ? 0 : k < 1 ? 1 : 3;
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
              <g key={i} opacity={i === z ? 1 : 0.4} filter={i === z ? undefined : 'url(#bd-ghost)'}>
                {node}
              </g>
            ))}
            {lab.map((l, i) => (
              <g key={l}>
                <rect x={xs[i] + 3} y={GROUND + 4} width={38} height={0.9} rx={0.45} fill={i === z ? C.ink : C.textGrey} opacity={i === z ? 1 : 0.3} />
                <text x={xs[i] + 22} y={GROUND + 11.6} textAnchor="middle" fontFamily={FONT} fontSize={3.6} fontWeight={i === z ? 600 : 400} fill={i === z ? C.ink : C.textGrey}>
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
          {palletTruck(lerp(166, 262, k), 62, 1, true)}
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
      const x = k < 0.5 ? lerp(164, 200, k * 2) : 200;
      return {
        dim: k * 0.08,
        children: (
          <>
            <Hall />
            <Pile n={8} x0={270} />
            <Fork x={x} w={66} />
            {k < 0.5 ? <Streaks x={x - 30} y={152} op={1 - k * 2} /> : <Warn cx={x + 38} cy={118} size={26} pulse={k === 1 ? 1 : 0} />}
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
      const out = clamp((k - 0.66) * 3);
      const lift = k < 0.66 ? 14 : lerp(14, 0, out);
      const done = Math.round(Math.min(1, k * 1.5) * 5);
      const x = k < 0.66 ? 212 : lerp(212, 300, out);
      const deck = 3.4 + lift + 3;
      const rings: [number, number][] = [[-46, 30], [-27, 6], [0, -3], [27, 6], [46, 30]];
      return {
        children: (
          <>
            <LiftPlatform x={198} w={98} lift={lift} />
            <Fork x={x} w={58} y={-lerp(deck, 0, out)} />
            {k < 1 && rings.map(([dx, dy], i) => <CheckRing key={i} cx={247 + dx} cy={dy + 80} done={i < done} />)}
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
      const n = 1 + Math.round(k * 3);
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
      const leaders = items.slice(0, n).map((i) => <line key={`l${i.cx}`} x1={i.cx} y1={TY + 7.4} x2={i.cx} y2={i.top - 5} stroke={C.tonedTextGrey} strokeWidth={0.25} strokeDasharray="0.1 1.1" strokeLinecap="round" opacity={0.8} />);
      return {
        children: (
          <>
            <Hall />
            {leaders}
            {items.slice(0, n).map((i) => i.node)}
            {items.slice(0, n).map((i) => i.tag)}
          </>
        ),
      };
    },
  },
];

export const byId = (id: string) => BEATS.find((b) => b.id === id);
