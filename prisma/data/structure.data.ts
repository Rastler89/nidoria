
//{ code: "", name: "", preview: 0, effects: {}, base_food: 0, base_wood: 0, base_lead: 0, base_ants: 0, base_time: 0, multiplier: 1, maxInstances: 1 }
export const STRUCTURES = [
    {
        code: "creina",
        name: "Cámara de la reina",
        preview: 0,
        effects: {
            popMax: 50, storage: 500
        },
        base_food: 200,
        base_wood: 200,
        base_lead: 200,
        base_ants: 20,
        base_time: 300,
        multiplier: 1.75,
        maxInstances: 1
    },
    {
        code: "despensa",
        name: "Despensa",
        preview: 0,
        effects: {
            storageFood: 2000
        },
        base_food: 150,
        base_wood: 60,
        base_lead: 0,
        base_ants: 10,
        base_time: 180,
        multiplier: 1.5,
        maxInstances: 3
    },
    {
        code: "guarderia",
        name: "Guardería real",
        preview: 0,
        effects: {
            popMax: 100,
            birthRate: 1.0001
        },
        base_food: 300,
        base_wood: 150,
        base_lead: 0,
        base_ants: 25,
        base_time: 300,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "cronicas",
        name: "Cámara de las crónicas",
        preview: 0,
        effects: {
            research: 1.001
        },
        base_food: 450,
        base_wood: 300,
        base_lead: 150,
        base_ants: 20,
        base_time: 480,
        multiplier: 1.6,
        maxInstances: 1
    },
    {
        code: "colector",
        name: "Colector de hojas",
        preview: 0,
        effects: {
            activeLead: true
        },
        base_food: 300,
        base_wood: 300,
        base_lead: 0,
        base_ants: 15,
        base_time: 420,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "silo",
        name: "Silo de madera",
        preview: 0,
        effects: {
            storageWood: 2000
        },
        base_food: 300,
        base_wood: 450,
        base_lead: 0,
        base_ants: 20,
        base_time: 420,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "cuartel",
        name: "Cuartel Militar",
        preview: 0,
        effects: {
            activeUnits: true
        },
        base_food: 500,
        base_wood: 800,
        base_lead: 100,
        base_ants: 40,
        base_time: 900,
        multiplier: 1.5,
        maxInstances: 3
    },
    {
        code: "laboratorio",
        name: "Laboratorio",
        preview: 0,
        effects: {
            research: 1.002
        },
        base_food: 1200,
        base_wood: 1000,
        base_lead: 600,
        base_ants: 60,
        base_time: 1800,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "huerto",
        name: "Huerto Fúngico",
        preview: 0,
        effects: {
            convertLead: true
        },
        base_food: 1000,
        base_wood: 1500,
        base_lead: 400,
        base_ants: 50,
        base_time: 2400,
        multiplier: 1.5,
        maxInstances: 3
    },
    {
        code: "muda",
        name: "Cámara de muda",
        preview: 0,
        effects: {
            armorBonus: 0.01,
            birthRate: 1.0001
        },
        base_food: 2000,
        base_wood: 800,
        base_lead: 600,
        base_ants: 30,
        base_time: 3600,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "taller",
        name: "Taller de carpinteria",
        preview: 0,
        effects: {
            constructionSpeed: 1.1
        },
        base_food: 1500,
        base_wood: 2500,
        base_lead: 500,
        base_ants: 80,
        base_time: 5400,
        multiplier: 1.5,
        maxInstances: 1
    },
    {
        code: "tunel",
        name: "Túnel de viento",
        preview: 0,
        effects: {
            movementSpeed: 1.2
        },
        base_food: 1200,
        base_wood: 1200,
        base_lead: 1500,
        base_ants: 40,
        base_time: 5400,
        multiplier: 1.7,
        maxInstances: 1
    },
    {
        code: 'genetica_ed',
        name: 'Laboratorio de genética',
        preview: 0,
        base_food: 5000,
        base_wood: 3000,
        base_lead: 6000,
        base_ants: 150,
        base_time: 14400,
        effects: {

        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'plaza',
        name: 'Plaza enjambre',
        preview: 0,
        base_food: 3000,
        base_wood: 4000,
        base_lead: 2000,
        base_ants: 100,
        base_time: 7200,
        effects: {
            armyCapacity: 500,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'atalaya',
        name: 'Atalaya de antenas',
        preview: 0,
        base_food: 1500,
        base_wood: 3000,
        base_lead: 3500,
        base_ants: 60,
        base_time: 5400,
        effects: {
            visionRange: 2.0,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'prensa',
        name: 'Prensa de hojas',
        preview: 0,
        base_food: 2500,
        base_wood: 2000,
        base_lead: 5000,
        base_ants: 90,
        base_time: 7200,
        effects: {
            leafStorage: 5000,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'justas',
        name: 'Campo de justas',
        preview: 0,
        base_food: 5000,
        base_wood: 3500,
        base_lead: 1500,
        base_ants: 70,
        base_time: 10800,
        effects: {
            attackBuff: 0.2,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'santuario',
        name: 'Santuario real',
        preview: 0,
        base_food: 25000,
        base_wood: 20000,
        base_lead: 15000,
        base_ants: 500,
        base_time: 86400,
        effects: {
            queenHealth: 2.0,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'puerta',
        name: 'Puerta de ébano',
        preview: 0,
        base_food: 6000,
        base_wood: 25000,
        base_lead: 4000,
        base_ants: 150,
        base_time: 64800,
        effects: {
            baseDefense: 10000,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'catacumba',
        name: 'Catacumbas residuo',
        preview: 0,
        base_food: 8000,
        base_wood: 6000,
        base_lead: 10000,
        base_ants: 120,
        base_time: 21600,
        effects: {
            recycleEfficiency: 0.3,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'conducto',
        name: 'Conducto Ácido',
        preview: 0,
        base_food: 5000,
        base_wood: 8000,
        base_lead: 12000,
        base_ants: 90,
        base_time: 21600,
        effects: {
            acidTrapDamage: 500,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
    {
        code: 'invernacion',
        name: 'Cámara de Invernación',
        preview: 0,
        base_food: 12000,
        base_wood: 4000,
        base_lead: 4000,
        base_ants: 50,
        base_time: 28800,
        effects: {
            upkeepReduction: 0.25,
        },
        multiplier: 1.5,
        maxInstances: 1,
    },
];