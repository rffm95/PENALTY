import React, { useEffect, useRef, useState } from 'react';
import { GameState, PrizeType, PRIZES } from './types';

const OK_KEYS = new Set([13, 32, 179, 195, 404, 406]);
const L_KEYS = new Set([37]);
const R_KEYS = new Set([39]);
const U_KEYS = new Set([38]);
const D_KEYS = new Set([40]);

type Side = 'left' | 'center' | 'right';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [power, setPower] = useState(0);
  const [side, setSide] = useState<Side>('center');
  const [result, setResult] = useState<{ success: boolean; prize?: PrizeType } | null>(null);
  const powerRef = useRef(0);
  const dirRef = useRef(1);
  const timerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Forçar foco — crítico para VIDAA OS
  useEffect(() => {
    const focus = () => rootRef.current?.focus();
    focus();
    const t1 = setTimeout(focus, 300);
    const t2 = setTimeout(focus, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Barra de força
  useEffect(() => {
    if (gameState !== GameState.POWERING) return;
    const step = () => {
      setPower(p => {
        let n = p + dirRef.current * 2;
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
      setSide('center');
      setGameState(GameState.POWERING);
      return;
    }
    if (gameState === GameState.POWERING) {
      const p = powerRef.current;
      const isGoal = p >= 58 && p <= 82;
      setGameState(GameState.KICKING);
      setTimeout(() => {
        setResult({ success: isGoal, prize: isGoal ? getRandomPrize() : undefined });
        setGameState(GameState.RESULT);
      }, 500);
      return;
    }
    if (gameState === GameState.RESULT) {
      setGameState(GameState.IDLE);
      setResult(null);
      setPower(0);
      setSide('center');
    }
  };

  const onKey = (e: KeyboardEvent) => {
    const code = e.keyCode || e.which;
    if (OK_KEYS.has(code)) { e.preventDefault(); shoot(); return; }
    if (L_KEYS.has(code))  { e.preventDefault(); if (gameState === GameState.POWERING) setSide('left'); return; }
    if (R_KEYS.has(code))  { e.preventDefault(); if (gameState === GameState.POWERING) setSide('right'); return; }
    if (U_KEYS.has(code))  { e.preventDefault(); if (gameState === GameState.POWERING) { setPower(p => { const n = Math.min(100, p + 8); powerRef.current = n; return n; }); } return; }
    if (D_KEYS.has(code))  { e.preventDefault(); if (gameState === GameState.POWERING) { setPower(p => { const n = Math.max(0, p - 8); powerRef.current = n; return n; }); } return; }
  };

  useEffect(() => {
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup',   onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup',   onKey, true);
    };
  }, [gameState]);

  const isKicking = gameState === GameState.KICKING;
  const isIdle    = gameState === GameState.IDLE;
  const isResult  = gameState === GameState.RESULT;
  const isPower   = gameState === GameState.POWERING;

  // Posição do keeper — mergulha para o lado contrário ao remate
  const keeperX = isKicking
    ? (side === 'left' ? 64 : side === 'right' ? -64 : 0)
    : 0;
  const keeperRotate = isKicking
    ? (side === 'left' ? 18 : side === 'right' ? -18 : 0)
    : 0;

  // Posição da bola
  const ballLeft = isKicking
    ? (side === 'left' ? '28%' : side === 'right' ? '68%' : '48%')
    : '32%';
  const ballBottom = isKicking ? '52%' : '19%';

  const powerColor = power >= 58 && power <= 82 ? '#22c55e' : power > 82 ? '#ef4444' : '#f59e0b';

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onClick={shoot}
      style={{
        width: '100%', height: '100vh', overflow: 'hidden',
        background: 'linear-gradient(180deg,#0d2232 0%,#07131d 100%)',
        position: 'relative', outline: 'none', fontFamily: 'Arial,sans-serif',
        color: '#fff', userSelect: 'none'
      }}
    >
      <style>{`
        *{box-sizing:border-box}
        html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes ballFly{
          0%{opacity:1}
          100%{opacity:.85}
        }
        @keyframes keeperDive{
          0%{transform:translateX(0) rotate(0deg)}
          100%{transform:translateX(var(--kx)) rotate(var(--kr))}
        }
        @keyframes playerKick{
          0%{transform:rotate(0deg)}
          40%{transform:rotate(-14deg)}
          100%{transform:rotate(0deg)}
        }
        @keyframes resultIn{
          0%{opacity:0;transform:scale(.92)}
          100%{opacity:1;transform:scale(1)}
        }
      `}</style>

      {/* Relva */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg,#0e3320 0%,#0a2418 55%,#061810 100%)'
      }} />

      {/* Linhas do campo */}
      <div style={{
        position: 'absolute', left: '50%', top: '13%',
        width: '62%', height: '24%',
        border: '6px solid rgba(255,255,255,.28)',
        borderBottom: 'none', borderRadius: '18px 18px 0 0',
        transform: 'translateX(-50%)'
      }} />
      {/* Rede simples */}
      <div style={{
        position: 'absolute', left: '50%', top: '14.5%',
        width: '58%', height: '22%',
        background: 'repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0,rgba(255,255,255,.07) 1px,transparent 1px,transparent 28px), repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0,rgba(255,255,255,.07) 1px,transparent 1px,transparent 28px)',
        transform: 'translateX(-50%)',
        borderRadius: '0 0 0 0'
      }} />

      {/* HUD topo */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,.55)', borderRadius: 10, padding: '8px 16px',
        fontSize: 18, fontWeight: 700, zIndex: 20, whiteSpace: 'nowrap'
      }}>
        {isIdle && 'OK para jogar'}
        {isPower && `Força: ${Math.round(power)}% · Setas: direção`}
        {isKicking && 'Remate!'}
        {isResult && 'OK para jogar de novo'}
      </div>

      {/* Barra de força */}
      {isPower && (
        <div style={{
          position: 'absolute', left: 16, bottom: 16,
          width: 24, height: 180,
          border: '2px solid rgba(255,255,255,.4)',
          borderRadius: 12, background: 'rgba(0,0,0,.35)', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%',
            height: `${power}%`,
            background: `linear-gradient(to top, #d61f2a, ${powerColor})`,
            transition: 'height .06s linear'
          }} />
        </div>
      )}

      {/* Direção escolhida */}
      {isPower && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 12, alignItems: 'center'
        }}>
          {(['left','center','right'] as Side[]).map(s => (
            <div key={s} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `3px solid ${side === s ? '#22c55e' : 'rgba(255,255,255,.3)'}`,
              background: side === s ? '#22c55e' : 'transparent',
              transition: 'all .1s'
            }} />
          ))}
        </div>
      )}

      {/* JOGADOR — boneco CSS */}
      <div style={{
        position: 'absolute', left: '12%', bottom: '15%',
        width: 70, height: 160,
        transformOrigin: '50% 100%',
        animation: isKicking ? 'playerKick .45s ease-out' : 'none',
        transition: 'transform .1s'
      }}>
        {/* cabeça */}
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 28, height: 28, borderRadius: '50%', background: '#f0c090', transform: 'translateX(-50%)' }} />
        {/* corpo */}
        <div style={{ position: 'absolute', left: '50%', top: 26, width: 30, height: 52, background: '#d72a30', borderRadius: 8, transform: 'translateX(-50%)' }} />
        {/* braço esq */}
        <div style={{ position: 'absolute', left: 2, top: 34, width: 28, height: 7, background: '#f0c090', borderRadius: 4, transform: 'rotate(22deg)' }} />
        {/* braço dir */}
        <div style={{ position: 'absolute', right: 2, top: 34, width: 28, height: 7, background: '#f0c090', borderRadius: 4, transform: 'rotate(-22deg)' }} />
        {/* perna esq */}
        <div style={{ position: 'absolute', left: '38%', top: 76, width: 9, height: 58, background: '#222', borderRadius: 4, transform: 'rotate(8deg)' }} />
        {/* perna dir */}
        <div style={{
          position: 'absolute', right: '38%', top: 76, width: 9, height: 58,
          background: '#222', borderRadius: 4,
          transform: isKicking ? 'rotate(-52deg) translateY(-10px)' : 'rotate(-20deg)',
          transition: 'transform .15s'
        }} />
        {/* chuteira */}
        <div style={{
          position: 'absolute', right: '26%', top: isKicking ? 90 : 118,
          width: 18, height: 9, background: '#333', borderRadius: 4,
          transform: isKicking ? 'rotate(-50deg)' : 'rotate(-15deg)',
          transition: 'all .15s'
        }} />
      </div>

      {/* GUARDA-REDES — boneco CSS */}
      <div style={{
        position: 'absolute', left: '63%', bottom: '28%',
        width: 70, height: 160,
        transformOrigin: '50% 100%',
        transform: `translateX(${keeperX}px) rotate(${keeperRotate}deg)`,
        transition: isKicking ? 'transform .3s ease-out' : 'none'
      }}>
        {/* cabeça */}
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 28, height: 28, borderRadius: '50%', background: '#f0c090', transform: 'translateX(-50%)' }} />
        {/* corpo */}
        <div style={{ position: 'absolute', left: '50%', top: 26, width: 30, height: 52, background: '#1e67d6', borderRadius: 8, transform: 'translateX(-50%)' }} />
        {/* braço esq — estendido */}
        <div style={{ position: 'absolute', left: -14, top: 38, width: 44, height: 8, background: '#f0c090', borderRadius: 4, transform: 'rotate(-28deg)' }} />
        {/* braço dir — estendido */}
        <div style={{ position: 'absolute', right: -14, top: 38, width: 44, height: 8, background: '#f0c090', borderRadius: 4, transform: 'rotate(28deg)' }} />
        {/* perna esq */}
        <div style={{ position: 'absolute', left: '38%', top: 76, width: 9, height: 58, background: '#222', borderRadius: 4, transform: 'rotate(5deg)' }} />
        {/* perna dir */}
        <div style={{ position: 'absolute', right: '38%', top: 76, width: 9, height: 58, background: '#222', borderRadius: 4, transform: 'rotate(-5deg)' }} />
      </div>

      {/* BOLA */}
      <div style={{
        position: 'absolute',
        left: ballLeft,
        bottom: ballBottom,
        width: 20, height: 20,
        borderRadius: '50%',
        background: '#fff',
        border: '2px solid #222',
        boxShadow: '0 2px 8px rgba(0,0,0,.5)',
        transition: isKicking ? 'left .4s ease-out, bottom .4s ease-out' : 'none',
        zIndex: 10
      }} />

      {/* ECRÃ DE INÍCIO */}
      {isIdle && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.18)', pointerEvents: 'none'
        }}>
          <div style={{
            background: 'rgba(0,0,0,.7)', border: '2px solid rgba(255,255,255,.12)',
            borderRadius: 20, padding: '28px 36px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>⚽ PENALTY HERO</div>
            <div style={{ fontSize: 18, marginTop: 8, color: '#ef4444', fontWeight: 800 }}>MOSTRA QUE BATES BEM</div>
            <div style={{
              marginTop: 18, fontSize: 22, fontWeight: 800,
              animation: 'blink 1.4s ease-in-out infinite'
            }}>Pressiona OK para jogar</div>
            <div style={{ marginTop: 10, fontSize: 14, opacity: .55 }}>← → escolhe canto · ↑ ↓ ajusta força</div>
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {isResult && result && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.65)', zIndex: 50
        }}>
          <div style={{
            background: result.success ? 'rgba(0,80,0,.92)' : 'rgba(120,0,0,.92)',
            border: `3px solid ${result.success ? '#22c55e' : '#ef4444'}`,
            borderRadius: 20, padding: '32px 48px', textAlign: 'center',
            animation: 'resultIn .25s ease-out'
          }}>
            <div style={{ fontSize: result.success ? 72 : 56, fontWeight: 900, letterSpacing: -2 }}>
              {result.success ? '⚽ GOLO!' : '🧤 DEFESA!'}
            </div>
            {result.success && result.prize && (
              <div style={{ marginTop: 14, fontSize: 26, fontWeight: 800, color: '#FFD700' }}>
                🏆 {result.prize}
              </div>
            )}
            <div style={{ marginTop: 18, fontSize: 16, opacity: .6, animation: 'blink 1.4s ease-in-out infinite' }}>
              OK para jogar de novo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
