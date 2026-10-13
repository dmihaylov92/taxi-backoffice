import type { Account } from "../../accounts/domain/models/Account";

export const driver: Account = {
  id: "acc-driver",
  email: "ivan.petrov@taxi.test",
  firstName: "Иван",
  lastName: "Петров",
  roles: ["DRIVER"],
  status: "ACTIVE",
  createdAt: "2026-08-14T10:24:00Z",
};

export const dispatcher: Account = {
  id: "acc-dispatcher",
  email: "maria@taxi.test",
  roles: ["DISPATCHER", "ADMIN"],
  status: "DISABLED",
  createdAt: "2026-08-12T16:32:00Z",
};

export const admin: Account = {
  id: "acc-admin",
  email: "admin@taxi.test",
  firstName: "Админ",
  roles: ["ADMIN"],
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
};
