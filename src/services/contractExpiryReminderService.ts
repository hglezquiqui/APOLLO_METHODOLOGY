import { ContractRepository } from "../data/inMemoryContractRepository";
import {
  ContractExpiryNotificationPayload,
  EmailService,
} from "./notificationService";
import { Contract, ReminderEvent, ReminderRunSummary } from "../types/contract";

export function getLeadTimeDaysForCadence(cadence: Contract["cadence"]): number | null {
  if (cadence === "annual") {
    return 30;
  }

  if (cadence === "monthly") {
    return 7;
  }

  return null;
}

export function calculateThresholdUtc(expiresAtUtc: Date, leadTimeDays: number): Date {
  const threshold = new Date(expiresAtUtc.getTime());
  threshold.setUTCDate(threshold.getUTCDate() - leadTimeDays);
  return threshold;
}

export function isRenewalEffectiveAtRunTime(contract: Contract, runAtUtc: Date): boolean {
  if (contract.renewalStatus !== "renewed") {
    return false;
  }

  if (!contract.renewalEffectiveAtUtc) {
    return false;
  }

  return runAtUtc >= contract.renewalEffectiveAtUtc;
}

export function isEligibleThreshold(runAtUtc: Date, thresholdAtUtc: Date): boolean {
  return runAtUtc.getTime() === thresholdAtUtc.getTime();
}

export function isEligibleCatchUp(
  runAtUtc: Date,
  thresholdAtUtc: Date,
  expiresAtUtc: Date
): boolean {
  return runAtUtc > thresholdAtUtc && runAtUtc < expiresAtUtc;
}

export class ContractExpiryReminderService {
  constructor(
    private readonly repository: ContractRepository,
    private readonly emailService: EmailService
  ) {}

  async run(runAtUtc = new Date()): Promise<ReminderRunSummary> {
    const contracts = await this.repository.listContracts();

    let notifiedCount = 0;
    let skippedRenewedCount = 0;
    let skippedDuplicateCount = 0;
    let skippedIneligibleCount = 0;
    let catchUpSentCount = 0;

    for (const contract of contracts) {
      const leadTimeDays = getLeadTimeDaysForCadence(contract.cadence);

      if (leadTimeDays === null) {
        skippedIneligibleCount += 1;
        continue;
      }

      if (isRenewalEffectiveAtRunTime(contract, runAtUtc)) {
        skippedRenewedCount += 1;
        continue;
      }

      const thresholdAtUtc = calculateThresholdUtc(contract.expiresAtUtc, leadTimeDays);

      if (runAtUtc >= contract.expiresAtUtc) {
        skippedIneligibleCount += 1;
        continue;
      }

      const thresholdHit = isEligibleThreshold(runAtUtc, thresholdAtUtc);
      const catchUpEligible = isEligibleCatchUp(
        runAtUtc,
        thresholdAtUtc,
        contract.expiresAtUtc
      );

      if (!thresholdHit && !catchUpEligible) {
        skippedIneligibleCount += 1;
        continue;
      }

      const alreadySent = await this.repository.hasReminderEvent(
        contract.termId,
        leadTimeDays
      );

      if (alreadySent) {
        skippedDuplicateCount += 1;
        continue;
      }

      const payload: ContractExpiryNotificationPayload = {
        contractId: contract.id,
        contractTermId: contract.termId,
        contractTitle: contract.title,
        ownerName: contract.owner.name,
        ownerEmail: contract.owner.email,
        expiresAtUtc: contract.expiresAtUtc.toISOString(),
        leadTimeDays,
        catchUp: catchUpEligible,
      };

      const reminderEvent: ReminderEvent = {
        reminderEventId: `${contract.termId}:${leadTimeDays}`,
        contractId: contract.id,
        contractTermId: contract.termId,
        leadTimeDays,
        thresholdAtUtc: thresholdAtUtc.toISOString(),
        notifiedAtUtc: runAtUtc.toISOString(),
        dispatchStatus: "sent",
        catchUp: catchUpEligible,
      };

      await this.emailService.sendContractExpiryEmail(payload);
      await this.repository.recordReminderEvent(reminderEvent);

      notifiedCount += 1;

      if (catchUpEligible) {
        catchUpSentCount += 1;
      }
    }

    return {
      processedContracts: contracts.length,
      notifiedCount,
      skippedRenewedCount,
      skippedDuplicateCount,
      skippedIneligibleCount,
      catchUpSentCount,
    };
  }
}
