import { Flame, Trophy } from "lucide-react";

interface StreakCalendarProps {
  streak: number;
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
  // Let's create a 7-day sliding window ending today
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Real logic would parse dates from activityLog. 
  // Here we just light up the previous N days based on current streak (capped at 7)
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 

  const windowStartStreak = Math.min(streak || 0, 7);
  
  return (
    <div className="bg-white border border-slate-200 shadow-xl flex h-full flex-col rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      
      {/* Flame ambient glow if streak > 0 */}
      {streak > 0 && (
        <div className="pointer-events-none absolute right-0 top-0 opacity-20 blur-3xl">
          <div className="h-64 w-64 rounded-full bg-orange-200 mix-blend-multiply" />
        </div>
      )}

      <div className="mb-8 flex items-center justify-between z-10">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            Streak calendar — this week
          </h3>
          <p className="text-sm font-medium text-slate-500">
            Keep the fire burning!
          </p>
        </div>
        
        <div className="flex h-12 w-auto min-w-12 px-3 items-center justify-center gap-2 rounded-full border border-orange-100 bg-orange-50 text-orange-600 shadow-sm backdrop-blur-md">
          <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
          <span className="font-bold text-lg">{streak}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6 z-10 w-full mb-6">
        <div className="flex justify-between w-full">
          {days.map((dayLabel, idx) => {
             // Mock logic: light it up if streak covers this day index relative to today
             // This is purely visual. For a real app, map over exact dates.
             const daysAgo = (todayIndex - idx + 7) % 7;
             const isLit = daysAgo < windowStartStreak;
             const isToday = idx === todayIndex;

             return (
               <div key={dayLabel} className="flex flex-col items-center gap-3">
                 <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                   {dayLabel}
                 </div>
                 <div 
                   className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-all duration-500
                   ${isLit 
                    ? 'border-orange-200 bg-orange-50 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                   } 
                   ${isToday ? 'ring-2 ring-primary-500/30 ring-offset-2 ring-offset-white' : ''}
                   `}
                 >
                   {isLit ? (
                     <Flame className="h-6 w-6 text-orange-600 fill-orange-500/80 animate-pulse" />
                   ) : (
                     <div className="h-2 w-2 rounded-full bg-slate-200" />
                   )}
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
             <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Next Milestone</h4>
            <div className="text-xs text-slate-500">Reach 7 days for a badge.</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600">
             {windowStartStreak}/7
          </div>
        </div>
      </div>

    </div>
  );
}
