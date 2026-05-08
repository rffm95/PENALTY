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
      setResult(null); setPower(0); dirRef.current = 1;
      setGameState(GameState.POWERING);
      return;
    }
    if (gameState === GameState.POWERING) {
      const p = powerRef.current;
      const side = p >= 90 ? 'right' : p >= 80 ? 'left' : 'center';
      const isGoal = side !== 'center';
      setGameState(GameState.KICKING);
      setTimeout(() => {
        setResult({ success: isGoal, prize: isGoal ? getRandomPrize() : undefined, side });
        setGameState(GameState.RESULT);
      }, 560);
      return;
    }
    if (gameState === GameState.RESULT) {
      setGameState(GameState.IDLE); setResult(null); setPower(0);
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
  const shooting  = isKicking || isResult;
  const side      = result?.side;

  // Baliza ocupa: left=17%, right=83% (width=66%, centrada)
  // Keeper no centro da baliza = 50% horizontal
  // Cantos da bola ficam BEM dentro dos postes mas longe do keeper (centro)
  // Esquerda: ~19% (poste esq + margem), Direita: ~78% (poste dir - margem)
  // Bola inicial: junto ao pé do jogador (~17%)
  const ballLeft = shooting
    ? (side === 'left'   ? '19%'   // canto esquerdo da baliza
     : side === 'right'  ? '78%'   // canto direito da baliza
     : '49%')                      // centro → keeper
    : '17%';

  const ballBottom = shooting
    ? (side === 'center' ? '36%'   // vai ao GR no centro
     : '60%')                      // vai alto nos cantos, longe do GR
    : '17%';

  const powerColor = power >= 80 ? '#22c55e' : power >= 50 ? '#f59e0b' : '#ef4444';
  const powerZone  = power >= 90 ? '⚽ DIREITA' : power >= 80 ? '⚽ ESQUERDA' : '🧤 CENTRO';
  const keeperAnim = shooting && side === 'center' ? 'keeperSave .5s ease-out forwards' : 'none';

  return (
    <div ref={rootRef} tabIndex={0} onClick={shoot} style={{
      width:'100%', height:'100vh', overflow:'hidden', outline:'none',
      fontFamily:'Arial,sans-serif', color:'#fff', userSelect:'none',
      position:'relative', background:'linear-gradient(180deg,#0d2232,#07131d)'
    }}>
      <style>{`
        *{box-sizing:border-box}
        html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes resultIn{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes keeperSave{0%{transform:translateY(0)}40%{transform:translateY(-26px) scale(1.08)}100%{transform:translateY(0)}}
      `}</style>

      {/* Campo */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0e3320,#0a2418 55%,#061810)' }} />

      {/* Baliza — 66% de largura, centrada */}
      <div style={{
        position:'absolute', left:'17%', top:'8%',
        width:'66%', height:'30%',
        border:'8px solid #fff', borderBottom:'none',
        borderRadius:'20px 20px 0 0'
      }} />
      {/* Rede */}
      <div style={{
        position:'absolute', left:'17%', top:'9.5%',
        width:'66%', height:'28.5%',
        backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 1px,transparent 1px,transparent 32px)'
      }} />

      {/* HUD topo */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,.65)', borderRadius:10, padding:'9px 20px',
        fontSize:22, fontWeight:700, zIndex:20, whiteSpace:'nowrap', textAlign:'center'
      }}>
        {isIdle    && 'OK para jogar'}
        {isPower   && `Força: ${Math.round(power)}% — ${powerZone}`}
        {isKicking && 'Remate!'}
        {isResult  && 'OK para jogar de novo'}
      </div>

      {/* Barra de força */}
      {isPower && (
        <div style={{
          position:'absolute', left:18, top:'50%', transform:'translateY(-50%)',
          width:30, height:220, border:'2px solid rgba(255,255,255,.4)',
          borderRadius:14, background:'rgba(0,0,0,.35)', overflow:'hidden'
        }}>
          <div style={{
            position:'absolute', bottom:0, left:0, width:'100%',
            height:`${power}%`,
            background:`linear-gradient(to top,#d61f2a,${powerColor})`,
            transition:'height .05s linear'
          }} />
          <div style={{ position:'absolute', bottom:'80%', left:0, right:0, height:2, background:'rgba(255,255,255,.7)' }} />
        </div>
      )}

      {/* ======= JOGADOR VERMELHO (2x) ======= */}
      <div style={{ position:'absolute', left:'4%', bottom:'8%', width:140, height:320, transformOrigin:'50% 100%' }}>
        {/* Cabeça */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:56, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)', border:'3px solid #c9956a' }} />
        {/* Cabelo */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:22, borderRadius:'50% 50% 0 0', background:'#3a1a00', transform:'translateX(-50%)' }} />
        {/* Corpo / Camisola RONALDO */}
        <div style={{ position:'absolute', left:'50%', top:52, width:60, height:104, background:'#d72a30', borderRadius:14, transform:'translateX(-50%)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <span style={{ fontSize:11, fontWeight:900, color:'#fff', letterSpacing:1 }}>RONALDO</span>
          <span style={{ fontSize:18, fontWeight:900, color:'rgba(255,255,255,.5)', marginTop:2 }}>7</span>
        </div>
        {/* Braço esq */}
        <div style={{ position:'absolute', left:4, top:68, width:56, height:14, background:'#d72a30', borderRadius:7, transform:'rotate(22deg)' }} />
        <div style={{ position:'absolute', left:2, top:78, width:24, height:13, background:'#f0c090', borderRadius:6, transform:'rotate(22deg)' }} />
        {/* Braço dir */}
        <div style={{ position:'absolute', right:4, top:68, width:56, height:14, background:'#d72a30', borderRadius:7, transform:'rotate(-22deg)' }} />
        <div style={{ position:'absolute', right:2, top:78, width:24, height:13, background:'#f0c090', borderRadius:6, transform:'rotate(-22deg)' }} />
        {/* Calções */}
        <div style={{ position:'absolute', left:'50%', top:152, width:64, height:40, background:'#1a1a80', borderRadius:8, transform:'translateX(-50%)' }} />
        {/* Perna esq */}
        <div style={{ position:'absolute', left:'36%', top:188, width:18, height:96, background:'#fff', borderRadius:8, transform:'rotate(8deg)' }} />
        <div style={{ position:'absolute', left:'32%', top:268, width:22, height:18, background:'#111', borderRadius:5, transform:'rotate(8deg)' }} />
        {/* Perna dir — anima chuto */}
        <div style={{
          position:'absolute', right:'36%', top:188, width:18, height:96,
          background:'#fff', borderRadius:8,
          transform: isKicking ? 'rotate(-58deg) translateY(-18px)' : 'rotate(-18deg)',
          transformOrigin:'50% 0%', transition:'transform .18s'
        }} />
        <div style={{
          position:'absolute', right:'28%', top: isKicking ? 196 : 258,
          width:26, height:16, background:'#111', borderRadius:5,
          transform: isKicking ? 'rotate(-54deg)' : 'rotate(-14deg)',
          transition:'all .18s'
        }} />
      </div>

      {/* ======= GUARDA-REDES AZUL (2x) — CENTRO DA BALIZA, BEM RECUADO ======= */}
      {/* Baliza: left=17% a right=83%. Centro = 50%. GR centrado = left:50% - 70px */}
      {/* bottom: coloca o GR dentro da baliza, não à frente dela */}
      <div style={{
        position:'absolute',
        left:'calc(50% - 70px)',  /* centro horizontal da baliza */
        bottom:'14%',             /* dentro da baliza, bem recuado */
        width:140, height:320, transformOrigin:'50% 100%',
        animation: keeperAnim,
        zIndex:8
      }}>
        {/* Cabeça */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:56, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)', border:'3px solid #c9956a' }} />
        {/* Touca */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:22, borderRadius:'50% 50% 0 0', background:'#1a3a00', transform:'translateX(-50%)' }} />
        {/* Corpo */}
        <div style={{ position:'absolute', left:'50%', top:52, width:60, height:104, background:'#1e67d6', borderRadius:14, transform:'translateX(-50%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:11, fontWeight:900, color:'#fff', letterSpacing:1 }}>GR</span>
        </div>
        {/* Braço esq — estendido com luva amarela */}
        <div style={{ position:'absolute', left:-28, top:72, width:80, height:14, background:'#1e67d6', borderRadius:7, transform:'rotate(-30deg)' }} />
        <div style={{ position:'absolute', left:-42, top:63, width:28, height:22, background:'#f5d020', borderRadius:6, transform:'rotate(-30deg)' }} />
        {/* Braço dir — estendido com luva amarela */}
        <div style={{ position:'absolute', right:-28, top:72, width:80, height:14, background:'#1e67d6', borderRadius:7, transform:'rotate(30deg)' }} />
        <div style={{ position:'absolute', right:-42, top:63, width:28, height:22, background:'#f5d020', borderRadius:6, transform:'rotate(30deg)' }} />
        {/* Calções */}
        <div style={{ position:'absolute', left:'50%', top:152, width:64, height:40, background:'#0a3a8a', borderRadius:8, transform:'translateX(-50%)' }} />
        {/* Perna esq */}
        <div style={{ position:'absolute', left:'36%', top:188, width:18, height:96, background:'#1e67d6', borderRadius:8, transform:'rotate(5deg)' }} />
        <div style={{ position:'absolute', left:'32%', top:268, width:22, height:18, background:'#111', borderRadius:5 }} />
        {/* Perna dir */}
        <div style={{ position:'absolute', right:'36%', top:188, width:18, height:96, background:'#1e67d6', borderRadius:8, transform:'rotate(-5deg)' }} />
        <div style={{ position:'absolute', right:'32%', top:268, width:22, height:18, background:'#111', borderRadius:5 }} />
      </div>

      {/* BOLA */}
      <div style={{
        position:'absolute',
        left: ballLeft,
        bottom: ballBottom,
        width:26, height:26, borderRadius:'50%',
        background:'#fff', border:'3px solid #222',
        boxShadow:'0 2px 10px rgba(0,0,0,.6)',
        transition: shooting ? 'left .44s ease-out, bottom .44s ease-out' : 'none',
        zIndex:20
      }} />

      {/* ECRÃ INICIAL */}
      {isIdle && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.2)', pointerEvents:'none' }}>
          <div style={{ background:'rgba(0,0,0,.75)', border:'2px solid rgba(255,255,255,.14)', borderRadius:22, padding:'30px 44px', textAlign:'center' }}>
            <div style={{ fontSize:42, fontWeight:900, letterSpacing:-1 }}>⚽ PENALTY HERO</div>
            <div style={{ fontSize:19, marginTop:8, color:'#ef4444', fontWeight:800, letterSpacing:3 }}>CHEERS O BAR</div>
            <div style={{ marginTop:22, fontSize:24, fontWeight:800, animation:'blink 1.4s ease-in-out infinite' }}>Pressiona OK para jogar</div>
            <div style={{ marginTop:10, fontSize:14, opacity:.5 }}>Acerta entre 80–100% para marcar!</div>
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {isResult && result && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.68)', zIndex:50 }}>
          <div style={{
            background: result.success ? 'rgba(0,70,0,.95)' : 'rgba(110,0,0,.95)',
            border:`3px solid ${result.success ? '#22c55e' : '#ef4444'}`,
            borderRadius:22, padding:'34px 56px', textAlign:'center',
            animation:'resultIn .22s ease-out'
          }}>
            <div style={{ fontSize: result.success ? 80 : 64, fontWeight:900, letterSpacing:-2 }}>
              {result.success ? '⚽ GOLO!' : '🧤 DEFESA!'}
            </div>
            {result.success && result.prize && (
              <div style={{ marginTop:14, fontSize:30, fontWeight:800, color:'#FFD700' }}>🏆 {result.prize}</div>
            )}
            <div style={{ marginTop:20, fontSize:17, opacity:.6, animation:'blink 1.4s ease-in-out infinite' }}>OK para jogar de novo</div>
          </div>
        </div>
      )}
    </div>
  );
}
