import { Logger } from '@nestjs/common';
import {
  isLocalUrl,
  normalizeBaseUrl,
  resolvePublicAppUrl,
  urlHintsFromRequest,
} from './public-url';

describe('public-url', () => {
  beforeEach(() => {
    // Los avisos están pensados para producción; en tests solo hacen ruido.
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('normalizeBaseUrl', () => {
    it('quita la barra final y las rutas', () => {
      expect(normalizeBaseUrl('https://nidoria.org/')).toBe(
        'https://nidoria.org',
      );
      expect(
        normalizeBaseUrl('https://nidoria.org/verifyAccount/1/token'),
      ).toBe('https://nidoria.org');
    });

    it('devuelve undefined para valores vacíos o no http(s)', () => {
      expect(normalizeBaseUrl(undefined)).toBeUndefined();
      expect(normalizeBaseUrl('   ')).toBeUndefined();
      expect(normalizeBaseUrl('mailto:hola@nidoria.org')).toBeUndefined();
      expect(normalizeBaseUrl('no-es-una-url')).toBeUndefined();
    });
  });

  describe('isLocalUrl', () => {
    it('detecta localhost y loopback', () => {
      expect(isLocalUrl('http://localhost:3000')).toBe(true);
      expect(isLocalUrl('http://127.0.0.1:3000')).toBe(true);
      expect(isLocalUrl('https://nidoria.org')).toBe(false);
    });
  });

  describe('resolvePublicAppUrl', () => {
    it('usa APP_URL cuando está definida', () => {
      expect(
        resolvePublicAppUrl('https://nidoria.org/', { isProduction: true }),
      ).toBe('https://nidoria.org');
    });

    it('en producción ignora un APP_URL con localhost y usa el origen de la petición', () => {
      expect(
        resolvePublicAppUrl('http://localhost:3000', {
          appOrigin: 'https://nidoria.org',
          isProduction: true,
        }),
      ).toBe('https://nidoria.org');
    });

    it('en desarrollo respeta APP_URL aunque sea localhost', () => {
      expect(
        resolvePublicAppUrl('http://localhost:3000', {
          appOrigin: 'https://nidoria.org',
          isProduction: false,
        }),
      ).toBe('http://localhost:3000');
    });

    it('usa x-app-origin (origen reenviado por Next) antes que Origin', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          appOrigin: 'https://nidoria.org',
          origin: 'https://api.nidoria.org',
          isProduction: true,
        }),
      ).toBe('https://nidoria.org');
    });

    it('usa la cabecera Origin si no hay app-origin', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          origin: 'https://nidoria.org',
          isProduction: true,
        }),
      ).toBe('https://nidoria.org');
    });

    it('usa el origen del Referer como último recurso de la petición', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          referer: 'https://nidoria.org/register?step=2',
          isProduction: true,
        }),
      ).toBe('https://nidoria.org');
    });

    it('en producción usa X-Forwarded-Host si es un dominio público', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          forwardedProto: 'https',
          forwardedHost: 'nidoria.org',
          host: 'api:4000',
          isProduction: true,
        }),
      ).toBe('https://nidoria.org');
    });

    it('descarta nombres de servicio de Docker y cae a localhost con aviso', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          forwardedProto: 'http',
          forwardedHost: 'api',
          host: 'api:4000',
          isProduction: true,
        }),
      ).toBe('http://localhost:3000');
    });

    it('en desarrollo devuelve localhost:3000 si no hay ninguna pista', () => {
      expect(
        resolvePublicAppUrl(undefined, {
          host: 'localhost:4000',
          isProduction: false,
        }),
      ).toBe('http://localhost:3000');
    });
  });

  describe('urlHintsFromRequest', () => {
    it('extrae las cabeceras relevantes y toma solo el primer valor', () => {
      const hints = urlHintsFromRequest(
        {
          headers: {
            'x-app-origin': 'https://nidoria.org',
            origin: 'https://api.nidoria.org',
            referer: 'https://nidoria.org/register',
            'x-forwarded-proto': 'https,http',
            'x-forwarded-host': 'nidoria.org,interno',
            host: 'api:4000',
          },
        },
        true,
      );

      expect(hints).toEqual({
        appOrigin: 'https://nidoria.org',
        origin: 'https://api.nidoria.org',
        referer: 'https://nidoria.org/register',
        forwardedProto: 'https',
        forwardedHost: 'nidoria.org',
        host: 'api:4000',
        isProduction: true,
      });
    });
  });
});
