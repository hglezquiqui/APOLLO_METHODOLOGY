import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../../src/index";
import { ContractRepository } from "../../src/data/inMemoryContractRepository";
import { Contract, ReminderEvent } from "../../src/types/contract";
import { ContractExpiryReminderService } from "../../src/services/contractExpiryReminderService";
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

test("US1 integration: POST /contracts/expiry-reminders/run returns counters", async () => {
  const contracts: Contract[] = [
    {
      id: "ct-a",
      termId: "ct-a-2026",
      title: "Annual",
      cadence: "annual",
      owner: { id: "o1", name: "A", email: "a@example.com" },
      expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
      renewalStatus: "active",
      renewalEffectiveAtUtc: null,
    },
  ];

  const repository = new InMemoryRepo(contracts);
  const email = new CaptureEmailService();
  const service = new ContractExpiryReminderService(repository, email);
  const app = createApp(service);

  const response = await request(app)
    .post("/contracts/expiry-reminders/run")
    .send({ runAtUtc: "2026-08-12T09:00:00.000Z" })
    .expect(200);

  assert.equal(response.body.processedContracts, 1);
  assert.equal(response.body.notifiedCount, 1);
  assert.equal(response.body.skippedDuplicateCount, 0);
});
