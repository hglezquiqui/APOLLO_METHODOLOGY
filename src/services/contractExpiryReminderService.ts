import { ContractRepository } from "../data/inMemoryContractRepository";
import {
  ContractExpiryNotificationPayload,
  NotificationService,
} from "./notificationService";

type ReminderServiceOptions = {
  reminderDays: number[];
  lookaheadHours: number;
};

export type ReminderRunResult = {
  processedContracts: number;
  remindersSent: number;
  skipped: number;
};

const DEFAULT_OPTIONS: ReminderServiceOptions = {
  reminderDays: [30, 14, 7, 1],
  lookaheadHours: 24,
};

export class ContractExpiryReminderService {
  constructor(
    private readonly repository: ContractRepository,
    private readonly notificationService: NotificationService,
    private readonly options: ReminderServiceOptions = DEFAULT_OPTIONS
  ) {}

  async run(now = new Date()): Promise<ReminderRunResult> {
    const contracts = await this.repository.listContracts();
    const reminderWindowEnd = new Date(
      now.getTime() + this.options.lookaheadHours * 60 * 60 * 1000
    );

    let remindersSent = 0;
    let skipped = 0;

    for (const contract of contracts) {
      for (const reminderDay of this.options.reminderDays) {
        const reminderAt = new Date(contract.expiresAt.getTime());
        reminderAt.setUTCDate(reminderAt.getUTCDate() - reminderDay);

        const isInsideReminderWindow =
          reminderAt >= now && reminderAt < reminderWindowEnd;

        if (!isInsideReminderWindow) {
          continue;
        }

        const alreadyNotified = contract.reminderHistory.some((entry) => {
          return (
            entry.daysBefore === reminderDay &&
            entry.expiresAtIso === contract.expiresAt.toISOString()
          );
        });

        if (alreadyNotified) {
          skipped += 1;
          continue;
        }

        const payload: ContractExpiryNotificationPayload = {
          contractId: contract.id,
          contractTitle: contract.title,
          ownerName: contract.owner.name,
          ownerEmail: contract.owner.email,
          expiresAtIso: contract.expiresAt.toISOString(),
          daysBefore: reminderDay,
        };

        await this.notificationService.sendContractExpiryReminder(payload);
        await this.repository.recordReminder(
          contract.id,
          reminderDay,
          contract.expiresAt.toISOString(),
          now.toISOString()
        );

        remindersSent += 1;
      }
    }

    return {
      processedContracts: contracts.length,
      remindersSent,
      skipped,
    };
  }
}
