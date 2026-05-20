import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";

type Options = Omit<MemoryRouterProps, "children">;

/** Enveloppe utilisée dans les tests pour que le Header puisse appeler useAuth(). */
export function wrapWithRouterAndAuth(children: ReactNode, options?: Options): ReactElement {
  return (
    <MemoryRouter {...options}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

/** À imbriquer sous MemoryRouter existant quand les routes sont déjà définies à la main. */
export function wrapWithAuth(children: ReactNode): ReactElement {
  return <AuthProvider>{children}</AuthProvider>;
}
