import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SkillService,
  DEFAULT_SKILL_SCORES,
  SKILL_STORAGE_KEY,
  mapCategoryToSkillCategory,
} from "./SkillService";

describe("SkillService", () => {
  let skillService: SkillService;

  beforeEach(() => {
    localStorage.clear();
    skillService = new SkillService();
  });

  describe("mapCategoryToSkillCategory", () => {
    it("maps finding categories to corresponding skill categories correctly", () => {
      expect(mapCategoryToSkillCategory("bug")).toBe("bug-detection");
      expect(mapCategoryToSkillCategory("bug-detection")).toBe("bug-detection");
      expect(mapCategoryToSkillCategory("security")).toBe("security");
      expect(mapCategoryToSkillCategory("maintainability")).toBe("maintainability");
      expect(mapCategoryToSkillCategory("readability")).toBe("maintainability");
      expect(mapCategoryToSkillCategory("performance")).toBe("maintainability");
      expect(mapCategoryToSkillCategory("type-safety")).toBe("type-safety");
      expect(mapCategoryToSkillCategory("testing")).toBe("testing");
    });
  });

  describe("getScores", () => {
    it("returns default skill scores when localStorage is empty", () => {
      const scores = skillService.getScores();
      expect(scores).toEqual(DEFAULT_SKILL_SCORES);
      expect(scores["bug-detection"]).toBe(72);
      expect(scores.security).toBe(51);
      expect(scores.maintainability).toBe(84);
      expect(scores["type-safety"]).toBe(63);
      expect(scores.testing).toBe(55);
    });

    it("hydrates existing scores from localStorage", () => {
      const customScores = {
        "bug-detection": 80,
        security: 60,
        maintainability: 90,
        "type-safety": 70,
        testing: 65,
      };
      localStorage.setItem(SKILL_STORAGE_KEY, JSON.stringify(customScores));

      const scores = skillService.getScores();
      expect(scores).toEqual(customScores);
    });

    it("safely resets to defaults if localStorage has corrupted JSON", () => {
      localStorage.setItem(SKILL_STORAGE_KEY, "{ invalid-json :::");

      const scores = skillService.getScores();
      expect(scores).toEqual(DEFAULT_SKILL_SCORES);
    });

    it("safely resets to defaults if localStorage data has missing keys or invalid values", () => {
      localStorage.setItem(
        SKILL_STORAGE_KEY,
        JSON.stringify({ "bug-detection": "not-a-number" })
      );

      const scores = skillService.getScores();
      expect(scores).toEqual(DEFAULT_SKILL_SCORES);
    });
  });

  describe("updateScore", () => {
    it("increments score by default delta (+3) for finding category and persists to localStorage", () => {
      const result = skillService.updateScore("bug");

      expect(result.oldScore).toBe(DEFAULT_SKILL_SCORES["bug-detection"]);
      expect(result.newScore).toBe(DEFAULT_SKILL_SCORES["bug-detection"] + 3);
      expect(result.skillCategory).toBe("bug-detection");
      expect(result.updatedScores["bug-detection"]).toBe(DEFAULT_SKILL_SCORES["bug-detection"] + 3);

      const stored = JSON.parse(localStorage.getItem(SKILL_STORAGE_KEY)!);
      expect(stored["bug-detection"]).toBe(DEFAULT_SKILL_SCORES["bug-detection"] + 3);
    });

    it("maps aliases like readability to maintainability when updating", () => {
      const result = skillService.updateScore("readability", 3);

      expect(result.skillCategory).toBe("maintainability");
      expect(result.oldScore).toBe(84);
      expect(result.newScore).toBe(87);
      expect(result.updatedScores.maintainability).toBe(87);
    });

    it("clamps score strictly to 100 when delta would exceed the maximum", () => {
      localStorage.setItem(
        SKILL_STORAGE_KEY,
        JSON.stringify({ ...DEFAULT_SKILL_SCORES, security: 99 })
      );

      const result = skillService.updateScore("security", 5);
      expect(result.oldScore).toBe(99);
      expect(result.newScore).toBe(100);
      expect(result.updatedScores.security).toBe(100);
    });

    it("clamps score strictly to 0 when delta is negative and would fall below 0", () => {
      localStorage.setItem(
        SKILL_STORAGE_KEY,
        JSON.stringify({ ...DEFAULT_SKILL_SCORES, testing: 2 })
      );

      const result = skillService.updateScore("testing", -10);
      expect(result.oldScore).toBe(2);
      expect(result.newScore).toBe(0);
      expect(result.updatedScores.testing).toBe(0);
    });
  });

  describe("resetScores", () => {
    it("resets scores back to defaults and updates localStorage", () => {
      skillService.updateScore("security", 10);
      expect(skillService.getScores().security).toBe(61);

      const resetResult = skillService.resetScores();
      expect(resetResult).toEqual(DEFAULT_SKILL_SCORES);
      expect(skillService.getScores()).toEqual(DEFAULT_SKILL_SCORES);

      const stored = JSON.parse(localStorage.getItem(SKILL_STORAGE_KEY)!);
      expect(stored).toEqual(DEFAULT_SKILL_SCORES);
    });
  });

  describe("Storage error resilience", () => {
    it("handles localStorage throwing errors gracefully", () => {
      const setItemSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      // Should not throw
      const result = skillService.updateScore("bug", 3);
      expect(result.newScore).toBe(DEFAULT_SKILL_SCORES["bug-detection"] + 3);

      setItemSpy.mockRestore();
    });

    it("works with in-memory fallback when storage is null/unavailable", () => {
      const throwingStorage: Storage = {
        getItem: () => {
          throw new Error("SecurityError: Access Denied");
        },
        setItem: () => {
          throw new Error("SecurityError: Access Denied");
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };

      const secureService = new SkillService("secure-key", throwingStorage);
      expect(secureService.getScores()).toEqual(DEFAULT_SKILL_SCORES);

      const update = secureService.updateScore("security", 3);
      expect(update.newScore).toBe(DEFAULT_SKILL_SCORES.security + 3);
      expect(secureService.getScores().security).toBe(DEFAULT_SKILL_SCORES.security + 3);
    });
  });
});
