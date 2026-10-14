import type { Role } from "./Role";

/** Who may open a screen: anyone, any signed-in account, or accounts holding one role. */
export type Access = "PUBLIC" | "AUTHENTICATED" | Role;

/**
 * Every backoffice module and who may open it. Navigation, route guards and the landing page all
 * read this table, so a rule is declared once. Key order is the navigation order; a module without
 * a path is announced but has no screen yet. Frontend access is UX only; the API enforces it too.
 */
export const APP_MODULES = {
  home: { access: "AUTHENTICATED" },
  rides: { access: "DISPATCHER", path: "/rides" },
  cars: { access: "ADMIN", path: "/cars" },
  accounts: { access: "ADMIN", path: "/accounts" },
  settings: { access: "ADMIN" },
} as const satisfies Record<string, { access: Access; path?: string }>;

export type ModuleId = keyof typeof APP_MODULES;

/** Modules that already have a screen, and so a path to route to. */
export type RoutedModuleId = {
  [K in ModuleId]: (typeof APP_MODULES)[K] extends { path: string } ? K : never;
}[ModuleId];

/** Where a signed-in account lands: the first of these it may open. */
export const LANDING_ORDER: readonly RoutedModuleId[] = [
  "accounts",
  "rides",
  "cars",
];

/** Keys of `APP_MODULES`, which `Object.keys` types as plain strings. */
export const MODULE_IDS = Object.keys(APP_MODULES) as ModuleId[];
