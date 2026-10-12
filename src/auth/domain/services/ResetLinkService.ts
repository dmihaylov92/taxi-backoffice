const LINK_PATHS = ["/reset-password", "/set-password"];
const MAX_TOKEN_LENGTH = 200;

/**
 * Reads the one-time token from the URL fragment of a reset/set link and
 * scrubs the fragment from history so the secret never stays in the address bar.
 */
export function consumeLinkToken(): string | undefined {
  const isLink = LINK_PATHS.includes(location.pathname);
  const token = isLink
    ? new URLSearchParams(location.hash.slice(1)).get("token")
    : null;

  if (location.hash) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }

  return token && token.length <= MAX_TOKEN_LENGTH ? token : undefined;
}

export function isLinkPath(pathname: string): boolean {
  return LINK_PATHS.includes(pathname);
}
