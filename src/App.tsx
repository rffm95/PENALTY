import React, { useEffect, useRef, useState } from 'react';
import { GameState, PrizeType, PRIZES } from './types';

const OK_KEYS = new Set([13, 32, 179, 195, 404, 406]);

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [power, setPower] = useState(0);
  const [result, setResult] = useState<{ success: boolean; prize?: PrizeType; side: 'left' | 'center' | 'right' } | null>(null);
  const powerRef = useRef(0);
  const dirRef = useRef(1);
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const f = () => rootRef.current?.focus();
    f(); setTimeout(f, 300); setTimeout(f, 1000);
  }, []);

  // Barra de força — 2.4 por tick (20% mais rápido que 2.0)
  useEffect(() => {
    if (gameState !== GameState.POWERING) return;
    const step = () => {
      setPower(p => {
        let n = p + dirRef.current * 2.4;
        if (n >= 100) { n = 100; dirRef.current = -1; }
        if (n <= 0)   { n = 0;   dirRef.current = 1; }
        powerRef.current = n;
        return n;
      });
      timerRef.current = window.setTimeout(step, 35);
    };
    step();
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [gameState]);

  const getRandomPrize = (): PrizeType => {
    const rand = Math.random();
    let cum = 0;
    for (const p of PRIZES) { cum += p.probability; if (rand <= cum) return p.type; }
    return PrizeType.FINO_1;
  };

  const shoot = () => {
    if (gameState === GameState.IDLE) {
      setResult(null);
      setPower(0);
      dirRef.current = 1;
      setGameState(GameState.POWERING);
      return;
    }
    if (gameState === GameState.POWERING) {
      const p = powerRef.current;
      // <80% → centro (defesa), 80–90% → esquerda (golo), 90–100% → direita (golo)
      const side = p >= 90 ? 'right' : p >= 80 ? 'left' : 'center';
      const isGoal = side !== 'center';
      setGameState(GameState.KICKING);
      setTimeout(() => {
        setResult({ success: isGoal, prize: isGoal ? getRandomPrize() : undefined, side });
        setGameState(GameState.RESULT);
      }, 520);
      return;
    }
    if (gameState === GameState.RESULT) {
      setGameState(GameState.IDLE);
      setResult(null);
      setPower(0);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    const code = e.keyCode || e.which;
    if (OK_KEYS.has(code)) { e.preventDefault(); shoot(); }
  };

  useEffect(() => {
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
    };
  }, [gameState]);

  const isIdle    = gameState === GameState.IDLE;
  const isPower   = gameState === GameState.POWERING;
  const isKicking = gameState === GameState.KICKING;
  const isResult  = gameState === GameState.RESULT;

  const kickSide = isResult ? result?.side : isKicking ? 'kick' : null;

  // Bola: cantos bem afastados do centro para não passar no boneco azul
  const ballLeft = (isKicking || isResult)
    ? (result?.side === 'left'   ? '21%'
     : result?.side === 'right'  ? '75%'
     : '48%')   // centro
    : '27%';    // posição inicial (pé do jogador)
  const ballBottom = (isKicking || isResult)
    ? (result?.side === 'center' ? '40%' : '52%')  // centro vai mais baixo (para o boneco)
    : '18%';

  // Keeper: só se move ligeiramente se for ao centro (para simular defesa)
  // Quando vai para os cantos, o keeper NÃO persegue a bola
  const keeperX = (isKicking || isResult) && result?.side === 'center' ? 0 : 0;
  const keeperRotate = 0;
  // Keeper salta para a frente quando defende (centro)
  const keeperBottom = (isKicking || isResult) && result?.side === 'center' ? '42%' : '37%';

  const powerColor = power >= 80 ? '#22c55e' : power >= 50 ? '#f59e0b' : '#ef4444';
  const powerZone  = power >= 90 ? '⚽ DIREITA' : power >= 80 ? '⚽ ESQUERDA' : '🧤 CENTRO';

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onClick={shoot}
      style={{
        width:'100%', height:'100vh', overflow:'hidden', outline:'none',
        fontFamily:'Arial,sans-serif', color:'#fff', userSelect:'none',
        position:'relative', background:'linear-gradient(180deg,#0d2232,#07131d)'
      }}
    >
      <style>{`
        *{box-sizing:border-box}
        html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes resultIn{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes keeperSave{0%{transform:translateY(0) scale(1)}50%{transform:translateY(-14px) scale(1.08)}100%{transform:translateY(0) scale(1)}}
      `}</style>

      {/* Campo */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0e3320,#0a2418 55%,#061810)' }} />

      {/* Baliza — postes */}
      <div style={{
        position:'absolute', left:'50%', top:'12%',
        width:'62%', height:'26%',
        border:'7px solid #fff', borderBottom:'none',
        borderRadius:'18px 18px 0 0', transform:'translateX(-50%)'
      }} />
      {/* Rede */}
      <div style={{
        position:'absolute', left:'50%', top:'13.5%',
        width:'58.5%', height:'24%',
        backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 1px,transparent 1px,transparent 30px),repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 1px,transparent 1px,transparent 30px)',
        transform:'translateX(-50%)'
      }} />

      {/* HUD topo */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,.6)', borderRadius:10, padding:'8px 18px',
        fontSize:20, fontWeight:700, zIndex:20, whiteSpace:'nowrap', textAlign:'center'
      }}>
        {isIdle    && 'OK para jogar'}
        {isPower   && `Força: ${Math.round(power)}% — ${powerZone}`}
        {isKicking && 'Remate!'}
        {isResult  && 'OK para jogar de novo'}
      </div>

      {/* Barra de força */}
      {isPower && (
        <div style={{
          position:'absolute', left:16, top:'50%', transform:'translateY(-50%)',
          width:26, height:200,
          border:'2px solid rgba(255,255,255,.4)', borderRadius:13,
          background:'rgba(0,0,0,.35)', overflow:'hidden'
        }}>
          <div style={{
            position:'absolute', bottom:0, left:0, width:'100%',
            height:`${power}%`,
            background:`linear-gradient(to top,#d61f2a,${powerColor})`,
            transition:'height .05s linear'
          }} />
          {/* linha zona de golo a 80% */}
          <div style={{ position:'absolute', bottom:'80%', left:0, right:0, height:2, background:'rgba(255,255,255,.6)' }} />
        </div>
      )}

      {/* JOGADOR vermelho */}
      <div style={{ position:'absolute', left:'12%', bottom:'14%', width:70, height:160, transformOrigin:'50% 100%' }}>
        <div style={{ position:'absolute', left:'50%', top:0, width:28, height:28, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)' }} />
        <div style={{ position:'absolute', left:'50%', top:26, width:30, height:52, background:'#d72a30', borderRadius:8, transform:'translateX(-50%)' }} />
        <div style={{ position:'absolute', left:2,  top:34, width:28, height:7, background:'#f0c090', borderRadius:4, transform:'rotate(22deg)' }} />
        <div style={{ position:'absolute', right:2, top:34, width:28, height:7, background:'#f0c090', borderRadius:4, transform:'rotate(-22deg)' }} />
        <div style={{ position:'absolute', left:'38%', top:76, width:9, height:58, background:'#222', borderRadius:4, transform:'rotate(8deg)' }} />
        <div style={{
          position:'absolute', right:'38%', top:76, width:9, height:58,
          background:'#222', borderRadius:4,
          transform: isKicking ? 'rotate(-55deg) translateY(-12px)' : 'rotate(-18deg)',
          transition:'transform .18s'
        }} />
        <div style={{
          position:'absolute', right:'24%', top: isKicking ? 88 : 116,
          width:18, height:9, background:'#333', borderRadius:4,
          transform: isKicking ? 'rotate(-52deg)' : 'rotate(-14deg)',
          transition:'all .18s'
        }} />
      </div>

      {/* GUARDA-REDES azul — centro fixo, salta ao defender */}
      <div style={{
        position:'absolute',
        left:'calc(50% - 35px)',
        bottom: keeperBottom,
        width:70, height:160, transformOrigin:'50% 100%',
        transition: isKicking ? 'bottom .28s ease-out' : 'none',
        animation: (isKicking || isResult) && result?.side === 'center' ? 'keeperSave .5s ease-out' : 'none',
        zIndex:8
      }}>
        <div style={{ position:'absolute', left:'50%', top:0, width:28, height:28, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)' }} />
        <div style={{ position:'absolute', left:'50%', top:26, width:30, height:52, background:'#1e67d6', borderRadius:8, transform:'translateX(-50%)' }} />
        <div style={{ position:'absolute', left:-16,  top:38, width:46, height:8, background:'#f0c090', borderRadius:4, transform:'rotate(-30deg)' }} />
        <div style={{ position:'absolute', right:-16, top:38, width:46, height:8, background:'#f0c090', borderRadius:4, transform:'rotate(30deg)' }} />
        <div style={{ position:'absolute', left:'38%',  top:76, width:9, height:58, background:'#222', borderRadius:4, transform:'rotate(5deg)' }} />
        <div style={{ position:'absolute', right:'38%', top:76, width:9, height:58, background:'#222', borderRadius:4, transform:'rotate(-5deg)' }} />
      </div>

      {/* BOLA */}
      <div style={{
        position:'absolute',
        left: ballLeft,
        bottom: ballBottom,
        width:22, height:22, borderRadius:'50%',
        background:'#fff', border:'2px solid #222',
        boxShadow:'0 2px 8px rgba(0,0,0,.5)',
        transition:(isKicking || isResult) ? 'left .42s ease-out, bottom .42s ease-out' : 'none',
        zIndex:10
      }} />

      {/* ECRÃ INICIAL */}
      {isIdle && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.2)', pointerEvents:'none' }}>
          <div style={{ background:'rgba(0,0,0,.72)', border:'2px solid rgba(255,255,255,.12)', borderRadius:20, padding:'28px 40px', textAlign:'center' }}>
            <div style={{ fontSize:40, fontWeight:900, letterSpacing:-1 }}>⚽ PENALTY HERO</div>
            <div style={{ fontSize:18, marginTop:8, color:'#ef4444', fontWeight:800, letterSpacing:2 }}>CHEERS O BAR</div>
            <div style={{ marginTop:20, fontSize:22, fontWeight:800, animation:'blink 1.4s ease-in-out infinite' }}>Pressiona OK para jogar</div>
            <div style={{ marginTop:10, fontSize:14, opacity:.5 }}>Acerta entre 80–100% para marcar!</div>
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {isResult && result && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.65)', zIndex:50 }}>
          <div style={{
            background: result.success ? 'rgba(0,70,0,.94)' : 'rgba(110,0,0,.94)',
            border:`3px solid ${result.success ? '#22c55e' : '#ef4444'}`,
            borderRadius:20, padding:'32px 52px', textAlign:'center',
            animation:'resultIn .22s ease-out'
          }}>
            <div style={{ fontSize: result.success ? 76 : 60, fontWeight:900, letterSpacing:-2 }}>
              {result.success ? '⚽ GOLO!' : '🧤 DEFESA!'}
            </div>
            {result.success && result.prize && (
              <div style={{ marginTop:12, fontSize:28, fontWeight:800, color:'#FFD700' }}>🏆 {result.prize}</div>
            )}
            <div style={{ marginTop:18, fontSize:16, opacity:.6, animation:'blink 1.4s ease-in-out infinite' }}>OK para jogar de novo</div>
          </div>
        </div>
      )}
    </div>
  );
}
