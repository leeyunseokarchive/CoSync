import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer container">
      <span>© 2025 CoSync</span>
      <Link href="#" className="footer-link">
        개인정보처리방침
      </Link>
    </footer>
  );
}
