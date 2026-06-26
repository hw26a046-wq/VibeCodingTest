/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ActiveUpgrade, WeaponType, PassiveType } from '../types';
import { Swords, Shield, Zap, Eye, Heart, Clock, CircleDot, Gift, Award, Sparkles } from 'lucide-react';
import { sfx } from '../utils/audio';

import whipImage from '../assets/images/whip_pixel_1782472362145.jpg';
import fireballImage from '../assets/images/fireball_pixel_1782472376447.jpg';
import garlicImage from '../assets/images/garlic_pixel_1782472386492.jpg';
import axeImage from '../assets/images/axe_pixel_1782472402626.jpg';
import bibleImage from '../assets/images/bible_pixel_1782472426654.jpg';
import hadoukenImage from '../assets/images/hadouken_pixel_1782472416063.jpg';
import noteImage from '../assets/images/note_pixel_1782472440238.jpg';

interface ChestScreenProps {
  upgrades: ActiveUpgrade[];
  count: number;
  onClose: () => void;
}

export function ChestScreen({ upgrades, count, onClose }: ChestScreenProps) {
  React.useEffect(() => {
    // Play chest open sound effect
    sfx.playLevelUp();
  }, []);

  const getIcon = (type: 'weapon' | 'passive', targetType: WeaponType | PassiveType) => {
    if (type === 'weapon') {
      switch (targetType) {
        case 'whip': return <img src={whipImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Whip" />;
        case 'fireball': return <img src={fireballImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Fireball" />;
        case 'garlic': return <img src={garlicImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Garlic" />;
        case 'axe': return <img src={axeImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Axe" />;
        case 'bible': return <img src={bibleImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Bible" />;
        case 'lightning': return <span className="text-2xl">⚡</span>;
        case 'hadouken': return <img src={hadoukenImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Hadouken" />;
        case 'note': return <img src={noteImage} className="w-10 h-10 object-contain rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5" referrerPolicy="no-referrer" alt="Note" />;
        default: return <span className="text-2xl">⚔️</span>;
      }
    } else {
      switch (targetType) {
        case 'might': return <Swords size={18} className="text-amber-400" />;
        case 'armor': return <Shield size={18} className="text-blue-400" />;
        case 'speed': return <Zap size={18} className="text-emerald-400" />;
        case 'magnet': return <Eye size={18} className="text-purple-400" />;
        case 'maxHp': return <Heart size={18} className="text-red-400" />;
        case 'cooldown': return <Clock size={18} className="text-cyan-400" />;
        default: return <CircleDot size={18} className="text-zinc-400" />;
      }
    }
  };

  const getTierInfo = () => {
    if (count === 5) {
      return {
        title: '🌟 神話級の宝箱 (ULTRA LEGENDARY CHEST) 🌟',
        subtitle: '奇跡の超天ドロップ！5個の装備/アイテムを獲得しました！',
        colorClass: 'text-rose-400',
        bgGlow: 'bg-rose-500/15',
        bannerBorder: 'border-rose-500/30 bg-rose-500/10'
      };
    } else if (count === 3) {
      return {
        title: '🔮 魔法学の宝箱 (MAGICAL TRIPLE CHEST) 🔮',
        subtitle: '大幅強化の好機！3個の装備/アイテムを獲得しました！',
        colorClass: 'text-amber-400',
        bgGlow: 'bg-amber-500/15',
        bannerBorder: 'border-amber-500/30 bg-amber-500/10'
      };
    } else {
      return {
        title: '🔑 精鋭の宝箱 (TREASURE CHEST) 🔑',
        subtitle: '秘宝を発見！ランダムな装備/アイテムを1個獲得しました！',
        colorClass: 'text-cyan-400',
        bgGlow: 'bg-cyan-500/10',
        bannerBorder: 'border-cyan-500/20 bg-cyan-500/5'
      };
    }
  };

  const tier = getTierInfo();

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      {/* Dynamic ambient backdrop animations */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${tier.bgGlow} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`} />
      
      <div className="w-full max-w-2xl relative z-10 text-center">
        {/* Glowing chest animation */}
        <div className="mb-6 flex justify-center relative">
          <motion.div
            initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
            animate={{ scale: [1.2, 1.0], rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            className="text-6xl md:text-8xl p-5 bg-zinc-900/80 border-2 border-zinc-700/50 rounded-full shadow-2xl relative"
          >
            <span role="img" aria-label="chest" className="block animate-bounce duration-1000">🎁</span>
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -top-3 -right-3 text-yellow-400"
            >
              <Sparkles size={24} />
            </motion.div>
          </motion.div>
        </div>

        {/* Banner Headers */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 px-4"
        >
          <h1 className={`text-xl md:text-3xl font-black tracking-wider ${tier.colorClass} mb-1.5 font-mono drop-shadow-md`}>
            {tier.title}
          </h1>
          <p className="text-xs md:text-sm font-sans text-zinc-300 max-w-lg mx-auto">
            {tier.subtitle}
          </p>
        </motion.div>

        {/* Awards display boxes */}
        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto px-4 mb-8 custom-scrollbar">
          {upgrades.map((item, idx) => {
            const isGold = item.id.startsWith('gold');
            return (
              <motion.div
                key={item.id + idx}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + idx * 0.12, type: 'spring' }}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 text-left hover:border-zinc-700 hover:bg-zinc-900/40 transition-all"
              >
                <div className="text-3xl bg-zinc-900 border border-zinc-800 p-2 rounded-lg shrink-0 flex items-center justify-center min-w-[50px] min-h-[50px]">
                  {getIcon(item.type, item.targetType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-extrabold text-zinc-100 truncate">
                      {item.name}
                    </h3>
                    <span className="font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                      {isGold ? 'BONUS' : `LV ${item.level}`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Resume game button next to each acquired item */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    sfx.playSelect();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-white text-zinc-300 hover:text-zinc-950 text-[11px] font-black rounded-lg border border-zinc-700 hover:border-white transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Award size={12} />
                  獲得して再開
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Action button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + upgrades.length * 0.1 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sfx.playSelect();
              onClose();
            }}
            className="px-10 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-black tracking-wider text-xs md:text-sm rounded-xl cursor-pointer shadow-lg transition-colors flex items-center gap-2"
          >
            <Award size={16} />
            報酬を獲得してゲーム再開
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
