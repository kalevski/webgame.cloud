---
component: tc-engine-spec
---

### tc-engine-spec

Machined engine ID plate for the vehicle-catalog `engine` table — mono
stamped engine code, muted manufacturer, a derived CONFIG badge combining
layout + cylinder count (`V`+8 → **V8**, `SERIES`+6 → **L6**, `BOXER`+4 →
**B4**, `ROTARY` → **R**, `SINGLE` → **1CYL**), over a hairline key-value
cell grid (displacement, valvetrain, torque, peak rpm, injection,
aspiration, emission control). Every attribute is optional — an absent
attribute (SQL NULL) renders no cell, per the schema's "unknown is always
NULL" rule.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | — | Engine code, mono "stamped serial" (e.g. `B58B30M1`) |
| `manufacturer` | string | — | Engine manufacturer name |
| `layout` | `BOXER\|SERIES\|V\|ROTARY\|SINGLE` | — | Cylinder layout (drives the config badge) |
| `position` | `FRONT\|REAR\|MID` | — | Engine position |
| `emission-control` | enum | — | e.g. `SCR_CAT_WITH_DPF` → "SCR cat + DPF" |
| `fuel-injection` | enum | — | e.g. `COMMON_RAIL` → "Common rail" |
| `supercharger` | enum | — | e.g. `BI_TURBO` → "Bi-turbo"; omit for naturally aspirated |
| `displacement-cc` | number | — | Displacement in cc (thousands-formatted) |
| `cylinders` | number | — | Cylinder count (also feeds the config badge) |
| `valves` | number | — | Valve count |
| `torque-nm` | number | — | Peak torque in Nm |
| `power-at-rpm` | number | — | rpm at peak power |
| `torque-at-rpm` | number | — | rpm at peak torque |
| `compact` | boolean | false | Headline cells only (displacement + torque) for listing pages |

Enum members humanize automatically (`SCREAMING_SNAKE` → "Sentence case")
with hand-tuned labels for the technical ones.

```html
<tc-engine-spec
    code="B58B30M1"
    manufacturer="BMW"
    layout="SERIES"
    position="FRONT"
    cylinders="6"
    valves="24"
    displacement-cc="2998"
    torque-nm="500"
    power-at-rpm="5000"
    torque-at-rpm="1900"
    fuel-injection="DIRECT_INJECTION"
    supercharger="TURBO"
    emission-control="OTTO_PARTICULATE_FILTER"
></tc-engine-spec>
```

---