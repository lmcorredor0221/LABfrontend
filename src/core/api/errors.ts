export type ApiErrorSource = "backend" | "proxy" | "client";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "REQUEST_ABORTED"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "REQUEST_FAILED"
  | "UNEXPECTED_ERROR";

export type ApiErrorJson = {
  status: number;
  code: ApiErrorCode | string;
  message: string;
  details?: unknown;
  method?: string;
  url?: string;
  source: ApiErrorSource;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStatusCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 408:
    case 504:
      return "REQUEST_TIMEOUT";
    default:
      return "REQUEST_FAILED";
  }
}

function getReadableDetail(detail: unknown) {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (isRecord(entry) && typeof entry.msg === "string") {
          return entry.msg;
        }

        return null;
      })
      .filter(Boolean)
      .join("; ");
  }

  return null;
}

function getErrorEnvelope(payload: unknown) {
  if (isRecord(payload) && isRecord(payload.error)) {
    return payload.error;
  }

  return null;
}

function getMessage(payload: unknown, fallbackMessage: string) {
  const errorEnvelope = getErrorEnvelope(payload);

  if (errorEnvelope && typeof errorEnvelope.message === "string" && errorEnvelope.message.trim()) {
    return errorEnvelope.message;
  }

  if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (isRecord(payload)) {
    const detail = getReadableDetail(payload.detail);
    if (detail) {
      return detail;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallbackMessage;
}

function getDetails(payload: unknown) {
  const errorEnvelope = getErrorEnvelope(payload);

  if (errorEnvelope && "details" in errorEnvelope) {
    return errorEnvelope.details;
  }

  if (isRecord(payload) && "detail" in payload) {
    return payload.detail;
  }

  return payload;
}

function getCode(payload: unknown, status: number) {
  const errorEnvelope = getErrorEnvelope(payload);

  if (errorEnvelope && typeof errorEnvelope.code === "string" && errorEnvelope.code.trim()) {
    return errorEnvelope.code;
  }

  return getStatusCode(status);
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;
  readonly details?: unknown;
  readonly method?: string;
  readonly url?: string;
  readonly source: ApiErrorSource;

  constructor({
    status,
    code,
    message,
    details,
    method,
    url,
    source,
  }: ApiErrorJson) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.method = method;
    this.url = url;
    this.source = source;
  }

  toJSON(): ApiErrorJson {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      method: this.method,
      url: this.url,
      source: this.source,
    };
  }

  static fromResponse({
    status,
    payload,
    method,
    url,
    source,
    fallbackMessage,
  }: {
    status: number;
    payload: unknown;
    method?: string;
    url?: string;
    source: ApiErrorSource;
    fallbackMessage?: string;
  }) {
    return new ApiError({
      status,
      code: getCode(payload, status),
      message: getMessage(payload, fallbackMessage ?? "The request failed."),
      details: getDetails(payload),
      method,
      url,
      source,
    });
  }

  static fromClientError({
    message,
    code = "UNEXPECTED_ERROR",
    details,
    method,
    url,
  }: {
    message: string;
    code?: ApiErrorCode | string;
    details?: unknown;
    method?: string;
    url?: string;
  }) {
    return new ApiError({
      status: 0,
      code,
      message,
      details,
      method,
      url,
      source: "client",
    });
  }
}

export function createApiErrorPayload({
  status,
  code,
  message,
  details,
  method,
  url,
  source,
}: ApiErrorJson) {
  return {
    ok: false as const,
    error: {
      status,
      code,
      message,
      details,
      method,
      url,
      source,
    },
  };
}
