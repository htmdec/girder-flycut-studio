import assert from 'node:assert/strict';

import { presetErrors } from '../girder_flycut/web_client/core/presets.js';
import { assessConfiguration } from '../girder_flycut/web_client/core/assess.js';
const preset = {
    templates: ['t'],
    materials: ['m'],
    flyer_layers: { min: 1, max: 1 },
    laser_limits: { power: { min: 10, max: 80 } },
    custom_fields: { thickness: { not_null: true, type: 'number', exclusive_min: 0 } },
    additional_custom_fields: false
};
const config = { run_params: { template: 't', foil_material: 'm' }, laser_params: [{ enabled: true, power: 60 }], custom_fields: { thickness: '2' } };
assert.deepEqual(presetErrors(preset, config), []);
for (const change of [
    { run_params: { template: 'other', foil_material: 'm' } },
    { laser_params: [] }, { laser_params: [{ power: 81 }] },
    { custom_fields: {} }, { custom_fields: { thickness: null } },
    { custom_fields: { thickness: 'abc' } }, { custom_fields: { thickness: 0 } },
    { custom_fields: { thickness: 1, extra: 'x' } }
]) assert(presetErrors(preset, { ...config, ...change }).length);
const status = assessConfiguration({ stackId: '00005', operator: 'user', lasers: [], fields: [], layers: ['F1'], repeat: 1, wraparound: true, foilMaterial: 'm', template: 't' });
assert.equal(status.complete, true);
assert.equal(status.status, 'Needs validation');
assert(status.warnings.some((text) => text.includes('all parameters inherit')));
console.log('Preset constraints and empty laser inheritance passed.');
