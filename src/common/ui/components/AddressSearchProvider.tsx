import { createContext, useContext, type ReactNode } from "react";
import type { AddressSearchApi } from "../../domain/services/AddressSearchService";

const AddressSearchContext = createContext<AddressSearchApi | undefined>(
  undefined,
);

/** Supplies address search to every address field below; without it fields are plain inputs. */
export function AddressSearchProvider({
  search,
  children,
}: {
  search?: AddressSearchApi;
  children: ReactNode;
}) {
  return (
    <AddressSearchContext.Provider value={search}>
      {children}
    </AddressSearchContext.Provider>
  );
}

export function useAddressSearch(): AddressSearchApi | undefined {
  return useContext(AddressSearchContext);
}
