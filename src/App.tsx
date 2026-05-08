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

  /*
   * LAYOUT (em % do ecrã):
   * Baliza: top 8%–38% => bottom 62%–92%
   * GR: bottom 64% (dentro da baliza, bem ao fundo)
   * GR horizontal: centro do ecrã = 50%, GR width=140 => left = calc(50%-70px)
   *
   * Bola inicial: junto ao Ronaldo, bottom 15%, left 18%
   * Bola GOLO esquerda:  left 18%, bottom 80% (canto sup esq da baliza)
   * Bola GOLO direita:   left 78%, bottom 80% (canto sup dir da baliza)
   * Bola CENTRO (defesa): left 49%, bottom 66% (vai bater no GR)
   *
   * O GR está em left=calc(50%-70px)=~43% e bottom=64%
   * Os cantos (18% e 78%) estão longe do centro (43%-53%), sem cruzar.
   */
  const ballLeft = shooting
    ? (side === 'left'  ? '18%'
     : side === 'right' ? '78%'
     : '49%')
    : '18%';

  const ballBottom = shooting
    ? (side === 'center' ? '66%'   // vai ao GR
     : '80%')                      // canto alto, dentro da baliza
    : '15%';

  const powerColor = power >= 80 ? '#22c55e' : power >= 50 ? '#f59e0b' : '#ef4444';
  const powerZone  = power >= 90 ? '⚽ DIREITA' : power >= 80 ? '⚽ ESQUERDA' : '🧤 CENTRO';
  const keeperAnim = shooting && side === 'center' ? 'keeperSave .5s ease-out forwards' : 'none';

  return (
    <div ref={rootRef} tabIndex={0} onClick={shoot} style={{
      width:'100%', height:'100vh', overflow:'hidden', outline:'none',
      fontFamily:'Arial,sans-serif', color:'#fff', userSelect:'none',
      position:'relative', background:'#0e3320'
    }}>
      <style>{`
        *{box-sizing:border-box}
        html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes resultIn{0%{opacity:0;transform:scale(.9)}100%{opacity:1;transform:scale(1)}}
        @keyframes keeperSave{0%{transform:translateY(0)}45%{transform:translateY(-30px) scale(1.1)}100%{transform:translateY(0)}}
      `}</style>

      {/* Campo */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0e3320 0%,#0a2418 60%,#061810 100%)' }} />
      {/* Linhas do campo */}
      <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:'2px', background:'rgba(255,255,255,.15)' }} />

      {/* ===== BALIZA ===== */}
      {/* top: 8%, height: 30% => ocupa de 8% a 38% do topo */}
      {/* Em bottom: de 62% a 92% */}
      <div style={{
        position:'absolute', left:'17%', top:'8%',
        width:'66%', height:'30%',
        border:'8px solid #fff', borderBottom:'none',
        borderRadius:'20px 20px 0 0',
        zIndex:5
      }} />
      {/* Rede */}
      <div style={{
        position:'absolute', left:'17%', top:'9.5%',
        width:'66%', height:'28.5%',
        backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,.08) 0,rgba(255,255,255,.08) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0,rgba(255,255,255,.08) 1px,transparent 1px,transparent 32px)',
        zIndex:4
      }} />
      {/* Barra inferior da baliza (linha do chão da baliza) */}
      <div style={{
        position:'absolute', left:'17%', top:'38%',
        width:'66%', height:'8px',
        background:'rgba(255,255,255,.4)',
        zIndex:5
      }} />

      {/* HUD topo */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        background:'rgba(0,0,0,.7)', borderRadius:10, padding:'9px 20px',
        fontSize:22, fontWeight:700, zIndex:30, whiteSpace:'nowrap', textAlign:'center'
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
          width:30, height:220, border:'2px solid rgba(255,255,255,.5)',
          borderRadius:14, background:'rgba(0,0,0,.4)', overflow:'hidden', zIndex:30
        }}>
          <div style={{
            position:'absolute', bottom:0, left:0, width:'100%',
            height:`${power}%`,
            background:`linear-gradient(to top,#d61f2a,${powerColor})`,
            transition:'height .05s linear'
          }} />
          {/* linha 80% */}
          <div style={{ position:'absolute', bottom:'80%', left:0, right:0, height:2, background:'rgba(255,255,255,.8)' }} />
        </div>
      )}

      {/* ======= GUARDA-REDES AZUL ======= */}
      {/* Dentro da baliza: bottom=64% coloca-o mesmo dentro da zona da baliza */}
      <div style={{
        position:'absolute',
        left:'calc(50% - 70px)',
        bottom:'64%',
        width:140, height:280,
        transformOrigin:'50% 100%',
        animation: keeperAnim,
        zIndex:9
      }}>
        {/* Cabeça */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:56, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)', border:'3px solid #c9956a' }} />
        {/* Touca */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:22, borderRadius:'50% 50% 0 0', background:'#1a9a00', transform:'translateX(-50%)' }} />
        {/* Corpo */}
        <div style={{ position:'absolute', left:'50%', top:52, width:60, height:96, background:'#1e67d6', borderRadius:14, transform:'translateX(-50%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:12, fontWeight:900, color:'#fff', letterSpacing:1 }}>GR</span>
        </div>
        {/* Braço esq com luva */}
        <div style={{ position:'absolute', left:-30, top:68, width:82, height:14, background:'#1e67d6', borderRadius:7, transform:'rotate(-28deg)' }} />
        <div style={{ position:'absolute', left:-44, top:58, width:28, height:24, background:'#f5d020', borderRadius:6, transform:'rotate(-28deg)' }} />
        {/* Braço dir com luva */}
        <div style={{ position:'absolute', right:-30, top:68, width:82, height:14, background:'#1e67d6', borderRadius:7, transform:'rotate(28deg)' }} />
        <div style={{ position:'absolute', right:-44, top:58, width:28, height:24, background:'#f5d020', borderRadius:6, transform:'rotate(28deg)' }} />
        {/* Calções */}
        <div style={{ position:'absolute', left:'50%', top:144, width:64, height:36, background:'#0a3a8a', borderRadius:8, transform:'translateX(-50%)' }} />
        {/* Pernas */}
        <div style={{ position:'absolute', left:'36%', top:176, width:18, height:80, background:'#1e67d6', borderRadius:8, transform:'rotate(5deg)' }} />
        <div style={{ position:'absolute', left:'32%', top:244, width:22, height:16, background:'#111', borderRadius:5 }} />
        <div style={{ position:'absolute', right:'36%', top:176, width:18, height:80, background:'#1e67d6', borderRadius:8, transform:'rotate(-5deg)' }} />
        <div style={{ position:'absolute', right:'32%', top:244, width:22, height:16, background:'#111', borderRadius:5 }} />
      </div>

      {/* ======= JOGADOR VERMELHO (RONALDO) ======= */}
      {/* bottom: 38% = fica no chão fora da baliza, à esquerda */}
      <div style={{ position:'absolute', left:'4%', bottom:'38%', width:140, height:280, transformOrigin:'50% 100%', zIndex:10 }}>
        {/* Cabeça */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:56, borderRadius:'50%', background:'#f0c090', transform:'translateX(-50%)', border:'3px solid #c9956a' }} />
        {/* Cabelo */}
        <div style={{ position:'absolute', left:'50%', top:0, width:56, height:22, borderRadius:'50% 50% 0 0', background:'#3a1a00', transform:'translateX(-50%)' }} />
        {/* Corpo */}
        <div style={{ position:'absolute', left:'50%', top:52, width:60, height:96, background:'#d72a30', borderRadius:14, transform:'translateX(-50%)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <span style={{ fontSize:10, fontWeight:900, color:'#fff', letterSpacing:1 }}>RONALDO</span>
          <span style={{ fontSize:18, fontWeight:900, color:'rgba(255,255,255,.5)' }}>7</span>
        </div>
        {/* Braço esq */}
        <div style={{ position:'absolute', left:4, top:64, width:52, height:13, background:'#d72a30', borderRadius:7, transform:'rotate(22deg)' }} />
        <div style={{ position:'absolute', left:2, top:74, width:22, height:12, background:'#f0c090', borderRadius:6, transform:'rotate(22deg)' }} />
        {/* Braço dir */}
        <div style={{ position:'absolute', right:4, top:64, width:52, height:13, background:'#d72a30', borderRadius:7, transform:'rotate(-22deg)' }} />
        <div style={{ position:'absolute', right:2, top:74, width:22, height:12, background:'#f0c090', borderRadius:6, transform:'rotate(-22deg)' }} />
        {/* Calções */}
        <div style={{ position:'absolute', left:'50%', top:144, width:64, height:36, background:'#1a1a80', borderRadius:8, transform:'translateX(-50%)' }} />
        {/* Perna esq */}
        <div style={{ position:'absolute', left:'36%', top:176, width:18, height:80, background:'#fff', borderRadius:8, transform:'rotate(8deg)' }} />
        <div style={{ position:'absolute', left:'32%', top:244, width:22, height:16, background:'#111', borderRadius:5, transform:'rotate(8deg)' }} />
        {/* Perna dir — chuta */}
        <div style={{
          position:'absolute', right:'36%', top:176, width:18, height:80,
          background:'#fff', borderRadius:8,
          transform: isKicking ? 'rotate(-58deg) translateY(-16px)' : 'rotate(-18deg)',
          transformOrigin:'50% 0%', transition:'transform .18s'
        }} />
        <div style={{
          position:'absolute', right:'28%', top: isKicking ? 188 : 244,
          width:26, height:16, background:'#111', borderRadius:5,
          transform: isKicking ? 'rotate(-54deg)' : 'rotate(-14deg)',
          transition:'all .18s'
        }} />
      </div>

      {/* BOLA (zIndex:20 — sempre à frente dos bonecos) */}
      <div style={{
        position:'absolute',
        left: ballLeft,
        bottom: ballBottom,
        width:28, height:28, borderRadius:'50%',
        background:'#fff', border:'3px solid #222',
        boxShadow:'0 2px 12px rgba(0,0,0,.7)',
        transition: shooting ? 'left .46s ease-out, bottom .46s ease-out' : 'none',
        zIndex:20
      }} />

      {/* ECRÃ INICIAL */}
      {isIdle && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.25)', pointerEvents:'none', zIndex:40 }}>
          <div style={{ background:'rgba(0,0,0,.78)', border:'2px solid rgba(255,255,255,.15)', borderRadius:22, padding:'30px 44px', textAlign:'center' }}>
            <div style={{ fontSize:42, fontWeight:900, letterSpacing:-1 }}>⚽ PENALTY HERO</div>
            <div style={{ fontSize:19, marginTop:8, color:'#ef4444', fontWeight:800, letterSpacing:3 }}>CHEERS O BAR</div>
            <div style={{ marginTop:22, fontSize:24, fontWeight:800, animation:'blink 1.4s ease-in-out infinite' }}>Pressiona OK para jogar</div>
            <div style={{ marginTop:10, fontSize:14, opacity:.5 }}>Acerta entre 80–100% para marcar!</div>
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {isResult && result && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.7)', zIndex:50 }}>
          <div style={{
            background: result.success ? 'rgba(0,70,0,.96)' : 'rgba(110,0,0,.96)',
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
