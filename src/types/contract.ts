export type ContractOwner = {
  id: string;
  name: string;
  email: string;
};

export type ContractCadence = "annual" | "monthly";

export type ContractRenewalStatus = "active" | "renewed" | "unknown";

export type ReminderDispatchStatus =
  | "sent"
  | "skipped_renewed"
  | "skipped_duplicate"
  | "skipped_ineligible";

export type ReminderEvent = {
  reminderEventId: string;
  contractId: string;
  contractTermId: string;
  leadTimeDays: number;
  thresholdAtUtc: string;
  notifiedAtUtc: string;
  dispatchStatus: ReminderDispatchStatus;
  catchUp: boolean;
};

export type Contract = {
  id: string;
  termId: string;
  title: string;
  cadence: ContractCadence;
  owner: ContractOwner;
  expiresAtUtc: Date;
  renewalStatus: ContractRenewalStatus;
  renewalEffectiveAtUtc: Date | null;
};

export type ReminderRunSummary = {
  processedContracts: number;
  notifiedCount: number;
  skippedRenewedCount: number;
  skippedDuplicateCount: number;
  skippedIneligibleCount: number;
  catchUpSentCount: number;
};
