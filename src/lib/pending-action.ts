type ActionType = "favorite" | "visited" | "collection" | "journal" | "tried-it" | "save-trip";

interface PendingAction {
  type: ActionType;
  id: number;
  timestamp: number;
}

const STORAGE_KEY = "pendingAction";
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function setPendingAction(type: ActionType, id: number): void {
  try {
    const action: PendingAction = { type, id, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action));
  } catch {
    // sessionStorage unavailable (SSR, private browsing edge cases)
  }
}

export function consumePendingAction(type: ActionType, id: number): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const action: PendingAction = JSON.parse(raw);

    if (Date.now() - action.timestamp > EXPIRY_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return false;
    }

    if (action.type === type && action.id === id) {
      sessionStorage.removeItem(STORAGE_KEY);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
