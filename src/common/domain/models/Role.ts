/** Staff roles known to the API; shared because identity (auth) and accounts both speak them. */
export type Role = "ADMIN" | "DISPATCHER" | "DRIVER";

export const ROLES: readonly Role[] = ["ADMIN", "DISPATCHER", "DRIVER"];
