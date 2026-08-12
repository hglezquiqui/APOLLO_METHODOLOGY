import express from "express";
import { InMemoryContractRepository } from "./data/inMemoryContractRepository";
import { ContractExpiryReminderService } from "./services/contractExpiryReminderService";
import { ConsoleEmailService } from "./services/notificationService";

export function createApp(
  reminderService = new ContractExpiryReminderService(
    new InMemoryContractRepository(),
    new ConsoleEmailService()
  )
): express.Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/contracts/expiry-reminders/run", async (req, res) => {
    try {
      const runAtUtc = req.body?.runAtUtc
        ? new Date(req.body.runAtUtc)
        : new Date();

      if (Number.isNaN(runAtUtc.getTime())) {
        res.status(400).json({ error: "Invalid runAtUtc date." });
        return;
      }

      const result = await reminderService.run(runAtUtc);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      res.status(500).json({ error: message });
    }
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, () => {
    console.log(`Contract reminder API listening on port ${port}`);
  });
}
