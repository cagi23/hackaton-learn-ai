# ReviewLens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demo-ready, tested, and reliable hackathon web application that combines AI code review, software engineering education ("Why Does This Matter?"), deliberate practice ("Challenge Me" quizzes), and gamified skill progression.

**Architecture:** Single-page client-side application (React 19 + TypeScript + Tailwind CSS 4) with clear separation of concerns: UI layer, Application Services (ReviewService, ChallengeService, SkillService), and an AI Abstraction Layer (`ReviewProvider` with `MockReviewProvider` and `LLMReviewProvider`), runtime validated with Zod.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Lucide React, Zod, Vitest.

**Spec:** `spec.md`

## Global Constraints

- **Scope:** Strict MVP as defined in `scope.md`.
- **Reliability:** Demo reliability > technical sophistication. Mock mode is first-class and guaranteed to work with zero external dependencies.
- **Deterministic Evaluation:** Challenge answer evaluation is 100% deterministic on client side against the generated `correctAnswerId` (never call the LLM to grade a multiple-choice answer).
- **Runtime Validation:** All AI output is strictly validated through Zod before reaching UI or application state.
- **Score Bounds:** Skill scores strictly bounded between 0 and 100 (+3 per correct challenge).

## Review Focus

1. **Untrusted LLM Output / Malformed JSON:** Robust JSON extractor + Zod validation with safe error reporting and fallback.
2. **Challenge Answer Tampering / Inconsistent IDs:** Zod refinement validating that `answers.some(a => a.id === correctAnswerId)`.
3. **Skill Score Boundary Violations:** Clamping function `Math.min(100, Math.max(0, score + delta))`.
4. **Empty / Whitespace Code Submission:** Immediate client validation and validation state with clear user feedback.
5. **Network / API Key Failure During Demo:** Seamless fallback to `MockReviewProvider` with a clear indicator tag.

---

### Task 1: Git Init & Project Scaffolding
**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Working React + TypeScript + Tailwind CSS application with `npm run build` and `npm test` scripts passing.

- [x] **Step 1: Create package.json and install dependencies**
- [x] **Step 2: Configure Vite, Tailwind, TypeScript and Vitest**
- [x] **Step 3: Create index.html, src/main.tsx, src/App.tsx, src/index.css**
- [x] **Step 4: Verify build and test runner**
- [x] **Step 5: Commit**

---

### Task 2: Domain Models & Zod Schemas
**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/schemas.ts`
- Test: `src/domain/schemas.test.ts`

**Interfaces:**
- Produces: `CodeReview`, `ReviewFinding`, `ReviewChallenge`, `SkillScores` types and `CodeReviewSchema`, `ReviewFindingSchema`, `ReviewChallengeSchema` Zod schemas.

- [x] **Step 1: Write failing test for schema validation**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement domain types & Zod schemas**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 3: Mock Review Provider & Realistic Demo Code
**Files:**
- Create: `src/services/providers/ReviewProvider.ts`
- Create: `src/services/providers/MockReviewProvider.ts`
- Create: `src/data/demoCode.ts`
- Test: `src/services/providers/MockReviewProvider.test.ts`

**Interfaces:**
- Produces: `ReviewProvider` interface, `MockReviewProvider` with 4 high-value findings, and `DEMO_TYPESCRIPT_CODE`.

- [x] **Step 1: Write failing test for MockReviewProvider**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement realistic demo code and MockReviewProvider**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 4: LLM Review Provider & Prompt Architecture
**Files:**
- Create: `src/services/ai/prompts.ts`
- Create: `src/services/ai/jsonExtractor.ts`
- Create: `src/services/providers/LLMReviewProvider.ts`
- Test: `src/services/ai/jsonExtractor.test.ts`
- Test: `src/services/providers/LLMReviewProvider.test.ts`

**Interfaces:**
- Produces: `SYSTEM_REVIEW_PROMPT`, `extractAndValidateJson`, `LLMReviewProvider`.

- [x] **Step 1: Write failing tests for JSON extraction and validation**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement prompt, jsonExtractor, and LLMReviewProvider**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 5: Application Services (ReviewService, ChallengeService, SkillService)
**Files:**
- Create: `src/services/SkillService.ts`
- Create: `src/services/ChallengeService.ts`
- Create: `src/services/ReviewService.ts`
- Test: `src/services/SkillService.test.ts`
- Test: `src/services/ChallengeService.test.ts`

**Interfaces:**
- Produces: `SkillService` (+3 points up to 100, localStorage persistence), `ChallengeService` (deterministic quiz evaluator), `ReviewService`.

- [ ] **Step 1: Write failing tests for SkillService and ChallengeService**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement services**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

### Task 6: Header, Navigation & Skill Dashboard UI
**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/SkillDashboard.tsx`
- Test: `src/components/SkillDashboard.test.tsx`

