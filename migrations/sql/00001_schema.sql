-- +goose Up

CREATE TABLE roles (
    id         text PRIMARY KEY,
    name       text NOT NULL,

    builtin    boolean NOT NULL DEFAULT false,
    position   integer NOT NULL DEFAULT 0,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

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
    public_id    text NOT NULL,
    user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_agent   text NOT NULL DEFAULT '',
    ip           text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL
);
CREATE UNIQUE INDEX sessions_public_id_idx ON sessions (public_id) WHERE deleted_at IS NULL;
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
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX audit_log_actor_idx ON audit_log (actor_id) WHERE deleted_at IS NULL;

CREATE TABLE notifications (
    id         text PRIMARY KEY,
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       text NOT NULL CHECK (kind IN ('welcome', 'project_shared', 'task_activity', 'system')),
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

CREATE TABLE projects (
    id                   text PRIMARY KEY,
    owner_id             text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 text NOT NULL,
    description          text NOT NULL DEFAULT '',
    visibility           text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
    icon                 text NOT NULL DEFAULT 'FolderKanban',
    color                text NOT NULL DEFAULT '',
    priority             integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    due_date             date,
    notify_on_activity   boolean NOT NULL DEFAULT true,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    deleted_at           timestamptz
);
CREATE INDEX projects_owner_idx ON projects (owner_id) WHERE deleted_at IS NULL;

CREATE INDEX projects_shared_idx ON projects (updated_at DESC)
    WHERE visibility = 'shared' AND deleted_at IS NULL;

CREATE TABLE tasks (
    id         text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      text NOT NULL,
    status     text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'shipped')),
    position   integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX tasks_project_idx ON tasks (project_id, position) WHERE deleted_at IS NULL;
CREATE INDEX tasks_owner_idx ON tasks (owner_id) WHERE deleted_at IS NULL;

CREATE TABLE billing_plans (
    id           text PRIMARY KEY,
    name         text NOT NULL,
    description  text NOT NULL DEFAULT '',
    role_id      text REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
    mode         text NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'managed')),
    price_cents  integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    currency     text NOT NULL DEFAULT 'USD',
    interval     text NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
    position     integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true,
    features     jsonb NOT NULL DEFAULT '[]'::jsonb,
    sales_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
    trial_days   integer NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
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
    cancel_at_period_end     boolean NOT NULL DEFAULT false,
    current_period_end       timestamptz,
    started_at               timestamptz,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz
);
CREATE INDEX subscriptions_due_idx ON subscriptions (current_period_end)
    WHERE status IN ('trialing', 'active') AND deleted_at IS NULL;

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
    status_code integer NOT NULL DEFAULT 0,
    response    jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);
CREATE INDEX idempotency_keys_created_idx ON idempotency_keys (created_at) WHERE deleted_at IS NULL;

CREATE TABLE notification_preferences (
    user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event      text NOT NULL,
    channel    text NOT NULL CHECK (channel IN ('inapp', 'email', 'push')),
    enabled    boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (user_id, event, channel)
);

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

CREATE TABLE file_sources (
    id         text PRIMARY KEY,
    name       text NOT NULL,
    type       text NOT NULL CHECK (type IN ('disk', 's3')),
    config     jsonb NOT NULL DEFAULT '{}'::jsonb,
    secret     text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX file_sources_name_idx ON file_sources (lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE files (
    id            text PRIMARY KEY,
    file_type     text NOT NULL,
    source_id     text NOT NULL REFERENCES file_sources(id),
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
CREATE INDEX files_type_idx ON files (file_type) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX files_source_location_idx ON files (source_id, location) WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE files;
DROP TABLE file_sources;
DROP TABLE invoice_reminders;
DROP TABLE usage_events;
DROP TABLE coupon_redemptions;
DROP TABLE coupons;
DROP TABLE notification_preferences;
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
DROP TABLE invoices;
DROP TABLE subscriptions;
DROP TABLE billing_plans;
DROP TABLE tasks;
DROP TABLE projects;
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
