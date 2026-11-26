// The blog's posts, Filip 26 November, "add blog, add blog single pages, draft images from drive for blog" (briefs/blog/plan.md, taste
// 2026-11-26 13:06). Four drafts on topics the old blog never covered, each one says only what its photos and the Linde files in the
// client's Drive show, and carries a note of what Ekotehnika still has to add. The old posts come in later at their old addresses, with
// their dates. The photos are from the Drive, picked per post, each once on a page, no posed people (briefs/blog/plan.md, Picks).
import type { Tema } from './Contact';
import { POST_SLUGS } from './blogSlugs';

export type Block =
  | { t: 'h'; id: string; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'pic'; src: string; alt: string; cap: string; contain?: boolean }
  | { t: 'table'; rows: [string, string][]; cap: string };

// the card in the fourth frame, the shop category or the service the post leads to, with the page's one red button
// a card with a shop category takes its name, its count and its capacities from the shop's own data (Blog.tsx)
export type PostCard = { label: string; cta: string } & ({ cat: string } | { title: string; line: string; href: string });

export type Post = {
  slug: (typeof POST_SLUGS)[number];
  cat: string;
  title: string;
  lede: string;
  date: string | null;
  draft: string | null;
  lead: { src: string; alt: string; focus?: string } | null;
  card: PostCard;
  tema: Tema;
  ask: { title: string; poruka: string; cta: string };
  body: Block[];
};

const askHref = (tema: Tema, poruka: string) => `/kontakt?tema=${tema}&poruka=${encodeURIComponent(poruka)}`;

