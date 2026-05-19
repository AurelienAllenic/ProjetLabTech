import { useLocation, Link } from "react-router-dom";

interface NavItem {
  href: string;
  label: string;
}

const NAV_LINKS: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/help", label: "Aide" },
];

const LEGAL_LINKS: NavItem[] = [
  { href: "/mentions-legales", label: "Conditions d'utilisation" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cookies", label: "Politique des cookies" },
];

interface FooterLinkProps {
  href: string;
  label: string;
  active: boolean;
}

function FooterLink({ href, label, active }: FooterLinkProps) {
  return (
    <li>
      <Link
        to={href}
        className={`text-xs transition rounded px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400
          ${active ? "text-white font-semibold" : "text-gray-400 hover:text-white"}`}
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-raspberry-400 mr-2 mb-0.5 align-middle"
            aria-hidden="true"
          />
        )}
        {label}
      </Link>
    </li>
  );
}

export default function Footer() {
  const { pathname } = useLocation();

  return (
    <footer
      role="contentinfo"
      className="bg-gray-900 text-gray-400 text-sm pt-12 pb-6 mt-auto"
    >
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div>
          <h4 className="font-bold text-white mb-3 text-sm">Lab'IA</h4>
          <p className="text-xs leading-relaxed text-gray-400">
            Rendre les résultats médicaux compréhensibles pour tous.
          </p>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed italic">
            Outil éducatif uniquement — ne remplace pas un avis médical
            professionnel.
          </p>
        </div>

        <nav aria-label="Navigation principale du pied de page">
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-widest">
            Navigation
          </h4>
          <ul className="space-y-2">
            {NAV_LINKS.map((l) => (
              <FooterLink
                key={l.href}
                href={l.href}
                label={l.label}
                active={pathname === l.href}
              />
            ))}
          </ul>
        </nav>

        <nav aria-label="Liens légaux du pied de page">
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-widest">
            Légal
          </h4>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((l) => (
              <FooterLink
                key={l.href}
                href={l.href}
                label={l.label}
                active={pathname === l.href}
              />
            ))}
          </ul>
        </nav>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-widest">
            Contact
          </h4>
          <p className="text-xs text-gray-400">contact@labia.com</p>
          <Link
            to="/help"
            className={`text-xs mt-2 inline-block transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded
              ${pathname === "/help" ? "text-white font-semibold" : "text-raspberry-400 hover:text-raspberry-300"}`}
          >
            Centre d'aide →
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 text-center">
        <p className="text-xs text-gray-600">
          © 2025 Lab'IA. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
