import type { CarDriver } from "./Car";

export type DriverAvailability = "AVAILABLE" | "BUSY" | "OFFLINE";

/**
 * A driver account as shown beside rides. Availability is read-only here: only drivers change
 * their own availability, never a dispatcher.
 */
export interface RideDriver extends CarDriver {
  availability?: DriverAvailability;
  /** Disabled accounts are kept for names but are not offered for assignment. */
  status?: "ACTIVE" | "DISABLED";
}

/** Up to two capital letters for an avatar: first and last name, or the start of the email. */
export function driverInitials(driver: CarDriver): string {
  const named = [driver.firstName, driver.lastName]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.charAt(0));

  return (named.length > 0 ? named.join("") : driver.email.slice(0, 2)).toUpperCase();
}
