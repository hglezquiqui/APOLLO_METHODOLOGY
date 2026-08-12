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
  private events: ReminderEvent[] = [];

  constructor(private contracts: Contract[]) {}

  async listContracts(): Promise<Contract[]> {
    return this.contracts;
  }

  async hasReminderEvent(contractTermId: string, leadTimeDays: number): Promise<boolean> {
    return this.events.some(
      (event) =>
        event.contractTermId === contractTermId && event.leadTimeDays === leadTimeDays
    );
  }

  async recordReminderEvent(event: ReminderEvent): Promise<void> {
    this.events.push(event);
  }

  async listReminderEvents(): Promise<ReminderEvent[]> {
    return this.events;
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

test("US3: prevents duplicate sends across repeated runs", async () => {
  const contract: Contract = {
    id: "dup-1",
    termId: "dup-1-2026",
    title: "Duplicate Guard Contract",
    cadence: "annual",
    owner: { id: "o1", name: "Owner", email: "owner@example.com" },
    expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
    renewalStatus: "active",
    renewalEffectiveAtUtc: null,
  };

  const repository = new InMemoryRepo([contract]);
  const email = new CaptureEmailService();
  const service = new ContractExpiryReminderService(repository, email);

  const first = await service.run(new Date("2026-08-12T09:00:00.000Z"));
  const second = await service.run(new Date("2026-08-12T09:00:00.000Z"));

  assert.equal(first.notifiedCount, 1);
  assert.equal(second.notifiedCount, 0);
  assert.equal(second.skippedDuplicateCount, 1);
  assert.equal(email.payloads.length, 1);
});
