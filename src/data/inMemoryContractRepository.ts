import { Contract, ReminderEvent } from "../types/contract";

export interface ContractRepository {
  listContracts(): Promise<Contract[]>;
  hasReminderEvent(contractTermId: string, leadTimeDays: number): Promise<boolean>;
  recordReminderEvent(event: ReminderEvent): Promise<void>;
  listReminderEvents(): Promise<ReminderEvent[]>;
}

export class InMemoryContractRepository implements ContractRepository {
  private readonly contracts: Contract[] = [
    {
      id: "ct-001",
      termId: "ct-001-2026",
      title: "Cloud Hosting Agreement",
      cadence: "annual",
      owner: {
        id: "owner-001",
        name: "Ava Johnson",
        email: "ava.johnson@example.com",
      },
      expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
      renewalStatus: "active",
      renewalEffectiveAtUtc: null,
    },
    {
      id: "ct-002",
      termId: "ct-002-2026-08",
      title: "Payroll Platform Subscription",
      cadence: "monthly",
      owner: {
        id: "owner-002",
        name: "Miguel Santos",
        email: "miguel.santos@example.com",
      },
      expiresAtUtc: new Date("2026-08-20T12:00:00.000Z"),
      renewalStatus: "active",
      renewalEffectiveAtUtc: null,
    },
    {
      id: "ct-003",
      termId: "ct-003-2026-08",
      title: "Insurance Coverage Contract",
      cadence: "monthly",
      owner: {
        id: "owner-003",
        name: "Priya Singh",
        email: "priya.singh@example.com",
      },
      expiresAtUtc: new Date("2026-08-13T16:00:00.000Z"),
      renewalStatus: "renewed",
      renewalEffectiveAtUtc: new Date("2026-08-12T00:00:00.000Z"),
    },
    {
      id: "ct-004",
      termId: "ct-004-2026-08",
      title: "Device Leasing Agreement",
      cadence: "monthly",
      owner: {
        id: "owner-004",
        name: "Helena Cruz",
        email: "helena.cruz@example.com",
      },
      expiresAtUtc: new Date("2026-08-20T16:00:00.000Z"),
      renewalStatus: "renewed",
      renewalEffectiveAtUtc: new Date("2026-08-25T00:00:00.000Z"),
    },
  ];

  private readonly reminderEventMap = new Map<string, ReminderEvent>();

  private buildReminderKey(contractTermId: string, leadTimeDays: number): string {
    return `${contractTermId}:${leadTimeDays}`;
  }

  async listContracts(): Promise<Contract[]> {
    return this.contracts;
  }

  async hasReminderEvent(
    contractTermId: string,
    leadTimeDays: number
  ): Promise<boolean> {
    return this.reminderEventMap.has(this.buildReminderKey(contractTermId, leadTimeDays));
  }

  async recordReminderEvent(event: ReminderEvent): Promise<void> {
    const key = this.buildReminderKey(event.contractTermId, event.leadTimeDays);
    this.reminderEventMap.set(key, event);
  }

  async listReminderEvents(): Promise<ReminderEvent[]> {
    return [...this.reminderEventMap.values()];
  }
}
