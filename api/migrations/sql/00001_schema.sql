-- +goose Up

CREATE TABLE roles (
    id                 text PRIMARY KEY,
    name               text NOT NULL,

    builtin            boolean NOT NULL DEFAULT false,
    position           integer NOT NULL DEFAULT 0,

    applicable         boolean NOT NULL DEFAULT false,
    application_prompt text NOT NULL DEFAULT '',

    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);

CREATE INDEX roles_applicable_idx ON roles (position) WHERE applicable AND deleted_at IS NULL;

CREATE TABLE role_permissions (
    role_id    text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (role_id, permission)
);

CREATE TABLE users (
    id           text PRIMARY KEY,

    email        text NOT NULL,
    name         text NOT NULL DEFAULT '',
    picture      text NOT NULL DEFAULT '',

    role         text NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    kind         text NOT NULL DEFAULT 'human' CHECK (kind IN ('human', 'service')),
    active       boolean NOT NULL DEFAULT true,

    verified     boolean NOT NULL DEFAULT false,

    last_seen_at timestamptz,

    consented_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email)) WHERE deleted_at IS NULL;

CREATE INDEX users_role_active_idx ON users (role, active) WHERE deleted_at IS NULL;

CREATE INDEX users_kind_idx ON users (kind, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE user_identities (
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider   text NOT NULL CHECK (provider IN ('google', 'discord')),
    subject    text NOT NULL,
    email      text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (provider, subject)
);
CREATE UNIQUE INDEX user_identities_user_provider_idx ON user_identities (user_id, provider)
    WHERE deleted_at IS NULL;

CREATE TABLE sessions (
    id           text PRIMARY KEY,
    token_hash   text NOT NULL,
    user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_agent   text NOT NULL DEFAULT '',
    ip           text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    impersonated_by text REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX sessions_token_hash_idx ON sessions (token_hash) WHERE deleted_at IS NULL;
CREATE INDEX sessions_user_idx ON sessions (user_id, last_seen_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX sessions_expires_idx ON sessions (expires_at) WHERE deleted_at IS NULL;

CREATE TABLE user_permissions (
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission text NOT NULL,
    granted    boolean NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (user_id, permission)
);

CREATE TABLE role_limits (
    role       text NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    resource   text NOT NULL,
    max_count  integer CHECK (max_count IS NULL OR max_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (role, resource)
);

CREATE TABLE user_limit_overrides (
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource   text NOT NULL,
    max_count  integer CHECK (max_count IS NULL OR max_count >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (user_id, resource)
);

CREATE TABLE role_applications (
    id            text PRIMARY KEY,
    user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id       text NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    message       text NOT NULL DEFAULT '',
    decision_note text NOT NULL DEFAULT '',
    decided_by    text REFERENCES users(id) ON DELETE SET NULL,
    decided_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE UNIQUE INDEX role_applications_open_unique_idx ON role_applications (user_id)
    WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX role_applications_status_idx ON role_applications (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX role_applications_user_idx ON role_applications (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE reports (
    id           text PRIMARY KEY,
    reporter_id  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_kind  text NOT NULL CHECK (target_kind IN ('project', 'user')),
    target_id    text NOT NULL,
    target_label text NOT NULL DEFAULT '',
    reason       text NOT NULL DEFAULT '',
    status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    resolved_by  text REFERENCES users(id) ON DELETE SET NULL,
    resolved_at  timestamptz,
    resolution   text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE UNIQUE INDEX reports_open_unique_idx ON reports (reporter_id, target_kind, target_id)
    WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX reports_status_idx ON reports (status, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE audit_log (
    id         text PRIMARY KEY,
    actor_id   text REFERENCES users(id) ON DELETE SET NULL,
    actor_name text NOT NULL DEFAULT '',
    action     text NOT NULL,
    target_id  text NOT NULL DEFAULT '',
    detail     text NOT NULL DEFAULT '',
    request_id text NOT NULL DEFAULT '',
    impersonated boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX audit_log_actor_idx ON audit_log (actor_id) WHERE deleted_at IS NULL;
CREATE INDEX audit_log_action_idx ON audit_log (action) WHERE deleted_at IS NULL;

CREATE TABLE notifications (
    id         text PRIMARY KEY,
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       text NOT NULL CHECK (kind IN ('welcome', 'system', 'role_application', 'project_invite', 'project_moved',
                                              'build_failed', 'ticket_reply', 'ticket_status')),
    title      text NOT NULL,
    link       text NOT NULL DEFAULT '',
    read_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE push_subscriptions (
    endpoint   text PRIMARY KEY,
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    p256dh     text NOT NULL,
    auth       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id) WHERE deleted_at IS NULL;

CREATE TABLE settings (
    key        text PRIMARY KEY,
    value      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE billing_plans (
    id           text PRIMARY KEY,
    name         text NOT NULL,
    description  text NOT NULL DEFAULT '',
    role_id      text REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
    visible_role_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    mode         text NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'managed')),
    price_cents  integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    currency     text NOT NULL DEFAULT 'USD',
    interval     text NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    position     integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true,
    features     jsonb NOT NULL DEFAULT '[]'::jsonb,
    sales_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
    trial_days   integer NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
    provider_product_id text NOT NULL DEFAULT '',
    storage_overage_allowed boolean NOT NULL DEFAULT false,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX billing_plans_active_idx ON billing_plans (position) WHERE active AND deleted_at IS NULL;

CREATE TABLE subscriptions (
    user_id                  text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan_id                  text REFERENCES billing_plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    status                   text NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'trialing', 'active', 'past_due', 'canceled')),
    provider                 text NOT NULL DEFAULT 'manual',
    provider_customer_id     text NOT NULL DEFAULT '',
    provider_subscription_id text NOT NULL DEFAULT '',
    provider_updated_at      timestamptz,
    cancel_at_period_end     boolean NOT NULL DEFAULT false,
    current_period_end       timestamptz,
    started_at               timestamptz,
    staff_override_plan_id   text REFERENCES billing_plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    storage_overage_bytes    bigint NOT NULL DEFAULT 0,
    storage_overage_flagged_at timestamptz,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz
);
CREATE INDEX subscriptions_due_idx ON subscriptions (current_period_end)
    WHERE status IN ('trialing', 'active') AND deleted_at IS NULL;
CREATE INDEX subscriptions_provider_sub_idx ON subscriptions (provider, provider_subscription_id)
    WHERE provider_subscription_id <> '' AND deleted_at IS NULL;

CREATE TABLE invoices (
    id                  text PRIMARY KEY,
    number              text NOT NULL,
    public_token        text NOT NULL,
    user_id             text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id             text REFERENCES billing_plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    status              text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    provider            text NOT NULL DEFAULT 'manual',
    provider_invoice_id text NOT NULL DEFAULT '',
    amount_cents        integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
    discount_cents      integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    credit_cents        integer NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
    currency            text NOT NULL DEFAULT 'USD',
    issued_at           timestamptz NOT NULL DEFAULT now(),
    due_at              timestamptz,
    paid_at             timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);
CREATE UNIQUE INDEX invoices_number_idx ON invoices (number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX invoices_public_token_idx ON invoices (public_token) WHERE deleted_at IS NULL;
CREATE INDEX invoices_user_idx ON invoices (user_id, issued_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX invoices_status_idx ON invoices (status, issued_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX invoices_provider_invoice_idx ON invoices (provider, provider_invoice_id)
    WHERE provider_invoice_id <> '' AND deleted_at IS NULL;

CREATE TABLE billing_event (
    id                        text PRIMARY KEY,
    provider                  text NOT NULL,
    provider_event_id         text NOT NULL,
    event_type                text NOT NULL,
    provider_subscription_id  text NOT NULL DEFAULT '',
    user_id                   text REFERENCES users(id) ON DELETE SET NULL,
    object_at                 timestamptz NOT NULL,
    payload                   jsonb NOT NULL,
    status                    text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'applied', 'ignored', 'failed')),
    attempts                  integer NOT NULL DEFAULT 0,
    error                     text NOT NULL DEFAULT '',
    applied_at                timestamptz,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    deleted_at                timestamptz
);
CREATE UNIQUE INDEX billing_event_provider_idx ON billing_event (provider, provider_event_id) WHERE deleted_at IS NULL;
CREATE INDEX billing_event_status_idx ON billing_event (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX billing_event_user_idx ON billing_event (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE sales_enquiries (
    id         text PRIMARY KEY,
    plan_id    text REFERENCES billing_plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
    answers    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX sales_enquiries_status_idx ON sales_enquiries (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX sales_enquiries_user_idx ON sales_enquiries (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX sales_enquiries_open_unique_idx ON sales_enquiries (user_id)
    WHERE status IN ('new', 'contacted') AND deleted_at IS NULL;

CREATE TABLE sales_enquiry_events (
    id         text PRIMARY KEY,
    enquiry_id text NOT NULL REFERENCES sales_enquiries(id) ON DELETE CASCADE,
    actor_id   text REFERENCES users(id) ON DELETE SET NULL,
    actor_name text NOT NULL DEFAULT '',
    kind       text NOT NULL CHECK (kind IN ('created', 'status', 'note', 'invoice')),
    status     text,
    note       text NOT NULL DEFAULT '',
    invoice_id text REFERENCES invoices(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX sales_enquiry_events_idx ON sales_enquiry_events (enquiry_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE email_templates (
    key         text PRIMARY KEY,
    name        text NOT NULL,
    description text NOT NULL DEFAULT '',
    subject     text NOT NULL,
    body        text NOT NULL,
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

CREATE TABLE email_triggers (
    id           text PRIMARY KEY,
    action       text NOT NULL,
    template_key text NOT NULL REFERENCES email_templates(key) ON UPDATE CASCADE ON DELETE CASCADE,
    recipient    text NOT NULL DEFAULT 'actor' CHECK (recipient IN ('actor', 'role', 'members', 'custom')),
    role_id      text REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
    user_ids     jsonb NOT NULL DEFAULT '[]'::jsonb,
    custom_email text NOT NULL DEFAULT '',
    active       boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE UNIQUE INDEX email_triggers_action_template_idx ON email_triggers (action, template_key)
    WHERE deleted_at IS NULL;

CREATE TABLE email_messages (
    id           text PRIMARY KEY,
    to_email     text NOT NULL,
    to_name      text NOT NULL DEFAULT '',
    subject      text NOT NULL,
    body         text NOT NULL,
    template_key text REFERENCES email_templates(key) ON UPDATE CASCADE ON DELETE SET NULL,
    status       text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'canceled')),
    attempts     integer NOT NULL DEFAULT 0,
    error        text NOT NULL DEFAULT '',
    scheduled_at timestamptz NOT NULL DEFAULT now(),
    sent_at      timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX email_messages_due_idx ON email_messages (scheduled_at)
    WHERE status = 'queued' AND deleted_at IS NULL;
CREATE INDEX email_messages_status_idx ON email_messages (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX email_messages_created_idx ON email_messages (created_at DESC, id DESC) WHERE deleted_at IS NULL;

CREATE TABLE jobs (
    id         text PRIMARY KEY,
    kind       text NOT NULL,
    payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
    status     text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed', 'canceled')),
    run_at     timestamptz NOT NULL DEFAULT now(),
    attempts   integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    error      text NOT NULL DEFAULT '',
    unique_key text,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX jobs_due_idx ON jobs (run_at) WHERE status = 'queued' AND deleted_at IS NULL;
CREATE INDEX jobs_status_idx ON jobs (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX jobs_created_idx ON jobs (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX jobs_unique_key_idx ON jobs (unique_key)
    WHERE unique_key IS NOT NULL AND status IN ('queued', 'running') AND deleted_at IS NULL;

CREATE TABLE webhook_endpoints (
    id          text PRIMARY KEY,
    url         text NOT NULL,
    secret      text NOT NULL,
    description text NOT NULL DEFAULT '',
    events      jsonb NOT NULL DEFAULT '[]'::jsonb,
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE INDEX webhook_endpoints_active_idx ON webhook_endpoints (created_at DESC)
    WHERE active AND deleted_at IS NULL;

CREATE TABLE webhook_deliveries (
    id           text PRIMARY KEY,
    endpoint_id  text NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    action       text NOT NULL,
    payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
    status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    attempts     integer NOT NULL DEFAULT 0,
    response_status integer,
    error        text NOT NULL DEFAULT '',
    delivered_at timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX webhook_deliveries_endpoint_idx ON webhook_deliveries (endpoint_id, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX webhook_deliveries_status_idx ON webhook_deliveries (status, created_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX webhook_deliveries_created_idx ON webhook_deliveries (created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE login_tokens (
    id         text PRIMARY KEY,
    email      text NOT NULL,
    token_hash text NOT NULL,
    ip         text NOT NULL DEFAULT '',
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX login_tokens_hash_idx ON login_tokens (token_hash) WHERE deleted_at IS NULL;
CREATE INDEX login_tokens_email_idx ON login_tokens (lower(email), created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE api_keys (
    id           text PRIMARY KEY,
    owner_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         text NOT NULL DEFAULT '',
    prefix       text NOT NULL,
    token_hash   text NOT NULL,
    scopes       jsonb NOT NULL DEFAULT '[]'::jsonb,
    last_used_at timestamptz,
    expires_at   timestamptz,
    revoked_at   timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE UNIQUE INDEX api_keys_hash_idx ON api_keys (token_hash) WHERE deleted_at IS NULL;
CREATE INDEX api_keys_owner_idx ON api_keys (owner_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE rate_limits (
    bucket       text PRIMARY KEY,
    hits         integer NOT NULL DEFAULT 0,
    window_start timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX rate_limits_window_idx ON rate_limits (window_start) WHERE deleted_at IS NULL;

CREATE TABLE idempotency_keys (
    key         text PRIMARY KEY,
    user_id     text REFERENCES users(id) ON DELETE CASCADE,
    endpoint    text NOT NULL,
    fingerprint text NOT NULL DEFAULT '',
    status_code integer NOT NULL DEFAULT 0,
    response    jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE INDEX idempotency_keys_created_idx ON idempotency_keys (created_at) WHERE deleted_at IS NULL;

CREATE TABLE coupons (
    id             text PRIMARY KEY,
    code           text NOT NULL,
    percent_off    integer CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
    amount_off     integer CHECK (amount_off IS NULL OR amount_off > 0),
    currency       text NOT NULL DEFAULT 'USD',
    duration_months integer NOT NULL DEFAULT 1 CHECK (duration_months >= 0),
    max_redemptions integer,
    redeemed       integer NOT NULL DEFAULT 0,
    expires_at     timestamptz,
    active         boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);
CREATE UNIQUE INDEX coupons_code_idx ON coupons (lower(code)) WHERE deleted_at IS NULL;

CREATE TABLE coupon_redemptions (
    id         text PRIMARY KEY,
    coupon_id  text NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id text REFERENCES invoices(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX coupon_redemptions_unique_idx ON coupon_redemptions (coupon_id, user_id)
    WHERE deleted_at IS NULL;

CREATE TABLE usage_events (
    id          text PRIMARY KEY,
    user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource    text NOT NULL,
    quantity    integer NOT NULL DEFAULT 1,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE INDEX usage_events_user_idx ON usage_events (user_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX usage_events_resource_idx ON usage_events (resource, occurred_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE invoice_reminders (
    id         text PRIMARY KEY,
    invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stage      integer NOT NULL,
    sent_at    timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX invoice_reminders_unique_idx ON invoice_reminders (invoice_id, stage)
    WHERE deleted_at IS NULL;

CREATE TABLE asset_sources (
    id                 text PRIMARY KEY,
    name               text NOT NULL,
    type               text NOT NULL CHECK (type IN ('disk', 's3')),
    config             jsonb NOT NULL DEFAULT '{}'::jsonb,
    secret             text NOT NULL DEFAULT '',
    allowed_extensions jsonb NOT NULL DEFAULT '[]'::jsonb,
    allowed_mime_types jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);
CREATE UNIQUE INDEX asset_sources_name_idx ON asset_sources (lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE files (
    id            text PRIMARY KEY,
    asset_type    text NOT NULL,
    source_id     text NOT NULL REFERENCES asset_sources(id),
    location      text NOT NULL,
    owner_id      text REFERENCES users(id) ON DELETE SET NULL,
    original_name text NOT NULL DEFAULT '',
    mime          text NOT NULL DEFAULT '',
    size          bigint NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);
CREATE INDEX files_owner_idx ON files (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX files_type_idx ON files (asset_type) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX files_source_location_idx ON files (source_id, location) WHERE deleted_at IS NULL;

CREATE TABLE realm_regions (
    id         text PRIMARY KEY,
    name       text NOT NULL,
    active     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX realm_regions_name_idx ON realm_regions (lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX realm_regions_active_idx ON realm_regions (active) WHERE deleted_at IS NULL;

CREATE TABLE realms (
    id                 text PRIMARY KEY,
    name               text NOT NULL,
    base_url           text NOT NULL,
    region_id          text REFERENCES realm_regions(id) ON UPDATE CASCADE ON DELETE SET NULL,
    plan_id            text REFERENCES billing_plans(id) ON UPDATE CASCADE ON DELETE SET NULL,
    exclusive          boolean NOT NULL DEFAULT false,
    status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draining', 'offline')),
    token_hash         text NOT NULL,
    disk_free_bytes    bigint NOT NULL DEFAULT 0,
    queue_depth        integer NOT NULL DEFAULT 0,
    cpu_usage          integer NOT NULL DEFAULT 0 CHECK (cpu_usage BETWEEN 0 AND 100),
    memory_used_bytes  bigint NOT NULL DEFAULT 0,
    memory_total_bytes bigint NOT NULL DEFAULT 0,
    health             text NOT NULL DEFAULT 'unknown' CHECK (health IN ('unknown', 'healthy', 'degraded', 'unhealthy')),
    last_seen_at       timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);
CREATE UNIQUE INDEX realms_name_idx ON realms (lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX realms_assignable_idx ON realms (status) WHERE NOT exclusive AND deleted_at IS NULL;
CREATE INDEX realms_region_idx ON realms (region_id) WHERE deleted_at IS NULL;

CREATE TABLE realm_samples (
    id                 text PRIMARY KEY,
    realm_id           text NOT NULL REFERENCES realms(id) ON DELETE CASCADE,
    health             text NOT NULL DEFAULT 'unknown' CHECK (health IN ('unknown', 'healthy', 'degraded', 'unhealthy')),
    disk_free_bytes    bigint NOT NULL DEFAULT 0,
    queue_depth        integer NOT NULL DEFAULT 0,
    cpu_usage          integer NOT NULL DEFAULT 0 CHECK (cpu_usage BETWEEN 0 AND 100),
    memory_used_bytes  bigint NOT NULL DEFAULT 0,
    memory_total_bytes bigint NOT NULL DEFAULT 0,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz
);
CREATE INDEX realm_samples_realm_idx ON realm_samples (realm_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE projects (
    id                  text PRIMARY KEY,
    owner_id            text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    realm_id            text REFERENCES realms(id) ON DELETE RESTRICT,
    name                text NOT NULL,
    description         text NOT NULL DEFAULT '',
    app_type            text NOT NULL DEFAULT 'game' CHECK (app_type IN ('game', 'app', 'prototype')),
    genre               text NOT NULL DEFAULT '',
    icon                text NOT NULL DEFAULT 'Gamepad2',
    color               text NOT NULL DEFAULT '',
    default_category_id text NOT NULL DEFAULT '',
    archived_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);
CREATE INDEX projects_owner_idx ON projects (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX projects_realm_idx ON projects (realm_id) WHERE deleted_at IS NULL;

CREATE TABLE project_migrations (
    id            text PRIMARY KEY,
    project_id    text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    from_realm_id text REFERENCES realms(id) ON DELETE SET NULL,
    to_realm_id   text NOT NULL REFERENCES realms(id) ON DELETE RESTRICT,
    state         text NOT NULL DEFAULT 'exporting'
                  CHECK (state IN ('exporting', 'importing', 'repointing', 'purging', 'completed', 'failed')),
    actor_id      text REFERENCES users(id) ON DELETE SET NULL,
    error         text NOT NULL DEFAULT '',
    started_at    timestamptz NOT NULL DEFAULT now(),
    finished_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);
CREATE UNIQUE INDEX project_migrations_lock_idx ON project_migrations (project_id)
    WHERE state NOT IN ('completed', 'failed') AND deleted_at IS NULL;
CREATE INDEX project_migrations_project_idx ON project_migrations (project_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE project_members (
    id          text PRIMARY KEY,
    project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions text[] NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE UNIQUE INDEX project_members_unique_idx ON project_members (project_id, user_id)
    WHERE deleted_at IS NULL;
CREATE INDEX project_members_user_idx ON project_members (user_id) WHERE deleted_at IS NULL;

CREATE TABLE project_invites (
    id          text PRIMARY KEY,
    project_id  text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email       text NOT NULL DEFAULT '',
    user_id     text REFERENCES users(id) ON DELETE CASCADE,
    permissions text[] NOT NULL DEFAULT '{}',
    invited_by  text REFERENCES users(id) ON DELETE SET NULL,
    expires_at  timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE UNIQUE INDEX project_invites_pending_idx ON project_invites (project_id, lower(email))
    WHERE accepted_at IS NULL AND deleted_at IS NULL;
CREATE INDEX project_invites_user_idx ON project_invites (user_id) WHERE deleted_at IS NULL;

CREATE TABLE asset_categories (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    position   integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX asset_categories_name_idx ON asset_categories (project_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE TABLE project_tags (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX project_tags_name_idx ON project_tags (project_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE TABLE project_build_tags (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX project_build_tags_name_idx ON project_build_tags (project_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE TABLE assets (
    id              text PRIMARY KEY,
    project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by     text REFERENCES users(id) ON DELETE SET NULL,
    parent_asset_id text REFERENCES assets(id) ON DELETE CASCADE,
    kind            text NOT NULL DEFAULT 'texture'
                    CHECK (kind IN ('texture', 'audio', 'video', 'data', 'plain', 'font', 'normal-map', 'physics',
                                    'bitmap-font', 'bitmap-font-page')),
    category_id     text REFERENCES asset_categories(id) ON DELETE SET NULL,
    name            text NOT NULL,
    extension       text NOT NULL DEFAULT '',
    mime            text NOT NULL DEFAULT '',
    size_bytes      bigint NOT NULL DEFAULT 0,
    tags            text[] NOT NULL DEFAULT '{}',
    upload_status   text NOT NULL DEFAULT 'pending_upload'
                    CHECK (upload_status IN ('pending_upload', 'processing', 'ready', 'failed')),
    upload_uuid     text NOT NULL,
    storage_path    text NOT NULL DEFAULT '',
    checksum        text NOT NULL DEFAULT '',
    finalized_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX assets_project_idx ON assets (project_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX assets_tags_idx ON assets USING gin (tags) WHERE deleted_at IS NULL;
CREATE INDEX assets_pending_idx ON assets (created_at)
    WHERE upload_status = 'pending_upload' AND deleted_at IS NULL;
CREATE UNIQUE INDEX assets_upload_uuid_idx ON assets (upload_uuid) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX assets_normal_map_idx ON assets (parent_asset_id)
    WHERE kind = 'normal-map' AND deleted_at IS NULL;

CREATE TABLE bundles (
    id               text PRIMARY KEY,
    project_id       text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name             text NOT NULL,
    engine           text NOT NULL DEFAULT 'phaser' CHECK (engine IN ('phaser', 'pixi', 'custom')),
    category_id      text REFERENCES asset_categories(id) ON DELETE SET NULL,
    included_tags    text[] NOT NULL DEFAULT '{}',
    excluded_tags    text[] NOT NULL DEFAULT '{}',
    build_tag        text NOT NULL DEFAULT '',
    algorithm        text NOT NULL DEFAULT 'max-rects'
                     CHECK (algorithm IN ('basic', 'max-rects', 'shelf', 'guillotine')),
    downscale        integer NOT NULL DEFAULT 100 CHECK (downscale BETWEEN 1 AND 100),
    rotation_enabled boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);
CREATE UNIQUE INDEX bundles_name_idx ON bundles (project_id, lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX bundles_project_idx ON bundles (project_id) WHERE deleted_at IS NULL;

CREATE TABLE builds (
    id           text PRIMARY KEY,
    project_id   text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    bundle_id    text NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    realm_id     text REFERENCES realms(id) ON DELETE SET NULL,
    triggered_by text REFERENCES users(id) ON DELETE SET NULL,
    status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'done', 'failed')),
    build_tag    text NOT NULL DEFAULT '',
    snapshot     jsonb NOT NULL DEFAULT '{}'::jsonb,
    artifact_url text NOT NULL DEFAULT '',
    manifest_url text NOT NULL DEFAULT '',
    checksum     text NOT NULL DEFAULT '',
    size_bytes   bigint NOT NULL DEFAULT 0,
    duration_ms  integer NOT NULL DEFAULT 0,
    error        text NOT NULL DEFAULT '',
    claimed_at   timestamptz,
    finished_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);
CREATE INDEX builds_bundle_idx ON builds (bundle_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX builds_claimable_idx ON builds (realm_id, created_at)
    WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX builds_keyset_idx ON builds (project_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX builds_tag_unique_idx ON builds (bundle_id, build_tag)
    WHERE build_tag <> '' AND deleted_at IS NULL;

CREATE TABLE build_files (
    id         text PRIMARY KEY,
    build_id   text NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    group_name text NOT NULL DEFAULT 'textures'
               CHECK (group_name IN ('textures', 'audio', 'text', 'configs', 'fonts', 'locales', 'dialogues')),
    name       text NOT NULL,
    url        text NOT NULL DEFAULT '',
    size_bytes bigint NOT NULL DEFAULT 0,
    checksum   text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX build_files_build_idx ON build_files (build_id, group_name) WHERE deleted_at IS NULL;

CREATE TABLE config_schemas (
    id              text PRIMARY KEY,
    project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            text NOT NULL,
    definition      jsonb NOT NULL DEFAULT '[]'::jsonb,
    update_iterator integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE UNIQUE INDEX config_schemas_name_idx ON config_schemas (project_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE TABLE configs (
    id                     text PRIMARY KEY,
    project_id             text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schema_id              text NOT NULL REFERENCES config_schemas(id) ON DELETE RESTRICT,
    key                    text NOT NULL,
    description            text NOT NULL DEFAULT '',
    schema_update_iterator integer NOT NULL DEFAULT 0,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    deleted_at             timestamptz
);
CREATE UNIQUE INDEX configs_key_idx ON configs (project_id, lower(key)) WHERE deleted_at IS NULL;

CREATE TABLE config_versions (
    id         text PRIMARY KEY,
    config_id  text NOT NULL REFERENCES configs(id) ON DELETE CASCADE,
    build_tag  text NOT NULL DEFAULT '',
    is_default boolean NOT NULL DEFAULT false,
    values     jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX config_versions_default_idx ON config_versions (config_id)
    WHERE is_default AND deleted_at IS NULL;
CREATE UNIQUE INDEX config_versions_tag_idx ON config_versions (config_id, build_tag)
    WHERE build_tag <> '' AND deleted_at IS NULL;

CREATE TABLE project_translations (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    doc        jsonb NOT NULL DEFAULT '{"languages": [], "groups": []}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX project_translations_project_idx ON project_translations (project_id)
    WHERE deleted_at IS NULL;

CREATE TABLE tickets (
    id              text PRIMARY KEY,
    owner_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id     text REFERENCES users(id) ON DELETE SET NULL,
    subject         text NOT NULL,
    status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
    last_message_at timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);
CREATE INDEX tickets_owner_idx ON tickets (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX tickets_assignee_idx ON tickets (assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX tickets_status_idx ON tickets (status, last_message_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX tickets_recent_idx ON tickets (last_message_at DESC, id) WHERE deleted_at IS NULL;

CREATE TABLE ticket_messages (
    id         text PRIMARY KEY,
    ticket_id  text NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id  text REFERENCES users(id) ON DELETE SET NULL,
    body       text NOT NULL,
    internal   boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX ticket_messages_ticket_idx ON ticket_messages (ticket_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE waitlist_signups (
    id               text PRIMARY KEY,
    email            text NOT NULL,
    marketing_opt_in boolean NOT NULL DEFAULT false,
    consent_version  text NOT NULL DEFAULT '',
    source           text NOT NULL DEFAULT 'landing',
    granted_bytes    bigint NOT NULL DEFAULT 262144000,
    claimed_by       text REFERENCES users(id) ON DELETE SET NULL,
    claimed_at       timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);
CREATE UNIQUE INDEX waitlist_signups_email_idx ON waitlist_signups (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX waitlist_signups_created_idx ON waitlist_signups (created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE waitlist_signups;
DROP TABLE ticket_messages;
DROP TABLE tickets;
DROP TABLE project_translations;
DROP TABLE config_versions;
DROP TABLE configs;
DROP TABLE config_schemas;
DROP TABLE build_files;
DROP TABLE builds;
DROP TABLE bundles;
DROP TABLE assets;
DROP TABLE project_build_tags;
DROP TABLE project_tags;
DROP TABLE asset_categories;
DROP TABLE project_invites;
DROP TABLE project_members;
DROP TABLE project_migrations;
DROP TABLE projects;
DROP TABLE realm_samples;
DROP TABLE realms;
DROP TABLE realm_regions;
DROP TABLE files;
DROP TABLE asset_sources;
DROP TABLE invoice_reminders;
DROP TABLE usage_events;
DROP TABLE coupon_redemptions;
DROP TABLE coupons;
DROP TABLE idempotency_keys;
DROP TABLE rate_limits;
DROP TABLE api_keys;
DROP TABLE login_tokens;
DROP TABLE webhook_deliveries;
DROP TABLE webhook_endpoints;
DROP TABLE jobs;
DROP TABLE email_messages;
DROP TABLE email_triggers;
DROP TABLE email_templates;
DROP TABLE sales_enquiry_events;
DROP TABLE sales_enquiries;
DROP TABLE billing_event;
DROP TABLE invoices;
DROP TABLE subscriptions;
DROP TABLE billing_plans;
DROP TABLE settings;
DROP TABLE push_subscriptions;
DROP TABLE notifications;
DROP TABLE audit_log;
DROP TABLE reports;
DROP TABLE user_limit_overrides;
DROP TABLE role_limits;
DROP TABLE user_permissions;
DROP TABLE sessions;
DROP TABLE user_identities;
DROP TABLE users;
DROP TABLE role_permissions;
DROP TABLE roles;
