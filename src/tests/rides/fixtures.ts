import type { Car, CarDriver } from "../../rides/domain/models/Car";

export const ivan: CarDriver = {
  id: "drv-ivan",
  email: "ivan.petrov@taxi.test",
  firstName: "Иван",
  lastName: "Петров",
};

export const georgi: CarDriver = {
  id: "drv-georgi",
  email: "georgi@taxi.test",
  firstName: "Георги",
  lastName: "Иванов",
};

export const unnamed: CarDriver = {
  id: "drv-unnamed",
  email: "unnamed@taxi.test",
};

export const skoda: Car = {
  id: "car-skoda",
  plate: "CB1234AB",
  make: "Skoda",
  model: "Octavia",
  vin: "TMBJB7NX0LZ123456",
  mileageKm: 120000,
  servicedAt: "2026-01-15",
  drivers: [ivan, georgi],
};

export const toyota: Car = {
  id: "car-toyota",
  plate: "E5678BH",
  drivers: [],
};
