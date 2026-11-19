# Workflow presets

Presets are edited as JSON outside the dashboard. By default the server reads
`girder_flycut/presets.json`. Set `FLYCUT_PRESETS_FILE` to an absolute path to use
an administrator-managed file instead. The server reads it when options or
submission rules are requested. Reload the dashboard after editing it.

The file is an array. Each preset has a unique `id` and a `label`. All other
properties are optional. Omitting a restriction leaves that choice unrestricted.
Selecting a preset prefills required fields, permitted selections, automatic
Stack ID, laser defaults, and at least its minimum enabled layer count. Selecting
another preset replaces the laser entries and custom fields with its defaults.

```json
[
  {
    "id": "measured-stack",
    "label": "Measured stack",
    "templates": ["5x5-stack.lbrn2"],
    "materials": ["JHAMAB00010"],
    "automate_stack_id": true,
    "laser_defaults": {
      "power": 60, "speed": 100, "qpulsewidth": 200,
      "frequency": 100, "passes": 1
    },
    "laser_limits": {
      "power": {"min": 10, "max": 80},
      "speed": {"min": 1},
      "passes": {"min": 1, "max": 5}
    },
    "flyer_layers": {"min": 2, "max": 2},
    "custom_fields": {
      "batch_code": {"default": null, "not_null": true},
      "thickness_um": {
        "default": null, "not_null": true, "type": "number",
        "exclusive_min": 0, "max": 500
      }
    },
    "additional_custom_fields": false
  }
]
```

Use catalog IDs for templates and materials. Laser limit keys are `power`,
`speed`, `qpulsewidth`, `frequency`, and `passes`. Bounds are inclusive `min` /
`max`; custom numeric fields also accept strict `exclusive_min` /
`exclusive_max`. Numeric custom values are stored as JSON numbers on submission.
Every custom field listed is required to exist; `not_null` additionally requires
a value. `flyer_layers` counts enabled parameter entries, before repeat and
wraparound assignment. Equal minimum and maximum enforce an exact count.
Automatic Stack IDs use the existing server allocator and are locked in the form;
the API checks the automatic ID format. IDs are checked for collisions at submit.

Field-name recommendations are the sorted, deduplicated union of required custom
field names across all presets. Saved configurations never contribute. A preset
that prohibits extra fields hides recommendations and disables adding fields.
Preset rules block submission and cannot be overridden by acknowledging warnings.

With no enabled laser entries (including an empty list), all flyer settings are
inherited from the template. This requires validation acknowledgement. Generation
reads the effective LightBurn settings into both inventory CSV and metadata JSON.
New forms still begin with one entry; selecting a preset starts with one or its
minimum, whichever is larger.
