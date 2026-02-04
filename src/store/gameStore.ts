// Zustand game state store with JIT task calculations

import { create } from 'zustand';
import type {
  ObjectId,
  GameObject,
  GameState,
  ActiveTask,
  Player,
  ResolvedObjectType,
} from '../core/types';
import {
  createGameObject,
  resolveAllTypes,
  addChild,
  moveObject,
  getChildren,
  getSiblings,
  getPath,
  typeInheritsFrom,
} from '../core/GameObject';
import { objectTypes } from '../data/objectTypes';
import { taskDefinitions } from '../data/taskDefinitions';

// JIT calculation: compute task progress based on elapsed time
function calculateTaskProgress(task: ActiveTask, tickDuration: number, currentTime: number): number {
  if (task.status !== 'active') return task.progress;

  const taskDef = taskDefinitions[task.taskDefinitionId];
  if (!taskDef) return task.progress;

  const elapsedMs = currentTime - task.startedAt - (task.pausedAt ? (currentTime - task.pausedAt) : 0);
  const elapsedTicks = elapsedMs / tickDuration;
  const progress = Math.min(1, elapsedTicks / taskDef.baseDuration);

  return progress;
}

// Check if task is complete via JIT
function isTaskComplete(task: ActiveTask, tickDuration: number, currentTime: number): boolean {
  return calculateTaskProgress(task, tickDuration, currentTime) >= 1;
}

interface GameStore {
  // State
  gameState: GameState | null;
  currentPlayerId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed getters (JIT)
  getCurrentPlayer: () => Player | null;
  getCurrentLocation: () => GameObject | null;
  getLocationChildren: () => GameObject[];
  getLocationSiblings: () => GameObject[];
  getLocationPath: () => GameObject[];
  getResolvedType: (typeId: string) => ResolvedObjectType | null;
  getTaskProgress: (taskId: string) => number;
  getCompletedTasks: () => ActiveTask[];

  // Actions
  initializeGame: (playerId?: string) => void;
  movePlayer: (targetId: ObjectId) => void;
  moveUp: () => void;
  enterObject: (objectId: ObjectId) => void;
  startTask: (taskDefinitionId: string, performerId: ObjectId, targetId?: ObjectId) => void;
  processCompletedTasks: () => void;
  syncState: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  currentPlayerId: null,
  isLoading: false,
  error: null,

  // Computed getters
  getCurrentPlayer: () => {
    const { gameState, currentPlayerId } = get();
    if (!gameState || !currentPlayerId) return null;
    return gameState.players[currentPlayerId] || null;
  },

  getCurrentLocation: () => {
    const { gameState } = get();
    const player = get().getCurrentPlayer();
    if (!gameState || !player) return null;
    return gameState.objects[player.currentLocationId] || null;
  },

  getLocationChildren: () => {
    const { gameState } = get();
    const location = get().getCurrentLocation();
    if (!gameState || !location) return [];
    return getChildren(location.id, gameState.objects);
  },

  getLocationSiblings: () => {
    const { gameState } = get();
    const location = get().getCurrentLocation();
    if (!gameState || !location) return [];
    return getSiblings(location.id, gameState.objects);
  },

  getLocationPath: () => {
    const { gameState } = get();
    const location = get().getCurrentLocation();
    if (!gameState || !location) return [];
    return getPath(location.id, gameState.objects);
  },

  getResolvedType: (typeId: string) => {
    const { gameState } = get();
    if (!gameState) return null;
    return gameState.resolvedTypes[typeId] || null;
  },

  getTaskProgress: (taskId: string) => {
    const { gameState } = get();
    if (!gameState) return 0;
    const task = gameState.activeTasks[taskId];
    if (!task) return 0;
    return calculateTaskProgress(task, gameState.tickDuration, Date.now());
  },

  getCompletedTasks: () => {
    const { gameState } = get();
    if (!gameState) return [];
    const now = Date.now();
    return Object.values(gameState.activeTasks).filter(
      (task) => task.status === 'active' && isTaskComplete(task, gameState.tickDuration, now)
    );
  },

