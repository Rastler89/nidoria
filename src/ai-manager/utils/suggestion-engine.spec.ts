import { getDetailedErrorExplanation, getSuggestion } from './suggestion-engine';

describe('SuggestionEngine', () => {
  describe('getDetailedErrorExplanation', () => {
    it('should return empty string when status matches expected', () => {
      expect(getDetailedErrorExplanation('test', 200, 200, {})).toBe('');
    });
    it('should handle array of expected statuses', () => {
      expect(getDetailedErrorExplanation('test', 201, [200, 201], {})).toBe('');
    });
    it('should explain 401 errors', () => {
      const r = getDetailedErrorExplanation('test', 401, 200, {});
      expect(r).toContain('credenciales');
    });
    it('should explain 404 errors', () => {
      const r = getDetailedErrorExplanation('test', 404, 200, {});
      expect(r).toContain('no existe');
    });
    it('should explain 409 errors', () => {
      const r = getDetailedErrorExplanation('test', 409, 200, {});
      expect(r).toContain('conflicto');
    });
    it('should explain 500+ errors', () => {
      const r = getDetailedErrorExplanation('test', 500, 200, {});
      expect(r).toContain('crítico');
    });
    it('should append server message when present', () => {
      const r = getDetailedErrorExplanation('test', 400, 200, { message: 'bad input' });
      expect(r).toContain('bad input');
    });
  });

  describe('getSuggestion', () => {
    it('should return empty for success statuses', () => {
      expect(getSuggestion('test', 200, {})).toBe('');
      expect(getSuggestion('test', 201, {})).toBe('');
    });
    it('should suggest for 400', () => {
      expect(getSuggestion('test', 400, {})).toContain('parámetros');
    });
    it('should suggest for 401', () => {
      expect(getSuggestion('test', 401, {})).toContain('Login');
    });
    it('should suggest for 404 with Misión context', () => {
      const r = getSuggestion('Misión test', 404, {});
      expect(r).toContain('Resource');
    });
    it('should suggest for 500 with Registro context', () => {
      const r = getSuggestion('Registro test', 500, {});
      expect(r).toContain('correo');
    });
    it('should suggest for 500 with Misión context', () => {
      const r = getSuggestion('Misión test', 500, {});
      expect(r).toContain('Redis');
    });
    it('should return default for unknown status', () => {
      const r = getSuggestion('test', 418, {});
      expect(r).toContain('documentación');
    });
  });
});
