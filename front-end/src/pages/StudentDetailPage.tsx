import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { userService } from "@/services";
import { 
  ArrowLeft, 
  Mail, 
  Building2, 
  GraduationCap, 
  Activity, 
  Award,
  TrendingUp,
  Target,
  Trophy,
  CheckCircle2,
  Star
} from "lucide-react";
import { Button, Badge, Avatar, Spinner } from "@/components/ui";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [studentStats, setStudentStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [contests, setContests] = useState<any[]>([]);
  const [loadingContests, setLoadingContests] = useState(false);

  const { data: user, loading: loadingUser } = useApi(
    () => userService.getUserById(id!),
    [id]
  );

  useEffect(() => {
    if (id) {
      setLoadingStats(true);
      userService.getUserStats(id)
        .then(res => setStudentStats(res.data.data))
        .catch(() => setStudentStats(null))
        .finally(() => setLoadingStats(false));

      setLoadingContests(true);
      userService.getUserContests(id)
        .then(res => setContests(res.data.data || []))
        .catch(() => setContests([]))
        .finally(() => setLoadingContests(false));
    }
  }, [id]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-6">The student you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/students")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/students")}
          className="bg-white"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Students
        </Button>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 absolute top-0 left-0 right-0" />
        
        <div className="px-8 pb-8 pt-20 relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="p-1.5 bg-white rounded-2xl shadow-lg">
             <Avatar name={user.name} size="lg" className="rounded-xl h-24 w-24 text-2xl font-bold" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
              <Badge variant={user.isActive ? "success" : "danger"} className="uppercase tracking-widest text-[10px] font-black">
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
              {user.department && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {user.department}</span>}
              {user.passoutYear && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> Class of {user.passoutYear}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Stats Overview */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Activity className="h-4 w-4 text-primary-500" /> Platform Stats
             </h3>
             
             <div className="space-y-4">
               <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                 <div>
                   <p className="text-xs font-semibold text-gray-500 uppercase">Total Points</p>
                   <p className="text-xl font-black text-gray-900 mt-1">{user.points || 0}</p>
                 </div>
                 <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                   <Star className="h-5 w-5 text-amber-500" />
                 </div>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                 <div>
                   <p className="text-xs font-semibold text-gray-500 uppercase">Current Streak</p>
                   <p className="text-xl font-black text-gray-900 mt-1">{user.streak || 0} <span className="text-sm text-gray-500 font-medium lowercase">days</span></p>
                 </div>
                 <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                   <TrendingUp className="h-5 w-5 text-orange-500" />
                 </div>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                 <div>
                   <p className="text-xs font-semibold text-gray-500 uppercase">Max Streak</p>
                   <p className="text-xl font-black text-gray-900 mt-1">{user.maxStreak || 0} <span className="text-sm text-gray-500 font-medium lowercase">days</span></p>
                 </div>
                 <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                   <Award className="h-5 w-5 text-purple-500" />
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column - Dashboard Performance */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
               <Target className="h-4 w-4 text-primary-500" /> Performance Analytics
            </h3>
            
            {loadingStats ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : studentStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50 relative overflow-hidden group hover:border-blue-200 transition-colors">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <CheckCircle2 className="h-16 w-16 text-blue-600" />
                   </div>
                   <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 relative z-10">Problems Solved</p>
                   <p className="text-3xl font-black text-slate-900 relative z-10">{studentStats.problemsSolved}</p>
                </div>
                
                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/50 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Trophy className="h-16 w-16 text-emerald-600" />
                   </div>
                   <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Total XP Earned</p>
                   <p className="text-3xl font-black text-slate-900 relative z-10">{studentStats.totalXp}</p>
                </div>
                
                <div className="bg-violet-50/50 rounded-xl p-5 border border-violet-100/50 relative overflow-hidden group hover:border-violet-200 transition-colors">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Award className="h-16 w-16 text-violet-600" />
                   </div>
                   <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1 relative z-10">Global Rank</p>
                   <p className="text-3xl font-black text-slate-900 relative z-10">#{studentStats.globalRank}</p>
                </div>
                
                <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-100/50 relative overflow-hidden group hover:border-rose-200 transition-colors">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Target className="h-16 w-16 text-rose-600" />
                   </div>
                   <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1 relative z-10">Acceptance Rate</p>
                   <p className="text-3xl font-black text-slate-900 relative z-10">{studentStats.acceptance}%</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                Could not load dashboard statistics for this student.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Row - Contest Participations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
           <Trophy className="h-4 w-4 text-primary-500" /> Contest Participations
        </h3>
        
        {loadingContests ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : contests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Contest Title</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Questions Solved</th>
                  <th className="px-4 py-3 rounded-r-lg">Date Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contests.map((submission) => (
                  <tr key={submission._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{submission.contest?.title || 'Unknown Contest'}</td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        submission.contest?.difficulty === 'Hard' ? 'danger' :
                        submission.contest?.difficulty === 'Medium' ? 'warning' : 'success'
                      }>
                        {submission.contest?.difficulty || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-semibold text-primary-600">{submission.score} pts</td>
                    <td className="px-4 py-4">
                      {submission.solvedCount} / {submission.totalQuestions || '-'}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {new Date(submission.startedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm bg-slate-50 rounded-xl border border-slate-100 border-dashed">
            This student has not participated in any contests yet.
          </div>
        )}
      </div>
    </div>
  );
}
