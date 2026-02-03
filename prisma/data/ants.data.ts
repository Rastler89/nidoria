import { AntType } from "@prisma/client";

export const ANTS = [
    // --- ARTILLERÍA (AntType.ARTILLERY) ---
    { code: 'avispero', name: 'Avispero Ácido', type: AntType.ARTILLERY, attack: 65, defense: 30, speed_attack: 6, speed_defense: 2, heal: 40, capacity: 2, base_food: 800, base_wood: 0, base_lead: 500, base_ants: 10, base_time: 300 },
    { code: 'bomba', name: 'Bomba Melosa', type: AntType.ARTILLERY, attack: 70, defense: 25, speed_attack: 7, speed_defense: 2, heal: 35, capacity: 2, base_food: 600, base_wood: 0, base_lead: 300, base_ants: 5, base_time: 200 },
    { code: 'escupidor', name: 'Escupidor de Lodo', type: AntType.ARTILLERY, attack: 80, defense: 40, speed_attack: 5, speed_defense: 2, heal: 45, capacity: 3, base_food: 1200, base_wood: 600, base_lead: 0, base_ants: 15, base_time: 400 },
    { code: 'cazador', name: 'Cazador Nómada', type: AntType.ARTILLERY, attack: 90, defense: 35, speed_attack: 5, speed_defense: 3, heal: 50, capacity: 3, base_food: 1500, base_wood: 800, base_lead: 0, base_ants: 12, base_time: 500 },
    { code: 'catapulta', name: 'Catapulta de Semillas', type: AntType.ARTILLERY, attack: 150, defense: 60, speed_attack: 4, speed_defense: 2, heal: 70, capacity: 5, base_food: 4000, base_wood: 5000, base_lead: 0, base_ants: 40, base_time: 1800 },
    { code: 'francotirador', name: 'Francotirador Viscoso', type: AntType.ARTILLERY, attack: 180, defense: 70, speed_attack: 4, speed_defense: 2, heal: 80, capacity: 5, base_food: 6000, base_wood: 0, base_lead: 5000, base_ants: 35, base_time: 2400 },
    { code: 'rociador', name: 'Rociador Tóxico', type: AntType.ARTILLERY, attack: 200, defense: 90, speed_attack: 3, speed_defense: 2, heal: 100, capacity: 6, base_food: 10000, base_wood: 0, base_lead: 8000, base_ants: 70, base_time: 7200 },
    { code: 'alquitran', name: 'Guardiana de Alquitrán', type: AntType.ARTILLERY, attack: 250, defense: 120, speed_attack: 3, speed_defense: 3, heal: 120, capacity: 8, base_food: 15000, base_wood: 18000, base_lead: 0, base_ants: 110, base_time: 10800 },
    { code: 'toxina', name: 'Toxina de Túnel', type: AntType.ARTILLERY, attack: 300, defense: 150, speed_attack: 2, speed_defense: 2, heal: 150, capacity: 10, base_food: 40000, base_wood: 0, base_lead: 30000, base_ants: 250, base_time: 32400 },
    { code: 'asedio', name: 'Asedio de Polvo', type: AntType.ARTILLERY, attack: 500, defense: 300, speed_attack: 2, speed_defense: 2, heal: 200, capacity: 15, base_food: 100000, base_wood: 150000, base_lead: 0, base_ants: 500, base_time: 129600 },

    // --- LIGERAS (AntType.LIGHT) ---
    { code: 'saqueador', name: 'Saqueador Minúsculo', type: AntType.LIGHT, attack: 10, defense: 5, speed_attack: 8, speed_defense: 5, heal: 10, capacity: 1, base_food: 150, base_wood: 0, base_lead: 0, base_ants: 2, base_time: 60 },
    { code: 'piquete', name: 'Piquete Mandibular', type: AntType.LIGHT, attack: 25, defense: 10, speed_attack: 7, speed_defense: 5, heal: 15, capacity: 1, base_food: 400, base_wood: 0, base_lead: 0, base_ants: 4, base_time: 120 },
    { code: 'centinela', name: 'Centinela Vigilante', type: AntType.LIGHT, attack: 35, defense: 20, speed_attack: 6, speed_defense: 4, heal: 20, capacity: 1, base_food: 600, base_wood: 200, base_lead: 0, base_ants: 5, base_time: 200 },
    { code: 'enjambr_errante', name: 'Enjambre Errante', type: AntType.LIGHT, attack: 40, defense: 25, speed_attack: 6, speed_defense: 4, heal: 25, capacity: 1, base_food: 800, base_wood: 0, base_lead: 0, base_ants: 10, base_time: 300 },
    { code: 'corredor', name: 'Corredor Fantasma', type: AntType.LIGHT, attack: 55, defense: 35, speed_attack: 5, speed_defense: 3, heal: 30, capacity: 2, base_food: 1200, base_wood: 0, base_lead: 0, base_ants: 15, base_time: 450 },
    { code: 'asaltante', name: 'Asaltante Saltador', type: AntType.LIGHT, attack: 65, defense: 40, speed_attack: 5, speed_defense: 3, heal: 35, capacity: 2, base_food: 2000, base_wood: 500, base_lead: 0, base_ants: 20, base_time: 600 },
    { code: 'verdugo', name: 'Verdugo Sedoso', type: AntType.LIGHT, attack: 100, defense: 70, speed_attack: 4, speed_defense: 2, heal: 50, capacity: 3, base_food: 4000, base_wood: 0, base_lead: 2500, base_ants: 40, base_time: 1500 },
    { code: 'fuerza', name: 'Fuerza Hormiguero', type: AntType.LIGHT, attack: 120, defense: 80, speed_attack: 4, speed_defense: 2, heal: 60, capacity: 4, base_food: 6000, base_wood: 2000, base_lead: 0, base_ants: 60, base_time: 2400 },
    { code: 'escamas', name: 'Guardián de Escamas', type: AntType.LIGHT, attack: 200, defense: 120, speed_attack: 3, speed_defense: 2, heal: 100, capacity: 5, base_food: 18000, base_wood: 0, base_lead: 12000, base_ants: 120, base_time: 7200 },
    { code: 'infiltrado', name: 'Infiltrado Húmedo', type: AntType.LIGHT, attack: 220, defense: 140, speed_attack: 3, speed_defense: 2, heal: 120, capacity: 5, base_food: 25000, base_wood: 8000, base_lead: 0, base_ants: 150, base_time: 10800 },

    // --- PESADAS (AntType.WEIGHT) ---
    { code: 'barro', name: 'Moldeador de Barro', type: AntType.WEIGHT, attack: 60, defense: 40, speed_attack: 4, speed_defense: 2, heal: 25, capacity: 4, base_food: 500, base_wood: 300, base_lead: 0, base_ants: 8, base_time: 150 },
    { code: 'gladiador', name: 'Gladiador Cosechador', type: AntType.WEIGHT, attack: 80, defense: 50, speed_attack: 4, speed_defense: 2, heal: 35, capacity: 4, base_food: 800, base_wood: 500, base_lead: 0, base_ants: 12, base_time: 300 },
    { code: 'mandicula', name: 'Guardián Mandíbula', type: AntType.WEIGHT, attack: 100, defense: 80, speed_attack: 3, speed_defense: 2, heal: 50, capacity: 5, base_food: 1500, base_wood: 1200, base_lead: 0, base_ants: 20, base_time: 400 },
    { code: 'destructor', name: 'Destructor de Cuernos', type: AntType.WEIGHT, attack: 150, defense: 100, speed_attack: 3, speed_defense: 2, heal: 70, capacity: 6, base_food: 2500, base_wood: 0, base_lead: 1500, base_ants: 35, base_time: 800 },
    { code: 'roca', name: 'Golpeador de Roca', type: AntType.WEIGHT, attack: 200, defense: 150, speed_attack: 3, speed_defense: 2, heal: 90, capacity: 7, base_food: 5000, base_wood: 6000, base_lead: 0, base_ants: 70, base_time: 1800 },
    { code: 'excavadora', name: 'Máquina Excavadora', type: AntType.WEIGHT, attack: 220, defense: 160, speed_attack: 3, speed_defense: 2, heal: 100, capacity: 8, base_food: 3000, base_wood: 10000, base_lead: 0, base_ants: 100, base_time: 3600 },
    { code: 'arbol', name: 'Asaltante de Árbol', type: AntType.WEIGHT, attack: 300, defense: 220, speed_attack: 2, speed_defense: 2, heal: 150, capacity: 10, base_food: 12000, base_wood: 15000, base_lead: 0, base_ants: 180, base_time: 14400 },
    { code: 'tormento', name: 'Tormento de Fuego', type: AntType.WEIGHT, attack: 350, defense: 250, speed_attack: 2, speed_defense: 2, heal: 200, capacity: 12, base_food: 15000, base_wood: 0, base_lead: 10000, base_ants: 220, base_time: 21600 },
    { code: 'torreon', name: 'Torreón Azucarero', type: AntType.WEIGHT, attack: 500, defense: 400, speed_attack: 2, speed_defense: 2, heal: 300, capacity: 15, base_food: 45000, base_wood: 35000, base_lead: 0, base_ants: 350, base_time: 43200 },
    { code: 'muralla', name: 'Muralla de Ébano', type: AntType.WEIGHT, attack: 700, defense: 600, speed_attack: 1, speed_defense: 2, heal: 500, capacity: 20, base_food: 80000, base_wood: 120000, base_lead: 0, base_ants: 600, base_time: 86400 }
];
