const SAFE_QUERY_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);
const DYNAMIC_SEGMENT_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[A-Za-z0-9_-]{16,})$/i;

function trimValue(value: string, maxLength = 160) {
  return value.trim().slice(0, maxLength);
}

export function sanitizePathname(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      return DYNAMIC_SEGMENT_PATTERN.test(segment)
        ? ":id"
        : encodeURIComponent(decodeURIComponent(segment)).slice(0, 80);
    })
    .join("/");
}

export function sanitizeTitle(title: string) {
  return trimValue(title.replace(/\s+/g, " "), 120);
}

export function sanitizeUrl(rawUrl: string) {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.leanagentbuilder.com";
    const url = new URL(rawUrl, origin);
    const sanitized = new URL(url.origin);
    sanitized.pathname = sanitizePathname(url.pathname);
    for (const key of SAFE_QUERY_KEYS) {
      const value = url.searchParams.get(key);
      if (value) sanitized.searchParams.set(key, trimValue(value, 120));
    }
    return sanitized.toString();
  } catch {
    return "";
  }
}

export function sanitizeReferrer(rawReferrer: string) {
  if (!rawReferrer) return "";
  try {
    const referrer = new URL(rawReferrer);
    return `${referrer.origin}${sanitizePathname(referrer.pathname)}`;
  } catch {
    return "";
  }
}
