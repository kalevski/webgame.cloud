export const PERMISSIONS = [

    'project.create',

    'realm.read',              'realm.write',
    'admin.project.read',      'admin.project.move',
    'waitlist.read',

    'ticket.create',           // open a support / bug ticket
    'ticket.queue.read',       // see and answer every open ticket as a moderator
    'ticket.queue.write',      // change a ticket's state or assign it

    'moderation.queue.read',   'moderation.report.resolve', 'audit.read',

    'admin.overview.read',     'admin.user.read',           'admin.user.role.write',
    'admin.user.impersonate',  'admin.role.read',           'admin.role.write',
    'admin.settings.read',     'admin.settings.write',      'admin.feature.write',
    'admin.service.read',      'admin.service.write',

    'role.application.read',   // see the queue of accounts asking for a role
    'role.application.write',  // approve or reject a role application

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

export type UserRole = string