  // Actions
  initializeGame: (playerId?: string) => {
    const resolvedTypes = resolveAllTypes(objectTypes);
    const objects: Record<ObjectId, GameObject> = {};

    // Create universe
    const universe = createGameObject('universe', 'The Universe', null, resolvedTypes);
    objects[universe.id] = universe;

    // Create a galaxy
    const galaxy = createGameObject('galaxy', 'Milky Way', null, resolvedTypes);
    addChild(universe.id, galaxy, objects);

    // Create a star system
    const starSystem = createGameObject('star_system', 'Sol System', null, resolvedTypes);
    addChild(galaxy.id, starSystem, objects);

    // Create the star
    const star = createGameObject('star', 'Sol', null, resolvedTypes);
    addChild(starSystem.id, star, objects);

    // Create planets
    const earth = createGameObject('rocky_planet', 'Earth', null, resolvedTypes, {
      properties: { habitable: true, atmosphere: true, minerals: 200 },
    });
    addChild(starSystem.id, earth, objects);

    const mars = createGameObject('rocky_planet', 'Mars', null, resolvedTypes, {
      properties: { habitable: false, atmosphere: false, minerals: 150 },
    });
    addChild(starSystem.id, mars, objects);

    const jupiter = createGameObject('gas_giant', 'Jupiter', null, resolvedTypes, {
      properties: { gasResources: 5000 },
    });
    addChild(starSystem.id, jupiter, objects);

    // Create moons
    const luna = createGameObject('moon', 'Luna', null, resolvedTypes);
    addChild(earth.id, luna, objects);

    const europa = createGameObject('moon', 'Europa', null, resolvedTypes, {
      properties: { ice: 500 },
    });
    addChild(jupiter.id, europa, objects);

    // Create asteroid belt
    const belt = createGameObject('asteroid_belt', 'Main Belt', null, resolvedTypes);
    addChild(starSystem.id, belt, objects);

    // Create some asteroids
    for (let i = 1; i <= 3; i++) {
      const asteroid = createGameObject('asteroid', `Asteroid ${i}`, null, resolvedTypes, {
        properties: { minerals: 30 + Math.floor(Math.random() * 40) },
      });
      addChild(belt.id, asteroid, objects);
    }

    // Create a player ship
    const playerShip = createGameObject('ship', 'Pioneer', null, resolvedTypes, {
      properties: { fuel: 100, hull: 100 },
    });
    addChild(earth.id, playerShip, objects);

    // Create a probe
    const probe = createGameObject('probe', 'Scout-1', null, resolvedTypes);
    addChild(playerShip.id, probe, objects);

    // Create a station
    const station = createGameObject('station', 'Orbital Station Alpha', null, resolvedTypes);
    addChild(earth.id, station, objects);

    // Create player
    const player: Player = {
      id: playerId || `player_${Date.now()}`,
      name: 'Commander',
      currentLocationId: starSystem.id,
      controlledObjectIds: [playerShip.id, probe.id],
      lastActiveAt: Date.now(),
    };

    const now = Date.now();
    const gameState: GameState = {
      id: `game_${now}`,
      objects,
      objectTypes,
      resolvedTypes,
      taskDefinitions,
      activeTasks: {},
      players: { [player.id]: player },
      gameTime: 0,
      lastTickAt: now,
      tickDuration: 1000, // 1 second per tick
      createdAt: now,
      updatedAt: now,
    };

    set({ gameState, currentPlayerId: player.id, isLoading: false, error: null });

    // Log state to console for Phase 1 verification
    console.log('Game initialized!');
    console.log('Game State:', gameState);
    console.log('Objects:', objects);
    console.log('Player:', player);
    console.log('Current location:', objects[player.currentLocationId]);
  },

  movePlayer: (targetId: ObjectId) => {
    const { gameState, currentPlayerId } = get();
    if (!gameState || !currentPlayerId) return;

    const player = gameState.players[currentPlayerId];
    if (!player) return;

    const target = gameState.objects[targetId];
    if (!target) return;

    set({
      gameState: {
        ...gameState,
        players: {
          ...gameState.players,
          [currentPlayerId]: {
            ...player,
            currentLocationId: targetId,
            lastActiveAt: Date.now(),
          },
        },
        updatedAt: Date.now(),
      },
    });
  },

  moveUp: () => {
    const { gameState } = get();
    const location = get().getCurrentLocation();
    if (!gameState || !location?.parentId) return;

    get().movePlayer(location.parentId);
  },

