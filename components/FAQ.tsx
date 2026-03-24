import React, { useEffect } from 'react';
import { ArrowLeft, LayoutGrid, HelpCircle } from 'lucide-react';

export type FaqItem = {
  question: string;
  answer: string;
};

/** 20 SEO-oriented Q&As for “football lineup builder” and related intents */
export const FOOTBALL_LINEUP_BUILDER_FAQ: FaqItem[] = [
  {
    question: 'What is a football lineup builder?',
    answer:
      'A football lineup builder is a digital tool that lets coaches place players on a pitch, pick formations, and communicate who starts, who is on the bench, and how the team is shaped. Unlike a static image, a good lineup builder lets you adjust roles, phases of play, and details quickly as your squad or tactics change.',
  },
  {
    question: 'Why use a digital lineup builder instead of pen and paper?',
    answer:
      'A digital football lineup builder reduces errors, saves time on match day, and makes it easy to duplicate or tweak lineups for different opponents. You can store multiple versions, share a clean visual with your team, and update names or positions without redrawing the whole board.',
  },
  {
    question: 'What formations can I build with Taptics?',
    answer:
      'Taptics supports multiple team sizes and common football formations so you can mirror how your side actually plays. You can switch between formats such as 11v11, 9v9, 8v8, and 7v7 and align your tactical slots to your preferred system as you plan each match.',
  },
  {
    question: 'What is the difference between in-possession and out-of-possession lineups?',
    answer:
      'In-possession shows how you want to attack and circulate the ball; out-of-possession shows your defensive shape and pressing triggers. Using both in a lineup builder helps players see the transition: how positions shift when you win or lose the ball.',
  },
  {
    question: 'How many lineup drafts can I save at once?',
    answer:
      'Taptics lets you work with multiple drafts so you can compare plans—for example one lineup for your first choice XI and alternatives for injuries or different opponents. That makes your football lineup workflow closer to how real coaching staffs prepare scenarios.',
  },
  {
    question: 'How do I share my football lineup with players or staff?',
    answer:
      'You can generate a shareable view of your setup so players and coaches can open your lineup in the browser. This is useful for WhatsApp groups, email, or pre-match briefings when everyone needs the same starting picture.',
  },
  {
    question: 'Is Taptics free to use?',
    answer:
      'Taptics is built as a free web app for building football lineups and related coaching workflows. You can explore the lineup builder and tools without a paid subscription; creating an account can help sync certain data where that feature is available.',
  },
  {
    question: 'Can I use a football lineup builder on my phone?',
    answer:
      'The tactics editor is designed for desktop browsers for the best drag-and-drop experience. On smaller screens you may see a notice to use a computer so that moving players and editing reliably matches how the lineup builder is meant to work.',
  },
  {
    question: 'How does a minutes log help with playing time?',
    answer:
      'A minutes log helps you track how much each player has played across matches and seasons. For youth football in particular, balancing minutes fairly and monitoring load is easier when your records live next to your lineup planning.',
  },
  {
    question: 'What is the set pieces tool and who is it for?',
    answer:
      'The set pieces area is for designing corners, free kicks, and other dead-ball situations on a focused view of the box. Coaches who treat set pieces as match-deciding moments can sketch routines the same way they build open-play lineups.',
  },
  {
    question: 'Can I design training drills in Taptics?',
    answer:
      'Yes—there is a dedicated drills workspace for session design alongside your lineup builder. That helps you keep tactical ideas, training content, and matchday lineups in one coaching toolkit.',
  },
  {
    question: 'How do player names stay consistent across drafts?',
    answer:
      'When you rename a player in one draft, the same player can be updated across your other drafts so your football lineup stays consistent. That avoids mismatched names when you copy ideas between scenarios or share lineups.',
  },
  {
    question: 'What is the schedule calendar in the lineup builder?',
    answer:
      'The schedule section is a simple calendar-style strip for upcoming days where you can add matches, training blocks, or other events. It keeps match prep next to your lineup work so kickoff times and opponents stay visible while you plan.',
  },
  {
    question: 'Can I customize kit colors on the pitch view?',
    answer:
      'You can choose kit colors so your lineup graphic matches your team’s home or away look. Clear color contrast helps players and parents read the lineup at a glance when you share your football formation online.',
  },
  {
    question: 'Does signing in sync my squad across devices?',
    answer:
      'When you create an account and sign in, your squad data can be stored in the cloud so you can access your football lineup builder from another machine. Local saving may still apply for parts of your workflow depending on how you use the app.',
  },
  {
    question: 'What age groups is this football lineup builder for?',
    answer:
      'Taptics is useful from grassroots youth teams through adult amateur sides: any coach who needs a clear lineup, formation diagram, and communication tool. The same lineup builder concepts apply whether you coach U10 small-sided games or full 11v11.',
  },
  {
    question: 'How can a lineup builder help me scout or prepare for an opponent?',
    answer:
      'You can map your own shape against how you expect the opponent to set up, then adjust roles and subs in your digital lineup builder. Seeing overloads and weak zones on screen is faster than sketching multiple variants by hand before match day.',
  },
  {
    question: 'What are substitutes and bench slots in a lineup builder?',
    answer:
      'Bench slots list players outside the starting shape so everyone knows who is available to come on. Setting sub counts and bench order in the tool matches how you brief the team about available changes during the match.',
  },
  {
    question: 'Is my tactical data private when I use a share link?',
    answer:
      'Share links are designed to expose only what you choose to share—typically a read-style view of your lineup for others to see. You should still treat sensitive opponent analysis as confidential and only distribute links to people you trust.',
  },
  {
    question: 'What are best practices for communicating a lineup to a team?',
    answer:
      'Share your football lineup early enough for players to prepare mentally, keep naming consistent with your squad list, and pair the graphic with short notes on roles or set pieces. A clear lineup builder export plus a one-minute verbal summary reduces confusion on arrival at the ground.',
  },
];

function buildFaqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

interface FAQProps {
  onBack: () => void;
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills' | 'faq') => void;
}

export const FAQ: React.FC<FAQProps> = ({ onBack, onNavigate }) => {
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? null;

    document.title = 'Football Lineup Builder FAQ | Tactics, Formations & Sharing | Taptics';
    const description =
      'Answers about football lineup builders: formations, drafts, sharing lineups, minutes logs, set pieces, drills, and best practices for coaches.';
    meta?.setAttribute('content', description);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'taptics-faq-jsonld';
    script.text = JSON.stringify(buildFaqJsonLd(FOOTBALL_LINEUP_BUILDER_FAQ));
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) meta?.setAttribute('content', prevDesc);
      document.getElementById('taptics-faq-jsonld')?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col items-center">
      <header className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white shrink-0"
              title="Back to Home"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-red-700 p-1.5 rounded shadow-lg shadow-red-900/20 shrink-0">
                <LayoutGrid size={18} className="text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 truncate">
                Taptics{' '}
                <span className="text-slate-500 font-normal hidden sm:inline">Help</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider shrink-0">
                  FAQ
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10">
        <header className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-emerald-400/90 text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle size={14} aria-hidden />
            <span>Football lineup builder</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tight leading-tight">
            Football lineup builder FAQ
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
            Clear answers for coaches and analysts searching for a{' '}
            <strong className="text-slate-200 font-semibold">football lineup builder</strong>, formation
            planning, sharing lineups, and how Taptics fits into your weekly workflow.
          </p>
        </header>

        <section aria-labelledby="faq-list-heading" className="flex flex-col gap-3">
          <h2 id="faq-list-heading" className="sr-only">
            Frequently asked questions about football lineup builders
          </h2>
          {FOOTBALL_LINEUP_BUILDER_FAQ.map((item, index) => (
            <details
              key={index}
              className="group bg-slate-900/50 border border-slate-800 rounded-xl open:border-emerald-500/25 open:bg-slate-900/70 transition-colors"
            >
              <summary className="cursor-pointer list-none px-4 sm:px-5 py-4 font-bold text-white text-left flex items-start gap-3 [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 text-emerald-500 shrink-0" aria-hidden>
                  ·
                </span>
                <span className="text-sm sm:text-base leading-snug">
                  <span className="text-slate-500 font-normal mr-2">{index + 1}.</span>
                  {item.question}
                </span>
              </summary>
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-10 sm:pl-12 pr-4 sm:pr-6 border-t border-slate-800/80 pt-3">
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">{item.answer}</p>
              </div>
            </details>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Ready to build your lineup?</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Open the football lineup builder to create formations, manage your squad, and share your setup.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-colors"
          >
            Launch lineup builder
          </button>
        </section>
      </main>

      <footer className="w-full border-t border-slate-900 py-8 mt-auto text-center text-slate-600 text-xs max-w-3xl px-4 sm:px-6">
        <p>
          &copy; {new Date().getFullYear()} Taptics. Football lineup builder tools for coaches and teams.
        </p>
      </footer>
    </div>
  );
};
