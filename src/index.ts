import express from "express";
import { InMemoryContractRepository } from "./data/inMemoryContractRepository";
import { ContractExpiryReminderService } from "./services/contractExpiryReminderService";
import { ConsoleNotificationService } from "./services/notificationService";

const app = express();
app.use(express.json());

const repository = new InMemoryContractRepository();
const notificationService = new ConsoleNotificationService();
const reminderService = new ContractExpiryReminderService(
  repository,
  notificationService
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/contracts/expiry-reminders/run", async (req, res) => {
  try {
    const runAt = req.body?.runAt ? new Date(req.body.runAt) : new Date();

    if (Number.isNaN(runAt.getTime())) {
      res.status(400).json({ error: "Invalid runAt date." });
      return;
    }

    const result = await reminderService.run(runAt);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Contract reminder API listening on port ${port}`);
});
