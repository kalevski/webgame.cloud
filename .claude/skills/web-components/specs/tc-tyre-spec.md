---
component: tc-tyre-spec
---

### tc-tyre-spec

Tyre sidewall readout for the vehicle-catalog `tyre_size` table. Parses ISO
metric spec strings (`225/45 R17`, `225/45R17`, optional `91V` load/speed
suffix) into width / aspect / rim segments rendered as large mono digits
with micro unit sub-labels, hairline-separated. Two-axle mode renders mono
FRONT / REAR tags and raises a **STAGGERED** corner flag when the axles
differ. A spec that doesn't parse renders as the raw mono string (commercial
sizes like `185 R14C` stay legible — it never crashes).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `spec` | string | — | Single-axle spec (ignored when `front-spec`/`rear-spec` set) |
| `front-spec` | string | — | Front axle spec (two-axle mode) |
| `rear-spec` | string | — | Rear axle spec (two-axle mode) |

```html
<!-- single axle -->
<tc-tyre-spec spec="225/45 R17 91V"></tc-tyre-spec>

<!-- staggered fitment — unequal axles show the STAGGERED flag -->
<tc-tyre-spec front-spec="245/35 R20 95Y" rear-spec="275/30 R20 97Y"></tc-tyre-spec>
```

---