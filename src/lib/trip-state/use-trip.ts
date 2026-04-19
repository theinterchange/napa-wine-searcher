"use client";

import { useCallback, useReducer, useRef } from "react";
import { applyMutation } from "./reducer";
import type { Trip, TripMutation } from "./types";

type HistoryEntry = { inverse: TripMutation };

type State = {
  trip: Trip;
  history: HistoryEntry[];
  future: HistoryEntry[];
  pending: TripMutation[];
};

type Action =
  | { type: "apply"; mutation: TripMutation; queue: boolean }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "set_trip"; trip: Trip }
  | { type: "clear_pending" };

const MAX_HISTORY = 25;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "apply": {
      const result = applyMutation(state.trip, action.mutation);
      if (!result.inverse) return state;
      const history = [...state.history, { inverse: result.inverse }].slice(
        -MAX_HISTORY
      );
      return {
        trip: result.next,
        history,
        future: [],
        pending: action.queue
          ? [...state.pending, action.mutation]
          : state.pending,
      };
    }
    case "undo": {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      const result = applyMutation(state.trip, last.inverse);
      return {
        trip: result.next,
        history: state.history.slice(0, -1),
        future: result.inverse
          ? [...state.future, { inverse: result.inverse }]
          : state.future,
        pending: state.pending,
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const last = state.future[state.future.length - 1];
      const result = applyMutation(state.trip, last.inverse);
      return {
        trip: result.next,
        history: result.inverse
          ? [...state.history, { inverse: result.inverse }]
          : state.history,
        future: state.future.slice(0, -1),
        pending: state.pending,
      };
    }
    case "set_trip":
      return { trip: action.trip, history: [], future: [], pending: [] };
    case "clear_pending":
      return { ...state, pending: [] };
  }
}

export function useTrip(initial: Trip) {
  const [state, dispatch] = useReducer(reducer, {
    trip: initial,
    history: [],
    future: [],
    pending: [],
  });

  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback(
    (mutation: TripMutation, options?: { queueForSync?: boolean }) => {
      dispatch({
        type: "apply",
        mutation,
        queue: options?.queueForSync ?? true,
      });
    },
    []
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const setTrip = useCallback(
    (trip: Trip) => dispatch({ type: "set_trip", trip }),
    []
  );
  const clearPending = useCallback(
    () => dispatch({ type: "clear_pending" }),
    []
  );

  const scheduleFlush = useCallback(
    (flushFn: () => Promise<void> | void, delayMs = 600) => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = setTimeout(() => {
        void flushFn();
      }, delayMs);
    },
    []
  );

  return {
    trip: state.trip,
    pending: state.pending,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    apply,
    undo,
    redo,
    setTrip,
    clearPending,
    scheduleFlush,
  };
}
