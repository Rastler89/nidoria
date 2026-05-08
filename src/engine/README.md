# Motor de Juego (Game Engine) - Nidoria API

Este módulo centraliza la lógica de negocio y la gestión de estado para garantizar consistencia en todo el sistema (DRY).

## Responsabilidades
1.  **Centralización de Consultas**: Toda la composición del estado del hormiguero se realiza aquí. Tanto los controladores REST como el WebSocket Gateway consumen este servicio.
2.  **Sistema de Deltas**: El servicio puede comparar el estado anterior y el nuevo para enviar únicamente los cambios al cliente, optimizando el ancho de banda.
3.  **Tipado Seguro**: Define interfaces estrictas para cada componente del juego, eliminando el uso de `any`.

## Flujo de Sincronización
Cuando un evento ocurre (ej: termina una construcción):
1.  El servicio correspondiente (ej: `ConstructionService`) actualiza la base de datos.
2.  Se dispara un evento o se llama directamente al `AnthillGateway`.
3.  El `AnthillGateway` solicita el nuevo estado al `GameEngineService`.
4.  Se calcula el delta y se envía al cliente vía WebSockets.

## Tipos Principales
- `GameState`: Representa el mundo completo del usuario.
- `ItemEffects`: Interfaz para las bonificaciones de edificios e investigaciones.
