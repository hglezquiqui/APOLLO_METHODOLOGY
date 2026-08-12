import { Contract } from "../types/contract";

export interface ContractRepository {
  listContracts(): Promise<Contract[]>;
  recordReminder(
    contractId: string,
    daysBefore: number,
    expiresAtIso: string,
    notifiedAtIso: string
  ): Promise<void>;
}

export class InMemoryContractRepository implements ContractRepository {
  private readonly contracts: Contract[] = [
    {
      id: "ct-001",
      title: "Cloud Hosting Agreement",
      owner: {
        id: "owner-001",
        name: "Ava Johnson",
        email: "ava.johnson@example.com",
      },
      expiresAt: new Date("2026-09-11T09:00:00.000Z"),
      reminderHistory: [],
    },
    {
      id: "ct-002",
      title: "Payroll Platform Subscription",
      owner: {
        id: "owner-002",
        name: "Miguel Santos",
        email: "miguel.santos@example.com",
      },
      expiresAt: new Date("2026-08-20T12:00:00.000Z"),
      reminderHistory: [],
    },
    {
      id: "ct-003",
      title: "Insurance Coverage Contract",
      owner: {
        id: "owner-003",
        name: "Priya Singh",
        email: "priya.singh@example.com",
      },
      expiresAt: new Date("2026-08-13T16:00:00.000Z"),
      reminderHistory: [],
    },
  ];

  async listContracts(): Promise<Contract[]> {
    return this.contracts;
  }

  async recordReminder(
    contractId: string,
    daysBefore: number,
    expiresAtIso: string,
    notifiedAtIso: string
  ): Promise<void> {
    const contract = this.contracts.find((item) => item.id === contractId);

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    contract.reminderHistory.push({
      daysBefore,
      expiresAtIso,
      notifiedAtIso,
    });
  }
}
