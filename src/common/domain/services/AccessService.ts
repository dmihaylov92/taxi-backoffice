import {
  APP_MODULES,
  LANDING_ORDER,
  MODULE_IDS,
  type Access,
  type ModuleId,
  type RoutedModuleId,
} from "../models/AppModule";
import type { Role } from "../models/Role";

/** `roles` is undefined when nobody is signed in. Roles are not implied: ADMIN does not grant DISPATCHER. */
export function canAccess(
  roles: readonly Role[] | undefined,
  access: Access,
): boolean {
  switch (access) {
    case "PUBLIC": {
      return true;
    }

    case "AUTHENTICATED": {
      return roles !== undefined;
    }

    default: {
      return roles?.includes(access) ?? false;
    }
  }
}

export function canOpenModule(
  roles: readonly Role[] | undefined,
  id: ModuleId,
): boolean {
  return canAccess(roles, APP_MODULES[id].access);
}

export interface NavModule {
  id: ModuleId;
  /** Absent while the module has no screen. */
  path?: string;
}

/** Modules in navigation order that the account may open; the others are not shown at all. */
export function visibleModules(roles: readonly Role[] | undefined): NavModule[] {
  return MODULE_IDS.filter((id) => canOpenModule(roles, id)).map((id) => {
    const module = APP_MODULES[id];

    return { id, path: "path" in module ? module.path : undefined };
  });
}

export function modulePath(id: RoutedModuleId): string {
  return APP_MODULES[id].path;
}

/** The first screen the account may open, or undefined when it has none. */
export function landingPath(roles: readonly Role[]): string | undefined {
  const landing = LANDING_ORDER.find((id) => canOpenModule(roles, id));

  return landing ? modulePath(landing) : undefined;
}
