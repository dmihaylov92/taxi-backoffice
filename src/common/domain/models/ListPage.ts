/** The API reports no totals, so only the existence of a following page is known. */
export interface ListPage<Item> {
  items: Item[];
  hasNext: boolean;
}
