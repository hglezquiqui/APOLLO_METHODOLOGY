# Apollo Pilot — Step-by-Step Guide (GitHub Copilot)
## From VS Code setup to the finished playbook

This is the complete, action-only guide using **GitHub Copilot** as the agent (not Claude Code). Each step is something to actually click or type, in order.

---

## Step 0 — Set up GitHub Copilot in VS Code

1. Open VS Code.
2. Click the account icon (bottom-left corner of the window).
3. Click **"Sign in with GitHub"**.
4. Your browser opens — log in and authorize VS Code (Google login works if your GitHub account is linked to Google — look for "Continue with Google" on GitHub's login screen).
5. Back in VS Code, confirm you're signed in: the account icon should now show your GitHub avatar, not a generic icon.
6. Open the Copilot Chat panel (right sidebar). It should say your GitHub username at the top, **not** "SIGN IN GITHUB". If it still shows the sign-in prompt, click **"Chat with Copilot"** in the Welcome tab and complete the login flow again — this is the single most common thing that gets stuck.

**Common issue seen mid-session:** if Copilot Chat shows "Working..." indefinitely with no response, it almost always means step 6 didn't actually finish — check the top of the chat panel for "SIGN IN GITHUB" before troubleshooting anything else.

---

## Step 1 — Create the Git repository

In the VS Code integrated terminal (`Terminal` menu → `New Terminal`):

```bash
mkdir apollo-piloto && cd apollo-piloto
git init
git branch -M main

echo "# Apollo Pilot — Contract Expiration Alerts" > README.md
git add README.md
git commit -m "Initial commit"

git remote add origin <repo-url>
git push -u origin main
```

Open this folder in VS Code: `File` → `Open Folder` → select `apollo-piloto`.

- [ ] Repository created and pushed
- [ ] Every Session 1 attendee has write access
- [ ] A basic CI workflow exists on the repository

---

## Step 1.5 — Add a `.gitignore`

**The filename must start with a dot: `.gitignore`, not `gitignore`.** VS Code sometimes drops the leading dot when creating a new file through the UI — check the Explorer panel after creating it; if it shows as `gitignore` without the dot, rename it (right-click → Rename, or `mv gitignore .gitignore` in the terminal). A file named `gitignore` is invisible to Git and does nothing.

```
# Dependencies
node_modules/

# Build output
dist/
build/
*.tsbuildinfo

# Environment / secrets
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/*
!.vscode/settings.json
.idea/

# Test coverage
coverage/

# Spec Kit local state (keep .specify/memory and specs/ versioned, ignore scratch)
.specify/.cache/
```

**Do not ignore `.specify/memory/` or `specs/`** — those hold the actual session deliverables (constitution.md, spec.md, plan.md, tasks.md) and must stay versioned.

```bash
git add .gitignore
git commit -m "Add .gitignore"
```

If `node_modules` was already committed before this step existed:
```bash
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"
```

---

## Step 2 — Install Spec Kit with the Copilot integration

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration copilot
```

Verify it detected Copilot correctly:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify check
```

You're looking for a line like:
```
├── ○ GitHub Copilot (IDE-based, no CLI check)
```
This is expected — Copilot is IDE-based, so `specify check` doesn't need a CLI binary for it the way it does for terminal-first agents. As long as VS Code is signed in (Step 0), this integration works.

- [ ] `.specify/` and `.github/` folders now exist in the project
- [ ] Reload the VS Code window (`Ctrl+Shift+P` / `Cmd+Shift+P` → "Developer: Reload Window") so Copilot picks up the new prompt files

---

## Session 0 — Choosing the pilot case (30 min, informal)

1. PM brings the raw business problem to the group.
2. Draft the Jira ticket description (by hand, or with the reusable prompt from `session0_detailed.md`).
3. Tech Lead confirms the pilot is scoped small enough for 4 sessions.
4. Create the Jira ticket (e.g. `APOLLO-2481`) and link it to the repository.
5. Pre-Session-1 checklist:
   - [ ] Jira ticket created and linked
   - [ ] Every attendee has completed Steps 0–2 above, on their own machine
   - [ ] Tech Lead who will own the constitution file confirmed for Session 1

---

## Session 1 — From free-form prompting to specification (1.5h)

### 1.1 — Demo the failure mode (do this first, before touching Spec Kit)

Open Copilot Chat (right sidebar). **Make sure no unrelated file is attached** — check the chip above the input box; if it shows something like `Ask.agent.md` instead of your project file, click the **X** on it to remove it.

Type this prompt directly into Copilot Chat and send it once:

```
Add a feature that notifies contract owners before their contract expires.
```

Discuss out loud what it assumed (lead time? timezone handling? duplicate sends?) — don't fix anything yet. This is the reference point for why the rest of the session matters.

### 1.2 — Generate the constitution file

Still in Copilot Chat:

```
/speckit.constitution Create governing principles for the Apollo pilot
project. Focus on: stack constraints, minimum test coverage, data
handling rules for dates and financial fields, and rules for what
the agent may never modify without explicit human approval.
```

If `/speckit.constitution` doesn't autocomplete as you type `/`, reload the window (Step 2's last checkbox) — the prompt files load once at startup.

