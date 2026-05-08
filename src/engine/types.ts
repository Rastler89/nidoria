import { ConstructionStatus, InvestigationStatus, AntType, ResourceType } from "@prisma/client";

export interface ResourceState {
  type: ResourceType;
  name: string;
  stock: number;
}

export interface BuildingState {
  id: number;
  type: number;
  name: string;
  code: string;
  level: number;
  status: ConstructionStatus;
  finishingAt: Date | null;
}

export interface TechState {
  id: number;
  investigationId: number;
  name: string;
  level: number;
  status: InvestigationStatus;
  finishingAt: Date | null;
}

export interface ArmyState {
  type: AntType;
  name: string;
  total: number;
  busy: number;
}

export interface ExplorationState {
  resourceName: string;
  resourceType: ResourceType;
  workers: number;
  quantity: number;
  duration: number;
  createdAt: Date;
  finishingAt: Date;
}

export interface AnthillStats {
  eggs: number;
  larva: number;
  ants: number;
  antsBusy: number;
}

export interface GameState {
  stats: AnthillStats;
  resources: ResourceState[];
  buildings: BuildingState[];
  techs: TechState[];
  army: ArmyState[];
  explorations: ExplorationState[];
}

export interface ItemEffects {
  popMax?: number;
  militaryPopMax?: number;
  storage?: number;
  storageFood?: number;
  storageWood?: number;
  leafStorage?: number;
  [key: string]: any; // Permite otros efectos específicos
}
