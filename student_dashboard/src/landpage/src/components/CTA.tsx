import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className=" text-white px-6 pt-12 pb-18 max-md:px-[1.15rem]" id="cta">
      <div className="landing-reveal mx-auto flex max-w-[1120px] items-center justify-between gap-8 rounded-[26px] border border-slate-400/60 bg-[radial-gradient(circle_at_0_0,rgba(34,197,94,0.2),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.2),transparent_55%),linear-gradient(135deg,#020617,#020617)] px-8 py-10 shadow-[0_24px_70px_rgba(15,23,42,1)] max-[960px]:flex-col max-[960px]:items-start max-md:px-5">
        <div>
          <h2 className="mb-2 text-2xl font-bold">Join Thousands of Coders Improving Their Skills!</h2>
          <p className="text-sm text-gray-400">
            Build daily discipline, compete in contests, and unlock your dream
            job with Morattu Coder.
          </p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <Link to="/signup" className="relative overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-blue-500 px-5 py-2 text-sm font-medium text-gray-50 no-underline shadow-[0_10px_30px_rgba(34,197,94,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(34,197,94,0.55)]">
            Sign Up Now
          </Link>
          <Link to="/login" className="rounded-full border border-slate-400/80 bg-transparent px-5 py-2 text-sm font-medium text-gray-200 no-underline transition-all duration-300 hover:border-blue-400/90 hover:bg-[radial-gradient(circle,rgba(37,99,235,0.35),transparent)] hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
