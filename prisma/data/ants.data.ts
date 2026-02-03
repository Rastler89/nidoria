import { AntType, Ant } from "@prisma/client";

export const ANTS = [
    // --- ARTILLERÍA (AntType.ARTILLERY) ---
    { name: 'Avispero Ácido', type: AntType.ARTILLERY, attack: 65, defense: 30, speed_attack: 6, speed_defense: 2, heal: 40, capacity: 2, base_food: 800, base_wood: 0, base_lead: 400, base_ants: 10, base_time: 150 },
    { name: 'Bomba melosa', type: AntType.ARTILLERY, attack: 70, defense: 25, speed_attack: 7, speed_defense: 2, heal: 35, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 155 },
    { name: 'Cazador Nómada', type: AntType.ARTILLERY, attack: 55, defense: 35, speed_attack: 7, speed_defense: 3, heal: 45, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 152 },
    { name: 'Francotirador Viscoso', type: AntType.ARTILLERY, attack: 60, defense: 40, speed_attack: 5, speed_defense: 5, heal: 50, capacity: 3, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 160 },
    { name: 'Catapulta de semillas', type: AntType.ARTILLERY, attack: 50, defense: 45, speed_attack: 4, speed_defense: 6, heal: 55, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 148 },
    { name: 'Rociador tóxico', type: AntType.ARTILLERY, attack: 62, defense: 28, speed_attack: 5, speed_defense: 5, heal: 38, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 152 },
    { name: 'Escupidor de lodo', type: AntType.ARTILLERY, attack: 58, defense: 32, speed_attack: 4, speed_defense: 6, heal: 42, capacity: 3, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 150 },
    { name: 'Guardian de alquitrán', type: AntType.ARTILLERY, attack: 52, defense: 38, speed_attack: 3, speed_defense: 7, heal: 48, capacity: 4, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 173 },
    { name: 'Asedio de polvo', type: AntType.ARTILLERY, attack: 54, defense: 36, speed_attack: 4, speed_defense: 6, heal: 46, capacity: 5, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 175 },
    { name: 'Toxina de túnel', type: AntType.ARTILLERY, attack: 72, defense: 22, speed_attack: 8, speed_defense: 1, heal: 32, capacity: 6, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 185 },
    // --- ATAQUE LIGERO (AntType.LIGHT) ---
    { name: 'Enjambre errante', type: AntType.LIGHT, attack: 75, defense: 40, speed_attack: 6, speed_defense: 4, heal: 50, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 150 },
    { name: 'Asaltante Saltador', type: AntType.LIGHT, attack: 60, defense: 45, speed_attack: 7, speed_defense: 3, heal: 55, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 145 },
    { name: 'Piquete mandibular', type: AntType.LIGHT, attack: 80, defense: 35, speed_attack: 8, speed_defense: 1, heal: 40, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 146 },
    { name: 'Corredor Fantasma', type: AntType.LIGHT, attack: 70, defense: 30, speed_attack: 9, speed_defense: 1, heal: 30, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 144 },
    { name: 'Fuerza Hormiguero', type: AntType.LIGHT, attack: 65, defense: 42, speed_attack: 5, speed_defense: 5, heal: 52, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 159 },
    { name: 'Verdugo Sedoso', type: AntType.LIGHT, attack: 72, defense: 38, speed_attack: 6, speed_defense: 3, heal: 48, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 158 },
    { name: 'Saqueador Minúsculo', type: AntType.LIGHT, attack: 78, defense: 32, speed_attack: 7, speed_defense: 2, heal: 35, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 145 },
    { name: 'Guardián de Escamas', type: AntType.LIGHT, attack: 58, defense: 48, speed_attack: 4, speed_defense: 6, heal: 58, capacity: 3, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 164 },
    { name: 'Centinela Vigilante', type: AntType.LIGHT, attack: 68, defense: 40, speed_attack: 5, speed_defense: 6, heal: 45, capacity: 2, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 153 },
    { name: 'Infiltrado Húmedo', type: AntType.LIGHT, attack: 74, defense: 34, speed_attack: 6, speed_defense: 3, heal: 38, capacity: 1, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 146 },
    // --- ATAQUE PESADO (AntType.WEIGHT) ---
    { name: 'Destructor de Cuernos', type: AntType.WEIGHT, attack: 110, defense: 140, speed_attack: 1, speed_defense: 4, heal: 250, capacity: 8, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 215 },
    { name: 'Máquina Excavadora', type: AntType.WEIGHT, attack: 135, defense: 115, speed_attack: 1, speed_defense: 3, heal: 220, capacity: 7, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 208 },
    { name: 'Gladiador Cosechador', type: AntType.WEIGHT, attack: 120, defense: 125, speed_attack: 2, speed_defense: 5, heal: 230, capacity: 10, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 205 },
    { name: 'Tormento de Fuego', type: AntType.WEIGHT, attack: 160, defense: 90, speed_attack: 2, speed_defense: 3, heal: 190, capacity: 6, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 200 },
    { name: 'Guardián de Mandíbula', type: AntType.WEIGHT, attack: 105, defense: 160, speed_attack: 1, speed_defense: 6, heal: 280, capacity: 9, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 217 },
    { name: 'Asaltante Árbol', type: AntType.WEIGHT, attack: 125, defense: 130, speed_attack: 2, speed_defense: 4, heal: 210, capacity: 7, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 205 },
    { name: 'Golpeador de Roca', type: AntType.WEIGHT, attack: 175, defense: 100, speed_attack: 1, speed_defense: 2, heal: 200, capacity: 6, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 210 },
    { name: 'Moldeador de Barro', type: AntType.WEIGHT, attack: 95, defense: 180, speed_attack: 1, speed_defense: 7, heal: 300, capacity: 8, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 205 },
    { name: 'Torreón Azucarero', type: AntType.WEIGHT, attack: 85, defense: 200, speed_attack: 1, speed_defense: 8, heal: 350, capacity: 15, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 220 },
    { name: 'Muralla de Ébano', type: AntType.WEIGHT, attack: 150, defense: 190, speed_attack: 2, speed_defense: 5, heal: 320, capacity: 8, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 241 }
];