import { Logger } from '@nestjs/common';

/**
 * Resolución de la URL pública del frontend, usada en los enlaces que se
 * mandan por correo (verificación de cuenta, por ahora).
 *
 * Orden de prioridad:
 *   1. `APP_URL` (si está definida y es válida; en producción se ignora si
 *      apunta a localhost, que es la causa típica de enlaces roto).
 *   2. Origen que reenvía el proxy de Next (`x-app-origin`).
 *   3. Cabecera `Origin` de la petición.
 *   4. Origen de la cabecera `Referer`.
 *   5. `X-Forwarded-Host` / `Host`, solo si el host parece público.
 *   6. En desarrollo, `http://localhost:3000`.
 */

const logger = new Logger('PublicUrl');

const DEFAULT_DEV_URL = 'http://localhost:3000';

// Hosts que nunca son accesibles para el jugador que abre el correo.
const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

export interface AppUrlHints {
  /** Origen reenviado por el proxy del frontend (este sí es la URL del jugador). */
  appOrigin?: string;
  origin?: string;
  referer?: string;
  forwardedProto?: string;
  forwardedHost?: string;
  host?: string;
  /** Por defecto se deduce de NODE_ENV. */
  isProduction?: boolean;
}

export interface AppUrlRequestLike {
  headers: Record<string, string | string[] | undefined>;
}

function firstHeader(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return firstHeader(value[0]);
  }

  const first = value?.split(',')[0]?.trim();
  return first || undefined;
}

/** Devuelve `protocolo://host` sin barra final, o undefined si no es http(s). */
export function normalizeBaseUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}

/** Extrae el origen de un `Referer` completo. */
function originFromReferer(referer?: string): string | undefined {
  if (!referer) {
    return undefined;
  }

  try {
    return `${new URL(referer).protocol}//${new URL(referer).host}`;
  } catch {
    return undefined;
  }
}

export function isLocalUrl(url?: string): boolean {
  const normalized = normalizeBaseUrl(url);

  if (!normalized) {
    return false;
  }

  return LOCAL_HOSTNAMES.has(new URL(normalized).hostname.toLowerCase());
}

/**
 * Un host público tiene dominio (nidoria.org). Los nombres de servicio de
 * Docker (`api`, `web`) y localhost no sirven en un correo.
 */
function isPublicHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase();

  if (!hostname || LOCAL_HOSTNAMES.has(hostname)) {
    return false;
  }

  return hostname.includes('.');
}

function protocolFrom(value?: string): string | undefined {
  const proto = firstHeader(value)?.toLowerCase();
  return proto === 'http' || proto === 'https' ? proto : undefined;
}

export function resolvePublicAppUrl(
  configured?: string,
  hints: AppUrlHints = {},
): string {
  const isProduction =
    hints.isProduction ?? process.env.NODE_ENV === 'production';

  const fromEnv = normalizeBaseUrl(configured);

  if (fromEnv && !(isProduction && isLocalUrl(fromEnv))) {
    return fromEnv;
  }

  if (fromEnv && isProduction) {
    logger.warn(
      `APP_URL apunta a ${fromEnv}, que no es accesible desde el correo del jugador. Se usará el origen de la petición.`,
    );
  }

  const fromRequest =
    normalizeBaseUrl(firstHeader(hints.appOrigin)) ??
    normalizeBaseUrl(firstHeader(hints.origin)) ??
    normalizeBaseUrl(originFromReferer(firstHeader(hints.referer)));

  if (fromRequest) {
    return fromRequest;
  }

  if (!isProduction) {
    return DEFAULT_DEV_URL;
  }

  const proto = protocolFrom(hints.forwardedProto) ?? 'https';
  const hosts = [firstHeader(hints.forwardedHost), firstHeader(hints.host)];

  for (const host of hosts) {
    if (!host || !isPublicHost(host)) {
      continue;
    }

    const candidate = normalizeBaseUrl(`${proto}://${host}`);

    if (candidate) {
      logger.warn(
        `Enlace de verificación resuelto con el host de la petición (${candidate}). Si el frontend vive en otro dominio, define APP_URL.`,
      );

      return candidate;
    }
  }

  logger.error(
    'No se pudo resolver la URL pública del frontend: define APP_URL con el dominio real (por ejemplo https://nidoria.org). Los enlaces de verificación apuntarán a localhost.',
  );

  return DEFAULT_DEV_URL;
}

export function urlHintsFromRequest(
  request: AppUrlRequestLike,
  isProduction = process.env.NODE_ENV === 'production',
): AppUrlHints {
  const headers = request?.headers ?? {};

  return {
    appOrigin: firstHeader(headers['x-app-origin']),
    origin: firstHeader(headers['origin']),
    referer: firstHeader(headers['referer']),
    forwardedProto: firstHeader(headers['x-forwarded-proto']),
    forwardedHost: firstHeader(headers['x-forwarded-host']),
    host: firstHeader(headers['host']),
    isProduction,
  };
}
