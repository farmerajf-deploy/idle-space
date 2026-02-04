// Core type definitions for Open Universe Game

export type ObjectId = string;

// Abstract object type definitions - concrete types inherit from these
export interface ObjectTypeDefinition {
  id: string;
  name: string;
  parent?: string; // Parent type for inheritance
  ascii: string;
  color: string;
  defaultCapacity: number;
  defaultVolume: number;
  canContain?: string[]; // Types this can contain (inherits from parent if not specified)
  properties?: Record<string, PropertyDefinition>;
  availableTasks?: string[]; // Tasks this type can perform
  targetableTasks?: string[]; // Tasks that can target this type
}

export interface PropertyDefinition {
  type: 'number' | 'string' | 'boolean';
  default: number | string | boolean;
  min?: number;
  max?: number;
  inherited?: boolean; // Whether children inherit this property
}

// Resolved type with all inherited properties
export interface ResolvedObjectType extends ObjectTypeDefinition {
  inheritanceChain: string[]; // Full chain from root to this type
  resolvedCanContain: string[];
  resolvedProperties: Record<string, PropertyDefinition>;
  resolvedAvailableTasks: string[];
  resolvedTargetableTasks: string[];
}

// Game object instance
export interface GameObject {
  id: ObjectId;
  typeId: string; // Reference to ObjectTypeDefinition
  name: string;
  parentId: ObjectId | null;
  childIds: ObjectId[];
  volume: number;
  capacity: number;
  properties: Record<string, number | string | boolean>;
  createdAt: number; // Timestamp for JIT calculations
  lastUpdatedAt: number;
}

// Task system
export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  baseDuration: number; // In game ticks
  performerTypes: string[]; // Object types that can perform this
  targetTypes: string[]; // Object types this can target
  requirements: TaskRequirement[];
  effects: TaskEffect[];
}

export interface TaskRequirement {
  type: 'property' | 'contains' | 'parent_type' | 'sibling_type';
  target: 'performer' | 'target';
  key?: string;
  value?: number | string | boolean;
  operator?: '>' | '<' | '==' | '>=' | '<=' | 'exists';
}

export interface TaskEffect {
  type: 'set_property' | 'modify_property' | 'create_child' | 'move_to' | 'destroy';
  target: 'performer' | 'target' | 'parent';
  key?: string;
  value?: number | string | boolean;
  objectTypeId?: string; // For create_child effect
}

// Active task instance
export interface ActiveTask {
  id: string;
  taskDefinitionId: string;
  performerId: ObjectId;
  targetId: ObjectId | null;
  startedAt: number; // Timestamp
  pausedAt: number | null;
  progress: number; // 0-1, calculated JIT
  status: 'active' | 'paused' | 'completed' | 'failed';
}

// Player abstraction - the player is a perspective, not a physical object
export interface Player {
  id: string;
  name: string;
  currentLocationId: ObjectId; // Where the player is "viewing" from
  controlledObjectIds: ObjectId[]; // Objects the player can control
  lastActiveAt: number;
}

// Game state - stored on server
export interface GameState {
  id: string;
  objects: Record<ObjectId, GameObject>;
  objectTypes: Record<string, ObjectTypeDefinition>;
  resolvedTypes: Record<string, ResolvedObjectType>;
  taskDefinitions: Record<string, TaskDefinition>;
  activeTasks: Record<string, ActiveTask>;
  players: Record<string, Player>;
  gameTime: number; // Current game tick
  lastTickAt: number; // Real timestamp of last tick
  tickDuration: number; // Milliseconds per tick
  createdAt: number;
  updatedAt: number;
}

// Actions for state updates
export type GameAction =
  | { type: 'MOVE_PLAYER'; playerId: string; targetId: ObjectId }
  | { type: 'START_TASK'; taskDefinitionId: string; performerId: ObjectId; targetId?: ObjectId }
  | { type: 'CANCEL_TASK'; taskId: string }
  | { type: 'TICK'; timestamp: number }
  | { type: 'SYNC_STATE'; state: GameState };

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
