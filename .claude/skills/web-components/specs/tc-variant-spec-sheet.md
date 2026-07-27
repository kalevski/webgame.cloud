---
component: tc-variant-spec-sheet
---

### tc-variant-spec-sheet

The full technical datasheet of one `model_variant` catalog row: a header
(name, muted version, mono slug, production years), a hero strip of big mono
dashboard readouts (power PS/kW, 0–100 km/h, top speed, CO₂) in a 1px-gap
grid, then grouped key-value sections with dotted leader lines — Powertrain,
Chassis, Dimensions, Consumption & Emissions. Unknown is NULL: absent values
skip their rows entirely and a section with zero rows disappears (no em-dash
placeholders). Enum members are humanized (`PLUG_IN_HYBRID` → "Plug-in
hybrid", `DUAL_CLUTCH` → "Dual-clutch"); `turning_circle_dm` renders in
metres.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Variant name (e.g. "Golf GTI") |
| `version` | string | — | Muted version suffix (e.g. "2.0 TSI DSG") |
| `slug` | string | — | Mono, faint machine-facing identifier |
| `years-text` | string | — | Production span (e.g. "2020 – 2024") |
| `dense` | boolean | false | Tighter paddings for comparison layouts |

**Properties (JS-only):** `variant: VariantSpec` — an object mirroring the
`model_variant` columns in camelCase, all optional: `powertrain`, `fuelType`,
`gearboxType`, `gears`, `drivetrainType`, `powerPs`, `powerKw`, `seats`,
`doors`, `frontSuspension`, `rearSuspension`, `frontBrakes`, `rearBrakes`,
`frontTyre`, `rearTyre`, `fuelCapacityL`, `consumptionL100km`,
`consumptionCityL100km`, `consumptionHwyL100km`, `emissionStandard`,
`emissionCategory`, `co2GKm`, `adblueCapacityL`, `lengthMm`, `widthMm`,
`heightMm`, `wheelbaseMm`, `turningCircleDm`, `trunkVolumeL`, `roofLoadKg`,
`towingCapacityKg`, `maxSlopePct`, `accelerationS`, `topSpeedKmh`,
`noiseDb`. Set via a ref (`el.variant = {...}`) or the `useTc` React hook.

```html
<tc-variant-spec-sheet
    name="Golf GTI"
    version="2.0 TSI DSG"
    slug="vw-golf-8-gti-2-0-tsi-dsg"
    years-text="2020 – 2024"
></tc-variant-spec-sheet>
<script>
    document.querySelector('tc-variant-spec-sheet').variant = {
        powertrain: 'GASOLINE',
        gearboxType: 'DUAL_CLUTCH',
        gears: 7,
        powerPs: 245,
        powerKw: 180,
        accelerationS: 6.2,
        topSpeedKmh: 250,
        co2GKm: 149,
    }
</script>
```

---