  enterObject: (objectId: ObjectId) => {
    const { gameState } = get();
    if (!gameState) return;

    const obj = gameState.objects[objectId];
    if (!obj) return;

    // Can only enter objects that have capacity (can contain things)
    const resolvedType = gameState.resolvedTypes[obj.typeId];
    if (resolvedType && resolvedType.defaultCapacity > 0) {
      get().movePlayer(objectId);
    }
  },

  startTask: (taskDefinitionId: string, performerId: ObjectId, targetId?: ObjectId) => {
    const { gameState } = get();
    if (!gameState) return;

    const taskDef = gameState.taskDefinitions[taskDefinitionId];
    if (!taskDef) {
      console.error(`Unknown task: ${taskDefinitionId}`);
      return;
    }

    const performer = gameState.objects[performerId];
    if (!performer) {
      console.error(`Performer not found: ${performerId}`);
      return;
    }

    // Validate performer type
    const canPerform = taskDef.performerTypes.some(
      (t) => typeInheritsFrom(performer.typeId, t, gameState.resolvedTypes) || performer.typeId === t
    );
    if (!canPerform) {
      console.error(`${performer.name} cannot perform ${taskDef.name}`);
      return;
    }

    const now = Date.now();
    const task: ActiveTask = {
      id: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
      taskDefinitionId,
      performerId,
      targetId: targetId || null,
      startedAt: now,
      pausedAt: null,
      progress: 0,
      status: 'active',
    };

    set({
      gameState: {
        ...gameState,
        activeTasks: {
          ...gameState.activeTasks,
          [task.id]: task,
        },
        updatedAt: now,
      },
    });

    console.log(`Task started: ${taskDef.name}`, task);
  },

  processCompletedTasks: () => {
    const { gameState } = get();
    if (!gameState) return;

    const completedTasks = get().getCompletedTasks();
    if (completedTasks.length === 0) return;

    const newObjects = { ...gameState.objects };
    const newActiveTasks = { ...gameState.activeTasks };

    for (const task of completedTasks) {
      const taskDef = gameState.taskDefinitions[task.taskDefinitionId];
      if (!taskDef) continue;

      // Apply effects
      for (const effect of taskDef.effects) {
        const targetObjId = effect.target === 'performer' ? task.performerId : task.targetId;
        if (!targetObjId) continue;

        const targetObj = newObjects[targetObjId];
        if (!targetObj) continue;

        switch (effect.type) {
          case 'set_property':
            if (effect.key && effect.value !== undefined) {
              newObjects[targetObjId] = {
                ...targetObj,
                properties: { ...targetObj.properties, [effect.key]: effect.value },
                lastUpdatedAt: Date.now(),
              };
            }
            break;

          case 'modify_property':
            if (effect.key && typeof effect.value === 'number') {
              const currentValue = (targetObj.properties[effect.key] as number) || 0;
              newObjects[targetObjId] = {
                ...targetObj,
                properties: { ...targetObj.properties, [effect.key]: currentValue + effect.value },
                lastUpdatedAt: Date.now(),
              };
            }
            break;

          case 'create_child':
            if (effect.objectTypeId) {
              const newChild = createGameObject(
                effect.objectTypeId,
                `${gameState.resolvedTypes[effect.objectTypeId]?.name || 'Item'}`,
                targetObjId,
                gameState.resolvedTypes
              );
              newObjects[newChild.id] = newChild;
              newObjects[targetObjId] = {
                ...newObjects[targetObjId],
                childIds: [...newObjects[targetObjId].childIds, newChild.id],
                lastUpdatedAt: Date.now(),
              };
            }
            break;

          case 'move_to':
            if (task.targetId && task.performerId) {
              moveObject(task.performerId, task.targetId, newObjects);
            }
            break;
        }
      }

      // Mark task as completed
      newActiveTasks[task.id] = { ...task, status: 'completed', progress: 1 };
      console.log(`Task completed: ${taskDef.name}`, task);
    }

    set({
      gameState: {
        ...gameState,
        objects: newObjects,
        activeTasks: newActiveTasks,
        updatedAt: Date.now(),
      },
    });
  },

  syncState: (state: GameState) => {
    set({ gameState: state, updatedAt: Date.now() } as any);
  },
}));

export default useGameStore;
