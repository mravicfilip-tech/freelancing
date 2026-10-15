// BullHill's own work photos, sent by Filip on 14 October 2026. Orientation fixed and every
// metadata field stripped, location included. The four small ones (route-trench-village and the
// three square shots) were upscaled four times with Real-ESRGAN general x4v3 on CPU, then cut to
// the widths below as WebP, with one 1280 JPEG as the fallback.
// The second set, ducts-trench to site-setup, came from Dusan by mail on 15 October 2026. Display P3
// converted to sRGB, the GPS camera stamp cropped off the bottom of four, a number plate and a rental
// label blurred, every metadata field stripped, cut the same way.
import type { Lang } from './content';

export type PhotoId =
  | 'route-trench-village'
  | 'ducts-fence'
  | 'ducts-soil'
  | 'excavator-street'
  | 'restored-lane'
  | 'restored-manhole'
  | 'restored-wall'
  | 'ducts-trench'
  | 'crew-dusk'
  | 'road-crew'
  | 'restored-path'
  | 'restored-fence'
  | 'dumper-dusk'
  | 'site-setup';

type PhotoMeta = { w: number; h: number; widths: number[]; focal: string; alt: Record<Lang, string> };

export const PHOTOS: Record<PhotoId, PhotoMeta> = {
  'route-trench-village': {
    w: 3600, h: 4952, widths: [640, 1280, 1920, 2560, 2880], focal: '50% 50%',
    alt: { en: 'Open trench with green and orange ducts along a village road, a dumper and road barriers behind, mountains on the horizon', de: 'Offener Graben mit grünen und orangen Rohren entlang einer Ortsstraße, dahinter ein Dumper und Absperrungen, Berge am Horizont' },
  },
  'ducts-fence': {
    w: 3024, h: 4032, widths: [640, 1280, 1920, 2560], focal: '50% 62%',
    alt: { en: 'Bundle of green and orange ducts in a trench along a wooden garden fence', de: 'Bündel grüner und oranger Rohre in einem Graben entlang eines Holzzauns' },
  },
  'ducts-soil': {
    w: 5528, h: 5608, widths: [640, 1280, 1920, 2560], focal: '50% 50%',
    alt: { en: 'Green and orange ducts on the bed of a trench dug through grass and soil', de: 'Grüne und orange Rohre auf der Sohle eines Grabens durch Wiese und Erdreich' },
  },
  'excavator-street': {
    w: 2160, h: 3840, widths: [640, 1280, 1920, 2160], focal: '50% 46%',
    alt: { en: 'Mini excavator working on a village street behind red and white road barriers', de: 'Minibagger bei der Arbeit auf einer Ortsstraße hinter rot-weißen Absperrungen' },
  },
  'restored-lane': {
    w: 2267, h: 3190, widths: [640, 1280, 1920, 2267], focal: '50% 62%',
    alt: { en: 'Closed and resurfaced trench crossing a farm lane, fields and mountains behind', de: 'Geschlossener und neu befestigter Graben quer über einen Feldweg, dahinter Wiesen und Berge' },
  },
  'restored-manhole': {
    w: 5528, h: 5580, widths: [640, 1280, 1920, 2560], focal: '50% 60%',
    alt: { en: 'Pavement restored along the street around a manhole cover', de: 'Wiederhergestellter Gehweg entlang der Straße rund um einen Schachtdeckel' },
  },
  'restored-wall': {
    w: 5528, h: 5596, widths: [640, 1280, 1920, 2560], focal: '50% 56%',
    alt: { en: 'Restored strip along the kerb of a village street', de: 'Wiederhergestellter Streifen entlang der Bordsteinkante einer Ortsstraße' },
  },
  'ducts-trench': {
    w: 2634, h: 2580, widths: [640, 1280, 1920, 2560], focal: '45% 55%',
    alt: { en: 'Green and orange ducts on the bed of a deep trench, a measuring staff standing in it', de: 'Grüne und orange Rohre auf der Sohle eines tiefen Grabens, darin eine Messlatte' },
  },
  'crew-dusk': {
    w: 3024, h: 4032, widths: [640, 1280, 1920, 2560], focal: '50% 58%',
    alt: { en: 'Crew, a flatbed truck and a dumper at work along a village road under an orange evening sky', de: 'Mannschaft, Pritschenwagen und Dumper bei der Arbeit an einer Ortsstraße unter orangem Abendhimmel' },
  },
  'road-crew': {
    w: 2721, h: 2580, widths: [640, 1280, 1920, 2560], focal: '45% 55%',
    alt: { en: 'Mini excavator and yellow dumper at work on a village street behind red and white barriers, mountains behind', de: 'Minibagger und gelber Dumper bei der Arbeit auf einer Ortsstraße hinter rot-weißen Absperrungen, dahinter Berge' },
  },
  'restored-path': {
    w: 2591, h: 2580, widths: [640, 1280, 1920, 2560], focal: '50% 62%',
    alt: { en: 'Restored path along a village road, a small dumper parked beside it, mountains behind', de: 'Wiederhergestellter Gehweg entlang einer Ortsstraße, daneben ein kleiner Dumper, dahinter Berge' },
  },
  'restored-fence': {
    w: 3024, h: 4032, widths: [640, 1280, 1920, 2560], focal: '50% 62%',
    alt: { en: 'Freshly restored verge along a new wooden fence', de: 'Frisch wiederhergestelltes Bankett entlang eines neuen Holzzauns' },
  },
  'dumper-dusk': {
    w: 3024, h: 4032, widths: [640, 1280, 1920, 2560], focal: '50% 62%',
    alt: { en: 'Dumper coming down a village lane at dusk under an orange sky, mountains behind', de: 'Dumper auf einer Dorfstraße in der Abenddämmerung unter orangem Himmel, dahinter Berge' },
  },
  'site-setup': {
    w: 2721, h: 2580, widths: [640, 1280, 1920, 2560], focal: '50% 60%',
    alt: { en: 'Road works signs and barriers set up on a village road before the dig, mountains behind', de: 'Baustellenschilder und Absperrungen auf einer Ortsstraße vor dem Graben, dahinter Berge' },
  },
};

export function photoAlt(id: PhotoId, lang: Lang) {
  return PHOTOS[id].alt[lang];
}
