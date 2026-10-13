/** Identity of a driver as shown with a car. */
export interface CarDriver {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/** First and last name, falling back to the email for an unnamed account. */
export function driverName(driver: CarDriver): string {
  return (
    [driver.firstName, driver.lastName].filter(Boolean).join(" ") ||
    driver.email
  );
}

export interface Car {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  vin?: string;
  mileageKm?: number;
  /** Calendar date of the last service, `yyyy-MM-dd`. */
  servicedAt?: string;
  drivers: CarDriver[];
}
