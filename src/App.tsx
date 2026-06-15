/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerClass, GameStats, HighScore } from './types';
import { ClassSelect } from './components/ClassSelect';
import { GameCanvas } from './components/GameCanvas';
import { StatsPanel } from './components/StatsPanel';
import { sfx } from './utils/audio';
import { Swords, Trophy, Sparkles, Skull, Clock, Coins, Flame, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = React.useState<'title' | 'classSelect' | 'playing' | 'gameOver' | 'stats'>('title');
  const [selectedClass, setSelectedClass] = React.useState<PlayerClass | null>(null);
  const [lastStats, setLastStats] = React.useState<GameStats | null>(null);
  const [isNewRecord, setIsNewRecord] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(sfx.getMuteState());

  const handleStartGame = () => {
    sfx.playSelect();
    setScreen('classSelect');
  };

  const handleClassSelected = (hero: PlayerClass) => {
    setSelectedClass(hero);
    setScreen('playing');
  };

  const handleToggleMute = () => {
    const nextMute = sfx.toggleMute();
    setIsMuted(nextMute);
  };

  const handleGameOverStats = (stats: GameStats) => {
    if (!selectedClass) return;
    
    setLastStats(stats);
    
    // Save record to local storage
    const newRecord: HighScore = {
      className: selectedClass.name,
      classId: selectedClass.id,
      timeElapsed: stats.timeElapsed,
      kills: stats.kills,
      level: stats.level,
      gold: stats.gold,
      date: new Date().toLocaleString('ja-JP', { hour12: false }),
    };

    let previousHighScores: HighScore[] = [];
    try {
      const saved = localStorage.getItem('vampire_survivor_highscores');
      if (saved) {
        previousHighScores = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    // Check if player beat their previous best time for this class
    const classRecords = previousHighScores.filter((r) => r.classId === selectedClass.id);
    const bestPreTime = classRecords.length > 0 ? Math.max(...classRecords.map((r) => r.timeElapsed)) : 0;
    
    const isNewBest = stats.timeElapsed > bestPreTime;
    setIsNewRecord(isNewBest);

    // Add and save
    previousHighScores.push(newRecord);
    localStorage.setItem('vampire_survivor_highscores', JSON.stringify(previousHighScores));

    setScreen('gameOver');
  };

  const handleGoToStats = () => {
    sfx.playSelect();
    setScreen('stats');
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Background glowing particles / aura effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[140px] opacity-60" />
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Floating Audio Toggle (Only on Title and GameOver) */}
      {(screen === 'title' || screen === 'gameOver') && (
        <div className="absolute top-4 right-4 z-50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleMute}
            className="p-3 rounded-2xl bg-zinc-950/90 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 cursor-pointer border border-zinc-900 flex items-center gap-2 text-xs font-mono"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? 'MUTE ON' : 'MUTE OFF'}</span>
          </motion.button>
        </div>
      )}

      {/* Main Container screen routers */}
      <main className="flex-1 w-full relative z-10 flex flex-col justify-center py-6 px-4">
        <AnimatePresence mode="wait">
          
          {/* TITLE MAIN MENU SCREEN */}
          {screen === 'title' && (
            <motion.div
              key="title"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35 }}
              className="text-center max-w-xl mx-auto flex flex-col items-center py-10"
            >
              {/* Moon Eclipse Crimson Glow Ring */}
              <div className="relative mb-6">
                <div className="absolute inset-0 w-36 h-36 rounded-full bg-red-600/30 blur-2xl animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="w-36 h-36 rounded-full border-2 border-dashed border-red-500/40 p-4 flex items-center justify-center relative"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-amber-600 shadow-lg flex items-center justify-center">
                    <Flame size={48} className="text-zinc-950 animate-bounce duration-2000" />
                  </div>
                </motion.div>
                <span className="absolute -bottom-1 -right-1 text-2xl font-bold bg-zinc-900 border border-zinc-800 p-1.5 px-2.5 rounded-2xl">
                  🧛
                </span>
              </div>

              {/* Game Logos */}
              <span className="text-xs font-mono tracking-[0.5em] text-red-500 font-extrabold uppercase mb-1">
                2D DARK ROGUELIKE ACTION
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-zinc-100 via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-1">
                アビスサバイバー
              </h1>
              <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#ef4444] bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-xl uppercase shadow">
                ダーク・コヴェナント
              </h2>
              
              <p className="text-xs md:text-sm font-sans text-zinc-400 mt-5 leading-relaxed max-w-md">
                「ヴァンパイアサバイバー風」弾幕ハック＆スラッシュ。
                次々と押し寄せる数千体の奈落モンスター。ランダムな聖遺物を調合し、無限の武器ビルドを完成させて全画面一掃の快感を。
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3.5 mt-10 px-6">
                <motion.button
                  id="btn-play-start"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartGame}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-zinc-950 font-black text-sm uppercase tracking-widest py-4 rounded-2xl cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
                >
                  <Swords size={18} />
                  深淵に潜る (BATTLE START)
                </motion.button>

                <motion.button
                  id="btn-high-scores"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoToStats}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Trophy size={15} className="text-amber-400" />
                  生存者記録 (LEADERBOARD)
                </motion.button>
              </div>

              {/* Disclaimer */}
              <span className="text-[10px] font-mono text-zinc-600 mt-8 block">
                Vampire Survivors Tribute • Procedural Synth Synthesis Enabled
              </span>
            </motion.div>
          )}

          {/* HERO SELECTION SCREEN */}
          {screen === 'classSelect' && (
            <motion.div
              key="classSelect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <ClassSelect onSelect={handleClassSelected} />
            </motion.div>
          )}

          {/* ACTIVE GAME PLAY SCREEN */}
          {screen === 'playing' && selectedClass && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[620px] max-w-6xl mx-auto bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl relative"
            >
              <GameCanvas playerClass={selectedClass} onGameOver={handleGameOverStats} />
            </motion.div>
          )}

          {/* GAME OVER (RESULTS) BREAKDOWN SCREEN */}
          {screen === 'gameOver' && lastStats && selectedClass && (
            <motion.div
              key="gameOver"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto bg-zinc-950/90 border-2 border-red-500/20 rounded-3xl p-6 md:p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-10 bg-radial from-red-500 to-transparent blur-xl" />

              {/* Death icon */}
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full mx-auto flex items-center justify-center mb-6 text-3xl">
                💀
              </div>

              <span className="text-xs font-mono tracking-[0.4em] text-red-500 font-bold block mb-1">RUN SUMMARY</span>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tight mb-2">
                討ち死に (RUN OVER)
              </h1>
              <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xs mx-auto mb-8 font-sans">
                聖騎士アリスターたちの加護もここまでです。モンスターの群れはあなたの魂を飲み込みました。
              </p>

              {/* New Personal Best Flag */}
              {isNewRecord && (
                <div className="mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 font-mono text-xs font-bold animate-bounce">
                  <Sparkles size={14} /> NEW PERSONAL BEST RECORD!
                </div>
              )}

              {/* Data Table Panel */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 font-mono justify-center items-stretch text-sm text-left mb-8">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/40">
                  <span className="text-zinc-500 tracking-wider">使用クラス</span>
                  <span style={{ color: selectedClass.color }} className="font-extrabold flex items-center gap-1.5">
                    {selectedClass.image ? (
                      <img
                        src={selectedClass.image}
                        alt={selectedClass.name}
                        className="w-5 h-5 rounded-full object-cover border border-zinc-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{selectedClass.emoji}</span>
                    )}
                    <span>{selectedClass.name}</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Clock size={15} className="text-emerald-400" /> 生存時間</span>
                  <span className="text-emerald-400 font-black text-base">{formatTime(lastStats.timeElapsed)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Skull size={15} className="text-rose-500" /> 討伐モンスター数</span>
                  <span className="text-rose-400 font-black text-base">{lastStats.kills} 体</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5">到達レベル</span>
                  <span className="text-amber-400 font-black text-base">Lv.{lastStats.level}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Coins size={15} className="text-yellow-400" /> 獲得金貨</span>
                  <span className="text-yellow-400 font-black text-base">{lastStats.gold} Gold</span>
                </div>
              </div>

              {/* Play / Title Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  id="btn-retry-run"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    sfx.playSelect();
                    setScreen('classSelect');
                  }}
                  className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl cursor-pointer transition-colors shadow"
                >
                  同じクラスでリベンジする
                </motion.button>

                <motion.button
                  id="btn-title-return"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    sfx.playSelect();
                    setScreen('title');
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl cursor-pointer transition-colors"
                >
                  メインメニューに戻る
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STATS LEADERBOARD PANEL */}
          {screen === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <StatsPanel onBack={() => setScreen('title')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Humble Elegant footer credits */}
      <footer className="text-center py-4 text-xxs font-mono text-zinc-600 relative z-10 border-t border-zinc-900/40 mx-4">
        <span>DEV BUILD • © 2026 ABYSS SURVIVORS • POWERED BY ANTIGRAVITY EMULATION</span>
      </footer>
    </div>
  );
}