export const POSTS: Post[] = [
  {
    slug: 'linde-safety-guard',
    cat: 'Bezbednost',
    title: 'Linde Safety Guard, upozorenje pre opasne situacije',
    lede: 'Sistem koji vozača viljuškara i pešaka na vreme upozorava na opasnost, svetlom, vibracijom i zvukom.',
    date: null,
    draft: 'Nacrt. Tekst je napisan iz Lindeovog letka za interaktivni prsluk i prezentacije za Reverse Assist Radar iz Ekotehnikinog foldera. Ekotehnika proverava podatke i dopisuje da li sistem nudi uz polovne viljuškare.',
    lead: { src: '/blog/linde-safety-guard-1.webp', alt: 'Linde uređaj sa svetlećim znakom upozorenja na zidu hale, viljuškar u prolazu iza njega' },
    card: { label: 'Bezbednost', title: 'Safety Guard za vaše viljuškare', line: 'Ponuda za sistem, prsluke i radar uz novi viljuškar.', href: askHref('kupovina', 'Zanima me Linde Safety Guard.'), cta: 'Zatražite ponudu' },
    tema: 'kupovina',
    ask: { title: 'Recite nam koliko viljuškara i ljudi radi u istom prostoru.', poruka: 'Zanima me Linde Safety Guard.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'zone', text: 'Zone upozorenja oko viljuškara' },
      { t: 'p', text: 'Linde Safety Guard oko svakog viljuškara postavlja zone upozorenja. Zone se podešavaju pojedinačno, za svako vozilo i svaki posao, a položaj se meri sa tačnošću od 10 cm.' },
      { t: 'p', text: 'Kada se pešak i viljuškar nađu preblizu, upozorenje stiže na vreme, i vozaču i pešaku.' },
      { t: 'pic', src: '/blog/linde-safety-guard-3.webp', alt: 'Pogled iz kabine viljuškara na pešaka u reflektujućem prsluku', cap: 'Pogled iz kabine, pešak u prsluku blizu viljuškara.' },
      { t: 'h', id: 'prsluk', text: 'Interaktivni prsluk' },
      { t: 'p', text: 'Deo sistema je interaktivni prsluk. To je reflektujući prsluk koji svog nosioca upozorava na opasnost svetlom, vibracijom i zvukom, u hali i na otvorenom.' },
      {
        t: 'list',
        items: [
          'Vibracija na ključnoj kosti i zvučno upozorenje blizu uha',
          'Četiri LED trake, vidljivost po standardu EN ISO 20471, klasa 1',
          'Rad kroz više smena, punjenje preko powerbanka na stanicama za punjenje',
          'Šest veličina, od S do XXXL, zatvara se čičak trakom',
          'Najmanje 20 pranja, pa ga zaposleni mogu deliti',
        ],
      },
      { t: 'pic', src: '/blog/linde-safety-guard-2.webp', alt: 'Interaktivni prsluk sa četiri svetleće trake', cap: 'Interaktivni prsluk, deo sistema Linde Safety Guard.', contain: true },
      { t: 'h', id: 'gde', text: 'Gde pomaže' },
      {
        t: 'list',
        items: [
          'Gde je vidljivost loša, na raskrsnicama i u prolazima između regala',
          'U zoru, u sumrak i noću, na otvorenom',
          'Pri utovaru i istovaru kamiona',
          'Gde ljudi i viljuškari rade u skučenom prostoru',
          'U zonama komisioniranja',
        ],
      },
      { t: 'pic', src: '/blog/linde-safety-guard-4.webp', alt: 'Viljuškar utovara rolne papira u kamion', cap: 'Utovar kamiona, ljudi i viljuškar na istom prostoru.' },
      { t: 'h', id: 'radar', text: 'Reverse Assist Radar, kada se vozi unazad' },
      { t: 'p', text: 'Za vožnju unazad Linde ima i radar. Reverse Assist Radar prati put iza viljuškara u visini kolena. Kada iza vozila primeti pokret, ne dozvoljava polazak unazad iz mesta, a u vožnji sam koči kada je pešak ili prepreka na putu.' },
      {
        t: 'table',
        rows: [
          ['Kočenje', 'Do 3 m/s², uobičajeno kod drugih sistema 0,7 m/s²'],
          ['Zona', 'Put vožnje, širina se podešava u koracima od 10 cm'],
          ['Visina', 'Otkrivanje u visini kolena'],
          ['Zaustavljanje', 'Rastojanje se podešava, standardno 30 cm'],
          ['Nepokretne prepreke', 'Otkriva ih pri brzini viljuškara do 15 km/h'],
          ['Upozorenje', 'Na opcionom ekranu od 7 inča, uz zvučni signal'],
        ],
        cap: 'Podaci iz Lindeove prezentacije Reverse Assist Radar, maj 2024.',
      },
      { t: 'p', text: 'Radar se ugrađuje u fabrici, uz novi viljuškar.' },
    ],
  },
  {
    slug: 'postavka-regala-vemax',
    cat: 'Sa terena',
    title: 'Postavka regala u firmi Vemax',
    lede: 'Nova hala sa regalima za palete, i Linde viljuškari spremni za prvi dan rada.',
    date: null,
    draft: 'Nacrt. Tekst opisuje samo ono što se vidi na fotografijama. Ekotehnika dopisuje šta je urađeno i koliko je trajalo, a tekst se objavljuje tek uz saglasnost firme Vemax.',
    lead: { src: '/blog/vemax-1.webp', alt: 'Linde slagači paleta i ručni paletni viljuškari u prolazu između novih regala' },
    card: { label: 'Prodavnica', cat: 'slagaci-paleta', cta: 'Pogledajte modele' },
    tema: 'kupovina',
    ask: { title: 'Opremate novu halu? Recite nam šta će u njoj raditi.', poruka: 'Opremamo novo skladište i zanimaju me viljuškari.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'hala', text: 'Hala' },
      { t: 'p', text: 'Nova hala, sa regalima za palete u više redova i nivoa. Pod je tek završen, a regali su prazni i spremni za robu.' },
      { t: 'pic', src: '/blog/vemax-2.webp', alt: 'Prazni regali za palete u novoj hali', cap: 'Regali za palete u novoj hali.' },
      { t: 'p', text: 'Regali su postavljeni i u drugoj, manjoj prostoriji.' },
      { t: 'pic', src: '/blog/vemax-3.webp', alt: 'Regali uz zid manje prostorije', cap: 'Regali u drugoj prostoriji.' },
      { t: 'h', id: 'viljuskari', text: 'Viljuškari' },
      { t: 'p', text: 'Uz regale stoje Linde slagači paleta i ručni paletni viljuškari.' },
      { t: 'pic', src: '/blog/vemax-4.webp', alt: 'Dva Linde slagača paleta i ručni paletni viljuškar između regala', cap: 'Linde slagači i paletni viljuškari između regala.' },
    ],
  },
  {
    slug: 'staplercup-2025',
    cat: 'Događaji',
    title: 'StaplerCup 2025, svetsko prvenstvo vozača viljuškara',
    lede: 'Tri dana takmičenja u Linde MH Areni, sa vozačima iz više zemalja.',
    date: null,
    draft: 'Nacrt. Tekst opisuje samo ono što se vidi na fotografijama. Ekotehnika dopisuje ko je od nas bio na takmičenju i da li su vozili takmičari iz Srbije.',
    lead: { src: '/blog/staplercup-1.webp', alt: 'Linde viljuškar nosi visok stub paleta preko staze u areni' },
    card: { label: 'Prodavnica', cat: 'elektricni-ceoni-viljuskari', cta: 'Pogledajte modele' },
    tema: 'kupovina',
    ask: { title: 'Tražite viljuškar za svoje vozače?', poruka: 'Zanima me ponuda za novi viljuškar.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'takmicenje', text: 'Takmičenje' },
      { t: 'p', text: 'StaplerCup je Lindeovo takmičenje vozača viljuškara. Izdanje 2025. trajalo je tri dana, u Linde MH Areni.' },
      { t: 'pic', src: '/blog/staplercup-4.webp', alt: 'Ulaz u Linde MH Arenu, jesen', cap: 'Linde MH Arena.' },
      { t: 'h', id: 'staza', text: 'Staza' },
      { t: 'p', text: 'Zadaci se voze na stazi u areni, pred publikom. Vozači slažu palete u visok stub, prenose teret kroz uske prolaze i voze precizno oko prepreka.' },
      { t: 'pic', src: '/blog/staplercup-2.webp', alt: 'Staza sa preprekama u areni, publika na tribinama', cap: 'Staza u areni, drugi dan takmičenja.' },
      { t: 'h', id: 'automatizacija', text: 'Automatizacija na stazi' },
      { t: 'p', text: 'Na stazi je bilo i Lindeovo automatizovano vozilo, koje paletu prenosi bez vozača.' },
      { t: 'pic', src: '/blog/staplercup-3.webp', alt: 'Linde automatizovano vozilo sa paletom na stazi', cap: 'Automatizovano Linde vozilo sa paletom, treći dan.' },
    ],
  },
  {
    slug: 'linde-servisni-setovi',
    cat: 'Servis i delovi',
    title: 'Linde servisni setovi, delovi za redovan servis u jednom pakovanju',
    lede: 'Originalni Linde delovi koji se menjaju na redovnom servisu, spakovani u set.',
    date: null,
    draft: 'Nacrt. Tekst opisuje samo ono što se vidi na Lindeovim fotografijama. Ekotehnika dopisuje sastav seta po modelu viljuškara.',
    lead: { src: '/blog/servisni-setovi-1.webp', alt: 'Linde podmetači ispod točka viljuškara Linde E25', focus: '50% 60%' },
    card: { label: 'Delovi', title: 'Potrošni delovi', line: 'Delovi koji se menjaju na redovnom servisu.', href: askHref('delovi', 'Zanima me ponuda za servisni set.'), cta: 'Zatražite ponudu za delove' },
    tema: 'delovi',
    ask: { title: 'Navedite model viljuškara i serijski broj.', poruka: 'Zanima me ponuda za servisni set.', cta: 'Zatražite ponudu za delove' },
    body: [
      { t: 'h', id: 'set', text: 'Šta je u setu' },
      { t: 'p', text: 'Na fotografiji su Linde servisni setovi i delovi koji se u njima nalaze, filteri, ležajevi, kaiš, zaptivke, sprejevi i mast.' },
      { t: 'pic', src: '/blog/servisni-setovi-2.webp', alt: 'Dve kutije Linde Service Kit i delovi iz seta na belom', cap: 'Linde Service Kit i delovi iz seta.', contain: true },
      { t: 'h', id: 'podmetaci', text: 'Sigurno na servisu' },
      { t: 'p', text: 'Dok tehničar radi, viljuškar mora da stoji sigurno. Linde podmetači za točkove drže vozilo u mestu.' },
    ],
  },
  {
    // the fifth post, Filip 26 November, "add 4th blog", the grid under the newest post was one card short of its row
    slug: 'gri-ultimate-green-xt',
    cat: 'Servis i delovi',
    title: 'GRI Ultimate Green XT, puna guma od 93,5% održivih materijala',
    lede: 'Guma za viljuškare od održivih materijala i materijala biološkog porekla, za rad 24 sata u tri smene.',
    date: null,
    draft: 'Nacrt. Tekst je napisan iz GRI letka za Ultimate Green XT iz Ekotehnikinog foldera. Ekotehnika proverava podatke i dopisuje koje dimenzije nudi.',
    lead: { src: '/blog/gri-1.webp', alt: 'Dve zelene gume GRI Ultimate Green XT u praznoj hali' },
    card: { label: 'Delovi', title: 'Gume', line: 'Gume za viljuškare, po modelu i dimenziji.', href: askHref('delovi', 'Zanima me ponuda za gume GRI Ultimate Green XT.'), cta: 'Zatražite ponudu za delove' },
    tema: 'delovi',
    ask: { title: 'Navedite model viljuškara i dimenziju gume.', poruka: 'Zanima me ponuda za gume GRI Ultimate Green XT.', cta: 'Zatražite ponudu za delove' },
    body: [
      { t: 'h', id: 'materijal', text: 'Od čega je napravljena' },
      { t: 'p', text: 'GRI Ultimate Green XT je guma za viljuškare izrađena od 93,5% održivih materijala i materijala biološkog porekla. Prema GRI-ju, emisija ugljenika je zato 55,8% manja nego kod uporedivih guma drugih proizvođača.' },
      { t: 'p', text: 'Za ovu gumu GRI je dobio nagradu MHI za najbolju inovaciju u održivosti, na sajmu ProMat 2025.' },
      { t: 'pic', src: '/blog/gri-2.webp', alt: 'Zelena guma Ultimate Green XT na točku viljuškara', cap: 'Ultimate Green XT na točku viljuškara.' },
      { t: 'h', id: 'rad', text: 'U radu' },
      {
        t: 'list',
        items: [
          'Rad 24 sata, u tri smene',
          'Najmanji otpor kotrljanja u GRI-jevoj ponudi, pa baterija električnog viljuškara traje duže',
          'Manja potrošnja goriva kod viljuškara sa motorom, u neprekidnom radu',
          'Velika otpornost na habanje, guma traje duže i ređe se menja',
          'Stabilnost u krivinama i dobro prianjanje pri manevrisanju',
        ],
      },
      { t: 'h', id: 'izvedbe', text: 'Izvedbe' },
      { t: 'p', text: 'Guma se izrađuje u izvedbi koja ne ostavlja tragove na podu, u izvedbi otpornoj na ulje i u antistatičkoj izvedbi. Dimenziju za vaš viljuškar potvrđuje Ekotehnika.' },
    ],
  },
];

export const postOf = (slug: string) => POSTS.find((p) => p.slug === slug);

// the words of a post, for its reading time, a minute for every 200 words and never under one
export const minutes = (p: Post) => {
  const text = [p.lede, ...p.body.map((b) => (b.t === 'p' || b.t === 'h' ? b.text : b.t === 'list' ? b.items.join(' ') : b.t === 'table' ? b.rows.flat().join(' ') : ''))].join(' ');
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
};

// three other posts, the ones that follow this one, round to the start
export const relatedOf = (slug: string) => {
  const i = POSTS.findIndex((p) => p.slug === slug);
  return [1, 2, 3].map((k) => POSTS[(i + k) % POSTS.length]).filter((p) => p.slug !== slug);
};
