import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ManualValues from "../../pages/ManualValues";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));

const renderPage = (tests: string[] = ["Hémoglobine", "Glucose"]) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/manual/values", state: { tests, sex: "homme", age: 30 } }]}
    >
      <Routes>
        <Route path="/manual/values" element={<ManualValues />} />
      </Routes>
    </MemoryRouter>
  );

describe("Page ManualValues — intégration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it("affiche une carte par test transmis", () => {
    renderPage(["Hémoglobine", "Glucose"]);
    expect(screen.getByText("Hémoglobine")).toBeInTheDocument();
    expect(screen.getByText("Glucose")).toBeInTheDocument();
  });

  it("affiche le bouton Analyser les résultats", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /analyser les résultats/i })).toBeInTheDocument();
  });

  it("navigue vers /results après analyse et stocke dans localStorage", () => {
    renderPage(["CRP"]);
    fireEvent.click(screen.getByRole("button", { name: /analyser les résultats/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/results");
    expect(localStorage.getItem("analysisResult")).not.toBeNull();
  });

  it("stocke un résultat 'normal' si la valeur est dans la plage", () => {
    renderPage(["CRP"]);

    fireEvent.change(screen.getByLabelText(/votre valeur/i), { target: { value: "5" } });
    fireEvent.change(screen.getByPlaceholderText("Minimum"), { target: { value: "0" } });
    fireEvent.change(screen.getByPlaceholderText("Maximum"), { target: { value: "10" } });

    fireEvent.click(screen.getByRole("button", { name: /analyser/i }));

    const stored = JSON.parse(localStorage.getItem("analysisResult")!);
    expect(stored.result.elements[0].categorie).toBe("normal");
  });

  it("stocke un résultat 'abnormal' si la valeur est hors plage", () => {
    renderPage(["CRP"]);

    fireEvent.change(screen.getByLabelText(/votre valeur/i), { target: { value: "25" } });
    fireEvent.change(screen.getByPlaceholderText("Minimum"), { target: { value: "0" } });
    fireEvent.change(screen.getByPlaceholderText("Maximum"), { target: { value: "10" } });

    fireEvent.click(screen.getByRole("button", { name: /analyser/i }));

    const stored = JSON.parse(localStorage.getItem("analysisResult")!);
    expect(stored.result.elements[0].categorie).toBe("abnormal");
  });
});
