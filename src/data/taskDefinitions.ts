// Task definitions

import type { TaskDefinition } from '../core/types';

export const taskDefinitions: Record<string, TaskDefinition> = {
  scan: {
    id: 'scan',
    name: 'Scan',
    description: 'Scan an object to reveal its children and properties',
    baseDuration: 10, // 10 ticks
    performerTypes: ['vessel', 'station'],
    targetTypes: ['entity'],
    requirements: [
      {
        type: 'property',
        target: 'performer',
        key: 'fuel',
        operator: '>=',
        value: 5,
      },
    ],
    effects: [
      {
        type: 'set_property',
        target: 'target',
        key: 'discovered',
        value: true,
      },
      {
        type: 'modify_property',
        target: 'performer',
        key: 'fuel',
        value: -5,
      },
    ],
  },

  survey: {
    id: 'survey',
    name: 'Survey',
    description: 'Detailed survey to reveal resource deposits',
    baseDuration: 30,
    performerTypes: ['probe', 'ship'],
    targetTypes: ['planet', 'moon', 'asteroid'],
    requirements: [
      {
        type: 'property',
        target: 'target',
        key: 'discovered',
        operator: '==',
        value: true,
      },
      {
        type: 'property',
        target: 'performer',
        key: 'fuel',
        operator: '>=',
        value: 10,
      },
    ],
    effects: [
      {
        type: 'set_property',
        target: 'target',
        key: 'surveyed',
        value: true,
      },
      {
        type: 'modify_property',
        target: 'performer',
        key: 'fuel',
        value: -10,
      },
    ],
  },

  mine: {
    id: 'mine',
    name: 'Mine',
    description: 'Extract minerals from a celestial body',
    baseDuration: 60,
    performerTypes: ['ship'],
    targetTypes: ['asteroid', 'rocky_planet', 'moon'],
    requirements: [
      {
        type: 'property',
        target: 'target',
        key: 'minerals',
        operator: '>',
        value: 0,
      },
      {
        type: 'property',
        target: 'performer',
        key: 'fuel',
        operator: '>=',
        value: 20,
      },
    ],
    effects: [
      {
        type: 'modify_property',
        target: 'target',
        key: 'minerals',
        value: -10,
      },
      {
        type: 'create_child',
        target: 'performer',
        objectTypeId: 'ore',
      },
      {
        type: 'modify_property',
        target: 'performer',
        key: 'fuel',
        value: -20,
      },
    ],
  },

  travel: {
    id: 'travel',
    name: 'Travel',
    description: 'Move to a sibling location',
    baseDuration: 20,
    performerTypes: ['vessel'],
    targetTypes: ['celestial', 'station'],
    requirements: [
      {
        type: 'sibling_type',
        target: 'target',
      },
      {
        type: 'property',
        target: 'performer',
        key: 'fuel',
        operator: '>=',
        value: 15,
      },
    ],
    effects: [
      {
        type: 'move_to',
        target: 'performer',
        key: 'target',
      },
      {
        type: 'modify_property',
        target: 'performer',
        key: 'fuel',
        value: -15,
      },
    ],
  },

  dock: {
    id: 'dock',
    name: 'Dock',
    description: 'Dock with a station or larger vessel',
    baseDuration: 5,
    performerTypes: ['vessel'],
    targetTypes: ['station', 'vessel'],
    requirements: [
      {
        type: 'sibling_type',
        target: 'target',
      },
    ],
    effects: [
      {
        type: 'move_to',
        target: 'performer',
        key: 'target', // Moves performer inside target
      },
    ],
  },

  refuel: {
    id: 'refuel',
    name: 'Refuel',
    description: 'Refuel a docked vessel',
    baseDuration: 15,
    performerTypes: ['station'],
    targetTypes: ['vessel'],
    requirements: [
      {
        type: 'contains',
        target: 'performer',
        key: 'target', // Target must be inside performer
      },
    ],
    effects: [
      {
        type: 'set_property',
        target: 'target',
        key: 'fuel',
        value: 100,
      },
    ],
  },

  repair: {
    id: 'repair',
    name: 'Repair',
    description: 'Repair a docked vessel',
    baseDuration: 30,
    performerTypes: ['station'],
    targetTypes: ['vessel'],
    requirements: [
      {
        type: 'contains',
        target: 'performer',
        key: 'target',
      },
    ],
    effects: [
      {
        type: 'set_property',
        target: 'target',
        key: 'hull',
        value: 100,
      },
    ],
  },

  harvest_gas: {
    id: 'harvest_gas',
    name: 'Harvest Gas',
    description: 'Harvest gas resources from a gas giant',
    baseDuration: 45,
    performerTypes: ['ship'],
    targetTypes: ['gas_giant'],
    requirements: [
      {
        type: 'property',
        target: 'target',
        key: 'gasResources',
        operator: '>',
        value: 0,
      },
      {
        type: 'property',
        target: 'performer',
        key: 'fuel',
        operator: '>=',
        value: 25,
      },
    ],
    effects: [
      {
        type: 'modify_property',
        target: 'target',
        key: 'gasResources',
        value: -50,
      },
      {
        type: 'create_child',
        target: 'performer',
        objectTypeId: 'fuel_cargo',
      },
      {
        type: 'modify_property',
        target: 'performer',
        key: 'fuel',
        value: -25,
      },
    ],
  },
};

export default taskDefinitions;
