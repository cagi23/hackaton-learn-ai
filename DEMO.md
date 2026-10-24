# ReviewLens — 90-Second Demo Script & Walkthrough

> **The Hackathon Pitch & Live Walkthrough Guide**  
> *Target Duration:* 90–120 seconds  
> *Focus:* High-impact pedagogy, deliberate practice, deterministic reliability, and active learning.

---

## 🎤 Presentation Script & Timing

### 00:00 – 00:15 | Opening
**Spoken:**
> "AI is writing more code than ever. But developers still need to understand whether that code is actually good."

**Action:**
- Display the clean ReviewLens landing screen.
- Highlight the developer skill scorecard across the top (Bug Detection, Security, Maintainability, Type Safety, Testing).

---

### 00:15 – 00:30 | The Problem
**Spoken:**
> "Most AI review tools tell you what's wrong. ReviewLens teaches you why."
>
> "Standard linters and bot reviews dump wall-of-text diffs or superficial style warnings. Developers accept suggestions without developing intuition. ReviewLens bridges the gap between automated code review and deliberate software engineering education."

---

### 00:30 – 01:15 | Click-by-Click Live Demo Walkthrough

#### Step 1: Open ReviewLens
- Navigate to `http://localhost:5173`.
- Notice the active **Mock Mode** badge: guarantees 100% deterministic, zero-latency, offline reliability for live presentations.

#### Step 2: Click "Load Demo Example"
- Click the **"Load Demo Example"** button above the editor.
- The editor populates with realistic enterprise TypeScript code: `OrderService.ts`.
- Mention: *"Notice this checkout service: it compiles, looks plausible on the surface, but harbors critical real-world defects in error handling, type safety, security, and persistence coupling."*

#### Step 3: Click "Review My Code"
- Click the gradient **"Review My Code"** button.
- Point out the **animated domain analysis pipeline**:
  - `Analyzing AST and code structure...`
  - `Inspecting type boundaries and null safety...`
  - `Evaluating async error handling and resilience...`
  - `Auditing architectural separation of concerns...`

#### Step 4: Show Structured Findings Summary
- Review completes instantly with strict JSON schema validation.
- Point out the structured summary card:
  - **Overall Quality:** `Needs Improvement`
  - **4 Structured Findings** categorized with clear severity counters (Critical, High, Medium, Low).

#### Step 5: Click "Explore Issue" on `Possible undefined access in items.find(...)`
- Locate Finding 1: **"Unsafe Undefined Access on Array Search Result"** (`type-safety`, High severity).
- Click **"Explore Issue"** (or click the card).
- The detailed finding view opens, highlighting the affected line:
  ```typescript
  const targetItem = request.items.find((item) => item.productId === "PROD-VIP");
  const priorityQuantity = targetItem.quantity;
  ```

#### Step 6: Highlight "WHY DOES THIS MATTER?"
- Scroll down to the distinctive callout container labeled **"WHY DOES THIS MATTER?"**.
- Read / summarize the runtime consequence:
  > *"At runtime, this throws `TypeError: Cannot read properties of undefined (reading quantity)`, abruptly terminating the checkout transaction for any standard customer who did not add the VIP item."*
- Highlight that ReviewLens focuses on production business risk, not cosmetic nitpicks.

#### Step 7: Highlight "ENGINEERING PRINCIPLE"
- Point to the **ENGINEERING PRINCIPLE** badge and explanation:
  > **Null Safety & Defensive Checks**
- Explain that rather than just patching line 37, the developer learns the foundational defensive coding discipline.
- Briefly show the suggested fix with optional chaining (`targetItem?.quantity ?? 0`).

#### Step 8: Activate "CHALLENGE ME" Button
- Click the prominent **"Challenge Me"** button with the brain icon.
- A deliberate practice challenge modal opens instantly.

#### Step 9: Select Answer to Interactive Challenge Quiz
- Present the question:
  > *"What is the most idiomatic TypeScript approach to safely read a property from a find() result that may be undefined?"*
- Select Option 1:
  > **"Use optional chaining with a nullish coalescing fallback: `targetItem?.quantity ?? 0`"**

#### Step 10: Submit Answer & Immediate Feedback
- Click **"Submit Answer"**.
- Point out the immediate deterministic evaluation:
  - Green **"Correct!"** status banner.
  - In-depth pedagogical explanation explaining why optional chaining (`?.`) combined with nullish coalescing (`??`) protects runtime execution without masking upstream faults.

#### Step 11: Show Updated Skill Score
- Close the challenge modal.
- Point directly to the Skill Dashboard at the top:
  - **Type Safety score updates from 63 to 66**:
    $$\text{Type Safety: } 63 \rightarrow 66 \text{ (+3)} \uparrow$$
- A celebratory green upward trending indicator confirms the verified skill progression.

---

### 01:15 – 01:30 | Closing
**Spoken:**
> "ReviewLens doesn't just review your code. It teaches you to become a better reviewer."
>
> "By turning automated reviews into moments of deliberate practice, teams write better software today, and build stronger engineers for tomorrow. Thank you!"

---

## 💡 Judge Pro-Tips & Demo Reliability

1. **Deterministic Mock Mode (Default)**
   - The application starts in **Mock Mode** by default.
   - It runs completely offline without network latency, external rate limits, or API key dependencies.
   - Every challenge evaluation and score update is client-side deterministic.

2. **Live AI Mode Supported**
   - Click the **Gear icon (Settings)** in the top right.
   - Toggle to **Live AI Provider**.
   - Select **Google Gemini** (`gemini-1.5-flash` or `gemini-2.0-flash`) or **OpenAI** (`gpt-4o-mini`).
   - Paste an API key; keys are stored strictly in client `localStorage` and scrubbed from all error messages.

3. **Resetting Demo State**
   - Click the **Reset button (RotateCcw icon)** in the header to restore default skill scores (`Type Safety: 63`) at any time between demo runs.

4. **Automated Video Recording Agent (Playwright)**
   - ReviewLens includes an automated Chrome recording agent that executes this exact 14-step walkthrough and records a high-definition video:
     ```bash
     npm run demo:record
     ```
   - The generated video is saved to `recordings/reviewlens-demo.webm`.
