-- +goose Up

INSERT INTO roles (id, name, builtin, position) VALUES ('owner', 'Owner', true, 100);

INSERT INTO roles (id, name, position) VALUES ('indie', 'Indie', 10);
INSERT INTO roles (id, name, position) VALUES ('indie_plus', 'Indie Plus', 20);
INSERT INTO roles (id, name, position) VALUES ('studio', 'Studio', 30);

INSERT INTO roles (id, name, position) VALUES ('maintainer', 'Maintainer', 40);

INSERT INTO role_permissions (role_id, permission) VALUES ('indie', 'project.create');
INSERT INTO role_permissions (role_id, permission) VALUES ('indie', 'file.upload');
INSERT INTO role_permissions (role_id, permission) VALUES ('indie', 'ticket.create');

INSERT INTO role_permissions (role_id, permission) VALUES ('indie_plus', 'project.create');
INSERT INTO role_permissions (role_id, permission) VALUES ('indie_plus', 'file.upload');
INSERT INTO role_permissions (role_id, permission) VALUES ('indie_plus', 'ticket.create');

INSERT INTO role_permissions (role_id, permission) VALUES ('studio', 'project.create');
INSERT INTO role_permissions (role_id, permission) VALUES ('studio', 'file.upload');
INSERT INTO role_permissions (role_id, permission) VALUES ('studio', 'ticket.create');

INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'project.create');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'role.application.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'role.application.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'moderation.queue.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'moderation.report.resolve');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'audit.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.overview.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.user.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.role.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.service.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.settings.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'billing.plan.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'billing.subscription.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'invoice.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'enquiry.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'email.outbox.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'signing.key.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'ticket.create');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'ticket.queue.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'ticket.queue.write');

INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'projects', 1);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'storage_mb', 100);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'bundles_per_project', 1);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'configs_per_project', 2);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'members_per_project', 1);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie', 'tickets', 3);

INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'projects', 3);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'storage_mb', 1024);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'bundles_per_project', 3);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'configs_per_project', 10);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'members_per_project', 3);
INSERT INTO role_limits (role, resource, max_count) VALUES ('indie_plus', 'tickets', 10);

INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'projects', NULL);
INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'storage_mb', 10240);
INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'bundles_per_project', NULL);
INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'configs_per_project', NULL);
INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'members_per_project', NULL);
INSERT INTO role_limits (role, resource, max_count) VALUES ('studio', 'tickets', NULL);

INSERT INTO billing_plans (id, name, description, role_id, mode, price_cents, position, features)
    VALUES ('indie', 'Indie', 'One project, 100 MB of assets, everything else included.', 'indie', 'manual', 0, 10,
    '["1 project", "100 MB storage", "1 bundle per project", "Community support"]'::jsonb);

INSERT INTO billing_plans (id, name, description, role_id, mode, price_cents, position, features)
    VALUES ('indie_plus', 'Indie Plus', 'Three projects, a gigabyte of assets, small teams.', 'indie_plus', 'manual', 699, 20,
    '["3 projects", "1 GB storage", "3 bundles per project", "3 members per project"]'::jsonb);

INSERT INTO billing_plans (id, name, description, role_id, mode, price_cents, position, features, storage_overage_allowed)
    VALUES ('studio', 'Studio', 'Unlimited projects and teams, 10 GB of assets.', 'studio', 'manual', 4999, 30,
    '["Unlimited projects", "10 GB storage", "Unlimited bundles", "Unlimited members", "Storage overage allowed"]'::jsonb, true);

INSERT INTO email_templates (key, name, subject, body)
    VALUES ('project-invitation', 'Project invitation',
    '{{inviterName}} invited you to {{projectName}}',
    'Hi,

{{inviterName}} invited you to work on {{projectName}} on {{workspaceName}}.

Open {{inviteUrl}} to accept. The invitation expires in 7 days.');

INSERT INTO settings (key, value) VALUES ('role_slot_default', 'indie');

INSERT INTO settings (key, value) VALUES ('signups_open', 'true');

INSERT INTO settings (key, value) VALUES ('feature_billing', 'true');
INSERT INTO settings (key, value) VALUES ('feature_email', 'true');
INSERT INTO settings (key, value) VALUES ('feature_tickets', 'true');

INSERT INTO settings (key, value) VALUES ('email_provider', 'log');
INSERT INTO settings (key, value) VALUES ('email_from_name', 'WebGame Cloud');
INSERT INTO settings (key, value) VALUES ('email_from_email', 'no-reply@example.com');

INSERT INTO settings (key, value) VALUES ('sales_contact', '');
INSERT INTO settings (key, value) VALUES ('billing_provider', 'manual');

INSERT INTO settings (key, value) VALUES ('build_timeout_minutes', '30');

-- +goose Down
DELETE FROM email_messages;
DELETE FROM email_triggers;
DELETE FROM email_templates;
DELETE FROM sales_enquiry_events;
DELETE FROM sales_enquiries;
DELETE FROM invoices;
DELETE FROM subscriptions;
DELETE FROM billing_plans;
DELETE FROM role_limits;
DELETE FROM settings;
DELETE FROM role_applications;
DELETE FROM role_permissions;
DELETE FROM users;
DELETE FROM roles;
