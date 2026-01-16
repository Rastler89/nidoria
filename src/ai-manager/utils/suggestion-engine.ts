export function getSuggestion(action: string, status: number, data: any): string {
  if (status >= 200 && status < 300) return '';

  const suggestions: Record<number, string | ((action: string, data: any) => string)> = {
    400: 'Petición mal formada. Revisa que los parámetros enviados sean correctos y cumplan con las validaciones (ej. tipos de datos, campos obligatorios).',
    401: 'Sesión no autorizada. El token ha expirado o es inválido. Intenta iniciar sesión de nuevo para obtener un nuevo token de acceso.',
    403: 'Acceso prohibido. Tu usuario no tiene los permisos necesarios para realizar esta acción.',
    404: (action) => {
      if (action.includes('Misión')) return 'Recurso no encontrado. Asegúrate de que el tipo de recurso (F, W o L) exista en la tabla de recursos de la base de datos.';
      return 'El endpoint o el recurso solicitado no existe. Verifica la URL y los IDs enviados.';
    },
    409: 'Conflicto de datos. Es posible que el usuario ya esté registrado o estés intentando duplicar un registro único.',
    500: (action, data) => {
      let base = 'Error interno del servidor (Bug). ';
      if (action.includes('Registro')) return base + 'Verifica la configuración del MailerService (SMTP) y asegúrate de que la base de datos esté accesible.';
      if (action.includes('Misión')) return base + 'Revisa la lógica de colas (Bull/Redis) y asegúrate de que las relaciones entre Anthill y Resource sean correctas.';
      if (data?.message) return base + `Detalle técnico: ${data.message}`;
      return base + 'Revisa los logs del backend para identificar el fallo exacto en el código.';
    }
  };

  const suggestion = suggestions[status];
  if (typeof suggestion === 'function') {
    return suggestion(action, data);
  }
  return suggestion || 'Error desconocido. Revisa la consola para más detalles.';
}
