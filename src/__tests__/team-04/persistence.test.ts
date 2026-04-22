import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  clearPersistedIntake,
  loadPersistedIntake,
  savePersistedIntake,
} from "@/lib/intake/persistence";
import { makeFixtureIntakeState } from "@/contracts";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

const USER = "user_abc";

beforeEach(() => {
  const storage = new MemoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

describe("intake persistence", () => {
  test("returns null when nothing saved", () => {
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("round-trips the state through localStorage", () => {
    const state = makeFixtureIntakeState({
      make: "Honda",
      model: "Accord",
      titlePreference: "clean",
      matchMode: true,
    });
    savePersistedIntake(USER, state);
    const loaded = loadPersistedIntake(USER);
    expect(loaded?.make).toBe("Honda");
    expect(loaded?.model).toBe("Accord");
    expect(loaded?.titlePreference).toBe("clean");
    expect(loaded?.matchMode).toBe(true);
  });

  test("per-user isolation — userA can't read userB", () => {
    savePersistedIntake("userA", makeFixtureIntakeState({ make: "Honda" }));
    savePersistedIntake("userB", makeFixtureIntakeState({ make: "Ford" }));
    expect(loadPersistedIntake("userA")?.make).toBe("Honda");
    expect(loadPersistedIntake("userB")?.make).toBe("Ford");
  });

  test("clear removes only the target key", () => {
    savePersistedIntake(USER, makeFixtureIntakeState({ make: "Honda" }));
    clearPersistedIntake(USER);
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("malformed JSON resolves to null (not a throw)", () => {
    const win = window as unknown as { localStorage: Storage };
    win.localStorage.setItem(`picknbuild:intake:v1:${USER}`, "not-json");
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("wrong version resolves to null", () => {
    const win = window as unknown as { localStorage: Storage };
    win.localStorage.setItem(
      `picknbuild:intake:v1:${USER}`,
      JSON.stringify({ version: 99, state: makeFixtureIntakeState() }),
    );
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("missing required field resolves to null", () => {
    const win = window as unknown as { localStorage: Storage };
    win.localStorage.setItem(
      `picknbuild:intake:v1:${USER}`,
      JSON.stringify({
        version: 1,
        state: { location: { zip: "43210" } },
      }),
    );
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("invalid titlePreference resolves to null", () => {
    const win = window as unknown as { localStorage: Storage };
    const state = { ...makeFixtureIntakeState(), titlePreference: "nope" };
    win.localStorage.setItem(
      `picknbuild:intake:v1:${USER}`,
      JSON.stringify({ version: 1, state }),
    );
    expect(loadPersistedIntake(USER)).toBeNull();
  });

  test("no-op when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => savePersistedIntake(USER, makeFixtureIntakeState())).not.toThrow();
    expect(loadPersistedIntake(USER)).toBeNull();
    expect(() => clearPersistedIntake(USER)).not.toThrow();
  });
});
