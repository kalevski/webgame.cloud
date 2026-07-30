# JWT signing keys

Outbound authentication. These are the key pairs this workspace uses to **sign JWTs it presents to
other services** — the mirror image of `docs/api-keys.md`, which covers tokens other people present
to us.

The private key never leaves the server. The public key is shown in the admin UI so it can be handed
to whoever validates the token.

## The key catalog is code, not data

Keys are a hand-maintained enum in `api/src/contracts/signing.ts`, exactly like `ASSET_TYPES`:

```ts
export const SIGNING_KEYS = ['partner_api'] as const
export const SIGNING_KEY_LABELS: Record<SigningKeyName, string> = {
    partner_api: 'Partner API',
}
```

Adding a downstream service = adding one entry plus its label (the compiler enforces the pair is
total). Nothing else is needed: the key material is generated on the next boot.

They are code rather than rows because a key name is referenced by application code calling
`sign('partner_api', …)` — a runtime-created key nobody can reference is not useful, and the enum
keeps the call sites greppable.

## Key material on disk

Under `SIGNING_KEYS_DIR` (default `./keys`), one directory per key:

```
<SIGNING_KEYS_DIR>/<name>/<kid>.key   RSA private key, PKCS#8 PEM, mode 0600
<SIGNING_KEYS_DIR>/<name>/<kid>.pub   public key, SPKI PEM, mode 0644
<SIGNING_KEYS_DIR>/<name>/active      plain text: the kid currently signing
```

`SigningKeyService.init()` runs at boot (`index.ts`, before `http.init()`) and, for every entry in
`SIGNING_KEYS`, generates a 2048-bit RSA pair if the `active` kid is missing or its private key is
gone. It is idempotent — an existing key is left alone.

**The path is resolved from the process working directory**, which is not the same place in every
context: `npm run dev` runs the API from `api/`, so keys land in `api/keys/`, while the Docker image
runs from `/app`. Set `SIGNING_KEYS_DIR` to an absolute path if you want one predictable location.

**`keys/` and `*.pem` are gitignored** (the pattern matches at any depth, so `api/keys/` is covered
too). Never commit private key material.

**In Docker, mount `SIGNING_KEYS_DIR` as a volume.** The image runs as `node` from `/app` with no
volume declared, so without one, every container restart generates a fresh key pair and every
downstream validator starts rejecting tokens. This is the single most likely way to break this
feature in production.

## Signing a token

```ts
const { token, kid, expiresAt } = await container.resolve(SigningKeyService)
    .sign('partner_api', { scope: 'reports:read' }, { audience: 'reporting', subject: 'webgame-cloud' })
```

`sign(name, payload, options?)` merges the payload with `iss` (`SIGNING_ISSUER`, falling back to
`API_URL` then `WORKSPACE_NAME`), `iat` and `exp`, adds `aud`/`sub` when given, and signs RS256 with
the active key. The JWT header carries `kid`, so a validator holding several public keys knows which
one to use.

TTL is `options.expiresInSeconds`, defaulting to `SIGNING_TTL_SECONDS` (300) and clamped to
`SIGNING_MAX_TTL_SECONDS` (86400). An unknown key name throws `NotFoundError('signing_key_not_found')`;
unreadable key material throws `UnavailableError('signing_key_unavailable')`.

Signing is deliberately **not** exposed over HTTP — it is a service other server code calls. There is
no endpoint that mints a token on request.

## Rotation

`POST /api/signing-keys/:name/rotate` generates a new pair and repoints `active`. **The previous
private key is not deleted and its public key stays listed under `retiredKids`.**

That is the whole point: tokens already issued keep verifying against the retired public key until
they expire, so rotation is not a flag day. Keep the retired public key published downstream for at
least the TTL of the longest token you issued, then it can be dropped.

Rotation is audited as `rotate_signing_key` (target = key name, detail = new kid), so it fans out to
webhooks like every other audited action.

## HTTP surface

| Route | Permission | Returns |
| --- | --- | --- |
| `GET /api/signing-keys` | `signing.key.read` | `SigningKey[]` — name, label, kid, algorithm, public key PEM, createdAt, retiredKids |
| `POST /api/signing-keys/:name/rotate` | `signing.key.rotate` | the rotated `SigningKey` |

`:name` is validated against the `SIGNING_KEYS` enum by JSON Schema, so an unknown name is a 400
before it reaches the service.

Both are enveloped like everything else — `curl` output needs `jq '.data'`.

## UI

`/admin/signing-keys` (`modules/SigningKeysAdmin.tsx`), a tab in the admin workspace gated on
`signing.key.read`. Each row shows the label, kid, algorithm, creation time and retired-key count —
the PEM itself is **not** rendered inline.

Two modals carry the interactions (`modals/SigningPublicKeyModal.tsx`,
`modals/ConfirmRotateSigningKeyModal.tsx`):

- **Show public key** opens the PEM in a modal with a copy button. Keeping it behind a click stops a
  wall of base64 from dominating the page when several keys exist.
- **Rotate** opens a confirmation modal restating what rotation does before the destructive
  action — the standard `ConfirmDelete*Modal` shape, not `window.confirm`.

The Rotate button only renders with `signing.key.rotate` — a read-only viewer never sees a dead
control.

`maintainer` is seeded with `signing.key.read`; rotation is owner-only until granted.

## Config

| Env var | Default | Meaning |
| --- | --- | --- |
| `SIGNING_KEYS_DIR` | `./keys` | Where key material lives. Mount as a volume in Docker. |
| `SIGNING_ISSUER` | `API_URL` → `WORKSPACE_NAME` | The `iss` claim. |
| `SIGNING_TTL_SECONDS` | `300` | Default token lifetime. |

## Deliberate limits

- **RS256 only.** One algorithm, no negotiation. Validators need no configuration beyond the PEM.
- **No JWKS endpoint.** The public key is copied from the admin UI. If a downstream service wants to
  refresh keys automatically, serving `<kid>.pub` files as a JWKS document is the natural extension —
  the on-disk layout is already keyed by `kid`.
- **No revocation.** A retired key stops signing but keeps verifying. To harden a compromised key,
  rotate and remove the retired `.pub` from the validator immediately, accepting that outstanding
  tokens break.


## Realm keys

Two more keys ship with the console:

- `realm_upload` — signs a 15-minute upload ticket. Claims: `sub` (asset id), `projectId`, `maxBytes`,
  `mime`, `jti`, `iss`, `iat`, `exp`, with `kid` in the header. **`maxBytes` is enforced by the realm** —
  the size the client declares when it asks for the ticket is otherwise unverifiable, so the realm refuses
  a body that exceeds it and finalises `failed`.
- `realm_transfer` — signs migration and purge instructions.

Never one key for both directions: an upload receiver must not be able to validate a data-relocation
instruction. The public-key route is unauthenticated (a realm holds no session) and serves retired kids so
a rotation does not invalidate tickets already in flight.
