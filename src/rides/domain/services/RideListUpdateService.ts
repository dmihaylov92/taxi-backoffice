import type { ListPage } from "../../../common/domain/models/ListPage";
import type { Ride } from "../models/Ride";
import type { RideEvent } from "../models/RideEvent";
import type { RideFilters } from "../models/RideFilters";

function matches(filters: RideFilters, ride: Ride): boolean {
  return !filters.status || ride.status === filters.status;
}

function time(timestamp: string | undefined): number | undefined {
  const parsed = timestamp ? Date.parse(timestamp) : Number.NaN;

  return Number.isNaN(parsed) ? undefined : parsed;
}

/** An event older than the row already held is a late duplicate and must not roll the row back. */
function isStale(held: Ride, incoming: Ride): boolean {
  const heldAt = time(held.updatedAt);
  const incomingAt = time(incoming.updatedAt);

  return (
    heldAt !== undefined && incomingAt !== undefined && incomingAt < heldAt
  );
}

/** The list is newest first, so a ride goes before the first row created earlier than it. */
function insertionIndex(items: readonly Ride[], ride: Ride): number {
  const createdAt = time(ride.createdAt);

  if (createdAt === undefined) {
    return 0;
  }

  const index = items.findIndex((row) => {
    const rowCreatedAt = time(row.createdAt);

    return rowCreatedAt !== undefined && rowCreatedAt < createdAt;
  });

  return index === -1 ? items.length : index;
}

function applyUpdate(
  page: ListPage<Ride>,
  filters: RideFilters,
  pageIndex: number,
  ride: Ride,
  pageSize: number,
): ListPage<Ride> {
  const index = page.items.findIndex((row) => row.id === ride.id);

  if (index !== -1) {
    if (isStale(page.items[index], ride)) {
      return page;
    }

    const items = matches(filters, ride)
      ? page.items.map((row) => (row.id === ride.id ? ride : row))
      : page.items.filter((row) => row.id !== ride.id);

    return { ...page, items };
  }

  // Only the first page can show a ride the list has not seen; other pages catch up on reload.
  if (pageIndex !== 0 || !matches(filters, ride)) {
    return page;
  }

  const items = [...page.items];

  items.splice(insertionIndex(items, ride), 0, ride);

  return {
    items: items.slice(0, pageSize),
    hasNext: page.hasNext || items.length > pageSize,
  };
}

/**
 * Applies one live event to the loaded page of the rides list. An updated ride replaces its row,
 * or leaves the page when it no longer matches the status filter; a ride the page has not seen is
 * added in newest-first order on the first page only, pushing the last row off the page; a deleted
 * ride leaves the page. Events older than the row held are ignored.
 */
export function applyRideEvent(
  page: ListPage<Ride>,
  filters: RideFilters,
  pageIndex: number,
  event: RideEvent,
  pageSize: number,
): ListPage<Ride> {
  switch (event.type) {
    case "updated": {
      return applyUpdate(page, filters, pageIndex, event.ride, pageSize);
    }

    case "deleted": {
      return {
        ...page,
        items: page.items.filter((row) => row.id !== event.id),
      };
    }
  }
}
