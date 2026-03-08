
import React from 'react';
import { ArrowLeft, LayoutGrid, ArrowRight, Flag } from 'lucide-react';

interface ArticlesProps {
  onBack: () => void;
  onNavigate: (page: 'home' | 'builder' | 'setpieces' | 'articles' | 'minutes' | 'drills') => void;
}

export const Articles: React.FC<ArticlesProps> = ({ onBack, onNavigate }) => {
  const articles = [
    {
      id: 1,
      title: "Mastering Tactics with a Lineup Builder for Football",
      summary: "Discover how digital tools are replacing the whiteboard. A lineup builder for football is the modern coach's secret weapon for tactical precision.",
      content: `
        <p class="mb-4">In the high-stakes world of modern coaching, the difference between winning and losing often comes down to preparation. Gone are the days when a crumpled piece of paper or a stained whiteboard was sufficient for communicating complex tactical instructions. Enter the <strong>lineup builder for football</strong>—a digital solution that is revolutionizing how managers prepare for match day.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Precision in Positioning</h3>
        <p class="mb-4">One of the primary benefits of using a dedicated lineup builder is the ability to place players with pixel-perfect precision. Unlike magnetic boards where pieces slide around, a digital lineup builder allows you to define exact coordinates for your players. This is crucial for teaching positional discipline, especially in systems that rely on strict spacing like Positional Play (Juego de Posición).</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Visualizing Phases of Play</h3>
        <p class="mb-4">Football is dynamic. Your team's shape changes the moment you lose possession. A high-quality lineup builder for football doesn't just show a static formation; it allows you to visualize transitions. By creating separate views for "In Possession" and "Out of Possession," coaches can clarify responsibilities. For example, a team might defend in a 4-4-2 block but transition into a 3-2-5 attacking shape. Visualizing this shift helps players understand their dual roles.</p>
        
        <p class="mb-4">Ultimately, the goal is clarity. When players can see exactly where they need to be, hesitation disappears. And on the pitch, hesitation is the enemy of execution.</p>
      `,
      action: () => onNavigate('builder'),
      actionLabel: "Launch Lineup Builder"
    },
    {
      id: 6,
      title: "Dominate Dead Balls: The Set Piece Creator",
      summary: "Set pieces account for 30% of goals. Stop neglecting them. Our new Set Piece Creator helps you design winning routines.",
      content: `
        <p class="mb-4">In modern football, margins are razor-thin. When open play becomes a stalemate, a well-drilled corner or free kick is often the difference maker. Yet, many coaches still treat set pieces as an afterthought. Taptics introduces the <strong>Set Piece Creator</strong> to change that.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Design Winning Routines</h3>
        <p class="mb-4">The new Set Piece interface is purpose-built for dead ball situations. It features a zoomed-in view of the penalty area, allowing you to position every player with pinpoint accuracy. Want to crowd the goalkeeper? Create a near-post flick? The tool lets you visualize these concepts clearly.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Annotate with Precision</h3>
        <p class="mb-4">Static player positions aren't enough. The Set Piece Creator allows you to add:</p>
        <ul class="list-disc pl-5 mb-4 text-slate-400">
            <li><strong>Movement Arrows:</strong> Show exactly where runs should start and end.</li>
            <li><strong>Target Zones:</strong> Highlight the delivery area for your taker.</li>
            <li><strong>Opposition Markers:</strong> Place dummy defenders to show how to beat specific marking systems (Zonal vs Man-to-Man).</li>
        </ul>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Build Your Playbook</h3>
        <p class="mb-4">You can now save up to 5 distinct routines. Build a portfolio of corners—one inswinging, one outswinging, and a short option. When you're done, generate a "Share All" link to send your entire set piece playbook to your team instantly. It's the professional standard of preparation, now available to everyone.</p>
      `,
      action: () => onNavigate('setpieces'),
      actionLabel: "Launch Set Piece Creator",
      icon: <Flag size={18} />
    },
    {
      id: 2,
      title: "The Best Lineup Builder Football Tools for Modern Coaches",
      summary: "Not all tools are created equal. We break down the essential features you need in a football lineup builder to manage your squad effectively.",
      content: `
        <p class="mb-4">With the explosion of football analytics and technology, the market is flooded with coaching apps. But how do you choose the right <strong>lineup builder for football</strong>? Whether you manage a Sunday League team or a semi-pro academy, the right tool can save you hours of administrative work.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Key Features to Look For</h3>
        <ul class="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Drag-and-Drop Interface:</strong> The user experience should be intuitive. You want to be able to swap players and adjust formations on the fly without navigating clunky menus.</li>
            <li><strong>Customization:</strong> Every team has its identity. The ability to customize kit colors, player names, and numbers is essential for making the lineup feel like <em>yours</em>.</li>
            <li><strong>Sharing Capabilities:</strong> A lineup builder is useless if you can't share the output. Look for tools that generate high-quality images or shareable web links that can be dropped into a WhatsApp group or email chain.</li>
            <li><strong>Squad Management:</strong> Beyond the starting XI, how does the tool handle substitutes? A comprehensive lineup builder for football should allow you to track your bench and even player availability status (injured, suspended, etc.).</li>
        </ul>
        
        <p class="mb-4">Tools like Taptics represent the next generation of these applications, combining tactical planning with squad management in a seamless interface.</p>
      `,
      action: () => onNavigate('builder'),
      actionLabel: "Launch Lineup Builder"
    },
    {
      id: 3,
      title: "How to Create the Perfect Formation Using a Lineup Builder",
      summary: "Struggling to fit your players into a system? Learn how to use a lineup builder to experiment with formations and find your winning formula.",
      content: `
        <p class="mb-4">Finding the right system for your players is an art form. Often, coaches try to shoehorn players into a popular formation rather than adapting the system to the talent available. A <strong>lineup builder for football</strong> serves as a sandbox for tactical experimentation, allowing you to iterate without consequences.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Experimenting with Asymmetry</h3>
        <p class="mb-4">Modern football is rarely symmetrical. You might have an attacking wing-back on the right and a defensive full-back on the left. Using a lineup builder, you can visualize this asymmetry. Drag your right-back high up the pitch and tuck your left-back in to form a back three. Seeing this on screen highlights potential gaps in your defense that need covering.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">The False Nine Dilemma</h3>
        <p class="mb-4">Implementing complex roles like a False Nine requires buy-in from the whole team. When you use a digital tool to drop your striker into midfield, you can visually demonstrate how the wingers need to make diagonal runs inside to exploit the space created. This visual aid is often more powerful than a verbal explanation.</p>
        
        <p class="mb-4">Don't be afraid to break the grid. The best lineup builders allow free movement, enabling you to create bespoke formations that baffle opponents and play to your team's strengths.</p>
      `,
      action: () => onNavigate('builder'),
      actionLabel: "Launch Lineup Builder"
    },
    {
      id: 4,
      title: "Why a Digital Lineup Builder is Essential for Football Management",
      summary: "Organization wins championships. See why moving your squad management to a digital lineup builder improves communication and retention.",
      content: `
        <p class="mb-4">Communication is the bedrock of any successful team. Yet, many managers still rely on last-minute text messages or blurry photos of a notebook to announce the starting XI. Adopting a professional <strong>lineup builder for football</strong> sends a message to your players: we take this seriously.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Professionalism and Morale</h3>
        <p class="mb-4">When players receive a polished, digital lineup card before the match, it boosts morale. It looks professional, it builds hype, and it provides clarity. It eliminates the "where am I playing?" confusion that often plagues amateur dressing rooms.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Archiving Your Season</h3>
        <p class="mb-4">Another often overlooked benefit is the ability to look back. By saving your lineups digitally, you create an archive of your season. You can analyze what worked against specific opponents, track which player combinations yielded the most goals, and monitor rotation over the course of a campaign. A digital lineup builder isn't just for this Saturday—it's for the whole season.</p>
      `,
      action: () => onNavigate('builder'),
      actionLabel: "Launch Lineup Builder"
    },
    {
      id: 5,
      title: "Advanced Strategies: Analyzing Opponents with a Football Lineup Builder",
      summary: "Turn the tables on your rivals. Use a lineup builder to map out opposition strengths and design specific counter-tactics.",
      content: `
        <p class="mb-4">Most coaches use lineup builders to focus on their own team. However, the elite managers use them to deconstruct the opposition. By using a <strong>lineup builder for football</strong> to map out your opponent's likely shape, you can identify mismatched zones before the whistle even blows.</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Identifying Overloads</h3>
        <p class="mb-4">If you know the opposition plays a narrow 4-4-2 diamond, you can set up your lineup builder to show how a 3-4-3 creates natural overloads in wide areas. By overlaying your formation against theirs mentally or digitally, you can highlight the exact zones where your team will have a numerical advantage (2v1s).</p>
        
        <h3 class="text-xl font-bold text-white mt-6 mb-3">Scenario Planning</h3>
        <p class="mb-4">What happens if they go down to 10 men? What if they switch to a back five to defend a lead? Advanced lineup builders allow you to create multiple drafts. You can prepare "Scenario A," "Scenario B," and "Scenario C" in advance. Sharing these visualizations with your coaching staff ensures everyone is on the same page when chaos ensues during the match.</p>
        
        <p class="mb-4">Preparation is power. Using these tools for opposition analysis gives you the tactical edge required to outsmart managers who are just "winging it."</p>
      `,
      action: () => onNavigate('builder'),
      actionLabel: "Launch Lineup Builder"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                  onClick={onBack}
                  className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors group text-slate-400 hover:text-white"
                  title="Back to Home"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-red-700 p-1.5 rounded shadow-lg shadow-red-900/20">
                        <LayoutGrid size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        Taptics <span className="text-slate-500 font-normal">Articles</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">Beta</span>
                    </span>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl px-6 py-12 flex flex-col gap-12">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Tactical Insights</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Deep dives into football strategy, squad management, and mastering the digital touchline.</p>
        </div>

        <div className="grid gap-12">
            {articles.map((article) => (
                <article key={article.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 group">
                    <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors leading-tight">
                                {article.title}
                            </h2>
                        </div>
                    </div>
                    
                    <div className="text-slate-400 leading-relaxed mb-6 border-l-2 border-slate-700 pl-4 italic">
                        {article.summary}
                    </div>

                    <div 
                        className="prose prose-invert prose-slate max-w-none text-slate-300 leading-7 text-sm md:text-base"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    <div className="mt-8 pt-4 border-t border-slate-800">
                      <button 
                        onClick={article.action}
                        className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-2 transition-all hover:gap-3"
                      >
                        {article.icon && article.icon}
                        {article.actionLabel} <ArrowRight size={18} />
                      </button>
                    </div>
                </article>
            ))}
        </div>

        {/* SEO Footer for this page */}
        <div className="mt-12 p-8 bg-slate-900 rounded-xl text-center border border-slate-800">
            <h3 className="text-white font-bold mb-2">Ready to apply these tactics?</h3>
            <p className="text-slate-400 text-sm mb-6">Use the most advanced lineup builder for football to dominate your next match.</p>
            <button 
                onClick={() => onNavigate('builder')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all"
            >
                Launch Builder
            </button>
        </div>
      </main>

      <footer className="w-full border-t border-slate-900 py-8 text-center text-slate-600 text-xs">
         <p>&copy; {new Date().getFullYear()} Taptics. The ultimate lineup builder for football managers.</p>
      </footer>
    </div>
  );
};
