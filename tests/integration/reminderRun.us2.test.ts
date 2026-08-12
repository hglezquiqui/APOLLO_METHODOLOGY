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

test("US2 integration: renewal-effective contract is skipped", async () => {
  const contracts: Contract[] = [
    {
      id: "ct-r",
      termId: "ct-r-2026",
      title: "Renewed",
      cadence: "annual",
      owner: { id: "o1", name: "A", email: "a@example.com" },
      expiresAtUtc: new Date("2026-09-11T09:00:00.000Z"),
      renewalStatus: "renewed",
      renewalEffectiveAtUtc: new Date("2026-08-10T00:00:00.000Z"),
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

  assert.equal(response.body.notifiedCount, 0);
  assert.equal(response.body.skippedRenewedCount, 1);
  assert.equal(email.payloads.length, 0);
});
