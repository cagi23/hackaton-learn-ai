import type { FindingCategory, SkillCategory, SkillScores } from "../domain/types";
import { SkillScoresSchema } from "../domain/schemas";

export const SKILL_STORAGE_KEY = "reviewlens_skills";

export const DEFAULT_SKILL_SCORES: SkillScores = {
  "bug-detection": 72,
  security: 51,
  maintainability: 84,
  "type-safety": 63,
  testing: 55,
};

export const ALL_SKILL_CATEGORIES: SkillCategory[] = [
  "bug-detection",
  "security",
  "maintainability",
  "type-safety",
  "testing",
];

/**
 * Maps a finding category or skill category to one of the 5 canonical skill categories.
 */
export function mapCategoryToSkillCategory(
  category: FindingCategory | SkillCategory
): SkillCategory {
  switch (category) {
    case "bug":
    case "bug-detection":
      return "bug-detection";
    case "security":
      return "security";
    case "maintainability":
    case "readability":
    case "performance":
      return "maintainability";
    case "type-safety":
      return "type-safety";
    case "testing":
      return "testing";
    default:
      return "maintainability";
  }
}

export interface ScoreUpdateResult {
  oldScore: number;
  newScore: number;
  skillCategory: SkillCategory;
  updatedScores: SkillScores;
}

function resolveStorage(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
    ) {
      return window.localStorage;
    }
    if (
      typeof localStorage !== "undefined" &&
      typeof localStorage.getItem === "function"
    ) {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export class SkillService {
  private memoryFallbackScores: SkillScores | null = null;
  private readonly customStorage?: Storage;

  constructor(
    private readonly storageKey: string = SKILL_STORAGE_KEY,
    storage?: Storage
  ) {
    this.customStorage = storage;
  }

  private get storage(): Storage | null {
    return this.customStorage ?? resolveStorage();
  }

  /**
   * Retrieves the current skill scores from storage.
   * Falls back to defaults if storage is empty, corrupted, or unavailable.
   */
  getScores(): SkillScores {
    try {
      const storage = this.storage;
      if (!storage) {
        return this.memoryFallbackScores
          ? { ...this.memoryFallbackScores }
          : { ...DEFAULT_SKILL_SCORES };
      }

      const raw = storage.getItem(this.storageKey);
      if (!raw) {
        return this.memoryFallbackScores
          ? { ...this.memoryFallbackScores }
          : { ...DEFAULT_SKILL_SCORES };
      }

      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return { ...DEFAULT_SKILL_SCORES };
      }

      // Validate scores with schema and check that all 5 canonical categories exist
      const validation = SkillScoresSchema.safeParse(parsed);
      if (!validation.success) {
        return { ...DEFAULT_SKILL_SCORES };
      }

      const bugDetection = validation.data["bug-detection"];
      const security = validation.data.security;
      const maintainability = validation.data.maintainability;
      const typeSafety = validation.data["type-safety"];
      const testing = validation.data.testing;

      if (
        typeof bugDetection !== "number" ||
        typeof security !== "number" ||
        typeof maintainability !== "number" ||
        typeof typeSafety !== "number" ||
        typeof testing !== "number"
      ) {
        return { ...DEFAULT_SKILL_SCORES };
      }

      return {
        "bug-detection": Math.min(100, Math.max(0, bugDetection)),
        security: Math.min(100, Math.max(0, security)),
        maintainability: Math.min(100, Math.max(0, maintainability)),
        "type-safety": Math.min(100, Math.max(0, typeSafety)),
        testing: Math.min(100, Math.max(0, testing)),
      };
    } catch {
      return this.memoryFallbackScores
        ? { ...this.memoryFallbackScores }
        : { ...DEFAULT_SKILL_SCORES };
    }
  }

  /**
   * Updates the score for a specific category by delta (default +3).
   * Clamps score between 0 and 100, persists to storage, and returns the result.
   */
  updateScore(
    category: FindingCategory | SkillCategory,
    delta: number = 3
  ): ScoreUpdateResult {
    const skillCategory = mapCategoryToSkillCategory(category);
    const currentScores = this.getScores();
    const oldScore = currentScores[skillCategory];
    const newScore = Math.min(100, Math.max(0, oldScore + delta));

    const updatedScores: SkillScores = {
      ...currentScores,
      [skillCategory]: newScore,
    };

    this.saveScores(updatedScores);

    return {
      oldScore,
      newScore,
      skillCategory,
      updatedScores,
    };
  }

  /**
   * Resets all skill scores back to their default values and persists to storage.
   */
  resetScores(): SkillScores {
    const defaultCopy = { ...DEFAULT_SKILL_SCORES };
    this.saveScores(defaultCopy);
    return defaultCopy;
  }

  private saveScores(scores: SkillScores): void {
    this.memoryFallbackScores = { ...scores };
    try {
      const storage = this.storage;
      if (storage) {
        storage.setItem(this.storageKey, JSON.stringify(scores));
      }
    } catch {
      // Gracefully ignore storage quota or permission errors while keeping in-memory state
    }
  }
}

export const skillService = new SkillService();
