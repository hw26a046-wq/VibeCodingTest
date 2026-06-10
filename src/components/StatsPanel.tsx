/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { HighScore } from '../types';
import { sfx } from '../utils/audio';
import { Trophy, Calendar, ShieldAlert, Skull, Timer, Trash2, Award } from 'lucide-react';

interface StatsPanelProps {
  onBack: () => void;
}

export function StatsPanel({ onBack }: StatsPanelProps) {
  const [history, setHistory] = React.useState<HighScore[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('vampire_survivor_highscores');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed reading score history:', e);
    }
  }, []);

  const handleClearHistory = () => {
    if (confirm('すべてのプレイ履歴とハイスコアを消去しますか？')) {
      sfx.playWhip();
      localStorage.removeItem('vampire_survivor_highscores');
      setHistory([]);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sort history: Best time survived wins, then level, then kills
  const sortedHistory = [...history].sort((a, b) => {
    if (b.timeElapsed !== a.timeElapsed) {
      return b.timeElapsed - a.timeElapsed;
    }
    return b.kills - a.kills;
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto text-zinc-100 min-h-[500px]">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-xs font-mono tracking-[0.4em] text-red-500 font-bold block mb-1">HALL OF HEROES</span>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent drop-shadow">
            深淵の生存記録
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-2">
            これまで奈落に挑んだ戦士たちのハイスコアおよび生存軌跡。
          </p>
        </motion.div>
      </div>

      <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col mb-6">
        {/* Decorative Grid Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-5 bg-radial from-red-500 to-transparent blur-xl" />

        {sortedHistory.length === 0 ? (
          <div className="text-center py-16">
            <Award size={48} className="text-zinc-700 mx-auto mb-4 animate-bounce" />
            <p className="text-zinc-500 text-sm">記録された生存記がまだありません。</p>
            <p className="text-zinc-600 text-xs font-mono mt-1">First, battle the vampire horde to scribe your legacy!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 font-bold tracking-widest uppercase">
                RANKING (SURVIVED TIME)
              </span>

              <button
                id="btn-clear-history"
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                <span>履歴リセット</span>
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 font-mono">
                <thead>
                  <tr className="border-b border-zinc-800/60 text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">順位</th>
                    <th className="py-2 px-4">生存者（クラス）</th>
                    <th className="py-2 px-3 text-center"><Timer size={14} className="inline mr-1" /> 生存時間</th>
                    <th className="py-2 px-3 text-center"><Skull size={14} className="inline mr-1" /> 討伐数</th>
                    <th className="py-2 px-3 text-center">到達LV</th>
                    <th className="py-2 px-3 text-right"><Calendar size={14} className="inline mr-1" /> 日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {sortedHistory.slice(0, 10).map((score, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-zinc-900/40 transition-colors ${
                          isFirst ? 'bg-amber-500/5 font-semibold text-amber-200' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          {isFirst ? (
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Trophy size={14} /> #1
                            </span>
                          ) : (
                            <span>#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="text-sm">
                            {score.classId === 'knight' && '🛡️'}
                            {score.classId === 'mage' && '🔮'}
                            {score.classId === 'assassin' && '🥷'}
                            {score.classId === 'hunter' && '🧛'}
                          </span>
                          <span className={isFirst ? 'text-amber-300 font-medium' : 'text-zinc-100'}>
                            {score.className}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-400">
                          {formatTime(score.timeElapsed)}
                        </td>
                        <td className="py-3 px-3 text-center text-red-400 font-bold">
                          {score.kills}
                        </td>
                        <td className="py-3 px-3 text-center">
                          Lv.{score.level}
                        </td>
                        <td className="py-3 px-3 text-right text-[10px] text-zinc-500">
                          {score.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <motion.button
        id="btn-back-to-menu"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          sfx.playSelect();
          onBack();
        }}
        className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold rounded-2xl cursor-pointer text-sm transition-all shadow"
      >
        メインメニューに戻る
      </motion.button>
    </div>
  );
}
