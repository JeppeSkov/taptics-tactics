
import React from 'react';
import { ArrowRight, LayoutGrid, Activity, Share2, Users, Shield, Swords, Calendar, Flag } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
  onNavigate: (page: 'home' | 'builder' | 'articles' | 'setpieces' | 'minutes') => void;
}

export const Home: React.FC<HomeProps> = ({ onStart, onNavigate }) => {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Background Graphic Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[100px]"></div>
        {/* Tactical Lines */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="bg-red-700 p-2 rounded-lg shadow-lg shadow-red-900/20">
              <LayoutGrid size={24} className="text-white" />
           </div>
           <span className="text-xl font-bold tracking-tight flex items-center gap-2">
              Taptics
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">Beta</span>
           </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
           <a href="#features" onClick={scrollToFeatures} className="hover:text-emerald-400 transition-colors">Features</a>
           <a 
             href="#" 
             onClick={(e) => { e.preventDefault(); onNavigate('articles'); }}
             className="hover:text-emerald-400 transition-colors"
           >
             Articles
           </a>
        </nav>
        <button 
          onClick={onStart}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-all shadow-lg"
        >
          Launch Builder
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 mt-16 md:mt-24 mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in-up">
           <Activity size={12} />
           <span>The most advanced lineup builder</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 max-w-4xl leading-[0.9]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">PLAN. ANALYZE.</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">WIN.</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mb-12 leading-relaxed">
          The modern tactical playground for football minds. Build detailed squads, design complex gameplans, and share your vision with your squad or coaching staff.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mx-auto mb-32">
           <button 
             onClick={onStart}
             className="group relative flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-2xl shadow-emerald-900/50 transition-all transform hover:-translate-y-1"
           >
             Start Building
             <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        {/* Feature Grid */}
        <div id="features" className="w-full max-w-7xl mx-auto px-4 pb-20 scroll-mt-24">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">A Lineup Builder you've seen before</h2>
              <p className="text-slate-400">From the training ground to match day, we've got your tactics covered.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Feature 1 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-all group text-left hover:bg-slate-800/50">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-900/30 group-hover:scale-110 transition-all duration-300">
                     <LayoutGrid className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Tactical Board</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Drag & drop interface to craft the perfect formation. Visualize your shape with precision using our professional pitch grid.
                  </p>
               </div>
               
               {/* Feature 2 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all group text-left hover:bg-slate-800/50">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-900/30 group-hover:scale-110 transition-all duration-300">
                     <Users className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Squad Management</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Track fitness, roles, and depth charts. Assign player statuses and manage your bench with professional-grade detail.
                  </p>
               </div>

               {/* Feature 3 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-purple-500/50 transition-all group text-left hover:bg-slate-800/50">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-900/30 group-hover:scale-110 transition-all duration-300">
                     <Swords className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Phased Tactics</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Design separate shapes for possession and defensive phases. Visualize how your team transitions when the ball is won or lost.
                  </p>
               </div>

               {/* Feature 4 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-orange-500/50 transition-all group text-left hover:bg-slate-800/50">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-900/30 group-hover:scale-110 transition-all duration-300">
                     <Share2 className="text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Instant Sharing</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Generate read-only public links to share your tactical vision with your squad, coaching staff, or on social media instantly.
                  </p>
               </div>

               {/* Feature 5 */}
               <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-red-500/50 transition-all group text-left hover:bg-slate-800/50">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-900/30 group-hover:scale-110 transition-all duration-300">
                     <Shield className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Gameplan Editor</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Don't just show the formation, explain the philosophy. Dedicated sections for on-ball and off-ball instructions.
                  </p>
               </div>
           </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-900 py-10 text-center">
         <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <LayoutGrid size={20} />
            <span className="font-bold tracking-tight">Taptics</span>
         </div>
         <p className="text-slate-600 text-sm">&copy; {new Date().getFullYear()} Taptics. Inspired by the beautiful game.</p>
      </footer>
    </div>
  );
};
