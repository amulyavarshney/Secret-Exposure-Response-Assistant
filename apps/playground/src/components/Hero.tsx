import { useIncident } from "../context/incident-context";
import { SAFETY_NOTE, TAGLINE } from "../lib/constants";

export function Hero() {
  const { startWizard } = useIncident();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <p className="hero-eyebrow">Local-first credential response</p>
      <h1 id="hero-title" className="hero-title">
        Secret Response
      </h1>
      <p className="hero-tagline">{TAGLINE}</p>
      <div className="hero-cta-row">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={startWizard}
        >
          Start containment scan
        </button>
      </div>
      <p className="hero-note">{SAFETY_NOTE}</p>
      <div className="hero-grid-line" aria-hidden />
    </section>
  );
}
