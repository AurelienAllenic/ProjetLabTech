import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type * as ReactRouterDom from "react-router-dom";
import Header from "../../components/Header";import { wrapWithRouterAndAuth } from "../authTestUtils";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = (path = "/") =>
  render(wrapWithRouterAndAuth(<Header />, { initialEntries: [path] }));

describe("Header", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it("affiche le logo et le nom Lab'IA", () => {
    renderWithRouter();
    expect(screen.getByAltText(/logo lab'ia/i)).toBeInTheDocument();
    expect(screen.getByText("Lab'IA")).toBeInTheDocument();
  });

  it("navigue vers / au clic sur le logo", () => {
    renderWithRouter();
    fireEvent.click(screen.getByRole("button", { name: /retour à l'accueil/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("n'affiche pas le bouton 'Nouvelle analyse' sur la page d'accueil", () => {
    renderWithRouter("/");
    expect(screen.queryByRole("button", { name: /nouvelle analyse/i })).toBeNull();
  });

  it("affiche le bouton 'Nouvelle analyse' sur la page /results", () => {
    renderWithRouter("/results");
    expect(screen.getByRole("button", { name: /nouvelle analyse/i })).toBeInTheDocument();
  });

  it("contient un lien d'évitement vers le contenu principal", () => {
    renderWithRouter();
    expect(screen.getByRole("link", { name: /aller au contenu principal/i })).toBeInTheDocument();
  });

  it("n'affiche pas Déconnexion sans session", () => {
    renderWithRouter();
    expect(screen.queryByRole("button", { name: /déconnexion/i })).toBeNull();
  });

  it("affiche Déconnexion lorsque labia_auth_session est présent", () => {
    sessionStorage.setItem(
      "labia_auth_session",
      JSON.stringify({ email: "a@b.com", displayName: "Alice", role: "labo" }),
    );
    renderWithRouter();
    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("nettoie la session et navigue vers / au clic sur Déconnexion", () => {
    sessionStorage.setItem(
      "labia_auth_session",
      JSON.stringify({ email: "a@b.com", displayName: "Alice", role: "userLabo" }),
    );
    renderWithRouter();
    fireEvent.click(screen.getByRole("button", { name: /se déconnecter/i }));
    expect(sessionStorage.getItem("labia_auth_session")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });
});