/** Text matches a plate fragment or a driver's name; empty means "no restriction". */
export interface CarFilters {
  text: string;
}

export const NO_CAR_FILTERS: CarFilters = { text: "" };
