export const ANTHILL_CONFIG = {
    // Límites Base del Hormiguero
    LIMITS: {
        BASE_POPULATION: 50,
        BASE_MILITARY_POPULATION: 10,
        BASE_RESOURCE_CAPACITY: 1000,
    },
    
    // Recursos Iniciales para nuevas colonias
    INITIAL_RESOURCES: {
        FOOD: 1000,
        WOOD: 500,
        LEAD: 200,
    },
    
    // Reglas de Mapa y Posicionamiento
    WORLD: {
        MIN_DISTANCE_BETWEEN_COLONIES: 30,
        MAP_SIZE: 1000,
        MAX_PLAYERS_PER_WORLD: 1000,
    },
    
    // Reglas de Reclutamiento y Crianza
    BIOLOGY: {
        EGG_COST_FOOD: 40,
        EGG_TIME_BASE: 1, // minutos
    }
};
