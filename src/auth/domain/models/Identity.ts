export type Role = "ADMIN" | "DISPATCHER" | "DRIVER";

export interface Identity {
  id: string;
  email: string;
  roles: Role[];
}
