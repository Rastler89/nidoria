# Manual de Gestión: Limitaciones del Hormiguero

Has centralizado las reglas de tu juego en un único punto. Este manual te explica cómo usarlo y cómo añadir nuevas reglas en el futuro.

## 1. El Centro de Mando: `anthill.config.ts`

Ubicación: `src/config/anthill.config.ts`

Este archivo exporta el objeto `ANTHILL_CONFIG`. Para cambiar cualquier valor global, solo necesitas editar este archivo:

- **Aumentar la dificultad**: Sube `EGG_COST_FOOD` o baja `BASE_RESOURCE_CAPACITY`.
- **Acelerar el inicio**: Sube los valores en `INITIAL_RESOURCES`.
- **Hacer el mundo más denso**: Baja `MIN_DISTANCE_BETWEEN_COLONIES`.

---

## 2. Cómo añadir una nueva Limitación

Si en el futuro quieres añadir una nueva limitación (ej. un límite de "Comandantes" o "Líderes de Escuadrón"):

### Paso A: Base de Datos
Añade el campo en `prisma/schema.prisma` dentro del modelo `Anthill`:
```prisma
leadersMax Int @default(1) @map("leaders_max")
```

### Paso B: Configuración
Añade el valor base en `ANTHILL_CONFIG`:
```typescript
LIMITS: {
    // ...
    BASE_LEADERS: 1,
}
```

### Paso C: Motor de Cálculo
En `src/resources/resources.services.ts`, añade la lógica en `updateColonyLimits`:
```typescript
let leadersMax = 0;
// ... en applyEffects ...
if (effects.leadersMax) leadersMax += Math.floor(effects.leadersMax * mult);
// ... antes del update ...
if (leadersMax === 0) leadersMax = ANTHILL_CONFIG.LIMITS.BASE_LEADERS;
// ... en el update ...
data: { leadersMax: leadersMax }
```

### Paso D: Validación
En el servicio correspondiente (ej. un hipotético `leadership.service.ts`), comprueba contra el nuevo campo:
```typescript
if (currentLeaders + 1 > anthill.leadersMax) {
    throw new BadRequestException("No puedes tener más líderes.");
}
```

---

## 3. Mejores Prácticas

1. **Evitar Números Mágicos**: Nunca uses `if (recursos > 500)` directamente en un servicio. Usa siempre `if (recursos > anthill.capacities[type])` o consulta la config.
2. **Redondeo Progresivo**: Al usar multiplicadores en `ResourcesService`, recuerda que los valores en DB son enteros. El sistema actual ya usa `Math.floor()` para garantizar que no haya errores de precisión.
3. **Persistencia vs Cálculo**: Los límites que cambian poco (como la capacidad de almacén) se guardan en la DB. Los límites que cambian por cada acción (como el consumo de energía temporal) deberían calcularse al vuelo en el servicio.
