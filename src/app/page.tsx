import { Badge, ButtonLink, Card, SiteFooter, SiteHeader, TrustBlock } from "@/components/ui";

const steps = [
  ["01", "Tu poses l’accord", "Un titre, quelques lignes, les deux emails. Pas de tunnel administratif."],
  ["02", "Vous signez", "Chacun ouvre son lien privé sur mobile, sans compte, puis signe."],
  ["03", "Vous gardez la preuve", "Le PDF final et son journal arrivent aux deux parties."],
] as const;

export default function HomePage() {
  return (
    <div className="landing-page" data-tone="fun">
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <Badge tone="brand">Le contrat à deux, sans le cirque</Badge>
          <h1 id="hero-title">
            Un accord carré.<br />
            <span>Une signature qui l’est moins.</span>
          </h1>
          <p className="hero__lede">
            Créez et signez un contrat à deux en moins de 60 secondes. Sans compte
            pour le signataire, sans jargon, avec un vrai dossier de preuve.
          </p>
          <div className="hero__actions">
            <ButtonLink href="/contracts/new" size="lg">
              Créer un contrat <span aria-hidden="true">→</span>
            </ButtonLink>
            <a className="text-link" href="#comment-ca-marche">
              Voir comment ça marche <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className="hero__proof" aria-label="Avantages clés">
            <li><span aria-hidden="true">✓</span> Sans compte</li>
            <li><span aria-hidden="true">✓</span> Mobile-first</li>
            <li><span aria-hidden="true">✓</span> Hébergé en UE</li>
          </ul>
        </div>

        <div className="hero__visual" aria-label="Aperçu d’un contrat finalisé">
          <div className="hero__orbit hero__orbit--one" aria-hidden="true">très officiel</div>
          <div className="hero__orbit hero__orbit--two" aria-hidden="true">zéro paperasse</div>
          <Card elevated className="contract-preview">
            <div className="contract-preview__topline">
              <span className="contract-preview__eyebrow">Contrat #0042</span>
              <Badge tone="success">Finalisé</Badge>
            </div>
            <h2>Le pacte du dernier croissant</h2>
            <p>
              Camille s’engage solennellement à laisser le dernier croissant à
              Noa, tous les dimanches, sauf gueule de bois majeure.
            </p>
            <div className="contract-preview__signatures">
              <div><span>Camille</span><strong>Cam’</strong><small>Signé à 09:41</small></div>
              <div><span>Noa</span><strong>Noa</strong><small>Signé à 09:43</small></div>
            </div>
            <div className="contract-preview__footer">
              <span className="pulse-dot" aria-hidden="true" />
              PDF + dossier de preuve envoyés
            </div>
          </Card>
        </div>
      </section>

      <section className="value-strip" aria-label="Promesse produit">
        <p><strong>&lt; 60 s</strong><span>pour lancer l’accord</span></p>
        <p><strong>0</strong><span>compte côté signataire</span></p>
        <p><strong>1 prix</strong><span>par contrat finalisé</span></p>
      </section>

      <section className="steps-section" id="comment-ca-marche" aria-labelledby="steps-title">
        <div className="section-heading">
          <span className="kicker">Simple comme une poignée de main</span>
          <h2 id="steps-title">De « on avait dit quoi déjà ? » à un accord signé.</h2>
          <p>Trois étapes. Pas d’enveloppe numérique, pas de formation certifiante.</p>
        </div>
        <ol className="steps-grid">
          {steps.map(([number, title, description]) => (
            <li key={number}>
              <span className="steps-grid__number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="proof-section" id="preuve" data-tone="serious">
        <div className="section-heading section-heading--left">
          <span className="kicker">Le sérieux, au bon endroit</span>
          <h2>La blague est dans le nom. Pas dans la preuve.</h2>
          <p>
            Sous l’interface légère, chaque contrat finalisé rassemble les éléments
            utiles pour raconter clairement qui a accepté quoi, et quand.
          </p>
        </div>
        <TrustBlock />
      </section>

      <section className="mode-section" aria-labelledby="mode-title">
        <div>
          <span className="kicker">Deux tons, une même rigueur</span>
          <h2 id="mode-title">Fun quand ça s’y prête. Neutre quand ça compte.</h2>
        </div>
        <div className="mode-cards">
          <Card className="mode-card mode-card--fun">
            <Badge tone="brand">Mode fun</Badge>
            <h3>Pour les paris et pactes mémorables.</h3>
            <p>Une identité parodique assumée, toujours avec le disclaimer honnête.</p>
          </Card>
          <Card className="mode-card mode-card--serious" data-tone="serious">
            <Badge>Mode serious</Badge>
            <h3>Pour les accords qui gardent leur cravate.</h3>
            <p>Une expérience entièrement neutre, de la page au PDF final.</p>
          </Card>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <span className="final-cta__spark" aria-hidden="true">✦</span>
        <p className="kicker">Votre parole mérite mieux qu’un vocal perdu</p>
        <h2 id="cta-title">Mettez-vous d’accord.<br />Pour de vrai.</h2>
        <ButtonLink href="/contracts/new" size="lg" variant="secondary">
          Créer mon contrat <span aria-hidden="true">→</span>
        </ButtonLink>
        <small>Pas de compte requis pour commencer.</small>
      </section>

      <SiteFooter />
    </div>
  );
}
