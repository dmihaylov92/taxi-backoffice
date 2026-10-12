export type FormField = "email" | "password" | "confirm";

export type FormErrorKind =
  | "emailInvalid"
  | "passwordRequired"
  | "passwordPolicy"
  | "passwordMismatch";

export type FormErrors = Partial<Record<FormField, FormErrorKind>>;

export interface FormValues {
  email: string;
  password: string;
  confirm: string;
}
