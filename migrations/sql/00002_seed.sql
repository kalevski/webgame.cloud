-- +goose Up

INSERT INTO roles (id, name, builtin, position) VALUES ('owner', 'Owner', true, 100);

INSERT INTO roles (id, name, position) VALUES ('member', 'Member', 10);
INSERT INTO roles (id, name, position) VALUES ('member_plus', 'Member Plus', 20);

INSERT INTO roles (id, name, position) VALUES ('maintainer', 'Maintainer', 30);

INSERT INTO role_permissions (role_id, permission) VALUES ('member', 'project.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('member', 'task.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('member', 'project.share');
INSERT INTO role_permissions (role_id, permission) VALUES ('member', 'file.upload');

INSERT INTO role_permissions (role_id, permission) VALUES ('member_plus', 'project.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('member_plus', 'task.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('member_plus', 'project.share');

INSERT INTO role_permissions (role_id, permission) VALUES ('member_plus', 'project.export');
INSERT INTO role_permissions (role_id, permission) VALUES ('member_plus', 'file.upload');

INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'project.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'task.write');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'project.share');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'moderation.queue.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'moderation.report.resolve');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'audit.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.overview.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.user.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.role.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'admin.settings.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'billing.plan.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'billing.subscription.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'invoice.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'enquiry.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'email.outbox.read');
INSERT INTO role_permissions (role_id, permission) VALUES ('maintainer', 'signing.key.read');

INSERT INTO settings (key, value) VALUES ('role_slot_default', 'member');

INSERT INTO settings (key, value) VALUES ('signups_open', 'true');

INSERT INTO settings (key, value) VALUES ('feature_billing', 'false');
INSERT INTO settings (key, value) VALUES ('feature_email', 'false');

INSERT INTO settings (key, value) VALUES ('email_provider', 'log');
INSERT INTO settings (key, value) VALUES ('email_from_name', 'AppKit');
INSERT INTO settings (key, value) VALUES ('email_from_email', 'no-reply@example.com');

INSERT INTO settings (key, value) VALUES ('sales_contact', '');

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
DELETE FROM role_permissions;
DELETE FROM users;
DELETE FROM roles;
