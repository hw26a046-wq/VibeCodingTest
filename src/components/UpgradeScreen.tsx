/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ActiveUpgrade, WeaponType, PassiveType } from '../types';
import { sfx } from '../utils/audio';
import { Swords, Eye, Shield, Zap, Heart, Clock, CircleDot, RefreshCw } from 'lucide-react';

interface UpgradeScreenProps {
  options: ActiveUpgrade[];
  onSelect: (option: ActiveUpgrade) => void;
  goldMultiplier?: number;
}

export function UpgradeScreen({ options, onSelect }: UpgradeScreenProps) {
  React.useEffect(() => {
    // Sound on open
    sfx.playUpgradeSelect();
  }, []);

  const handleSelect = (option: ActiveUpgrade) => {
    sfx.playUpgradeSelect();
    onSelect(option);
  };

  const getIcon = (type: 'weapon' | 'passive', targetType: WeaponType | PassiveType) => {
    if (type === 'weapon') {
      switch (targetType) {
        case 'whip': return '🪢';
        case 'fireball': return '🔥';
        case 'garlic': return '🧄';
        case 'axe': return '🪓';
        case 'bible': return '📖';
        case 'lightning': return '⚡';
        default: return '⚔️';
      }
    } else {
      switch (targetType) {
        case 'might': return <Swords size={20} className="text-amber-400" />;
        case 'armor': return <Shield size={20} className="text-blue-400" />;
        case 'speed': return <Zap size={20} className="text-emerald-400" />;
        case 'magnet': return <Eye size={20} className="text-purple-400" />;
        case 'maxHp': return <Heart size={20} className="text-red-400" />;
        case 'cooldown': return <Clock size={20} className="text-cyan-400" />;
        default: return <CircleDot size={20} className="text-zinc-400" />;
      }
    }
  };

  const getTypeBadge = (option: ActiveUpgrade) => {
    if (option.type === 'weapon') {
      return (
        <span className="text-[10px] font-mono tracking-wider font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full select-none">
          WEAPON
        </span>
      );
    } else {
      return (
        <span className="text-[10px] font-mono tracking-wider font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full select-none">
          PASSIVE
        </span>
      );
    }
  };

  const getColorTheme = (targetType: string) => {
    switch (targetType) {
      case 'whip': return 'from-amber-600/30 via-zinc-950 to-zinc-950 border-amber-700/50 hover:border-amber-500 shadow-amber-500/5';
      case 'fireball': return 'from-red-600/30 via-zinc-950 to-zinc-950 border-red-700/50 hover:border-red-500 shadow-red-500/5';
      case 'garlic': return 'from-green-600/30 via-zinc-950 to-zinc-950 border-green-700/50 hover:border-green-500 shadow-green-500/5';
      case 'axe': return 'from-zinc-500/30 via-zinc-950 to-zinc-950 border-zinc-700/50 hover:border-zinc-500 shadow-zinc-500/5';
      case 'bible': return 'from-purple-600/30 via-zinc-950 to-zinc-950 border-purple-700/50 hover:border-purple-500 shadow-purple-500/5';
      case 'lightning': return 'from-yellow-500/30 via-zinc-950 to-zinc-950 border-yellow-600/50 hover:border-yellow-400 shadow-yellow-500/5';
      case 'might': return 'from-orange-600/30 via-zinc-950 to-zinc-950 border-orange-700/50 hover:border-orange-500 shadow-orange-500/5';
      case 'armor': return 'from-blue-600/30 via-zinc-950 to-zinc-950 border-blue-700/50 hover:border-blue-500 shadow-blue-500/5';
      case 'speed': return 'from-emerald-600/30 via-zinc-950 to-zinc-950 border-emerald-700/50 hover:border-emerald-500 shadow-emerald-500/5';
      case 'magnet': return 'from-indigo-600/30 via-zinc-950 to-zinc-950 border-indigo-700/50 hover:border-indigo-500 shadow-indigo-500/5';
      case 'maxHp': return 'from-rose-600/30 via-zinc-950 to-zinc-950 border-rose-700/50 hover:border-rose-500 shadow-rose-500/5';
      case 'cooldown': return 'from-cyan-600/30 via-zinc-950 to-zinc-950 border-cyan-700/50 hover:border-cyan-500 shadow-cyan-500/5';
      default: return 'from-zinc-800/20 via-zinc-950 to-zinc-950 border-zinc-800 hover:border-zinc-700';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {/* Light glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 text-center">
        {/* Level Up Banner */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="mb-8"
        >
          <div className="flex justify-center items-center gap-2 text-amber-400 font-mono tracking-[0.3em] font-extrabold text-sm mb-2 uppercase">
            <RefreshCw size={14} className="animate-spin duration-3000" />
            LEVEL UP!
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 drop-shadow">
            秘術の選択
          </h1>
          <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto mt-2.5">
            レベルアップに伴い、新たな武装または追加の支援能力が授与されました。1つを選択して能力を拡張してください。
          </p>
        </motion.div>

        {/* Level Up Options Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch text-left">
          {options.length === 0 ? (
            <div className="col-span-3 text-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl">
              <span className="text-sm font-mono text-zinc-500 block">NO AVAILABLE UPGRADES AT THIS TIME</span>
              <button
                onClick={() => handleSelect({
                  id: 'gold', name: '金貨ボーナス', description: '現在の全装備が最大です。ボーナス金貨100Gを獲得します。',
                  icon: '💰', type: 'passive', targetType: 'might', level: 1
                })}
                className="mt-4 px-6 py-2.5 bg-yellow-500 text-zinc-950 font-bold rounded-xl hover:bg-yellow-400 active:scale-95 transition-all text-xs tracking-wider"
              >
                100ゴールドを受け取る
              </button>
            </div>
          ) : (
            options.map((opt, index) => {
              const isNewWeapon = opt.type === 'weapon' && opt.level === 1;
              const isMaxLevel = opt.level === 5;
              const theme = getColorTheme(opt.targetType);

              return (
                <motion.button
                  key={opt.id}
                  id={`btn-upgrade-${opt.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  onClick={() => handleSelect(opt)}
                  className={`relative flex flex-col justify-between p-6 rounded-2xl border-2 bg-gradient-to-b ${theme} transition-all duration-300 shadow-lg group cursor-pointer text-left focus:outline-none min-h-[220px]`}
                >
                  {/* Subtle hover background highlight effect */}
                  <div className="absolute inset-0 rounded-2xl bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    {/* Header: Badge + Level Indicator */}
                    <div className="flex justify-between items-center mb-4">
                      {getTypeBadge(opt)}
                      
                      <span className="font-mono text-xs font-extrabold text-zinc-400 select-none">
                        {isNewWeapon ? (
                          <span className="text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-[10px]">NEW</span>
                        ) : (
                          `LV ${opt.level}${isMaxLevel ? ' (MAX)' : ''}`
                        )}
                      </span>
                    </div>

                    {/* Content: Icon & Title */}
                    <div className="flex items-start gap-4 mb-3">
                      <span className="text-4xl bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl block shrink-0 select-none">
                        {getIcon(opt.type, opt.targetType)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-zinc-100 text-sm tracking-tight group-hover:text-white transition-colors">
                          {opt.name}
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 tracking-wider">
                          {opt.type === 'weapon' ? `weapon_${opt.targetType}` : `passive_${opt.targetType}`}
                        </p>
                      </div>
                    </div>

                    {/* Description text */}
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-4 font-sans border-t border-zinc-800/40 pt-3 mt-1.5">
                      {opt.description}
                    </p>
                  </div>

                  {/* Visual Footer hint */}
                  <div className="mt-4 flex justify-between items-center pt-2.5 border-t border-zinc-800/40 text-[10px] font-mono text-zinc-500">
                    <span>SELECTION CLICK</span>
                    <span className="group-hover:translate-x-1 group-hover:text-zinc-200 transition-all font-bold">
                      SELECT →
                    </span>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
