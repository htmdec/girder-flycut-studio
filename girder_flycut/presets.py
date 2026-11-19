"""Readable file-based workflow policies; never inferred from saved configurations."""

import json
import math
import os
import re
from pathlib import Path


def load_presets():
    path = Path(os.environ.get("FLYCUT_PRESETS_FILE", Path(__file__).with_name("presets.json")))
    presets = json.loads(path.read_text())
    if not isinstance(presets, list) or len({p["id"] for p in presets}) != len(presets):
        raise ValueError("Presets must be a list with unique IDs.")
    return presets


def validate_preset(config):
    preset_id = config.get("preset")
    if not preset_id:
        return
    preset = next((p for p in load_presets() if p["id"] == preset_id), None)
    if preset is None:
        raise ValueError("Unknown preset.")
    run = config.get("run_params", {})
    for key, allowed in [("template", "templates"), ("foil_material", "materials")]:
        if allowed in preset and run.get(key) not in preset[allowed]:
            raise ValueError(f"Preset does not allow this {key}.")
    if preset.get("automate_stack_id") and not re.fullmatch(r"[0-9A-HJKMNP-TV-Z]{5}", run.get("stackid", "")):
        raise ValueError("Preset requires an automatic five-character Stack ID.")
    lasers = config.get("laser_params", [])
    count = sum(row.get("enabled", True) is not False for row in lasers)
    bounds = preset.get("flyer_layers", {})
    if count < bounds.get("min", 0) or count > bounds.get("max", 28):
        raise ValueError("Enabled flyer layer count violates preset limits.")
    for row in lasers:
        if row.get("enabled", True) is False:
            continue
        for key, limits in preset.get("laser_limits", {}).items():
            value = row.get(key)
            if (
                type(value) not in (int, float)
                or not math.isfinite(value)
                or value < limits.get("min", -math.inf)
                or value > limits.get("max", math.inf)
            ):
                raise ValueError(f"Laser {key} violates preset limits.")
    fields = config.get("custom_fields", {})
    rules = preset.get("custom_fields", {})
    if preset.get("additional_custom_fields") is False and set(fields) - set(rules):
        raise ValueError("Preset does not allow additional custom fields.")
    for name, rule in rules.items():
        if name not in fields:
            raise ValueError(f"Preset requires custom field {name}.")
        rule = rule if isinstance(rule, dict) else {}
        value = fields[name]
        if value is None or isinstance(value, str) and not value.strip():
            if rule.get("not_null"):
                raise ValueError(f"Custom field {name} cannot be null.")
            continue
        if rule.get("type") == "number":
            if isinstance(value, bool):
                raise ValueError(f"Custom field {name} must be a number.")
            try:
                value = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"Custom field {name} must be a number.") from None
            if not math.isfinite(value):
                raise ValueError(f"Custom field {name} must be finite.")
            fields[name] = value
        if any(key in rule for key in ("min", "max", "exclusive_min", "exclusive_max")):
            if (
                type(value) not in (int, float)
                or value < rule.get("min", -math.inf)
                or value > rule.get("max", math.inf)
                or value <= rule.get("exclusive_min", -math.inf)
                or value >= rule.get("exclusive_max", math.inf)
            ):
                raise ValueError(f"Custom field {name} violates preset bounds.")
