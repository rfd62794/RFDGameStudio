import React from 'react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  onRunTraining: (moduleTitle: string, cost: number, skillType: 'english' | 'empathy' | 'tech' | 'speed', amount: number) => void;
}

interface TrainingCourse {
  id: string;
  title: string;
  category: string;
  cost: number;
  duration: string;
  icon: string;
  skillType: 'english' | 'empathy' | 'tech' | 'speed';
  boostAmount: number;
  description: string;
}

export const TrainingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  onRunTraining,
}) => {
  if (!isOpen) return null;

  const courses: TrainingCourse[] = [
    {
      id: 'accent',
      title: 'American & British Accent Neutralization',
      category: 'Language & Voice',
      cost: 14000,
      duration: '4 Hours',
      icon: '🗣️',
      skillType: 'english',
      boostAmount: 12,
      description: 'Phonetics coaching, tongue placement, intonation, and idiom comprehension for US/UK callers.',
    },
    {
      id: 'empathy',
      title: 'Empathy & De-escalating Angry US Callers',
      category: 'Customer Experience',
      cost: 12000,
      duration: '3 Hours',
      icon: '🛡️',
      skillType: 'empathy',
      boostAmount: 15,
      description: 'Mastering apologies without admitting fault, defusing verbal attacks, and earning 5-star CSAT surveys.',
    },
    {
      id: 'tech',
      title: 'Tier 2 Cloud & Hardware Diagnostic Bootcamp',
      category: 'Technical Support',
      cost: 18000,
      duration: '6 Hours',
      icon: '💻',
      skillType: 'tech',
      boostAmount: 16,
      description: 'Rapid command-line diagnostics, network troubleshooting, and router reset SOPs to cut AHT by 40 seconds.',
    },
    {
      id: 'speed',
      title: 'Touch Typing & CRM Shortcuts Accelerator',
      category: 'Productivity',
      cost: 9500,
      duration: '2 Hours',
      icon: '⚡',
      skillType: 'speed',
      boostAmount: 14,
      description: 'Zendesk, Salesforce and Avaya keyboard shortcuts. Eliminates dead air and speeds up after-call work (ACW).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-yellow-500 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏅</span>
            <div>
              <h2 className="font-bold text-lg text-yellow-400 tracking-wide uppercase font-pixel text-xs">
                BPO TRAINING ACADEMY & CERTIFICATIONS
              </h2>
              <p className="text-xs text-slate-400">Upgrade your agents' voice neutrality, empathy, and diagnostic speed</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Courses List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {courses.map((course) => {
            const canAfford = money >= course.cost;

            return (
              <div
                key={course.id}
                className="bg-slate-800/80 border border-slate-700 hover:border-yellow-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {course.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-100 text-sm">{course.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800 font-semibold">
                        {course.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">{course.description}</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        +{course.boostAmount}% Floor {course.skillType.toUpperCase()} Skill
                      </span>
                      <span className="text-slate-400">Duration: {course.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
                  <span className="font-bold text-amber-300 text-sm">
                    ₱ {course.cost.toLocaleString()}
                  </span>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      sounds.playCash();
                      onRunTraining(course.title, course.cost, course.skillType, course.boostAmount);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      canAfford
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-slate-950 shadow-md active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Enroll Floor' : 'No Funds'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
