// new: ts/src/games/house_of_kings_collab/components/HowItWorks.tsx
import React from 'react';
import { HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_STEPS, HOW_IT_WORKS_NOTE } from '../howItWorks';

/** Static exhibit: needs no sign-in and no backend. */
export const HowItWorks: React.FC = () => (
  <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5" aria-labelledby="hok-how-it-works">
    <h2 id="hok-how-it-works" className="text-xl sm:text-2xl font-bold text-amber-100">
      {HOW_IT_WORKS_HEADING}
    </h2>
    <p className="text-sm text-slate-300 leading-relaxed">{HOW_IT_WORKS_INTRO}</p>
    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
      {HOW_IT_WORKS_STEPS.map((step, i) => (
        <li key={step.title} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs">
            {i + 1}
          </span>
          <span className="font-bold text-slate-200 block">{step.title}</span>
          <p className="text-slate-400">{step.body}</p>
        </li>
      ))}
    </ol>
    <p className="text-xs text-slate-500">{HOW_IT_WORKS_NOTE}</p>
  </section>
);
