import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UiButton from "../../components/UiButton";

describe("UiButton", () => {
  it("affiche le texte du bouton", () => {
    render(<UiButton>Cliquer ici</UiButton>);
    expect(screen.getByRole("button", { name: /cliquer ici/i })).toBeInTheDocument();
  });

  it("appelle onClick quand cliqué", () => {
    const onClick = vi.fn();
    render(<UiButton onClick={onClick}>Action</UiButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("est désactivé quand disabled=true", () => {
    render(<UiButton disabled>Envoi</UiButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("ne déclenche pas onClick quand disabled", () => {
    const onClick = vi.fn();
    render(<UiButton onClick={onClick} disabled>Envoi</UiButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applique la classe personnalisée", () => {
    render(<UiButton className="ma-classe">Test</UiButton>);
    expect(screen.getByRole("button")).toHaveClass("ma-classe");
  });

  it("utilise type='submit' quand précisé", () => {
    render(<UiButton type="submit">Envoyer</UiButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
