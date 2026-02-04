// GameObject hierarchy helpers and type inheritance resolution

import type {
  ObjectId,
  GameObject,
  ObjectTypeDefinition,
  ResolvedObjectType,
  PropertyDefinition,
} from './types';

// Generate unique IDs
export function generateId(): ObjectId {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Resolve type inheritance - builds the full resolved type with all inherited properties
export function resolveObjectType(
  typeId: string,
  types: Record<string, ObjectTypeDefinition>
): ResolvedObjectType {
  const type = types[typeId];
  if (!type) {
    throw new Error(`Unknown type: ${typeId}`);
  }

  // Build inheritance chain
  const chain: string[] = [];
  let current: ObjectTypeDefinition | undefined = type;
  while (current) {
    chain.unshift(current.id);
    current = current.parent ? types[current.parent] : undefined;
  }

  // Merge properties from chain (parent first, child overrides)
  const resolvedProperties: Record<string, PropertyDefinition> = {};
  const resolvedCanContain: Set<string> = new Set();
  const resolvedAvailableTasks: Set<string> = new Set();
  const resolvedTargetableTasks: Set<string> = new Set();

  for (const id of chain) {
    const t = types[id];
    if (t.properties) {
      Object.assign(resolvedProperties, t.properties);
    }
    if (t.canContain) {
      t.canContain.forEach((c) => resolvedCanContain.add(c));
    }
    if (t.availableTasks) {
      t.availableTasks.forEach((task) => resolvedAvailableTasks.add(task));
    }
    if (t.targetableTasks) {
      t.targetableTasks.forEach((task) => resolvedTargetableTasks.add(task));
    }
  }

  return {
    ...type,
    inheritanceChain: chain,
    resolvedCanContain: Array.from(resolvedCanContain),
    resolvedProperties,
    resolvedAvailableTasks: Array.from(resolvedAvailableTasks),
    resolvedTargetableTasks: Array.from(resolvedTargetableTasks),
  };
}

// Resolve all types and cache them
export function resolveAllTypes(
  types: Record<string, ObjectTypeDefinition>
): Record<string, ResolvedObjectType> {
  const resolved: Record<string, ResolvedObjectType> = {};
  for (const typeId of Object.keys(types)) {
    resolved[typeId] = resolveObjectType(typeId, types);
  }
  return resolved;
}

// Check if a type inherits from another type
export function typeInheritsFrom(
  typeId: string,
  parentTypeId: string,
  resolvedTypes: Record<string, ResolvedObjectType>
): boolean {
  const resolved = resolvedTypes[typeId];
  return resolved ? resolved.inheritanceChain.includes(parentTypeId) : false;
}

// Create a new game object
export function createGameObject(
  typeId: string,
  name: string,
  parentId: ObjectId | null,
  resolvedTypes: Record<string, ResolvedObjectType>,
  overrides?: Partial<Pick<GameObject, 'volume' | 'capacity' | 'properties'>>
): GameObject {
  const type = resolvedTypes[typeId];
  if (!type) {
    throw new Error(`Unknown resolved type: ${typeId}`);
  }

  const now = Date.now();

  // Build default properties from resolved type
  const defaultProperties: Record<string, number | string | boolean> = {};
  for (const [key, def] of Object.entries(type.resolvedProperties)) {
    defaultProperties[key] = def.default;
  }

  return {
    id: generateId(),
    typeId,
    name,
    parentId,
    childIds: [],
    volume: overrides?.volume ?? type.defaultVolume,
    capacity: overrides?.capacity ?? type.defaultCapacity,
    properties: { ...defaultProperties, ...overrides?.properties },
    createdAt: now,
    lastUpdatedAt: now,
  };
}

// Get an object's ancestors (parent chain to root)
export function getAncestors(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): GameObject[] {
  const ancestors: GameObject[] = [];
  let current = objects[objectId];

  while (current?.parentId) {
    const parent = objects[current.parentId];
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

// Get path from root to object
export function getPath(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): GameObject[] {
  return [...getAncestors(objectId, objects).reverse(), objects[objectId]].filter(Boolean);
}

// Get direct children of an object
export function getChildren(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): GameObject[] {
  const obj = objects[objectId];
  if (!obj) return [];
  return obj.childIds.map((id) => objects[id]).filter(Boolean);
}

// Get siblings (other children of same parent)
export function getSiblings(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): GameObject[] {
  const obj = objects[objectId];
  if (!obj?.parentId) return [];

  const parent = objects[obj.parentId];
  if (!parent) return [];

  return parent.childIds
    .filter((id) => id !== objectId)
    .map((id) => objects[id])
    .filter(Boolean);
}

// Add child to parent (mutates state)
export function addChild(
  parentId: ObjectId,
  child: GameObject,
  objects: Record<ObjectId, GameObject>
): void {
  const parent = objects[parentId];
  if (!parent) {
    throw new Error(`Parent not found: ${parentId}`);
  }

  // Check capacity
  const currentVolume = getChildren(parentId, objects).reduce((sum, c) => sum + c.volume, 0);
  if (currentVolume + child.volume > parent.capacity) {
    throw new Error(`Not enough capacity in ${parent.name}`);
  }

  child.parentId = parentId;
  objects[child.id] = child;
  parent.childIds.push(child.id);
  parent.lastUpdatedAt = Date.now();
}

// Move object to new parent
export function moveObject(
  objectId: ObjectId,
  newParentId: ObjectId,
  objects: Record<ObjectId, GameObject>
): void {
  const obj = objects[objectId];
  if (!obj) {
    throw new Error(`Object not found: ${objectId}`);
  }

  // Remove from old parent
  if (obj.parentId) {
    const oldParent = objects[obj.parentId];
    if (oldParent) {
      oldParent.childIds = oldParent.childIds.filter((id) => id !== objectId);
      oldParent.lastUpdatedAt = Date.now();
    }
  }

  // Add to new parent
  const newParent = objects[newParentId];
  if (!newParent) {
    throw new Error(`New parent not found: ${newParentId}`);
  }

  const currentVolume = getChildren(newParentId, objects).reduce((sum, c) => sum + c.volume, 0);
  if (currentVolume + obj.volume > newParent.capacity) {
    throw new Error(`Not enough capacity in ${newParent.name}`);
  }

  obj.parentId = newParentId;
  obj.lastUpdatedAt = Date.now();
  newParent.childIds.push(objectId);
  newParent.lastUpdatedAt = Date.now();
}

// Get total used volume in an object
export function getUsedVolume(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): number {
  return getChildren(objectId, objects).reduce((sum, child) => sum + child.volume, 0);
}

// Get remaining capacity
export function getRemainingCapacity(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>
): number {
  const obj = objects[objectId];
  if (!obj) return 0;
  return obj.capacity - getUsedVolume(objectId, objects);
}

// Check if object can contain another type
export function canContain(
  containerId: ObjectId,
  childTypeId: string,
  objects: Record<ObjectId, GameObject>,
  resolvedTypes: Record<string, ResolvedObjectType>
): boolean {
  const container = objects[containerId];
  if (!container) return false;

  const containerType = resolvedTypes[container.typeId];
  if (!containerType) return false;

  // Check if type is allowed
  const canContainTypes = containerType.resolvedCanContain;
  if (canContainTypes.length === 0) return true; // Empty means can contain anything

  // Check if childTypeId or any of its parents is in canContain
  const childType = resolvedTypes[childTypeId];
  if (!childType) return false;

  return childType.inheritanceChain.some((t) => canContainTypes.includes(t));
}

// Inherit properties from ancestors (for properties marked as inherited)
export function getInheritedProperties(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>,
  resolvedTypes: Record<string, ResolvedObjectType>
): Record<string, number | string | boolean> {
  const inherited: Record<string, number | string | boolean> = {};
  const ancestors = getAncestors(objectId, objects);

  // Process from root to parent (closest ancestor wins for same key)
  for (const ancestor of ancestors.reverse()) {
    const type = resolvedTypes[ancestor.typeId];
    if (!type) continue;

    for (const [key, def] of Object.entries(type.resolvedProperties)) {
      if (def.inherited && ancestor.properties[key] !== undefined) {
        inherited[key] = ancestor.properties[key];
      }
    }
  }

  return inherited;
}

// Get effective properties (own + inherited)
export function getEffectiveProperties(
  objectId: ObjectId,
  objects: Record<ObjectId, GameObject>,
  resolvedTypes: Record<string, ResolvedObjectType>
): Record<string, number | string | boolean> {
  const obj = objects[objectId];
  if (!obj) return {};

  const inherited = getInheritedProperties(objectId, objects, resolvedTypes);
  return { ...inherited, ...obj.properties };
}