**Interfaces:**
- Produces: Header and visual SkillDashboard with score progress bars.

- [ ] **Step 1: Write failing test for SkillDashboard**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement Header and SkillDashboard**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 7: Code Input Component & Demo Loader
**Files:**
- Create: `src/components/CodeInput.tsx`
- Test: `src/components/CodeInput.test.tsx`

**Interfaces:**
- Produces: Monospace code editor with "Load Example" and "Review My Code" controls.

- [ ] **Step 1: Write failing test for CodeInput**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement CodeInput**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 8: Review Loading State
**Files:**
- Create: `src/components/ReviewLoadingState.tsx`
- Test: `src/components/ReviewLoadingState.test.tsx`

**Interfaces:**
- Produces: Domain-specific animated review progress indicators.

- [ ] **Step 1: Write failing test for ReviewLoadingState**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement ReviewLoadingState**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 9: Findings List & Severity Summary Cards
**Files:**
- Create: `src/components/ReviewSummary.tsx`
- Create: `src/components/FindingCard.tsx`
- Create: `src/components/FindingsList.tsx`
- Test: `src/components/FindingsList.test.tsx`

**Interfaces:**
- Produces: Finding summary counters and interactive list of findings.

- [ ] **Step 1: Write failing test for FindingsList**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement ReviewSummary, FindingCard, FindingsList**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 10: Finding Detail Panel ("Why Does This Matter?" & "Principle")
**Files:**
- Create: `src/components/FindingDetail.tsx`
- Test: `src/components/FindingDetail.test.tsx`

**Interfaces:**
- Produces: Deep-dive view showing "Why Does This Matter?", "Engineering Principle", code diff, and "Challenge Me" button.

- [x] **Step 1: Write failing test for FindingDetail**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement FindingDetail**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 11: "Challenge Me" Interactive Quiz Modal
**Files:**
- Create: `src/components/ChallengeModal.tsx`
- Test: `src/components/ChallengeModal.test.tsx`

**Interfaces:**
- Produces: 3-option quiz modal with instant evaluation, explanation, and skill score increment feedback.

- [x] **Step 1: Write failing test for ChallengeModal**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement ChallengeModal**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit**

---

### Task 12: Application Integration & Error Handling
**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/SettingsModal.tsx`
- Create: `src/components/ErrorAlert.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: End-to-end connected application with provider toggle and error boundaries.

- [ ] **Step 1: Write failing integration test for full user journey**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement full flow in App.tsx**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 13: Automated Verification Suite
**Files:**
- Create: `src/tests/endToEndFlow.test.ts`

**Interfaces:**
- Produces: Complete end-to-end verification passing TypeScript check and Vitest test suite.

- [ ] **Step 1: Run typecheck and full test suite**
- [ ] **Step 2: Run production build**
- [ ] **Step 3: Commit**

---

### Task 14: Independent Code Review Hardening
**Files:**
- Create: `review-report.md`

**Interfaces:**
- Produces: Multi-perspective code review report with all blocker/high issues resolved.

- [ ] **Step 1: Document review findings across 6 review passes**
- [ ] **Step 2: Fix any issues and verify**
- [ ] **Step 3: Commit**

---

### Task 15: Documentation & Demo Kit
**Files:**
- Create: `DEMO.md`
- Create: `README.md`

**Interfaces:**
- Produces: Complete documentation and judge-ready demo script.

- [x] **Step 1: Write DEMO.md**
- [x] **Step 2: Write README.md**
- [x] **Step 3: Verify final build**
- [x] **Step 4: Commit**
