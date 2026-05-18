import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TestValueCard from "../../components/TestValueCard";

describe("TestValueCard", () => {
  it("affiche le nom du test comme légende", () => {
    render(<TestValueCard name="Hémoglobine" />);
    expect(screen.getByText("Hémoglobine")).toBeInTheDocument();
  });

  it("affiche les champs valeur, unité, min, max", () => {
    render(<TestValueCard name="Glucose" />);
    expect(screen.getByLabelText(/votre valeur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unité/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Minimum")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Maximum")).toBeInTheDocument();
  });

  it("appelle onChange avec les bonnes données à la saisie", () => {
    const onChange = vi.fn();
    render(<TestValueCard name="CRP" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/votre valeur/i), {
      target: { value: "12.5" },
    });

    expect(onChange).toHaveBeenCalledWith("CRP", expect.objectContaining({ value: "12.5" }));
  });

  it("appelle onChange lors du changement d'unité", () => {
    const onChange = vi.fn();
    render(<TestValueCard name="CRP" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/unité/i), {
      target: { value: "mg/dL" },
    });

    expect(onChange).toHaveBeenCalledWith("CRP", expect.objectContaining({ unit: "mg/dL" }));
  });
});
