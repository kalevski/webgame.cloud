export const PERMISSIONS = [

    'project.write',           // create / edit / delete own projects
    'project.share',           // publish a project so other members can see it
    'project.export',          // download a project's data (sold by the paid role)
    'task.write',              // create / edit / delete tasks inside a project

    'moderation.queue.read',   'moderation.report.resolve', 'audit.read',

    'admin.overview.read',     'admin.user.read',           'admin.user.role.write',
    'admin.user.impersonate',  'admin.role.read',           'admin.role.write',
    'admin.settings.read',     'admin.settings.write',      'admin.feature.write',

    'billing.plan.read',       'billing.plan.write',
    'billing.subscription.read', 'billing.subscription.write',
    'invoice.read',            'invoice.write',
    'enquiry.read',            'enquiry.write',

    'email.outbox.read',       'email.send',                'email.template.write',
    'email.trigger.write',     'email.config.write',

    'job.read',                'job.write',
    'webhook.read',            'webhook.write',

    'file.upload',
    'file.source.read',        'file.source.write',

    'signing.key.read',        'signing.key.rotate',
] as const

export type Permission = typeof PERMISSIONS[number]

export const ACCOUNT_SHAPED: readonly Permission[] = []

export type UserRole = string
