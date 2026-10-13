import type { Account } from "./Account";

/** The API reports no totals, so only the existence of a following page is known. */
export interface AccountPage {
  items: Account[];
  hasNext: boolean;
}
