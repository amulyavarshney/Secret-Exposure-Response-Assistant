import Link from "next/link";

export function AppHeader() {
  return (
    <header className="app-header">
      <h1>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          Secret Exposure Response Assistant
        </Link>
      </h1>
      <nav>
        <Link href="/settings">Settings</Link>
      </nav>
    </header>
  );
}
