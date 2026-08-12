export type ContractExpiryNotificationPayload = {
  contractId: string;
  contractTermId: string;
  contractTitle: string;
  ownerName: string;
  ownerEmail: string;
  expiresAtUtc: string;
  leadTimeDays: number;
  catchUp: boolean;
};

export interface EmailService {
  sendContractExpiryEmail(
    payload: ContractExpiryNotificationPayload
  ): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  async sendContractExpiryEmail(
    payload: ContractExpiryNotificationPayload
  ): Promise<void> {
    console.log("[contract-expiry-email]", JSON.stringify(payload, null, 2));
  }
}
