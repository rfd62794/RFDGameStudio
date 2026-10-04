// new: examples/bpo-sim/src/components/CountrySelectScreen.tsx
import React from 'react';
import type { CountryProfile } from '../data/countries';
import { attributeRows } from '../systems/countrySystem';

interface Props {
  countries: ReadonlyArray<CountryProfile>;
  onChoose: (countryId: string) => void;
}

/** Shown before the first shift. Every country has strengths and trade-offs; there is no wrong choice. */
export const CountrySelectScreen: React.FC<Props> = ({ countries, onChoose }) => (
  <div
    className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 sm:p-8 text-slate-100"
    data-testid="country-select"
  >
    <div className="mx-auto max-w-5xl">
      <h1 className="font-pixel text-sm sm:text-base text-sky-300 tracking-wide">CHOOSE WHERE YOUR OPERATION RUNS</h1>
      <p className="mt-2 text-xs sm:text-sm text-slate-300">
        Every location has strengths and trade-offs. Pick the one that suits how you want to play; you can start over from Settings to try another.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => onChoose(c.id)}
            className="text-left rounded-xl border-2 border-slate-700 bg-slate-900 p-4 hover:border-sky-400 hover:bg-slate-800 transition cursor-pointer"
            data-testid={`country-${c.id}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-sky-300">{c.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{c.region}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-snug">{c.blurb}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {attributeRows(c).map((row) => (
                <div key={row.key} className="flex justify-between gap-2">
                  <dt className="text-slate-400">{row.label}</dt>
                  <dd className="font-semibold text-slate-100">{row.level}</dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </div>
  </div>
);
