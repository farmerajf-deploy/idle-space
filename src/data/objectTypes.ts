// Object type definitions with inheritance hierarchy

import type { ObjectTypeDefinition } from '../core/types';

export const objectTypes: Record<string, ObjectTypeDefinition> = {
  // Root abstract type - all objects inherit from this
  entity: {
    id: 'entity',
    name: 'Entity',
    ascii: '?',
    color: '#888888',
    defaultCapacity: 0,
    defaultVolume: 1,
    properties: {
      discovered: { type: 'boolean', default: false },
    },
    availableTasks: [],
    targetableTasks: ['scan'],
  },

  // Celestial bodies - abstract
  celestial: {
    id: 'celestial',
    name: 'Celestial Body',
    parent: 'entity',
    ascii: 'O',
    color: '#FFFFFF',
    defaultCapacity: 1000000,
    defaultVolume: 1000000,
    canContain: ['celestial', 'vessel', 'structure'],
    properties: {
      mass: { type: 'number', default: 1000, inherited: false },
      gravity: { type: 'number', default: 1, inherited: true },
    },
    targetableTasks: ['scan', 'survey'],
  },

  // Universe - the root container
  universe: {
    id: 'universe',
    name: 'Universe',
    parent: 'celestial',
    ascii: `
    *  .  *  .  *
  .    *    .    *
    .  *  .  *  .
  *    .    *    .
    *  .  *  .  *
    `.trim(),
    color: '#1a1a2e',
    defaultCapacity: Infinity,
    defaultVolume: Infinity,
    canContain: ['galaxy', 'void'],
  },

  // Galaxy
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    parent: 'celestial',
    ascii: `
     _.--._
   .'      '.
  /  .--.    \\
 |  /    \\   |
 | |  ()  |  |
  \\  '--'  /
   '.____.'
    `.trim(),
    color: '#9b59b6',
    defaultCapacity: 100000000,
    defaultVolume: 10000000,
    canContain: ['star_system', 'nebula', 'black_hole'],
  },

  // Star system
  star_system: {
    id: 'star_system',
    name: 'Star System',
    parent: 'celestial',
    ascii: `
      \\|/
    --( )--
      /|\\
    `.trim(),
    color: '#f1c40f',
    defaultCapacity: 10000000,
    defaultVolume: 1000000,
    canContain: ['star', 'planet', 'asteroid_belt', 'comet'],
  },

  // Star
  star: {
    id: 'star',
    name: 'Star',
    parent: 'celestial',
    ascii: `
     \\  |  /
   --- * ---
     /  |  \\
    `.trim(),
    color: '#f39c12',
    defaultCapacity: 0,
    defaultVolume: 100000,
    properties: {
      temperature: { type: 'number', default: 5500 },
      luminosity: { type: 'number', default: 1, inherited: true },
    },
    canContain: [],
  },

  // Planet - abstract
  planet: {
    id: 'planet',
    name: 'Planet',
    parent: 'celestial',
    ascii: `
    .--.
   /    \\
  |      |
   \\    /
    '--'
    `.trim(),
    color: '#3498db',
    defaultCapacity: 10000,
    defaultVolume: 10000,
    canContain: ['moon', 'station', 'vessel'],
    properties: {
      atmosphere: { type: 'boolean', default: true },
      habitable: { type: 'boolean', default: false },
    },
    targetableTasks: ['scan', 'survey', 'colonize'],
  },

  // Rocky planet
  rocky_planet: {
    id: 'rocky_planet',
    name: 'Rocky Planet',
    parent: 'planet',
    ascii: `
    .---.
   /  o  \\
  | .   . |
   \\  o  /
    '---'
    `.trim(),
    color: '#95a5a6',
    defaultCapacity: 5000,
    defaultVolume: 5000,
    properties: {
      minerals: { type: 'number', default: 100 },
    },
    targetableTasks: ['mine'],
  },

  // Gas giant
  gas_giant: {
    id: 'gas_giant',
    name: 'Gas Giant',
    parent: 'planet',
    ascii: `
    .===.
   /=====\\
  |=======|
   \\=====/
    '==='
    `.trim(),
    color: '#e67e22',
    defaultCapacity: 50000,
    defaultVolume: 50000,
    properties: {
      atmosphere: { type: 'boolean', default: true },
      gasResources: { type: 'number', default: 1000 },
    },
    targetableTasks: ['harvest_gas'],
  },

  // Moon
  moon: {
    id: 'moon',
    name: 'Moon',
    parent: 'celestial',
    ascii: `
   .-.
  (   )
   '-'
    `.trim(),
    color: '#bdc3c7',
    defaultCapacity: 100,
    defaultVolume: 500,
    canContain: ['station', 'vessel'],
    targetableTasks: ['scan', 'mine', 'colonize'],
  },

  // Asteroid
  asteroid: {
    id: 'asteroid',
    name: 'Asteroid',
    parent: 'celestial',
    ascii: `
  .^.
 <   >
  'v'
    `.trim(),
    color: '#7f8c8d',
    defaultCapacity: 0,
    defaultVolume: 10,
    properties: {
      minerals: { type: 'number', default: 50 },
      iron: { type: 'number', default: 20 },
      ice: { type: 'number', default: 10 },
    },
    targetableTasks: ['scan', 'mine'],
  },

  // Asteroid belt
  asteroid_belt: {
    id: 'asteroid_belt',
    name: 'Asteroid Belt',
    parent: 'celestial',
    ascii: `
 . * . * . * .
* . * . * . * .
 . * . * . * .
    `.trim(),
    color: '#7f8c8d',
    defaultCapacity: 1000,
    defaultVolume: 1000,
    canContain: ['asteroid', 'vessel'],
  },

  // Vessels - abstract
  vessel: {
    id: 'vessel',
    name: 'Vessel',
    parent: 'entity',
    ascii: '>',
    color: '#2ecc71',
    defaultCapacity: 100,
    defaultVolume: 10,
    canContain: ['cargo', 'module', 'crew'],
    properties: {
      fuel: { type: 'number', default: 100, min: 0, max: 100 },
      hull: { type: 'number', default: 100, min: 0, max: 100 },
    },
    availableTasks: ['travel', 'scan', 'dock'],
    targetableTasks: ['scan', 'dock', 'board'],
  },

  // Ship
  ship: {
    id: 'ship',
    name: 'Ship',
    parent: 'vessel',
    ascii: `
  /\\
 /__\\
 |==|
/|  |\\
    `.trim(),
    color: '#2ecc71',
    defaultCapacity: 200,
    defaultVolume: 20,
    availableTasks: ['travel', 'scan', 'mine', 'dock'],
  },

  // Probe
  probe: {
    id: 'probe',
    name: 'Probe',
    parent: 'vessel',
    ascii: `
 [=]
  |
 / \\
    `.trim(),
    color: '#9b59b6',
    defaultCapacity: 10,
    defaultVolume: 2,
    properties: {
      fuel: { type: 'number', default: 50, min: 0, max: 50 },
      sensorRange: { type: 'number', default: 5 },
    },
    availableTasks: ['travel', 'scan', 'survey'],
  },

  // Station
  station: {
    id: 'station',
    name: 'Station',
    parent: 'entity',
    ascii: `
 [===]
 |   |
[=====]
 |   |
 [===]
    `.trim(),
    color: '#1abc9c',
    defaultCapacity: 1000,
    defaultVolume: 100,
    canContain: ['vessel', 'cargo', 'module', 'crew'],
    availableTasks: ['manufacture', 'repair', 'refuel'],
    targetableTasks: ['scan', 'dock'],
  },

  // Resources and cargo
  cargo: {
    id: 'cargo',
    name: 'Cargo',
    parent: 'entity',
    ascii: '[#]',
    color: '#e74c3c',
    defaultCapacity: 0,
    defaultVolume: 1,
    properties: {
      quantity: { type: 'number', default: 1 },
    },
    targetableTasks: ['transfer', 'jettison'],
  },

  // Ore
  ore: {
    id: 'ore',
    name: 'Ore',
    parent: 'cargo',
    ascii: '[*]',
    color: '#95a5a6',
    defaultCapacity: 0,
    defaultVolume: 2,
  },

  // Fuel
  fuel_cargo: {
    id: 'fuel_cargo',
    name: 'Fuel',
    parent: 'cargo',
    ascii: '[~]',
    color: '#f1c40f',
    defaultCapacity: 0,
    defaultVolume: 1,
  },
};

export default objectTypes;
