export type AbillioEndpoint = {
  group: string;
  endpoints: { path: string; label: string }[];
};

export const abillioEndpoints: AbillioEndpoint[] = [
  {
    group: 'API Usage Strategies',
    endpoints: [
      { path: 'usage/client', label: 'Client-side' },
      { path: 'usage/server-proxy', label: 'Server proxy' },
      { path: 'usage/server-direct', label: 'Server direct' },
      { path: 'usage/error-handling', label: 'Error Handling' },
    ],
  },
  {
    group: 'Account',
    endpoints: [{ path: 'account/settings', label: 'Account Settings' }],
  },
  {
    group: 'Freelancers',
    endpoints: [
      { path: 'freelancers', label: 'List Freelancers' },
      { path: 'freelancers/:id', label: 'Get Freelancer' },
      { path: 'freelancers/create', label: 'Create Freelancer' },
    ],
  },
  {
    group: 'Invites',
    endpoints: [
      { path: 'invites', label: 'List Invites' },
      { path: 'invites/:id', label: 'Get Freelancer Invite' },
      { path: 'invites/create', label: 'Create Freelancer Invite' },
    ],
  },
  {
    group: 'Services',
    endpoints: [
      { path: 'services', label: 'List Services' },
      { path: 'services/:id', label: 'Get Service' },
    ],
  },
  {
    group: 'Invoices',
    endpoints: [
      { path: 'invoices', label: 'List Invoices' },
      { path: 'invoices/:id', label: 'Get Invoice' },
      { path: 'invoices/create', label: 'Create Invoice' },
    ],
  },
  {
    group: 'Countries',
    endpoints: [{ path: 'countries', label: 'List Countries' }],
  },
  {
    group: 'Currencies',
    endpoints: [
      { path: 'currencies', label: 'List Currencies' },
      { path: 'currencies/:id', label: 'Get Currency' },
    ],
  },
  {
    group: 'Errors',
    endpoints: [
      { path: 'errors/payload', label: 'Error Payload' },
      { path: 'errors/http-codes', label: 'HTTP Error Codes' },
    ],
  },
  {
    group: 'Callbacks',
    endpoints: [
      { path: 'callbacks/verifying', label: 'Verifying Callbacks' },
      { path: 'callbacks/response', label: 'Callbacks Response' },
    ],
  },
];
