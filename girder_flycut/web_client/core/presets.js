/** Preset constraints are blocking requirements, mirrored by presets.py. */
export function presetErrors(preset, config) {
    if (!preset) return [];
    const errors = [];
    const run = config.run_params;
    for (const [key, allowed] of [['template', 'templates'], ['foil_material', 'materials']]) {
        if (preset[allowed] && !preset[allowed].includes(run[key])) errors.push(`Preset does not allow this ${key}.`);
    }
    const lasers = config.laser_params.filter((row) => row.enabled !== false);
    const bounds = preset.flyer_layers || {};
    if (lasers.length < (bounds.min ?? 0) || lasers.length > (bounds.max ?? 28)) errors.push('Enabled flyer layer count violates preset limits.');
    const outside = (value, limits) => !Number.isFinite(value) || value < (limits.min ?? -Infinity) || value > (limits.max ?? Infinity) || value <= (limits.exclusive_min ?? -Infinity) || value >= (limits.exclusive_max ?? Infinity);
    for (const row of lasers) {
        for (const [key, limits] of Object.entries(preset.laser_limits || {})) {
            if (outside(Number(row[key]), limits)) errors.push(`Laser ${key} violates preset limits.`);
        }
    }
    const fields = config.custom_fields;
    const rules = preset.custom_fields || {};
    if (preset.additional_custom_fields === false && Object.keys(fields).some((name) => !(name in rules))) errors.push('Preset does not allow additional custom fields.');
    for (const [name, definition] of Object.entries(rules)) {
        const rule = definition || {};
        const value = fields[name];
        if (!(name in fields)) errors.push(`Preset requires custom field ${name}.`);
        else if (value === null || value === undefined || String(value).trim() === '') {
            if (rule.not_null) errors.push(`Custom field ${name} cannot be null.`);
        } else if (rule.type === 'number' || ['min', 'max', 'exclusive_min', 'exclusive_max'].some((key) => key in rule)) {
            if (outside(Number(value), rule)) errors.push(`Custom field ${name} must be a number within preset bounds.`);
        }
    }
    return [...new Set(errors)];
}
