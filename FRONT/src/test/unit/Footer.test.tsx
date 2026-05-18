import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "../../components/Footer";

const renderWithRouter = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Footer />
    </MemoryRouter>
  );

describe("Footer", () => {
  it("affiche le nom Lab'IA dans le footer", () => {
    renderWithRouter();
    // Le h4 dans le footer contient exactement "Lab'IA"
    expect(screen.getByRole("heading", { name: "Lab'IA" })).toBeInTheDocument();
  });

  it("affiche les liens de navigation principaux", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /^accueil$/i })).toBeInTheDocument();
    // Cherche uniquement le lien "Aide" dans la nav du footer (pas "Centre d'aide →")
    expect(screen.getByRole("link", { name: /^aide$/i })).toBeInTheDocument();
  });

  it("affiche les liens légaux", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /confidentialité/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cookies/i })).toBeInTheDocument();
  });

  it("marque le lien actif avec aria-current='page'", () => {
    renderWithRouter("/help");
    const helpLinks = screen.getAllByRole("link", { name: /aide/i });
    const activeLink = helpLinks.find(
      (el) => el.getAttribute("aria-current") === "page"
    );
    expect(activeLink).toBeDefined();
  });

  it("affiche le copyright", () => {
    renderWithRouter();
    expect(screen.getByText(/2025 lab'ia/i)).toBeInTheDocument();
  });
});
