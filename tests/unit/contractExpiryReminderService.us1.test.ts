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
  constructor(
    private contracts: Contract[],
    private events: ReminderEvent[] = []
  ) {}

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

function baseContract(overrides: Partial<Contract>): Contract {
  return {
    id: "ct",
    termId: "ct-term",
    title: "Contract",
    cadence: "annual",
    owner: { id: "o1", name: "Owner", email: "owner@example.com" },
    expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
    renewalStatus: "active",
    renewalEffectiveAtUtc: null,
    ...overrides,
  };
}

test("US1: sends annual 30-day threshold reminder", async () => {
  const contract = baseContract({
    id: "annual-1",
    termId: "annual-1-2026",
    cadence: "annual",
    expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
  });

  const repository = new InMemoryRepo([contract]);
  const email = new CaptureEmailService();
  const service = new ContractExpiryReminderService(repository, email);

  const result = await service.run(new Date("2026-08-12T09:00:00.000Z"));

  assert.equal(result.notifiedCount, 1);
  assert.equal(result.catchUpSentCount, 0);
  assert.equal(email.payloads[0]?.leadTimeDays, 30);
});

test("US1: sends monthly 7-day catch-up reminder after missed threshold", async () => {
  const contract = baseContract({
    id: "monthly-1",
    termId: "monthly-1-2026-08",
    cadence: "monthly",
    expiresAtUtc: new Date("2026-08-20T12:00:00.000Z"),
  });

  const repository = new InMemoryRepo([contract]);
  const email = new CaptureEmailService();
  const service = new ContractExpiryReminderService(repository, email);

  const result = await service.run(new Date("2026-08-14T12:00:00.000Z"));

  assert.equal(result.notifiedCount, 1);
  assert.equal(result.catchUpSentCount, 1);
  assert.equal(email.payloads[0]?.leadTimeDays, 7);
  assert.equal(email.payloads[0]?.catchUp, true);
});
