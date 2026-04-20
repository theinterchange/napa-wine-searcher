type ActionType =
  | "favorite"
  | "visited"
  | "collection"
  | "journal"
  | "tried-it"
  | "save-trip"
  | "rate-winery"
  | "rate-accommodation";

interface PendingAction {
  type: ActionType;
  id: number;
  timestamp: number;
  payload?: Record<string, unknown>;
}

const STORAGE_KEY = "pendingAction";
const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function setPendingAction(
  type: ActionType,
  id: number,
  payload?: Record<string, unknown>
): void {
  try {
    const action: PendingAction = {
      type,
      id,
      timestamp: Date.now(),
      ...(payload && { payload }),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action));
  } catch {
    // sessionStorage unavailable (SSR, private browsing edge cases)
  }
}

export function consumePendingAction(
  type: ActionType,
  id: number
): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const action: PendingAction = JSON.parse(raw);

    if (Date.now() - action.timestamp > EXPIRY_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (action.type === type && action.id === id) {
      sessionStorage.removeItem(STORAGE_KEY);
      return action;
    }

    return null;
  } catch {
    return null;
  }
}
