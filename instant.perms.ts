import type { InstantRules } from '@instantdb/react';

const rules = {
  households: {
    allow: {
      view: "auth.id in data.ref('users.id')",
      create: "true",
      update: "auth.id in data.ref('users.id')",
      delete: "false",
    },
  },
  users: {
    allow: {
      view: "auth.id == data.id || data.householdId == auth.householdId",
      create: "true",
      update: "auth.id == data.id",
      delete: "false",
    },
  },
  accounts: {
    allow: {
      view: "data.householdId == auth.householdId",
      create: "auth.householdId != null",
      update: "data.householdId == auth.householdId",
      delete: "data.householdId == auth.householdId",
    },
  },
  investments: {
    allow: {
      view: "data.householdId == auth.householdId",
      create: "auth.householdId != null",
      update: "data.householdId == auth.householdId",
      delete: "data.householdId == auth.householdId",
    },
  },
  holdings: {
    allow: {
      view: "true", // Holdings are filtered through investment relationships
      create: "auth.householdId != null",
      update: "auth.householdId != null",
      delete: "auth.householdId != null",
    },
  },
  mortgage: {
    allow: {
      view: "data.householdId == auth.householdId",
      create: "auth.householdId != null",
      update: "data.householdId == auth.householdId",
      delete: "data.householdId == auth.householdId",
    },
  },
  extraPayments: {
    allow: {
      view: "true", // Extra payments filtered through mortgage relationships
      create: "auth.householdId != null",
      update: "auth.householdId != null",
      delete: "auth.householdId != null",
    },
  },
  snapshots: {
    allow: {
      view: "data.householdId == auth.householdId",
      create: "auth.householdId != null",
      update: "false", // Snapshots are immutable
      delete: "false", // Snapshots should not be deleted
    },
  },
} satisfies InstantRules;

export default rules;
