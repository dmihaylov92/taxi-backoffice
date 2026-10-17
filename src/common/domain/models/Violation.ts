/** Why the API refused one request field; `code` is its stable reason, such as `REQUIRED` or `TOO_LONG`. */
export interface Violation {
  field: string;
  code: string;
}
