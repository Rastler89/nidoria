export function getDetailedErrorExplanation(action: string, status: number, expectedStatus: number | number[], data: any): string {
  if (Array.isArray(expectedStatus) ? expectedStatus.includes(status) : status === expectedStatus) {
    return '';
  }

  const expectedStr = Array.isArray(expectedStatus) ? expectedStatus.join(' o ') : expectedStatus;
  let explanation = `Esperaba un código ${expectedStr}, pero recibí ${status}. `;

  if (status === 401) {
    explanation += 'Esto indica que las credenciales han fallado o el token ha expirado. El sistema de seguridad bloqueó el acceso.';
  } else if (status === 404) {
    explanation += 'El recurso solicitado no existe. Podría ser un ID de hormiguero incorrecto o un tipo de recurso no definido en la base de datos.';
  } else if (status === 409) {
    explanation += 'Hay un conflicto de datos. Probablemente intentamos registrar algo que ya existe (como un email duplicado).';
  } else if (status >= 500) {
    explanation += 'Fallo crítico del servidor. El backend encontró una excepción no controlada. Esto suele ser un bug en el código o un problema de conexión con la BD/Redis.';
  } else {
    explanation += 'La respuesta no coincide con el flujo esperado para esta acción.';
  }

  if (data?.message) {
    explanation += ` Mensaje del servidor: "${data.message}"`;
  }

  return explanation;
}

export function getSuggestion(action: string, status: number, data: any): string {
  if (status >= 200 && status < 300) return '';

  const suggestions: Record<number, string | ((action: string, data: any) => string)> = {
    400: 'Revisa que los parámetros (body) enviados cumplan con las validaciones de NestJS (DTOs).',
    401: 'Prueba a forzar un nuevo Login o a Refrescar el Token.',
    403: 'Verifica los roles del usuario en la base de datos.',
    404: (action) => {
      if (action.includes('Misión')) return 'Asegúrate de que los tipos de recursos (F, W, L) estén insertados en la tabla "Resource".';
      return 'Verifica que la ruta (URL) sea correcta.';
    },
    409: 'Usa un nombre de usuario o email diferente para el registro.',
    500: (action, data) => {
      if (action.includes('Registro')) return 'Revisa los logs del servidor para ver si falló el envío del correo de verificación.';
      if (action.includes('Misión')) return 'Verifica que Redis esté corriendo y que la cola "exploraciones" esté bien configurada.';
      return 'Inspecciona el Stack Trace en la terminal del backend.';
    }
  };

  const suggestion = suggestions[status];
  if (typeof suggestion === 'function') {
    return suggestion(action, data);
  }
  return suggestion || 'Consulta la documentación de la API para este endpoint.';
}
