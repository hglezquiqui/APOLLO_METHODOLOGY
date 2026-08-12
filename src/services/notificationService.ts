export type ContractExpiryNotificationPayload = {
  contractId: string;
  contractTitle: string;
  ownerName: string;
  ownerEmail: string;
  expiresAtIso: string;
  daysBefore: number;
};

export interface NotificationService {
  sendContractExpiryReminder(
    payload: ContractExpiryNotificationPayload
  ): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
  async sendContractExpiryReminder(
    payload: ContractExpiryNotificationPayload
  ): Promise<void> {
    console.log(
      "[contract-expiry-reminder]",
      JSON.stringify(payload, null, 2)
    );
  }
}
