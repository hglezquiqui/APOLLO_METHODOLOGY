import test from "node:test";
import assert from "node:assert/strict";
import { ContractExpiryReminderService } from "../../src/services/contractExpiryReminderService";
import { ContractRepository } from "../../src/data/inMemoryContractRepository";
import { Contract, ReminderEvent } from "../../src/types/contract";
import {
  ContractExpiryNotificationPayload,
  EmailService,
} from "../../src/services/notificationService";

class InMemoryRepo implements ContractRepository {
  constructor(private contracts: Contract[]) {}

  async listContracts(): Promise<Contract[]> {
    return this.contracts;
  }

  async hasReminderEvent(_contractTermId: string, _leadTimeDays: number): Promise<boolean> {
    return false;
  }

  async recordReminderEvent(_event: ReminderEvent): Promise<void> {}

  async listReminderEvents(): Promise<ReminderEvent[]> {
    return [];
  }
}

class CaptureEmailService implements EmailService {
  readonly payloads: ContractExpiryNotificationPayload[] = [];

  async sendContractExpiryEmail(
    payload: ContractExpiryNotificationPayload
  ): Promise<void> {
    this.payloads.push(payload);
  }
}

test("US2: skips send when renewal is effective at run time", async () => {
  const contract: Contract = {
    id: "renewed-1",
    termId: "renewed-1-2026",
    title: "Renewed Contract",
    cadence: "annual",
    owner: { id: "o1", name: "Owner", email: "owner@example.com" },
    expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
    renewalStatus: "renewed",
    renewalEffectiveAtUtc: new Date("2026-08-10T00:00:00.000Z"),
  };

  const service = new ContractExpiryReminderService(
    new InMemoryRepo([contract]),
    new CaptureEmailService()
  );

  const result = await service.run(new Date("2026-08-12T09:00:00.000Z"));

  assert.equal(result.notifiedCount, 0);
  assert.equal(result.skippedRenewedCount, 1);
});

