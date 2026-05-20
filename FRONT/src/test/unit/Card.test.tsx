import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Card from "../../components/Card";

describe("Card", () => {
  const defaultProps = {
    icon: <span>🧪</span>,
    title: "Mon titre",
    description: "Ma description",
  };

  it("affiche le titre et la description", () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText("Mon titre")).toBeInTheDocument();
    expect(screen.getByText("Ma description")).toBeInTheDocument();
  });

  it("appelle onClick quand cliquée", () => {
    const onClick = vi.fn();
    render(<Card {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("utilise ariaLabel si fourni", () => {
    render(<Card {...defaultProps} ariaLabel="Accès au formulaire" />);
    expect(screen.getByRole("region", { name: "Accès au formulaire" })).toBeInTheDocument();
  });
});
