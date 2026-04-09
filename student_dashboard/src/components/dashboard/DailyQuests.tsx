import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, Target, Flame, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Target,
  CheckCircle2
};

export function DailyQuests() {
  const { updateUserLocally } = useAuth();
  
  const [claimedIds, setClaimedIds] = useState<number[]>([]);
  const [isClaiming, setIsClaiming] = useState<number | null>(null);

  const fetchQuests = useCallback(() => authService.getDailyQuests(), []);
  const { data: quests, loading } = useApi<{ id: number; title: string; desc: string; xp: number; completed: boolean; iconName: string }[]>(fetchQuests, []);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`claimed_quests_${today}`);
    if (stored) {
      setClaimedIds(JSON.parse(stored));
    }
  }, []);

  const handleClaim = async (questId: number, xp: number) => {
    if (claimedIds.includes(questId)) return;
    
    setIsClaiming(questId);
    try {
      const res = await authService.claimXp(xp);
      if (res.data.success && res.data.data) {
        updateUserLocally(res.data.data);
        
        const newClaimedIds = [...claimedIds, questId];
        setClaimedIds(newClaimedIds);
        
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`claimed_quests_${today}`, JSON.stringify(newClaimedIds));
        
        toast.success(`+${xp} XP Claimed! Keep going!`, { icon: '✨' });
      }
    } catch (err) {
      toast.error("Failed to claim XP");
    } finally {
      setIsClaiming(null);
    }
  };

  const safeQuests = quests || [];
  const totalCompleted = safeQuests.filter((q) => q.completed).length;
  const progressPercent = safeQuests.length > 0 ? Math.round((totalCompleted / safeQuests.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 shadow-xl flex h-full flex-col rounded-3xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            Daily Quests
          </h3>
          {!loading ? (
            <p className="text-sm font-medium text-slate-500">
              {totalCompleted} / {safeQuests.length} completed
            </p>
          ) : (
            <div className="h-4 w-24 rounded bg-slate-100 animate-pulse mt-1" />
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-100 bg-primary-50 text-primary-600">
          <Target className="h-6 w-6" />
        </div>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-50 border border-slate-100 shadow-inner">
        <div
          className="bg-linear-to-r from-primary-600 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {loading ? (
          // Skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-6 w-6 rounded-full bg-slate-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-40 rounded bg-slate-200/80 animate-pulse" />
                </div>
                <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
          ))
        ) : (
          safeQuests.map((quest) => {
            const isClaimed = claimedIds.includes(quest.id);
            const canClaim = quest.completed && !isClaimed;
            const isLoad = isClaiming === quest.id;
            const IconComponent = ICON_MAP[quest.iconName] || Circle;

            return (
              <div
                key={quest.id}
                onClick={() => canClaim && !isLoad && handleClaim(quest.id, quest.xp)}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                  canClaim 
                    ? "border-primary-300 bg-primary-50 cursor-pointer hover:bg-primary-100 shadow-sm ring-1 ring-primary-200"
                    : isClaimed
                    ? "border-emerald-100 bg-emerald-50 cursor-default"
                    : "border-slate-200 bg-white shadow-sm cursor-default"
                }`}
              >
                <div className={`shrink-0 ${isClaimed ? 'text-emerald-400' : quest.completed ? 'text-primary-400' : 'text-slate-600'}`}>
                  {isClaimed ? (
                    <Sparkles className="h-6 w-6 fill-emerald-500/20 text-emerald-400 animate-pulse" />
                  ) : quest.completed ? (
                    <CheckCircle2 className="h-6 w-6 fill-primary-500/20 text-primary-400" />
                  ) : (
                    <IconComponent className="h-6 w-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${isClaimed ? "text-emerald-700" : quest.completed ? "text-primary-700" : "text-slate-900"}`}>
                    {quest.title}
                  </h4>
                  <p className="text-xs text-slate-500">{quest.desc}</p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span 
                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      isClaimed 
                        ? 'text-emerald-500' 
                        : canClaim 
                        ? 'text-primary-400 animate-bounce' 
                        : 'text-slate-500'
                    }`}
                  >
                    {isLoad ? '...' : isClaimed ? 'Claimed' : canClaim ? 'Claim XP' : `+${quest.xp} XP`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="flex w-full items-center justify-center gap-2 mt-6 py-4 font-bold hover:border-primary-500 group border-slate-200 hover:text-primary-600 border text-slate-700 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 active:scale-95">
        View All Quests
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
