import type { InstantRules } from '@instantdb/react';

const rules = {
  households: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  users: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  accounts: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  investments: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  holdings: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  mortgage: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  extraPayments: {
    allow: {
      view: "true",
      create: "true",
      update: "true",
      delete: "true",
    },
  },
  payments: {
    allow: {
      view: "true",
      create: "true",
      delete: "true",
    },
  },
  snapshots: {
    allow: {
      view: "true",
      create: "true",
      update: "true", // Allow updates to same-day snapshots when balances change
      delete: "true",
    },
  },
} satisfies InstantRules;

export default rules;
