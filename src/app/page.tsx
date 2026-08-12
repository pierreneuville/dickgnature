import { Badge, ButtonLink, Card, SiteFooter, SiteHeader, TrustBlock } from "@/components/ui";

const steps = [
  ["01", "Call it", "Add a title, a few lines, and two emails. Bureaucracy can sit this one out."],
  ["02", "Sign it", "Each person opens a private link on their phone — no account, no detour."],
  ["03", "Keep the receipts", "The signed PDF and its audit trail land with both people."],
] as const;

export default function HomePage() {
  return (
    <div className="landing-page" data-tone="fun">
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <Badge tone="brand">Two people. One deal. Zero circus.</Badge>
          <h1 id="hero-title">
            Make it official-ish.<br />
            <span>Keep it delightfully human.</span>
          </h1>
          <p className="hero__lede">
            Turn “we said we would” into a signed agreement in under 60 seconds.
            No signer account, no legalese maze, and a real proof trail.
          </p>
          <div className="hero__actions">
            <ButtonLink href="/contracts/new" size="lg">
              Make it official-ish <span aria-hidden="true">→</span>
            </ButtonLink>
            <a className="text-link" href="#how-it-works">
              Show me how <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className="hero__proof" aria-label="Key benefits">
            <li><span aria-hidden="true">✓</span> No signer account</li>
            <li><span aria-hidden="true">✓</span> Phone-friendly</li>
            <li><span aria-hidden="true">✓</span> Hosted in the EU</li>
          </ul>
        </div>

        <div className="hero__visual" aria-label="Preview of a completed agreement">
          <div className="hero__orbit hero__orbit--one" aria-hidden="true">very official-ish</div>
          <div className="hero__orbit hero__orbit--two" aria-hidden="true">zero paper cuts</div>
          <Card elevated className="contract-preview">
            <div className="contract-preview__topline">
              <span className="contract-preview__eyebrow">Agreement #0042</span>
              <Badge tone="success">Done &amp; signed</Badge>
            </div>
            <h2>The Last Croissant Pact</h2>
            <p>
              Camille solemnly agrees to leave the last croissant to Noa every
              Sunday, barring a truly historic hangover.
            </p>
            <div className="contract-preview__signatures">
              <div><span>Camille</span><strong>Cam&apos;</strong><small>Signed at 09:41</small></div>
              <div><span>Noa</span><strong>Noa</strong><small>Signed at 09:43</small></div>
            </div>
            <div className="contract-preview__footer">
              <span className="pulse-dot" aria-hidden="true" />
              PDF + proof trail delivered
            </div>
          </Card>
        </div>
      </section>

      <section className="value-strip" aria-label="Product promise">
        <p><strong>&lt; 60 sec</strong><span>to get the deal moving</span></p>
        <p><strong>0</strong><span>signer accounts</span></p>
        <p><strong>1 price</strong><span>per completed agreement</span></p>
      </section>

      <section className="steps-section" id="how-it-works" aria-labelledby="steps-title">
        <div className="section-heading">
          <span className="kicker">As easy as a handshake</span>
          <h2 id="steps-title">From “wait, what did we agree?” to signed and sorted.</h2>
          <p>Three tiny steps. No onboarding odyssey. No ceremonial PDF juggling.</p>
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

      <section className="proof-section" id="proof" data-tone="serious">
        <div className="section-heading section-heading--left">
          <span className="kicker">Serious where it matters</span>
          <h2>The name is the joke. The proof isn&apos;t.</h2>
          <p>
            Behind the playful interface, every completed agreement records who
            accepted what, and when, in a clear proof file.
          </p>
        </div>
        <TrustBlock />
      </section>

      <section className="mode-section" aria-labelledby="mode-title">
        <div>
          <span className="kicker">Two moods, same solid trail</span>
          <h2 id="mode-title">Fun when it fits. Straight-faced when it counts.</h2>
        </div>
        <div className="mode-cards">
          <Card className="mode-card mode-card--fun">
            <Badge tone="brand">Fun mode</Badge>
            <h3>For bets, dares, and legendary little pacts.</h3>
            <p>Playful by design, with an honest disclaimer and no fake legal swagger.</p>
          </Card>
          <Card className="mode-card mode-card--serious" data-tone="serious">
            <Badge>Serious mode</Badge>
            <h3>For agreements that keep their tie on.</h3>
            <p>A neutral, credible experience from first draft to final PDF.</p>
          </Card>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <span className="final-cta__spark" aria-hidden="true">✦</span>
        <p className="kicker">Your word deserves better than a lost voice note</p>
        <h2 id="cta-title">Say it. Sign it.<br />Get on with life.</h2>
        <ButtonLink href="/contracts/new" size="lg" variant="secondary">
          Seal the deal <span aria-hidden="true">→</span>
        </ButtonLink>
        <small>No account needed to get started.</small>
      </section>

      <SiteFooter />
    </div>
  );
}
