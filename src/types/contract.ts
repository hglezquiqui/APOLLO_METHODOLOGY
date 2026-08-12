export type ContractOwner = {
  id: string;
  name: string;
  email: string;
};

export type ContractReminderHistory = {
  daysBefore: number;
  expiresAtIso: string;
  notifiedAtIso: string;
};

export type Contract = {
  id: string;
  title: string;
  owner: ContractOwner;
  expiresAt: Date;
  reminderHistory: ContractReminderHistory[];
};
