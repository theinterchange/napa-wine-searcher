"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, X, Search, Check } from "lucide-react";

interface Assignment {
  id: number;
  slug: string;
  name: string;
  spotlightYearMonth: string | null;
}

interface PoolEntry {
  id: number;
  slug: string;
  name: string;
  subRegion: string | null;
}

interface Month {
  ym: string;
  label: string;
  monthIdx: number;
}

type EntityKind = "winery" | "hotel";

interface Props {
  months: Month[];
  wineryAssignments: Assignment[];
  wineryPool: PoolEntry[];
  accommodationAssignments: Assignment[];
  accommodationPool: PoolEntry[];
}

export function SpotlightCalendar({
  months,
  wineryAssignments,
  wineryPool,
  accommodationAssignments,
  accommodationPool,
}: Props) {
  const [wineries, setWineries] = useState(wineryAssignments);
  const [hotels, setHotels] = useState(accommodationAssignments);
  const [modal, setModal] = useState<{ kind: EntityKind; ym: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wineryMap = useMemo(
    () => new Map(wineries.map((w) => [w.spotlightYearMonth!, w])),
    [wineries]
  );
  const hotelMap = useMemo(
    () => new Map(hotels.map((a) => [a.spotlightYearMonth!, a])),
    [hotels]
  );

  function autoPickWinery(monthIdx: number) {
    if (wineryPool.length === 0) return null;
    return wineryPool[monthIdx % wineryPool.length];
  }

  function autoPickHotel(monthIdx: number) {
    if (accommodationPool.length === 0) return null;
    return accommodationPool[monthIdx % accommodationPool.length];
  }

  async function assign(kind: EntityKind, id: number, ym: string | null) {
    setBusy(true);
    setError(null);
    const endpoint = kind === "winery" ? "wineries" : "accommodations";
    const res = await fetch(`/api/admin/${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotlightYearMonth: ym }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Could not save assignment");
      setBusy(false);
      return false;
    }

    // Update local state
    if (kind === "winery") {
      // First clear any existing assignment for this YM
      setWineries((prev) => {
        const filtered = ym
          ? prev.filter((w) => !(w.id !== id && w.spotlightYearMonth === ym))
          : prev;
        // Update or add
        const exists = filtered.find((w) => w.id === id);
        if (exists) {
          return filtered.map((w) =>
            w.id === id ? { ...w, spotlightYearMonth: ym } : w
          ).filter((w) => w.spotlightYearMonth !== null);
        }
        if (ym) {
          // Need full entity info — find it in pool
          const fromPool = wineryPool.find((p) => p.id === id);
          if (fromPool) {
            return [...filtered, { ...fromPool, spotlightYearMonth: ym }];
          }
        }
        return filtered;
      });
    } else {
      setHotels((prev) => {
        const filtered = ym
          ? prev.filter((a) => !(a.id !== id && a.spotlightYearMonth === ym))
          : prev;
        const exists = filtered.find((a) => a.id === id);
        if (exists) {
          return filtered.map((a) =>
            a.id === id ? { ...a, spotlightYearMonth: ym } : a
          ).filter((a) => a.spotlightYearMonth !== null);
        }
        if (ym) {
          const fromPool = accommodationPool.find((p) => p.id === id);
          if (fromPool) {
            return [...filtered, { ...fromPool, spotlightYearMonth: ym }];
          }
        }
        return filtered;
      });
    }
    setBusy(false);
    return true;
  }

  async function handleClear(kind: EntityKind, ym: string) {
    const map = kind === "winery" ? wineryMap : hotelMap;
    const current = map.get(ym);
    if (!current) return;
    const ok = await assign(kind, current.id, null);
    if (ok) setModal(null);
  }

  async function handlePick(kind: EntityKind, ym: string, id: number) {
    const ok = await assign(kind, id, ym);
    if (ok) setModal(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CalendarColumn
          title="Winery spotlight"
          poolSize={wineryPool.length}
          months={months}
          getCurrent={(ym) => wineryMap.get(ym) ?? null}
          getAuto={(monthIdx) => autoPickWinery(monthIdx)}
          onClickMonth={(ym) => setModal({ kind: "winery", ym })}
          entityHrefBase="/wineries"
        />
        <CalendarColumn
          title="Hotel spotlight"
          poolSize={accommodationPool.length}
          months={months}
          getCurrent={(ym) => hotelMap.get(ym) ?? null}
          getAuto={(monthIdx) => autoPickHotel(monthIdx)}
          onClickMonth={(ym) => setModal({ kind: "hotel", ym })}
          entityHrefBase="/where-to-stay"
        />
      </div>

      <div className="mt-8 card-flat p-4 text-[12px] text-[var(--ink-2)] leading-relaxed">
        <p>
          To change the auto-rotation pool, toggle{" "}
          <strong>Curated</strong> on rows in the wineries or hotels admin tables.
          The homepage uses ISR with a 24-hour revalidation window — changes take
          up to a day to appear unless you redeploy.
        </p>
      </div>

      {modal && (
        <AssignModal
          kind={modal.kind}
          ym={modal.ym}
          currentAssignment={
            modal.kind === "winery"
              ? wineryMap.get(modal.ym) ?? null
              : hotelMap.get(modal.ym) ?? null
          }
          pool={modal.kind === "winery" ? wineryPool : accommodationPool}
          onClose={() => {
            setModal(null);
            setError(null);
          }}
          onPick={(id) => handlePick(modal.kind, modal.ym, id)}
          onClear={() => handleClear(modal.kind, modal.ym)}
          busy={busy}
          error={error}
        />
      )}
    </>
  );
}

function CalendarColumn({
  title,
  poolSize,
  months,
  getCurrent,
  getAuto,
  onClickMonth,
  entityHrefBase,
}: {
  title: string;
  poolSize: number;
  months: Month[];
  getCurrent: (ym: string) => Assignment | null;
  getAuto: (monthIdx: number) => PoolEntry | null;
  onClickMonth: (ym: string) => void;
  entityHrefBase: string;
}) {
  return (
    <section>
      <h2 className="editorial-h2 text-[20px] mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[var(--brass)]" />
        {title}
        <span className="ml-auto font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] font-normal">
          Pool: {poolSize}
        </span>
      </h2>

      <div className="border-t-2 border-[var(--brass)] bg-[var(--paper-2)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--rule)] bg-[var(--paper)]">
              <th className="text-left px-4 py-2.5 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold text-[var(--ink)] w-28">Month</th>
              <th className="text-left px-4 py-2.5 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold text-[var(--ink)]">Spotlight</th>
              <th className="text-right px-4 py-2.5 font-mono text-[10.5px] tracking-[0.14em] uppercase font-semibold text-[var(--ink)] w-20">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rule-soft)]">
            {months.map(({ ym, label, monthIdx }) => {
              const manual = getCurrent(ym);
              const auto = manual ? null : getAuto(monthIdx);
              const entry = manual ?? auto;

              return (
                <tr
                  key={ym}
                  className="hover:bg-[var(--paper)] transition-colors cursor-pointer"
                  onClick={() => onClickMonth(ym)}
                >
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--ink-2)]">{label}</td>
                  <td className={`px-4 py-2.5 ${manual ? "text-[var(--ink)]" : "text-[var(--ink-3)]"}`}>
                    {entry ? (
                      <span className="inline-flex items-center gap-1.5">
                        {entry.name}
                        <Link
                          href={`${entityHrefBase}/${entry.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--brass-2)] hover:text-[var(--ink)]"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </span>
                    ) : (
                      <span className="italic">
                        {poolSize === 0 ? "no curated entries yet" : "auto: pool empty"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {manual ? (
                      <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold bg-[var(--brass)] text-[var(--paper)]">
                        Manual
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                        Auto
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssignModal({
  kind,
  ym,
  currentAssignment,
  pool,
  onClose,
  onPick,
  onClear,
  busy,
  error,
}: {
  kind: EntityKind;
  ym: string;
  currentAssignment: Assignment | null;
  pool: PoolEntry[];
  onClose: () => void;
  onPick: (id: number) => void;
  onClear: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return pool;
    const q = search.toLowerCase();
    return pool.filter(
      (p) => p.name.toLowerCase().includes(q) || p.subRegion?.toLowerCase().includes(q)
    );
  }, [pool, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/60" onClick={onClose}>
      <div
        className="card-flat w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--rule)]">
          <div>
            <span className="kicker">Assign · {ym}</span>
            <h2 className="editorial-h2 text-[22px] mt-1">
              {kind === "winery" ? "Pick a winery" : "Pick a hotel"}
            </h2>
            {currentAssignment ? (
              <p className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-2)] mt-2">
                Currently assigned: <strong className="not-italic text-[var(--ink)]">{currentAssignment.name}</strong>
              </p>
            ) : (
              <p className="font-[var(--font-serif-text)] text-[13px] text-[var(--ink-2)] mt-2">
                No manual assignment for this month.
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 border-b border-[var(--rule-soft)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)]" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search curated pool..."
              className="input-editorial pl-9"
            />
          </div>
          {error && (
            <p className="mt-3 border border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        <ul className="overflow-y-auto flex-1 divide-y divide-[var(--rule-soft)]">
          {filtered.length === 0 ? (
            <li className="p-5 text-center font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              {pool.length === 0
                ? `No curated ${kind === "winery" ? "wineries" : "hotels"} yet. Curate some first.`
                : "No matches."}
            </li>
          ) : (
            filtered.map((p) => {
              const isCurrent = currentAssignment?.id === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onPick(p.id)}
                    disabled={busy || isCurrent}
                    className="w-full text-left p-4 hover:bg-[var(--paper)] transition-colors disabled:opacity-60 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-[var(--font-heading)] text-[15px] text-[var(--ink)] truncate">{p.name}</p>
                      {p.subRegion && (
                        <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)] mt-0.5">
                          {p.subRegion}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase font-semibold bg-[var(--ink)] text-[var(--paper)]">
                        <Check className="h-3 w-3" />
                        Current
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {currentAssignment && (
          <div className="p-4 border-t border-[var(--rule)] flex justify-end">
            <button
              onClick={onClear}
              disabled={busy}
              className="font-mono text-[10.5px] tracking-[0.18em] uppercase border border-[var(--ink)] px-3 py-1.5 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors disabled:opacity-50"
            >
              Clear assignment (revert to auto)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
