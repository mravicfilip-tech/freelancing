// Placeholder content below the hero, so the pinned scroll has a page to hand over to.
// Dummy copy on purpose. It is not part of the brief and carries no claims or numbers.

const cards = ['Viljuškar sa kontratežom', 'Retrak viljuškar', 'Elektro paletar'];

export function Placeholder() {
  return (
    <main className="placeholder" aria-label="Privremeni sadržaj">
      <section className="ph-section">
        <p className="ph-kicker">Privremeni sadržaj</p>
        <h2>Izdvojeni modeli</h2>
        <div className="ph-grid">
          {cards.map((c) => (
            <article key={c} className="ph-card">
              <div className="ph-img" aria-hidden="true" />
              <h3>{c}</h3>
              <p>Kratak opis modela ide ovde. Tekst je privremen i biće zamenjen pravim sadržajem.</p>
              <span className="ph-link">Saznajte više</span>
            </article>
          ))}
        </div>
      </section>
      <section className="ph-band">
        <h2>Tekst o kompaniji</h2>
        <p>Privremeni pasus o kompaniji, servisu i najmu. Pravi tekst stiže u sledećoj fazi.</p>
      </section>
      <footer className="ph-footer">Ekotehnika viljuškari d.o.o., Vrčin</footer>
    </main>
  );
}