### 1.3 — Review and commit

Open `.specify/memory/constitution.md` in the editor, review as a group, edit directly if needed, then:

```bash
git add .specify/memory/constitution.md
git commit -m "Add project constitution"
git push
```

**Checkpoint:** `constitution.md` exists, is committed, and contains at least one rule specific to Apollo's domain.

---

## Session 2 — Specifying in EARS format (1.5h)

All of these run as prompts inside Copilot Chat, one at a time, waiting for each to finish before the next:

### 2.1 — Generate the spec
```
/speckit.specify Notify contract owners automatically before their
contract expires. Annual contracts should notify 30 days in advance;
monthly contracts should notify 7 days in advance. Do not notify if
the contract has already been renewed. A contract must never receive
the notification twice, even if the notification job runs more than
once on the same day.
```

### 2.2 — Clarify
```
/speckit.clarify
```
Resolve whatever ambiguity it surfaces as a group decision, out loud — don't let Copilot guess.

### 2.3 — Plan
```
/speckit.plan Use the existing Express service layer pattern found in
src/services/. Read contract data via the existing ContractRepository,
do not introduce an ORM. Notification sending goes through the
existing EmailService.
```

### 2.4 — Tasks
```
/speckit.tasks
```

### 2.5 — Peer review before moving to Session 3
- [ ] Every EARS requirement maps to at least one task
- [ ] A task exists for idempotency specifically
- [ ] Every Clarify decision is reflected explicitly in the plan

**Checkpoint:** `specs/001-contract-expiration/spec.md`, `plan.md`, and `tasks.md` exist and pass peer review.

---

## Session 3 — Agent execution and governance (1.5h)

### 3.1 — Implement
```
/speckit.implement
```
Copilot works through `tasks.md` sequentially inside the editor, opening files and writing code you can watch in real time.

### 3.2 — Self-review, then human review
```
Review your own diff against specs/001-contract-expiration/spec.md.
List any requirement that is not covered by a test, and any place
where you made an assumption the spec didn't state explicitly.
```

Human checklist:
- [ ] Exclusion checks (`renewed`, `alreadyNotified`) run first
- [ ] Boundary comparison (`<=` vs `===`) resolved deliberately
- [ ] Diff doesn't touch anything the constitution file prohibits

### 3.3 — Encode governance as repository config

```
# .github/CODEOWNERS
/src/data/                    @apollo-tech-lead
/src/services/EmailService.ts @apollo-tech-lead
/.specify/memory/              @apollo-tech-lead
```

```bash
gh api repos/apollo-org/apollo-piloto/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/coverage","ci/tests"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

### 3.4 — Open the PR and merge once CI passes

Copilot can open the PR directly if the task was created from an assigned GitHub Issue; otherwise, push the branch and open the PR manually from GitHub.

**Checkpoint:** one real PR merged, `CODEOWNERS` and branch protection committed.

---

## Session 4 — Continuous evaluation and wrap-up (1.5h)

### 4.1 — Generate tests from the spec
```
Generate test cases directly from specs/001-contract-expiration/spec.md.
Cover every WHEN/IF statement as a separate test, including the
boundary cases (exactly 30 days, exactly 7 days, one day off).
```

### 4.2 — Coverage check
```bash
npm test -- --coverage
```

### 4.3 — Structured retro (exactly these 3 questions)
1. Where did the spec fail to anticipate something the agent got wrong?
2. Where did the agent drift from the spec despite it being unambiguous?
3. What should move into the constitution file so it doesn't need repeating?

### 4.4 — Assemble the playbook
```
apollo-playbook/
├── constitution-template.md
├── ears-cheatsheet.md
├── pr-review-checklist.md
├── governance-policy.yaml
├── eval-test-pattern.md
└── retro-questions.md
```

**Checkpoint:** playbook committed, coverage meets the constitution file's minimum, retro decisions recorded.

---

## Troubleshooting quick reference

| Symptom | Cause | Fix |
|---|---|---|
| Chat panel says "Working..." forever | Not actually signed in | Check for "SIGN IN GITHUB" at the top of the panel; redo Step 0 |
| Agent seems to be reasoning about the wrong file | Wrong file attached as context | Remove the chip above the input box, re-attach the right file or none |
| `/speckit.*` commands don't autocomplete | Prompt files not loaded yet | Reload window: `Ctrl+Shift+P` → "Developer: Reload Window" |
| `specify init --ai copilot` errors with "No such option" | Using the deprecated flag | Use `--integration copilot` instead |
| Sending the same prompt multiple times | Previous run still processing | Wait for or cancel the prior response before resending — don't stack duplicate prompts |
| `.gitignore` rules aren't working, `node_modules` still tracked | File was created as `gitignore` without the leading dot | Rename to `.gitignore`; run `git rm -r --cached node_modules` if already tracked |

---

## What "done" looks like

By the end of Session 4: a merged feature built entirely through this process, a constitution file with at least one Apollo-specific rule, governance enforced at the platform level, and a playbook the team can point the next feature at without a consultant in the room.
