export default function Topics() {
  const topics = [
    { iconBg: "bg-gradient-to-br from-green-500 to-green-600", title: "Data Structures", desc: "Master arrays, trees, graphs, and more." },
    { iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500", title: "Algorithms", desc: "Learn sorting, searching, greedy & more." },
    { iconBg: "bg-gradient-to-br from-purple-500 to-pink-500", title: "Dynamic Programming", desc: "Crack complex problems with DP patterns." },
    { iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-400", title: "SQL", desc: "Query, analyze, and manage relational data." },
    { iconBg: "bg-gradient-to-br from-orange-500 to-orange-600", title: "Java", desc: "Practice OOP and backend-focused problems." },
    { iconBg: "bg-gradient-to-br from-yellow-500 to-green-500", title: "Python", desc: "Fast prototyping and interview favorites." },
  ];

  return (
    <section className=" text-white px-6 py-18 max-md:px-[1.15rem]" id="topics">
      <div className="landing-reveal mb-11 text-center">
        <h2 className="mb-2.5 text-[1.6rem] font-bold">Popular Topics</h2>
        <p className="text-[0.95rem] text-gray-400">Sharpen your skills on the most asked topics in coding interviews.</p>
      </div>
      <div className="mx-auto grid max-w-[1120px] grid-cols-3 gap-5 max-[960px]:grid-cols-2 max-md:grid-cols-1">
        {topics.map((t, i) => (
          <div
            key={i}
            className="landing-reveal relative overflow-hidden rounded-2xl border border-gray-800/90 bg-[radial-gradient(circle_at_top_left,#020617,#020617)] p-5 transition-all duration-300 before:pointer-events-none before:absolute before:inset-[-40%] before:bg-[conic-gradient(from_160deg,rgba(34,197,94,0.2),rgba(59,130,246,0.2),rgba(168,85,247,0.28),transparent)] before:opacity-0 before:transition-opacity before:duration-[350ms] hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500/90 hover:shadow-[0_24px_60px_rgba(15,23,42,0.95)] hover:before:opacity-100"
          >
            <div className={`mb-3.5 h-10 w-10 rounded-xl ${t.iconBg}`}></div>
            <h3 className="mb-1 text-[0.98rem] font-bold">{t.title}</h3>
            <p className="text-[0.85rem] text-gray-400">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
