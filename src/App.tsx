import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CircleCheck, CircleX, Beer, Tv, Settings2 } from 'lucide-react';
import { GameState, PrizeType, PRIZES } from './types';

// Assets with elite football aesthetic
const STADIUM_BG = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=100&w=2560";
const RONALDO_RENDER = "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80&w=1200"; 
const KEEPER_RENDER = "https://images.unsplash.com/photo-1431324155629-1a6eda1dc231?auto=format&fit=crop&q=80&w=1200";

const NET_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0 L40,0 M0,40 L40,40 M0,0 L0,40 M40,0 L40,40' stroke='white' stroke-width='1' fill='none' opacity='0.3'/%3E%3C/svg%3E")`;

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [power, setPower] = useState(0);
  const [result, setResult] = useState<{ success: boolean; prize?: PrizeType; diveDirection?: 'left' | 'right' | 'center' } | null>(null);
  const powerRef = useRef<number>(0);
  
  const directionRef = useRef<number>(1);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.POWERING) {
      interval = setInterval(() => {
        setPower((prev) => {
          let next = prev + (1.5 * directionRef.current);
          if (next >= 100) {
            next = 100;
            directionRef.current = -1;
          } else if (next <= 0) {
            next = 0;
            directionRef.current = 1;
          }
          powerRef.current = next;
          return next;
        });
      }, 20);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const getRandomPrize = (): PrizeType => {
    const rand = Math.random();
    let cumulative = 0;
    for (const p of PRIZES) {
      cumulative += p.probability;
      if (rand <= cumulative) return p.type;
    }
    return PrizeType.FINO_1;
  };

  const handleShoot = useCallback(() => {
    if (gameState === GameState.IDLE) {
      setGameState(GameState.POWERING);
      setPower(0);
      directionRef.current = 1;
    } else if (gameState === GameState.POWERING) {
      const finalPower = powerRef.current;
      const isGoal = finalPower >= 82 && finalPower <= 98; // Sweet spot for EA style
      
      setGameState(GameState.RUNNING);
      
      // Sequence: Run (800ms) -> Kick (Transition to KICKING)
      setTimeout(() => {
        setGameState(GameState.KICKING);
        const diveDir = Math.random() > 0.5 ? 'left' : 'right';
        
        setResult({
          success: isGoal,
          prize: isGoal ? getRandomPrize() : undefined,
          diveDirection: isGoal ? (diveDir === 'left' ? 'right' : 'left') : diveDir 
        });

        setTimeout(() => {
          setGameState(GameState.RESULT);
        }, 1200);
      }, 700);

    } else if (gameState === GameState.RESULT) {
      setGameState(GameState.IDLE);
      setResult(null);
      setPower(0);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // OK / Enter / Confirm — suporte para Hisense, Samsung, LG e outros smart TVs
      const isConfirm =
        e.key === 'Enter' ||
        e.key === ' ' ||
        e.key === 'Accept' ||
        e.key === 'Select' ||
        e.key === 'MediaPlayPause' ||
        e.keyCode === 13 ||   // Enter padrão
        e.keyCode === 32 ||   // Space
        e.keyCode === 179 ||  // Play/Pause (alguns comandos)
        e.keyCode === 195 ||  // GamepadA / OK em Android TV
        e.keyCode === 404 ||  // Hisense OK
        e.keyCode === 406;    // Hisense confirm alternativo

      // Setas também ativam o jogo (útil para navegação TV)
      const isArrow =
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.keyCode === 37 ||
        e.keyCode === 38 ||
        e.keyCode === 39 ||
        e.keyCode === 40;

      if (isConfirm || isArrow) {
        e.preventDefault();
        handleShoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShoot]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] font-sans text-white select-none">
      {/* Starting Screen Overlay */}
      <AnimatePresence>
        {gameState === GameState.IDLE && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black/80 p-20 rounded-[80px] border-[16px] border-white/10 flex flex-col items-center shadow-[0_0_200px_rgba(0,0,0,1)]"
            >
              <img 
                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=400" 
                className="w-48 h-48 rounded-full mb-10 border-8 border-red-600 shadow-2xl object-cover"
                alt="Logo"
              />
              <h1 className="text-[10rem] font-black italic tracking-tightest leading-none mb-6">PENALTY HERO</h1>
              <p className="text-4xl font-black text-red-600 uppercase tracking-[0.6em] mb-20">MOSTRA QUE BATES BEM</p>
              
              <motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-8 text-6xl font-black"
              >
                <div className="bg-white text-black w-24 h-24 rounded-full flex items-center justify-center shadow-xl">OK</div>
                <span>PRESSIONA PARA COMEÇAR</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Stadium Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100"
        style={{ 
          backgroundImage: `url(${STADIUM_BG})`,
          filter: gameState === GameState.RESULT ? 'blur(12px) brightness(0.2)' : 'brightness(0.5)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        {/* Floodlight Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
      </div>

      {/* FIFA Scoreboard Overlay */}
      <div className="absolute top-0 w-full z-50 flex flex-col items-center pt-10">
        <motion.div 
          initial={{ y: -120 }}
          animate={{ y: 0 }}
          className="flex items-center bg-black/90 backdrop-blur-3xl border-b-4 border-[#00ff00] shadow-[0_15px_60px_rgba(0,0,0,0.8)] overflow-hidden rounded-b-lg"
        >
          <div className="bg-[#001f3f] px-10 py-4 flex items-center gap-4 border-r border-white/10">
             <div className="w-10 h-6 bg-red-600 border border-white/30 rounded-sm" />
             <span className="text-4xl font-black italic tracking-widest text-white">POR</span>
          </div>
          <div className="px-12 py-4 flex flex-col items-center min-w-[250px] bg-gradient-to-b from-transparent to-white/5">
             <span className="text-xs font-black text-[#00ff00] uppercase tracking-[0.4em] mb-1">MOSTRA QUE BATES BEM</span>
             <span className="text-5xl font-black tabular-nums tracking-tighter drop-shadow-lg">00:00</span>
          </div>
          <div className="bg-[#4b0082] px-10 py-4 flex items-center gap-4 border-l border-white/10">
             <span className="text-4xl font-black italic tracking-widest text-white">BAR</span>
             <div className="w-10 h-6 bg-blue-600 border border-white/30 rounded-sm" />
          </div>
        </motion.div>
        
        <AnimatePresence>
          {(gameState === GameState.RUNNING || gameState === GameState.KICKING) && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="mt-6 bg-red-600 px-8 py-1 rounded-full font-black text-2xl italic tracking-tighter shadow-3xl border-2 border-white animate-pulse"
            >
               AO VIVO
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Heineken Header Ad */}
      <div className="absolute right-12 top-10 z-50">
        <motion.div 
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#008232] px-10 py-4 rounded-3xl border-4 border-[#00a33a] shadow-2xl flex items-center gap-4"
        >
          <Beer size={40} className="fill-white" />
          <div className="flex flex-col text-left">
            <span className="text-4xl font-black tracking-tightest leading-none">HEINEKEN</span>
            <span className="text-xs font-bold opacity-70 tracking-[0.3em] uppercase">Original Quality</span>
          </div>
        </motion.div>
      </div>

      {/* Game Stage */}
      <div className="relative h-full flex flex-col items-center justify-end pb-40 perspective-[2500px]">
        
        {/* Baliza (Goal) */}
        <div className="relative w-full max-w-[1400px] aspect-[16/6] mb-10 z-10">
          {/* Postes Metálicos (3D Deep View) */}
          <div className="absolute inset-0 border-[28px] border-[#ffffff] rounded-t-3xl shadow-[0_100px_250px_rgba(255,255,255,0.1)] z-30" />
          <div className="absolute inset-[-10px] border-[4px] border-white/20 rounded-t-[40px] z-20 blur-[2px]" />
          
          {/* Rede Camada Pro (Realista) */}
          <div className="absolute inset-6 -inset-t-0 bg-white/5 backdrop-blur-[1px] rounded-t-2xl z-10 shadow-inner overflow-hidden" 
               style={{ backgroundImage: NET_PATTERN }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/20" />
          </div>
          
          {/* Fundo da Baliza (Depth) */}
          <div className="absolute inset-16 -inset-t-0 bg-black/40 rounded-t-xl z-0 opacity-60 flex items-center justify-center" 
               style={{ backgroundImage: NET_PATTERN }} />

          {/* Guarda-Redes (Goalkeeper) */}
          <motion.div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-[120%] z-20 origin-bottom flex items-end justify-center"
            animate={gameState === GameState.KICKING ? (
              result?.diveDirection === 'left' ? { x: -600, y: -200, rotate: -90, scale: 0.95 } :
              result?.diveDirection === 'right' ? { x: 600, y: -200, rotate: 90, scale: 0.95 } :
              { y: -250, scale: 1.15 }
            ) : { 
              x: [-120, 120], 
              transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatType: 'reverse' } 
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute bottom-0 w-full h-1/4 bg-black/80 blur-[80px] rounded-full scale-x-150 z-0" />
              <img 
                src={KEEPER_RENDER} 
                alt="GoalKeeper" 
                className="w-full h-full object-contain rounded-3xl filter drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)] brightness-110 contrast-110 z-10"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* A Bola */}
          <AnimatePresence>
            {(gameState === GameState.KICKING || gameState === GameState.RESULT) && (
              <motion.div
                initial={{ scale: 3, y: 500, x: 0, filter: 'blur(0px)' }}
                animate={result?.success ? {
                  scale: 0.5,
                  y: -120,
                  x: Math.random() * 500 - 250,
                  rotate: 1440,
                  filter: 'blur(1px)'
                } : {
                  scale: 0.5,
                  y: -400,
                  x: result?.diveDirection === 'left' ? 600 : -600,
                  rotate: 720,
                  filter: 'blur(2px)'
                }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="absolute left-1/2 bottom-0 w-24 h-24 -translate-x-1/2 z-30"
              >
                <div className="w-full h-full rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,1)] border-8 border-black/20 overflow-hidden bg-[url('https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=100')] bg-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ronaldo Boneco */}
        <motion.div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none"
          initial={{ y: 200, opacity: 0, scale: 1.5 }}
          animate={
            gameState === GameState.RUNNING ? { 
              opacity: 1,
              x: [-150, 100, -100, 150, 0], 
              y: [0, -40, 0, -40, 0], 
              scale: 1.7,
              transition: { duration: 0.7 }
            } :
            gameState === GameState.KICKING ? { 
              opacity: 1,
              x: 250, 
              y: -100,
              rotate: 30, 
              scale: 2.0,
              filter: 'brightness(1.5) contrast(1.2) drop-shadow(0 0 80px rgba(0,255,0,0.6))'
            } :
            gameState === GameState.IDLE ? { 
              opacity: 1,
              y: 0,
              x: -180,
              scale: [1.7, 1.72, 1.7], 
              transition: { repeat: Infinity, duration: 4 } 
            } :
            { opacity: 1, y: 0, x: -180 }
          }
        >
          <div className="relative w-[550px] h-[900px] flex flex-col items-center justify-end">
             <div className="absolute top-10 z-50 bg-[#001f3f] px-16 py-4 rounded-2xl border-4 border-[#00ff00] font-black italic text-7xl shadow-3xl skew-x-[-15deg] tracking-tighter">
               RONALDO
             </div>
             
             <div className="relative w-full h-[90%] flex items-end justify-center">
                {/* Sombra de contacto */}
                <div className="absolute bottom-4 w-2/3 h-16 bg-black/90 blur-[50px] rounded-full z-0" />
                <img 
                  src={RONALDO_RENDER} 
                  alt="Cristiano" 
                  className="w-full h-full object-contain rounded-3xl filter drop-shadow-[0_60px_100px_rgba(0,0,0,1)] contrast-110 brightness-110 z-10"
                  referrerPolicy="no-referrer"
                />
             </div>

             {/* Player Indicator (FIFA Style) */}
             <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ repeat: Infinity, duration: 1.2 }}
               className="absolute -top-32 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[45px] border-t-[#00ff00] drop-shadow-[0_0_30px_#00ff00] z-50"
             />
          </div>
        </motion.div>

        {/* HUD: Power Bar */}
        <div className="absolute bottom-24 left-24">
          <div className="relative w-24 h-[600px] bg-black/60 backdrop-blur-3xl border-8 border-white/10 rounded-[40px] p-2 flex flex-col-reverse shadow-3xl overflow-hidden">
            <div className="absolute inset-x-0 bottom-[82%] top-[10%] bg-green-500/20 border-y-8 border-green-500/50 shadow-[inset_0_0_60px_rgba(34,197,94,0.3)] z-0" />
            
            <motion.div 
              className="w-full rounded-2xl bg-gradient-to-t from-red-600 via-orange-500 to-green-400 shadow-[0_0_80px_rgba(255,255,255,0.4)] z-10"
              style={{ height: `${power}%` }}
            />
            
            <div className="absolute -top-32 left-0 w-full text-center">
              <span className={`text-[12rem] font-black italic tracking-tighter leading-none ${power >= 82 && power <= 96 ? 'text-green-400 drop-shadow-[0_0_50px_rgba(34,197,94,1)]' : 'text-white'}`}>
                {Math.round(power)}
              </span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="text-3xl font-black italic text-white/40 uppercase tracking-widest">FORÇA</span>
          </div>
        </div>

        {/* HUD: Controls */}
        <div className="absolute bottom-24 right-24 flex flex-col items-end gap-12">
           <motion.div 
             animate={{ scale: [1, 1.05, 1] }} 
             transition={{ repeat: Infinity, duration: 1 }}
             className="bg-white text-black p-12 rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex items-center gap-10 border-[16px] border-black"
           >
              <div className="bg-black text-white w-32 h-32 rounded-full flex items-center justify-center font-black text-6xl shadow-inner">OK</div>
              <div className="flex flex-col text-left">
                <span className="text-8xl font-black tracking-tightest leading-none italic uppercase">REMATAR</span>
                <span className="text-2xl font-bold opacity-60 italic text-red-600 uppercase tracking-widest mt-2">MOSTRA QUE BATES BEM</span>
              </div>
           </motion.div>
           
           <div className="bg-black/80 backdrop-blur-3xl border-4 border-white/10 p-12 rounded-[50px] flex items-center gap-10 shadow-3xl">
              <div className="p-8 bg-[#FFD700]/10 rounded-full border-4 border-[#FFD700]/30 shadow-[0_0_40px_rgba(255,215,0,0.2)]">
                <Trophy className="text-[#FFD700]" size={100} />
              </div>
              <div className="text-left">
                <p className="text-xl font-black opacity-40 uppercase tracking-[0.4em] mb-4">PRÓXIMO PRÉMIO ELITE</p>
                <p className="text-7xl font-black text-white italic tracking-tighter leading-none">1 RÉGUA DE FINOS</p>
              </div>
           </div>
        </div>

        {/* Cinematic Results Overlay */}
        <AnimatePresence>
          {gameState === GameState.RESULT && result && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-20"
            >
              <motion.div 
                initial={{ y: 100, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-black/95 to-[#002200]/95 border-[25px] border-white/5 rounded-[80px] p-24 flex flex-col items-center text-center shadow-[0_0_250px_rgba(0,0,0,1)] max-w-7xl w-full"
              >
                {result.success ? (
                  <>
                    <motion.div
                      animate={{ y: [-30, 0, -30], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="mb-16"
                    >
                      <Trophy size={250} className="text-[#FFD700] filter drop-shadow-[0_0_80px_rgba(255,215,0,0.6)]" />
                    </motion.div>
                    
                    <motion.h1 
                      animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-[18rem] font-black italic tracking-tightest leading-none mb-12 text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-green-500 to-green-800"
                    >
                      GOLO!
                    </motion.h1>
                    
                    <div className="bg-red-600 text-white px-32 py-14 rounded-[50px] shadow-3xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
                      <p className="text-4xl font-black opacity-80 mb-4 uppercase tracking-[0.3em]">RECOMPENSA MÁXIMA</p>
                      <h2 className="text-[10rem] font-black leading-none italic drop-shadow-2xl">{result.prize}</h2>
                    </div>
                  </>
                ) : (
                  <>
                    <CircleX size={250} className="text-red-700 mb-16 opacity-90 filter drop-shadow-[0_0_50px_rgba(220,38,38,0.4)]" />
                    <h1 className="text-[15rem] font-black italic tracking-tighter leading-none mb-4 text-red-600">
                      FALHOU!
                    </h1>
                    <p className="text-6xl font-black text-white/30 uppercase mb-20 tracking-widest">O Goleiro foi Gigante!</p>
                    <div className="bg-white/5 border border-white/10 px-20 py-10 rounded-[30px]">
                      <p className="text-3xl font-bold tracking-tight text-white/80">Precisão necessária: <span className="text-green-500">82-98%</span></p>
                    </div>
                  </>
                )}
                
                <div className="mt-20 flex items-center gap-8 text-5xl font-black opacity-40 animate-pulse tracking-tighter italic uppercase">
                  <Tv size={64} />
                  <span>Clica no Comando para continuar</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Ticker */}
      <div className="absolute bottom-0 w-full bg-red-700 h-20 flex items-center border-t-[12px] border-green-700 shadow-[0_-20px_100px_rgba(0,0,0,0.5)] z-50">
        <div className="flex gap-60 whitespace-nowrap animate-marquee items-center h-full">
           <div className="flex items-center gap-6 px-10">
              <span className="bg-white text-black px-6 py-2 rounded font-black text-xl">NEWS</span>
              <span className="text-3xl font-black italic uppercase tracking-tighter">RONALDO SHOWDOWN: O JOGO OFICIAL DO SEU BAR FAVORITO!</span>
           </div>
           <div className="flex items-center gap-6 px-10">
              <span className="bg-green-500 text-black px-6 py-2 rounded font-black text-xl">GRÁTIS</span>
              <span className="text-3xl font-black italic uppercase tracking-tighter">PEÇA UMA RÉGUA DE FINOS E RECEBA 1 CRÉDITO PARA JOGAR</span>
           </div>
           <div className="flex items-center gap-6 px-10 border-l-4 border-white/20">
              <Beer size={40} className="text-white" />
              <span className="text-3xl font-black italic uppercase tracking-tighter text-[#FFD700]">HEINEKEN: PATROCINADOR OFICIAL DA EMOÇÃO</span>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .perspective-2500 {
          perspective: 2500px;
        }
        .tracking-tightest {
          letter-spacing: -0.06em;
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
