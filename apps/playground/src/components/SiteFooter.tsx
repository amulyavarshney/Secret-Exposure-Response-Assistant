import {
  PRODUCTION_DOCS_ANCHOR,
  REPO_URL,
  SAFETY_NOTE,
} from "../lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <h3>About this playground</h3>
        <p>
          Advisory-only demo — scans run entirely in your browser. For
          production deployment, use a fingerprint salt, server-side connector
          credentials, and TLS. See the repository production checklist before
          exposing beyond a local workstation.
        </p>
        <div className="site-footer-links">
          <a
            href={`${REPO_URL}/blob/main/README.md${PRODUCTION_DOCS_ANCHOR}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Production checklist →
          </a>
          <a
            href={`${REPO_URL}/blob/main/docs/SAFETY.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Safety rules
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem" }}>{SAFETY_NOTE}</p>
      </div>
    </footer>
  );
}
