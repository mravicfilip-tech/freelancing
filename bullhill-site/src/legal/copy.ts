import type { Lang } from '../shared/content';

// The legal notice and the privacy page, English and German. Facts from
// studio/clients/bullhill/briefs/website/golive.md, 20 October 2026. A value still waiting on the client
// is TO_CONFIRM, which the page shows marked and scripts/golive-check.mjs refuses before a deploy.
export const TO_CONFIRM = '[TO CONFIRM]';

export type Row = { k: string; v: string; href?: string };
export type Block = { title: string; rows?: Row[]; body?: string[] };
export type LegalPage = { title: string; kicker: string; updated: string; blocks: Block[] };
export type LegalCopy = {
  home: string;
  langLabel: string;
  legal: LegalPage;
  privacy: LegalPage;
  links: { legal: string; privacy: string };
  meta: { legal: string; privacy: string };
};

const EMAIL = 'bullhilldoo@gmail.com';
const PHONE = '+43 665 65942472';
const PHONE_HREF = 'tel:+4366565942472';
const NAME = 'BULL HILL, gradbeništvo, trgovina in storitve, d.o.o.';

export const legalCopy: Record<Lang, LegalCopy> = {
  en: {
    home: 'Back to the site',
    langLabel: 'Language',
    links: { legal: 'Legal notice', privacy: 'Privacy' },
    meta: { legal: 'Legal notice, BullHill', privacy: 'Privacy, BullHill' },
    legal: {
      kicker: 'BullHill',
      title: 'Legal notice',
      updated: 'As of 20 October 2026',
      blocks: [
        {
          title: 'Company',
          rows: [
            { k: 'Name', v: NAME },
            { k: 'Short name', v: 'BULL HILL d.o.o.' },
            { k: 'Legal form', v: 'Limited liability company under Slovenian law (d.o.o.)' },
            { k: 'Registered office', v: 'Kidričeva ulica 24, 3000 Celje, Slovenia' },
            { k: 'Managing director', v: 'Dušan Stoilović' },
            { k: 'Business', v: 'Trenching, duct laying and house connections for fibre networks' },
          ],
        },
        {
          title: 'Register',
          rows: [
            { k: 'Register', v: 'Slovenian business register (AJPES)' },
            { k: 'Register court', v: 'District Court of Celje (Okrožno sodišče v Celju)' },
            { k: 'Registration number', v: '1639676000' },
            { k: 'Share capital', v: 'EUR 8,763.00' },
            { k: 'VAT ID', v: 'SI77173686' },
            { k: 'Tax number', v: '77173686' },
          ],
        },
        {
          title: 'Contact',
          rows: [
            { k: 'Email', v: EMAIL, href: `mailto:${EMAIL}` },
            { k: 'Phone and WhatsApp', v: PHONE, href: PHONE_HREF },
          ],
        },
        {
          title: 'Responsible for content',
          body: ['Dušan Stoilović, at the address above.'],
        },
        {
          title: 'Liability',
          body: [
            'We write the content of this site with care but cannot promise it is complete or current at all times.',
            'This site links to no outside content except WhatsApp, which is responsible for its own pages.',
          ],
        },
        {
          title: 'Photos',
          body: ['All photos show BullHill’s own machines and routes and belong to BullHill d.o.o.'],
        },
      ],
    },
    privacy: {
      kicker: 'BullHill',
      title: 'Privacy',
      updated: 'As of 20 October 2026',
      blocks: [
        {
          title: 'Who is responsible',
          body: [
            `${NAME}, Kidričeva ulica 24, 3000 Celje, Slovenia, is the controller for the data described here.`,
            `For any question about your data, write to ${EMAIL}.`,
          ],
        },
        {
          title: 'Visiting the site',
          body: [
            'The site is hosted by Cloudflare. When you open a page, Cloudflare’s servers process your IP address, the page asked for, the time and your browser’s details, so the page can be delivered and protected against attacks. This rests on our legitimate interest in a safe, working site, Art. 6(1)(f) GDPR.',
            'The site sets no cookies, keeps nothing in your browser, runs no analytics and no tracking, and loads its fonts from its own server.',
          ],
        },
        {
          title: 'The contact form',
          body: [
            'When you send the form we receive what you enter, your role, name, company, email, phone, the place and length of the job and your message. We use it only to answer your request and to prepare a quote. This rests on Art. 6(1)(b) GDPR, steps before a contract you asked for.',
            'The form is sent by email through Resend, Inc. in the United States, and arrives in our mailbox at Google. Both act on our behalf under data processing terms. Transfers to the United States rest on the EU to US Data Privacy Framework or the EU standard contractual clauses.',
            'We keep your request as long as we need it to answer and to handle a job that follows, and longer only where tax or commercial law requires it.',
          ],
        },
        {
          title: 'Email, phone and WhatsApp',
          body: [
            'If you write or call us directly, we use your details the same way as a form request. If you choose WhatsApp, WhatsApp’s own privacy terms apply to that conversation.',
          ],
        },
        {
          title: 'Your rights',
          body: [
            'You can ask what data we hold about you and have it corrected, deleted, restricted or handed over to you, and you can object to processing based on our legitimate interest. Write to us at the address above.',
            'You can also complain to a data protection authority. Ours is the Information Commissioner of the Republic of Slovenia, Dunajska cesta 22, 1000 Ljubljana, www.ip-rs.si. You may also turn to the authority where you live or work.',
          ],
        },
      ],
    },
  },
  de: {
    home: 'Zurück zur Website',
    langLabel: 'Sprache',
    links: { legal: 'Impressum', privacy: 'Datenschutz' },
    meta: { legal: 'Impressum, BullHill', privacy: 'Datenschutz, BullHill' },
    legal: {
      kicker: 'BullHill',
      title: 'Impressum',
      updated: 'Stand 20. Oktober 2026',
      blocks: [
        {
          title: 'Unternehmen',
          rows: [
            { k: 'Firma', v: NAME },
            { k: 'Kurzform', v: 'BULL HILL d.o.o.' },
            { k: 'Rechtsform', v: 'Gesellschaft mit beschränkter Haftung nach slowenischem Recht (d.o.o.)' },
            { k: 'Sitz', v: 'Kidričeva ulica 24, 3000 Celje, Slowenien' },
            { k: 'Geschäftsführer', v: 'Dušan Stoilović' },
            { k: 'Unternehmensgegenstand', v: 'Tiefbau, Rohrverlegung und Hausanschlüsse für Glasfasernetze' },
          ],
        },
        {
          title: 'Register',
          rows: [
            { k: 'Register', v: 'Slowenisches Unternehmensregister (AJPES)' },
            { k: 'Registergericht', v: 'Kreisgericht Celje (Okrožno sodišče v Celju)' },
            { k: 'Registernummer', v: '1639676000' },
            { k: 'Stammkapital', v: '8.763,00 EUR' },
            { k: 'USt-IdNr.', v: 'SI77173686' },
            { k: 'Steuernummer', v: '77173686' },
          ],
        },
        {
          title: 'Kontakt',
          rows: [
            { k: 'E-Mail', v: EMAIL, href: `mailto:${EMAIL}` },
            { k: 'Telefon und WhatsApp', v: PHONE, href: PHONE_HREF },
          ],
        },
        {
          title: 'Verantwortlich für den Inhalt',
          body: ['Dušan Stoilović, Anschrift wie oben.'],
        },
        {
          title: 'Haftung',
          body: [
            'Wir erstellen die Inhalte dieser Website mit Sorgfalt, können aber nicht zusichern, dass sie jederzeit vollständig und aktuell sind.',
            'Diese Website verlinkt keine fremden Inhalte außer WhatsApp, das für seine eigenen Seiten verantwortlich ist.',
          ],
        },
        {
          title: 'Fotos',
          body: ['Alle Fotos zeigen BullHills eigene Maschinen und Trassen und gehören der BullHill d.o.o.'],
        },
      ],
    },
    privacy: {
      kicker: 'BullHill',
      title: 'Datenschutz',
      updated: 'Stand 20. Oktober 2026',
      blocks: [
        {
          title: 'Verantwortlicher',
          body: [
            `${NAME}, Kidričeva ulica 24, 3000 Celje, Slowenien, ist Verantwortlicher für die hier beschriebenen Daten.`,
            `Für Fragen zu Ihren Daten schreiben Sie an ${EMAIL}.`,
          ],
        },
        {
          title: 'Besuch der Website',
          body: [
            'Die Website wird von Cloudflare gehostet. Wenn Sie eine Seite aufrufen, verarbeiten die Server von Cloudflare Ihre IP-Adresse, die aufgerufene Seite, die Uhrzeit und Angaben zu Ihrem Browser, damit die Seite ausgeliefert und vor Angriffen geschützt werden kann. Grundlage ist unser berechtigtes Interesse an einer sicheren, funktionierenden Website, Art. 6 Abs. 1 lit. f DSGVO.',
            'Die Website setzt keine Cookies, speichert nichts in Ihrem Browser, nutzt keine Analyse- oder Trackingdienste und lädt ihre Schriften vom eigenen Server.',
          ],
        },
        {
          title: 'Das Kontaktformular',
          body: [
            'Wenn Sie das Formular senden, erhalten wir Ihre Angaben, Ihre Rolle, Name, Firma, E-Mail, Telefon, Ort und Länge des Auftrags und Ihre Nachricht. Wir verwenden sie nur, um Ihre Anfrage zu beantworten und ein Angebot zu erstellen. Grundlage ist Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahmen auf Ihre Anfrage.',
            'Das Formular wird per E-Mail über Resend, Inc. in den USA versendet und kommt in unserem Postfach bei Google an. Beide handeln in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags. Übermittlungen in die USA stützen sich auf das EU-US Data Privacy Framework oder die EU-Standardvertragsklauseln.',
            'Wir bewahren Ihre Anfrage so lange auf, wie wir sie für die Antwort und einen folgenden Auftrag brauchen, und länger nur, wenn Steuer- oder Handelsrecht es verlangt.',
          ],
        },
        {
          title: 'E-Mail, Telefon und WhatsApp',
          body: [
            'Wenn Sie uns direkt schreiben oder anrufen, verwenden wir Ihre Angaben wie bei einer Formularanfrage. Wenn Sie WhatsApp wählen, gelten für dieses Gespräch die Datenschutzbestimmungen von WhatsApp.',
          ],
        },
        {
          title: 'Ihre Rechte',
          body: [
            'Sie können Auskunft über Ihre bei uns gespeicherten Daten verlangen und sie berichtigen, löschen, einschränken oder sich übergeben lassen, und Sie können einer Verarbeitung auf Grundlage unseres berechtigten Interesses widersprechen. Schreiben Sie uns an die Adresse oben.',
            'Sie können sich außerdem bei einer Datenschutzbehörde beschweren. Für uns zuständig ist der Informationsbeauftragte der Republik Slowenien, Dunajska cesta 22, 1000 Ljubljana, www.ip-rs.si. Sie können sich auch an die Behörde an Ihrem Wohn- oder Arbeitsort wenden.',
          ],
        },
      ],
    },
  },
};

// The page address for a legal page, keeping the language in the URL like the main page does.
export const legalHref = (page: 'legal' | 'privacy', lang: Lang) => (lang === 'de' ? `/${page}?lang=de` : `/${page}`);
