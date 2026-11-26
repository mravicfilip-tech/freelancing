// The blog's posts, Filip 26 November, "add blog, add blog single pages, draft images from drive for blog" (briefs/blog/plan.md, taste
// 2026-11-26 13:06). Drafts on topics the old blog never covered, about 600 words each (Filip 26 November, "add more text, like 600 words
// per blog"). Facts about the job, the event or the product come only from its photos, the Linde and GRI files in the client's Drive and
// the site's own pages, the rest is general advice, and each draft carries a note of what Ekotehnika still has to check and add. The old posts come in later at their old addresses, with
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
    draft: 'Nacrt. Podaci su iz Lindeovog letka za interaktivni prsluk i prezentacije za Reverse Assist Radar iz Ekotehnikinog foldera, ostalo su opšti saveti. Ekotehnika proverava tekst i dopisuje da li sistem nudi uz polovne viljuškare.',
    lead: { src: '/blog/linde-safety-guard-1.webp', alt: 'Linde uređaj sa svetlećim znakom upozorenja na zidu hale, viljuškar u prolazu iza njega' },
    card: { label: 'Bezbednost', title: 'Safety Guard za vaše viljuškare', line: 'Ponuda za sistem, prsluke i radar uz novi viljuškar.', href: askHref('kupovina', 'Zanima me Linde Safety Guard.'), cta: 'Zatražite ponudu' },
    tema: 'kupovina',
    ask: { title: 'Recite nam koliko viljuškara i ljudi radi u istom prostoru.', poruka: 'Zanima me Linde Safety Guard.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'uvod', text: 'Zašto upozorenje mora da stigne na vreme' },
      { t: 'p', text: 'Viljuškar i pešak u istoj hali su svakodnevni prizor. Vozač gleda teret, vilice i put ispred sebe, a pešak gleda robu, papire ili telefon. Najopasniji su trenuci u kojima nijedan od njih ne vidi drugog, na raskrsnici dva prolaza, iza kraja regala ili kada viljuškar kreće unazad.' },
      { t: 'p', text: 'Ogledala, svetla i oznake na podu pomažu, ali samo kada ih neko pogleda. Linde Safety Guard dodaje upozorenje koje stiže samo od sebe, i vozaču i pešaku u isto vreme.' },
      { t: 'h', id: 'zone', text: 'Zone upozorenja oko viljuškara' },
      { t: 'p', text: 'Linde Safety Guard oko svakog viljuškara postavlja zone upozorenja. Zone se podešavaju pojedinačno, za svako vozilo i svaki posao, a položaj se meri sa tačnošću od 10 cm.' },
      { t: 'p', text: 'Zona tako može da bude uža u uskom prolazu, a šira na otvorenom prostoru gde se vozi brže. Kada se pešak i viljuškar nađu preblizu, upozorenje stiže na vreme, i vozaču i pešaku.' },
      { t: 'pic', src: '/blog/linde-safety-guard-3.webp', alt: 'Pogled iz kabine viljuškara na pešaka u reflektujućem prsluku', cap: 'Pogled iz kabine, pešak u prsluku blizu viljuškara.' },
      { t: 'h', id: 'prsluk', text: 'Interaktivni prsluk' },
      { t: 'p', text: 'Deo sistema je interaktivni prsluk. To je reflektujući prsluk koji svog nosioca upozorava na opasnost svetlom, vibracijom i zvukom, u hali i na otvorenom.' },
      { t: 'p', text: 'Vibracija je na ključnoj kosti, a zvučno upozorenje blizu uha, pa se upozorenje oseti i čuje i u bučnoj hali. Kablovi su skriveni između spoljnog i unutrašnjeg sloja na leđima, a prsluk se nosi i po kiši.' },
      {
        t: 'list',
        items: [
          'Četiri LED trake, vidljivost po standardu EN ISO 20471, klasa 1',
          'Ispravnost se lako proveri, jer trake imaju pasivno svetljenje',
          'Rad kroz više smena, punjenje preko powerbanka na stanicama za punjenje',
          'Šest veličina, od S do XXXL, zatvara se čičak trakom',
          'Najmanje 20 pranja, pa ga zaposleni iz različitih smena mogu deliti',
        ],
      },
      { t: 'p', text: 'Prsluk je istovremeno i sertifikovani reflektujući prsluk, pa ga zaposleni nose umesto prsluka koji već imaju, a ne preko njega.' },
      { t: 'pic', src: '/blog/linde-safety-guard-2.webp', alt: 'Interaktivni prsluk sa četiri svetleće trake', cap: 'Interaktivni prsluk, deo sistema Linde Safety Guard.', contain: true },
      { t: 'h', id: 'gde', text: 'Gde pomaže' },
      { t: 'p', text: 'Sistem ima najviše smisla tamo gde se ljudi i viljuškari stalno mimoilaze.' },
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
      { t: 'p', text: 'Radar ne traži da ljudi nose bilo kakav uređaj, ne treba mu dodatna oprema u hali i ne zavisi od osvetljenja. Upozorava samo kada je opasnost stvarna, pa vozač ne sluša signal pri svakoj vožnji unazad.' },
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
      { t: 'p', text: 'Kada radar zaustavi viljuškar u mestu, vozač vraća pedalu u neutralan položaj pre nego što ponovo krene unazad. Posebnim dugmetom vozač može da nastavi vožnju unazad kada proceni da je put slobodan.' },
      { t: 'p', text: 'Radar se ugrađuje u fabrici, uz novi viljuškar, i povezan je sa ekranom i kočnicama vozila.' },
      { t: 'h', id: 'izbor', text: 'Šta ima smisla za vašu halu' },
      { t: 'p', text: 'Safety Guard je za prostore gde se pešaci i viljuškari stalno mešaju. Radar je za viljuškare koji mnogo voze unazad, na primer pri utovaru i istovaru. U mnogim halama ima smisla oba.' },
      { t: 'p', text: 'Svaka hala je drugačija, pa se rešenje bira tek kada se zna kako hala radi. Bitno je koliko viljuškara vozi, koliko ljudi peške prolazi kroz iste prolaze, gde su raskrsnice i vrata, i u kojoj smeni je najgušće.' },
      { t: 'p', text: 'Recite nam kako izgleda vaša hala, koliko viljuškara i ljudi radi u istom prostoru i gde se najčešće mimoilaze, pa vam šaljemo ponudu za rešenje koje joj odgovara.' },
    ],
  },
  {
    slug: 'postavka-regala-vemax',
    cat: 'Sa terena',
    title: 'Postavka regala u firmi Vemax',
    lede: 'Nova hala sa regalima za palete, i Linde viljuškari spremni za prvi dan rada.',
    date: null,
    draft: 'Nacrt. O samom poslu tekst kaže samo ono što se vidi na fotografijama, ostalo su opšti saveti za opremanje skladišta. Ekotehnika dopisuje šta je urađeno i koliko je trajalo, a tekst se objavljuje tek uz saglasnost firme Vemax.',
    lead: { src: '/blog/vemax-1.webp', alt: 'Linde slagači paleta i ručni paletni viljuškari u prolazu između novih regala' },
    card: { label: 'Prodavnica', cat: 'slagaci-paleta', cta: 'Pogledajte modele' },
    tema: 'kupovina',
    ask: { title: 'Opremate novu halu? Recite nam šta će u njoj raditi.', poruka: 'Opremamo novo skladište i zanimaju me viljuškari.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'hala', text: 'Hala' },
      { t: 'p', text: 'Nova hala, sa regalima za palete u više redova i nivoa. Pod je tek završen, a regali su prazni i spremni za robu.' },
      { t: 'p', text: 'Hala je svetla, sa prozorima duž zida i ravnim, sjajnim podom.' },
      { t: 'pic', src: '/blog/vemax-2.webp', alt: 'Prazni regali za palete u novoj hali', cap: 'Regali za palete u novoj hali.' },
      { t: 'p', text: 'Regali su postavljeni i u drugoj, manjoj prostoriji. Na stubu regala je tabla sa podacima o regalu.' },
      { t: 'pic', src: '/blog/vemax-3.webp', alt: 'Regali uz zid manje prostorije', cap: 'Regali u drugoj prostoriji.' },
      { t: 'h', id: 'priprema', text: 'Šta se dogovara pre postavke regala' },
      { t: 'p', text: 'Regal i viljuškar se biraju zajedno. Visina regala određuje koliko visoko viljuškar mora da podigne teret, a širina prolaza između regala određuje koji viljuškar uopšte može da radi u hali.' },
      { t: 'p', text: 'Kada se o tome razmišlja tek posle postavke, hala često dobije viljuškar koji je veći nego što treba, ili regale koji su niži nego što bi mogli da budu. I jedno i drugo se plaća svakog dana, kroz sporiji rad ili kroz prostor koji ostaje prazan.' },
      { t: 'p', text: 'Zato se pre postavke proverava nekoliko stvari.' },
      {
        t: 'list',
        items: [
          'Mere palete i najveća težina tereta',
          'Visina najvišeg nivoa regala i svetla visina hale',
          'Širina prolaza, koja zavisi od toga da li rade čeoni viljuškari, regalni viljuškari ili slagači paleta',
          'Ravnost i nosivost poda',
          'Koliko paleta dnevno ulazi u skladište i izlazi iz njega',
        ],
      },
      { t: 'h', id: 'prolaz', text: 'Kako se određuje širina prolaza' },
      { t: 'p', text: 'Širina prolaza zavisi od viljuškara i od palete. Čeonom viljuškaru treba najviše mesta, jer se ispred regala okreće zajedno sa teretom. Regalni viljuškar i slagač paleta rade u užem prolazu, pa ista hala prima više redova regala.' },
      { t: 'p', text: 'Tačnu širinu za svaki model daje proizvođač, za paletu određenih mera. U tehničkim podacima modela u prodavnici, gde ih proizvođač daje, ta širina piše za paletu 1000 × 1200 mm. Zato se mere palete dogovaraju prve, pre nego što se nacrta raspored regala.' },
      { t: 'p', text: 'Ravan pod i dobro svetlo nisu detalj. Na neravnom podu teret na visini se ljulja, a u slabo osvetljenom prolazu vozač kasnije vidi pešaka. Ogledala na raskrsnicama i oznake na podu koštaju malo, a sprečavaju mnoge sudare.' },
      { t: 'h', id: 'viljuskari', text: 'Viljuškari' },
      { t: 'p', text: 'Uz regale stoje Linde slagači paleta i ručni paletni viljuškari.' },
      { t: 'p', text: 'Slagači paleta podižu palete na više nivoa regala i rade u užim prolazima od čeonih viljuškara. Ručni paletni viljuškari prenose palete po podu, od kamiona do mesta gde ih slagač preuzima. Za skladište koje tek počinje sa radom to je jednostavan početak, koji kasnije može da se dopuni većim vozilima.' },
      { t: 'pic', src: '/blog/vemax-4.webp', alt: 'Dva Linde slagača paleta i ručni paletni viljuškar između regala', cap: 'Linde slagači i paletni viljuškari između regala.' },
      { t: 'h', id: 'prvi-dan', text: 'Pre prvog dana rada' },
      { t: 'p', text: 'Pre nego što roba uđe u halu, vozači treba da prođu obuku za tačno ta vozila, a svaki regal treba da ima vidno istaknute podatke o dozvoljenom opterećenju po nivou. Prolazi se obeležavaju na podu, a mesta gde se ljudi i viljuškari mimoilaze dobijaju posebnu oznaku.' },
      { t: 'p', text: 'Viljuškari koji rade svaki dan treba da imaju plan redovnog servisa od prvog dana, a ne od prvog kvara. Servis u propisanim intervalima otkriva habanje pre nego što zaustavi rad.' },
      { t: 'p', text: 'Prvih nekoliko nedelja vredi pratiti gde se roba zadržava i gde viljuškari čekaju, jer se raspored najlakše menja dok je hala još nova.' },
      { t: 'h', id: 'rast', text: 'Prostor za rast' },
      { t: 'p', text: 'Skladište retko ostane onakvo kakvo je bilo prvog dana. Kada se raspored regala crta sa rezervom za još jedan red ili još jedan nivo, kasnije proširenje ne traži novu halu. Isto važi za viljuškare, model sa nešto većom visinom podizanja od današnje potrebe radi i kada regali porastu.' },
      { t: 'h', id: 'najam', text: 'Kupovina ili najam' },
      { t: 'p', text: 'Za novo skladište nije uvek jasno koliko će viljuškara biti potrebno kada posao krene. Ekotehnika iznajmljuje viljuškare od nekoliko sati do godinu dana, uz isporuku za 24 sata, pa broj vozila može da se proveri u radu, pre kupovine.' },
      { t: 'p', text: 'Najam ima smisla i za sezonski špic ili veliki broj narudžbina, kada robe ima više nego obično, a kupljeni viljuškari ne mogu da postignu sve.' },
      { t: 'p', text: 'Recite nam kakva je hala, kolike su palete i koliko robe dnevno prolazi kroz skladište, pa vam šaljemo ponudu za viljuškare koji joj odgovaraju.' },
    ],
  },
  {
    slug: 'staplercup-2025',
    cat: 'Događaji',
    title: 'StaplerCup 2025, svetsko prvenstvo vozača viljuškara',
    lede: 'Tri dana takmičenja u Linde MH Areni, sa vozačima iz više zemalja.',
    date: null,
    draft: 'Nacrt. O takmičenju tekst kaže samo ono što se vidi na fotografijama, ostalo su opšti saveti za vozače i podaci o servisu sa sajta. Ekotehnika dopisuje ko je od nas bio na takmičenju i da li su vozili takmičari iz Srbije.',
    lead: { src: '/blog/staplercup-1.webp', alt: 'Linde viljuškar nosi visok stub paleta preko staze u areni' },
    card: { label: 'Prodavnica', cat: 'elektricni-ceoni-viljuskari', cta: 'Pogledajte modele' },
    tema: 'kupovina',
    ask: { title: 'Tražite viljuškar za svoje vozače?', poruka: 'Zanima me ponuda za novi viljuškar.', cta: 'Zatražite ponudu' },
    body: [
      { t: 'h', id: 'takmicenje', text: 'Takmičenje' },
      { t: 'p', text: 'StaplerCup je Lindeovo takmičenje vozača viljuškara, koje nosi naziv svetskog prvenstva. Izdanje 2025. trajalo je tri dana, u Linde MH Areni.' },
      { t: 'p', text: 'Takmiče se profesionalni vozači viljuškara, ljudi kojima je viljuškar svakodnevni posao, pred publikom na tribinama.' },
      { t: 'p', text: 'Za publiku je to predstava, a za vozače provera veštine koju svakog dana koriste na poslu.' },
      { t: 'pic', src: '/blog/staplercup-4.webp', alt: 'Ulaz u Linde MH Arenu, jesen', cap: 'Linde MH Arena.' },
      { t: 'h', id: 'staza', text: 'Staza' },
      { t: 'p', text: 'Zadaci se voze na stazi u areni. Vozači slažu palete u visok stub, prenose teret kroz uske prolaze i voze precizno oko prepreka.' },
      { t: 'p', text: 'Visinu, razmak i težinu tereta vozač procenjuje iz kabine, bez izlaska i merenja.' },
      { t: 'p', text: 'Zadaci liče na svakodnevni posao u hali, slaganje paleta, vožnju kroz uske prolaze i rad sa teretom na visini. Razlika je u tome što se na stazi svaka greška vidi odmah, pred svima.' },
      { t: 'pic', src: '/blog/staplercup-2.webp', alt: 'Staza sa preprekama u areni, publika na tribinama', cap: 'Staza u areni, drugi dan takmičenja.' },
      { t: 'h', id: 'automatizacija', text: 'Automatizacija na stazi' },
      { t: 'p', text: 'Na stazi je bilo i Lindeovo automatizovano vozilo, koje paletu prenosi bez vozača.' },
      { t: 'p', text: 'Automatizovana vozila preuzimaju vožnje koje se stalno ponavljaju, na primer prevoz paleta između proizvodnje i skladišta. Vozači tada ostaju na poslovima koji traže procenu, kao što su utovar, rad na visini i neobičan teret.' },
      { t: 'pic', src: '/blog/staplercup-3.webp', alt: 'Linde automatizovano vozilo sa paletom na stazi', cap: 'Automatizovano Linde vozilo sa paletom, treći dan.' },
      { t: 'h', id: 'svakodnevno', text: 'Šta takmičenje govori o svakodnevnom radu' },
      { t: 'p', text: 'Dobar vozač viljuškara nije onaj koji vozi najbrže, već onaj koji vozi bez greške, smenu za smenom. Preciznost čuva robu, regale i ljude, a mirna vožnja čuva i sam viljuškar, njegove gume, kočnice i hidrauliku.' },
      { t: 'p', text: 'Navike koje se vide na stazi vrede u svakoj hali.' },
      {
        t: 'list',
        items: [
          'Pregled viljuškara pre početka smene',
          'Teret nisko pri vožnji, podignut tek ispred regala',
          'Vožnja unazad kada teret zaklanja pogled',
          'Usporavanje na raskrsnicama, kod vrata i na kraju regala',
          'Nikada ljudi na vilicama ili na teretu',
        ],
      },
      { t: 'p', text: 'Najviše grešaka nastaje na kraju smene i pod pritiskom roka, pa se ove navike najviše isplate baš tada.' },
      { t: 'p', text: 'Kada je vozač umoran, i najbolje navike popuštaju, pa su pauze deo bezbednosti, a ne izgubljeno vreme.' },
      { t: 'h', id: 'nosivost', text: 'Nosivost na visini' },
      { t: 'p', text: 'Najteži zadatak na stazi je rad sa teretom na visini, a tako je i u hali. Nosivost viljuškara opada kako teret ide više i kako se težište tereta udaljava od vilica. Tablica nosivosti na viljuškaru pokazuje koliko sme da se podigne na kojoj visini.' },
      { t: 'p', text: 'Vozač koji prelazi na novi viljuškar treba da upozna njegove komande, visinu podizanja i tablicu nosivosti pre nego što radi sa punim teretom. Obuka ne završava ispitom, nastavlja se sa svakim novim vozilom i svakim novim teretom.' },
      { t: 'h', id: 'pregled', text: 'Pregled pre smene' },
      { t: 'p', text: 'Pre smene vozač proverava kočnice, upravljanje, sirenu i svetla, vilice i lance, nivo tečnosti ili napunjenost baterije, i da li negde curi ulje. To traje nekoliko minuta, a kvar koji se primeti pre smene ne pretvori se u zastoj usred posla.' },
      { t: 'p', text: 'Ako nešto nije u redu, viljuškar ne izlazi u smenu dok ga servis ne pregleda.' },
      { t: 'h', id: 'pesaci', text: 'Vozač nije sam u hali' },
      { t: 'p', text: 'Na stazi vozač vozi sam, a u hali deli prostor sa pešacima, drugim viljuškarima i kamionima. Kontakt pogledom pre prolaska je zato jednako važan kao preciznost na vilicama. Dobar vozač pred raskrsnicom uspori, pogleda i tek onda prođe, čak i kada ima prednost.' },
      { t: 'p', text: 'Mnoge firme tu dodaju i tehnička rešenja, svetla koja na podu ispred viljuškara pokazuju da vozilo dolazi i sisteme koji upozoravaju pešaka kada je viljuškar preblizu. O tome više pišemo u tekstu o sistemu Linde Safety Guard.' },
      { t: 'p', text: 'Vozač koga bole leđa ili koji se naprezanjem snalazi oko komandi greši više na kraju smene. Zato su sedište, položaj komandi i pogled iz kabine deo bezbednosti, a ne samo udobnosti.' },
      { t: 'h', id: 'servis', text: 'Obuka i servis idu zajedno' },
      { t: 'p', text: 'I najbolji vozač zavisi od ispravnog viljuškara. Ekotehnikin servis radi ispitivanje pre početka rada, sa proverom konstrukcije i voznog mehanizma, motora, baterije i punjača, hidraulike i tečnosti, elektrike i sistema za prihvat tereta.' },
      { t: 'p', text: 'Servisna vozila iz Vrčina i Čuruga dolaze do vas, gde god da radi vaš viljuškar. Kada je viljuškar ispravan, vozač može da se posveti poslu, a ne vozilu.' },
    ],
  },
  {
    slug: 'linde-servisni-setovi',
    cat: 'Servis i delovi',
    title: 'Linde servisni setovi, delovi za redovan servis u jednom pakovanju',
    lede: 'Originalni Linde delovi koji se menjaju na redovnom servisu, spakovani u set.',
    date: null,
    draft: 'Nacrt. O setu tekst kaže samo ono što se vidi na Lindeovim fotografijama, ostalo su podaci o servisu sa sajta i opšti saveti. Ekotehnika dopisuje sastav seta po modelu viljuškara.',
    lead: { src: '/blog/servisni-setovi-1.webp', alt: 'Linde podmetači ispod točka viljuškara Linde E25', focus: '50% 60%' },
    card: { label: 'Delovi', title: 'Potrošni delovi', line: 'Delovi koji se menjaju na redovnom servisu.', href: askHref('delovi', 'Zanima me ponuda za servisni set.'), cta: 'Zatražite ponudu za delove' },
    tema: 'delovi',
    ask: { title: 'Navedite model viljuškara i serijski broj.', poruka: 'Zanima me ponuda za servisni set.', cta: 'Zatražite ponudu za delove' },
    body: [
      { t: 'h', id: 'set', text: 'Šta je u setu' },
      { t: 'p', text: 'Na fotografiji su Linde servisni setovi i delovi koji se u njima nalaze, filteri, ležajevi, kaiš, zaptivke, sprejevi i mast.' },
      { t: 'p', text: 'Set spaja delove koji se menjaju zajedno, pa se na servisu ne čeka na deo koji je zaboravljen u porudžbini. Tehničar dolazi sa svim što mu treba, a viljuškar se vraća u rad istog dana.' },
      { t: 'pic', src: '/blog/servisni-setovi-2.webp', alt: 'Dve kutije Linde Service Kit i delovi iz seta na belom', cap: 'Linde Service Kit i delovi iz seta.', contain: true },
      { t: 'h', id: 'originalni', text: 'Zašto originalni delovi' },
      { t: 'p', text: 'Originalni Linde delovi su napravljeni za tačno taj viljuškar. Filter koji ne naleže kako treba ili zaptivka pogrešne mere mogu da skrate vek motora ili hidraulike, a kvar se tada plati više nego što je jeftiniji deo uštedeo.' },
      { t: 'p', text: 'Delovi se naručuju po serijskom broju viljuškara, pa odgovaraju tačnom modelu i seriji, a ne samo sličnom vozilu.' },
      { t: 'p', text: 'Ekotehnika je zvanični Linde partner za Srbiju i Crnu Goru, pa delovi za Linde viljuškare dolaze kao originalni, sa oznakom proizvođača.' },
      { t: 'h', id: 'redovan', text: 'Redovan servis' },
      { t: 'p', text: 'Servis u propisanim intervalima otkriva habanje pre nego što kvar zaustavi rad. Viljuškar koji stoji zbog kvara zaustavlja i ljude i robu oko sebe, pa je planirani servis obično jeftiniji od hitne popravke.' },
      { t: 'p', text: 'Planirani servis se zakazuje kada viljuškar najmanje treba, između smena ili u danu kada je posla manje.' },
      { t: 'p', text: 'Ekotehnika ima dva servisna centra, u Vrčinu i Čurugu, a servisna vozila dolaze do vas, gde god da radi vaš viljuškar. Servis radi na više od 300 tipova vozila, i drugih marki.' },
      {
        t: 'list',
        items: [
          'Konstrukcija vozila i vozni mehanizam',
          'Motor, baterija i punjači',
          'Hidraulika i tečnosti',
          'Elektrika',
          'Sistem za prihvat tereta',
        ],
      },
      { t: 'p', text: 'To su delovi viljuškara koje servis proverava pri ispitivanju pre početka rada.' },
      { t: 'h', id: 'sta-se-menja', text: 'Šta se menja na redovnom servisu' },
      { t: 'p', text: 'Na redovnom servisu se najčešće menjaju filteri, ulje i tečnosti, zaptivke koje su počele da propuštaju i delovi koji se habaju, kao što su kaiševi i ležajevi. Kod električnih viljuškara proverava se i baterija, njeni priključci i punjač.' },
      { t: 'p', text: 'Interval servisa zavisi od modela, broja radnih sati i uslova rada. Viljuškar koji radi u prašini, na hladnom ili u tri smene treba servis češće od onog koji radi jednu smenu u čistoj hali.' },
      { t: 'p', text: 'Gume, vilice i lanci se pregledaju na svakom servisu, a menjaju kada se istroše. Firme sa više viljuškara istog modela često drže jedan set na zalihi, pa sledeći servis počinje odmah.' },
      { t: 'p', text: 'Neki znaci kažu da servis treba ranije od plana.' },
      {
        t: 'list',
        items: [
          'Ulje ispod viljuškara posle stajanja',
          'Neobični zvukovi pri podizanju ili vožnji',
          'Kočnice koje slabije drže',
          'Baterija koja ne izdrži smenu',
          'Upozorenja na ekranu viljuškara',
        ],
      },
      { t: 'p', text: 'Za firme koje ne žele da prate rokove same, Ekotehnika nudi ugovor o punom servisu. Jedan ugovor pokriva sve neophodne mere održavanja.' },
      { t: 'h', id: 'dolazak', text: 'Servis dolazi do vas' },
      { t: 'p', text: 'Servisno vozilo dolazi sa tehničarem, alatom i delovima za taj viljuškar. Posao se radi tamo gde viljuškar radi, pa ga ne treba prevoziti do radionice.' },
      { t: 'p', text: 'Pored redovnog servisa, viljuškari imaju i propisane bezbednosne preglede. Ekotehnika ih radi uz potpunu servisnu dokumentaciju, pa su papiri za svaki viljuškar uredni.' },
      { t: 'h', id: 'podmetaci', text: 'Sigurno na servisu' },
      { t: 'p', text: 'Dok tehničar radi, viljuškar mora da stoji sigurno. Linde podmetači za točkove drže vozilo u mestu.' },
      { t: 'p', text: 'Podmetači se postavljaju pre nego što tehničar počne rad pored točkova ili ispod vozila, i skidaju tek kada je posao završen. Ručka od užeta služi da se podmetač lako postavi i izvuče.' },
      { t: 'p', text: 'Pri radu ispod podignutih vilica vilice se dodatno osiguraju, a nikada se ne radi ispod tereta koji drži samo hidraulika.' },
      { t: 'h', id: 'ponuda', text: 'Šta da pripremite za ponudu' },
      { t: 'p', text: 'Za ponudu za servisni set pošaljite model viljuškara, serijski broj i broj radnih sati sa brojača. Ako ne znate model, dovoljna je fotografija pločice sa podacima na viljuškaru.' },
      { t: 'p', text: 'Za više viljuškara pošaljite listu modela i serijskih brojeva, pa ponudu dobijate za sve odjednom.' },
      { t: 'p', text: 'Kada kvar dođe bez najave, jedan poziv je dovoljan. Tehničar dolazi sa originalnim rezervnim delovima.' },
      { t: 'p', text: 'Kada viljuškar stane i posao ne može da čeka, pozovite hitan servis na +381 60 300 20 50.' },
    ],
  },
  {
    // the fifth post, Filip 26 November, "add 4th blog", the grid under the newest post was one card short of its row
    slug: 'gri-ultimate-green-xt',
    cat: 'Servis i delovi',
    title: 'GRI Ultimate Green XT, puna guma od 93,5% održivih materijala',
    lede: 'Guma za viljuškare od održivih materijala i materijala biološkog porekla, za rad 24 sata u tri smene.',
    date: null,
    draft: 'Nacrt. Podaci o gumi su iz GRI letka za Ultimate Green XT iz Ekotehnikinog foldera, ostalo su opšti saveti. Ekotehnika proverava tekst i dopisuje koje dimenzije nudi.',
    lead: { src: '/blog/gri-1.webp', alt: 'Dve zelene gume GRI Ultimate Green XT u praznoj hali' },
    card: { label: 'Delovi', title: 'Gume', line: 'Gume za viljuškare, po modelu i dimenziji.', href: askHref('delovi', 'Zanima me ponuda za gume GRI Ultimate Green XT.'), cta: 'Zatražite ponudu za delove' },
    tema: 'delovi',
    ask: { title: 'Navedite model viljuškara i dimenziju gume.', poruka: 'Zanima me ponuda za gume GRI Ultimate Green XT.', cta: 'Zatražite ponudu za delove' },
    body: [
      { t: 'h', id: 'materijal', text: 'Od čega je napravljena' },
      { t: 'p', text: 'GRI Ultimate Green XT je guma za viljuškare izrađena od 93,5% održivih materijala i materijala biološkog porekla. Prema GRI-ju, emisija ugljenika je zato 55,8% manja nego kod uporedivih guma drugih proizvođača.' },
      { t: 'p', text: 'Guma ima tri sloja. Gazeći sloj je od smeše sa visoko disperzivnim silicijumom, napravljene za težak rad na svim podlogama. U srednjem sloju je reciklirana čađ, a u osnovi su žice koje drže gumu čvrsto na felni.' },
      { t: 'p', text: 'Za ovu gumu GRI je dobio nagradu MHI za najbolju inovaciju u održivosti, na sajmu ProMat 2025.' },
      { t: 'pic', src: '/blog/gri-2.webp', alt: 'Zelena guma Ultimate Green XT na točku viljuškara', cap: 'Ultimate Green XT na točku viljuškara.' },
      { t: 'h', id: 'puna', text: 'Šta je puna guma' },
      { t: 'p', text: 'Viljuškari u halama najčešće voze na punim gumama, bez vazduha. Puna guma ne može da se izduva, ne traži proveru pritiska i nosi veliki teret na malom točku.' },
      { t: 'p', text: 'Puna guma je tvrđa od gume sa vazduhom, pa je ravan pod za nju još važniji.' },
      { t: 'p', text: 'Zato se bira drugačije od gume na automobilu, po veličini točka i po nosivosti pri određenoj brzini vožnje. GRI za svaku dimenziju daje nosivost pri 6 i pri 10 km/h.' },
      { t: 'p', text: 'Oznaka na boku gume, na primer 18x7-8, daje spoljni prečnik i širinu gume u inčima, i prečnik felne. Ista dimenzija može da se zapiše i kao 180/70-8, sa širinom u milimetrima i visinom boka u procentima od širine.' },
      { t: 'p', text: 'Ultimate Green XT postoji i kao press-on guma, koja se utiskuje na čelični prsten, za viljuškare koji koriste takve točkove.' },
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
      { t: 'p', text: 'Manji otpor kotrljanja znači da viljuškar troši manje energije za isti put. Kod električnog viljuškara to se vidi u dužem radu na jedno punjenje baterije, a kod viljuškara sa motorom u manjoj potrošnji goriva.' },
      { t: 'p', text: 'Kada se porede gume, vredi gledati cenu po satu rada, a ne samo cenu gume. Guma koja košta više, a traje duže i štedi energiju, na kraju često izađe jeftinije.' },
      { t: 'h', id: 'koji', text: 'Za koje viljuškare' },
      { t: 'p', text: 'Gume se biraju po dimenziji točka, a ne po marki viljuškara. Ista dimenzija pune gume odgovara viljuškarima različitih proizvođača, pa Ultimate Green XT može da se stavi i na viljuškar koji nije Linde. Pune gume se skidaju i stavljaju presom, pa zamenu radi servis sa odgovarajućom opremom.' },
      { t: 'h', id: 'izvedbe', text: 'Izvedbe' },
      { t: 'p', text: 'Guma se izrađuje u izvedbi koja ne ostavlja tragove na podu, u izvedbi otpornoj na ulje i u antistatičkoj izvedbi.' },
      { t: 'p', text: 'Izvedba koja ne ostavlja tragove je za čiste podove, na primer u prehrambenoj industriji i trgovini. Izvedba otporna na ulje je za radionice i pogone gde je ulje na podu svakodnevna pojava. Antistatička izvedba je za prostore gde statički elektricitet može da napravi problem.' },
      { t: 'p', text: 'Pogrešna izvedba se primeti tek u radu, po tragovima na podu ili bržem habanju, pa se izvedba bira pre porudžbine, a ne posle.' },
      { t: 'h', id: 'okolina', text: 'Manje otpada i čestica' },
      { t: 'p', text: 'Guma se vrlo malo haba, pa u vazduh i na pod odlazi manje gumenih čestica. Duži vek znači i ređu zamenu, pa manje starih guma završi kao otpad.' },
      { t: 'p', text: 'Kod viljuškara sa motorom manji otpor kotrljanja znači i manje izduvnih gasova za isti posao.' },
      { t: 'h', id: 'zamena', text: 'Kada je vreme za nove gume' },
      { t: 'p', text: 'Puna guma se menja kada se istroši do oznake na boku ili kada se na njoj pojave pukotine i odvojeni komadi. Gume na istoj osovini menjaju se u paru, da viljuškar ostane stabilan.' },
      { t: 'p', text: 'Istrošena guma ima manji prečnik, pa viljuškar stoji niže nego što vozač očekuje, a kočenje i stabilnost slabe. Na istoj osovini ne treba mešati gume različitih proizvođača ili različite istrošenosti.' },
      { t: 'p', text: 'Pošaljite nam model viljuškara i oznaku dimenzije sa boka gume, pa vam potvrđujemo koja dimenzija i izvedba odgovaraju vašem viljuškaru.' },
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
