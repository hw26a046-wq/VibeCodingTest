/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { PlayerClass, WeaponType } from '../types';
import { sfx } from '../utils/audio';
import { Shield, Sparkles, Zap, Crosshair, Heart, Swords, Eye, Clock } from 'lucide-react';
import knightAlistairImg from '../assets/images/knight_alistair_1781674975459.jpg';
import mageLyraBlueImg from '../assets/images/mage_lyra_blue_1781674990330.jpg';
import assassinKaelenImg from '../assets/images/assassin_kaelen_1781675004366.jpg';
import hunterMarcusImg from '../assets/images/hunter_marcus_1781675017229.jpg';
import monkRenImg from '../assets/images/monk_ren_pixel_1782469746924.jpg';
import priestEliasImg from '../assets/images/priest_elias_pixel_1782469761017.jpg';
import bardLumiImg from '../assets/images/bard_lumi_pixel_1782469773909.jpg';
import astrologistOrionImg from '../assets/images/astrologist_orion_pixel_1782469786327.jpg';

export const CLASSES: PlayerClass[] = [
  {
    id: 'knight',
    name: '聖騎士アリスター',
    subtitle: 'Knight Alistair',
    description: '聖なる盾と頑強な肉体を持つ守護者。最大HPが非常に高く、敵から受けるダメージを常に大幅カットするため初心者でも生存が容易です。',
    emoji: '🛡️',
    image: knightAlistairImg,
    color: '#3b82f6', // Bright Azure
    startingWeapon: 'whip',
    baseStats: {
      maxHp: 160,
      hp: 160,
      speed: 2.2,
      might: 1.5,
      armor: 3,
      magnetRange: 60,
      area: 1.0,
      cooldownReduction: 0.0,
    },
  },
  {
    id: 'mage',
    name: '大魔術師ライラ',
    subtitle: 'Mage Lyra',
    description: '神秘の魔力と元素を操る学者。初期状態から攻撃冷却速度(クールダウン)が15%短縮されており、攻撃サイズも全クラス中最大です。身は脆い。',
    emoji: '🔮',
    image: mageLyraBlueImg,
    color: '#a855f7', // Vivid Purple
    startingWeapon: 'fireball',
    baseStats: {
      maxHp: 80,
      hp: 80,
      speed: 2.6,
      might: 2.0,
      armor: 0,
      magnetRange: 80,
      area: 1.3,
      cooldownReduction: 0.15,
    },
  },
  {
    id: 'assassin',
    name: '黒影の忍ケレン',
    subtitle: 'Assassin Kaelen',
    description: '暗闇に紛れ急所を穿つ影の戦士。最高水準の移動スピードと、異常に広い磁気探知（アイテム自動回収）能力を持ち、流れるように戦闘できます。',
    emoji: '🥷',
    image: assassinKaelenImg,
    color: '#10b981', // Emerald Green
    startingWeapon: 'garlic',
    baseStats: {
      maxHp: 100,
      hp: 100,
      speed: 3.3,
      might: 1.4,
      armor: 1,
      magnetRange: 110,
      area: 0.95,
      cooldownReduction: 0.05,
    },
  },
  {
    id: 'hunter',
    name: 'ヴァンパイアハンター・マーカス',
    subtitle: 'Hunter Marcus',
    description: '古来より闇の種族を追う魔物殺し。基礎火力が全クラス中トップの130%であり、敵をなぎ倒す高威力の斧で地平線を切り開きます。',
    emoji: '🧛',
    image: hunterMarcusImg,
    color: '#ef4444', // Crimson Row
    startingWeapon: 'axe',
    baseStats: {
      maxHp: 120,
      hp: 120,
      speed: 2.5,
      might: 2.2,
      armor: 2,
      magnetRange: 70,
      area: 1.15,
      cooldownReduction: 0.0,
    },
  },
  {
    id: 'monk',
    name: '修行僧レン',
    subtitle: 'Monk Ren',
    description: '過酷な修行で肉体と精神を極限まで鍛え上げた武闘家。基礎攻撃威力(Might)と移動速度(Speed)が非常に高く、前方に大威力の波動拳(Hadouken)を放ちます。防御は低め。',
    emoji: '👊',
    image: monkRenImg,
    color: '#f59e0b', // Amber/Gold
    startingWeapon: 'hadouken',
    baseStats: {
      maxHp: 110,
      hp: 110,
      speed: 3.0,
      might: 1.8,
      armor: 1,
      magnetRange: 65,
      area: 1.1,
      cooldownReduction: 0.10,
    },
  },
  {
    id: 'priest',
    name: '司祭エリアス',
    subtitle: 'Priest Elias',
    description: '神の加護と聖なる教典を操る若き司祭。聖書が常に周囲を自動で回り守りを固めます。初期の防御力(Armor)が高く、粘り強く戦い抜くことができます。',
    emoji: '🙏',
    image: priestEliasImg,
    color: '#eab308', // Bright Yellow
    startingWeapon: 'bible',
    baseStats: {
      maxHp: 130,
      hp: 130,
      speed: 2.1,
      might: 1.3,
      armor: 4,
      magnetRange: 75,
      area: 1.2,
      cooldownReduction: 0.05,
    },
  },
  {
    id: 'bard',
    name: '吟遊詩人ルミ',
    subtitle: 'Bard Lumi',
    description: '戦場に流麗な旋律を奏でる流浪の演奏家。周囲の敵に向けて自動でバウンドし拡散する音符(Music Note)を放ちます。クールダウン減少(Cooldown Reduction)が最初から全クラス最高の25%に達しています。',
    emoji: '🪕',
    image: bardLumiImg,
    color: '#ec4899', // Pink
    startingWeapon: 'note',
    baseStats: {
      maxHp: 90,
      hp: 90,
      speed: 2.8,
      might: 1.1,
      armor: 1,
      magnetRange: 90,
      area: 1.0,
      cooldownReduction: 0.25,
    },
  },
  {
    id: 'astrologist',
    name: '占星術師オリオン',
    subtitle: 'Astrologist Orion',
    description: '狂気の星光と天体を観測する天術士。キャラの周りをぐるぐる追尾し、敵を蹂躙する強力な召喚竜(Summoned Dragon)を従えています。超広域の攻撃エリア(Area)と、非常に広い経験値吸引範囲(Magnet)を持つ大器晩成タイプ。',
    emoji: '🌌',
    image: astrologistOrionImg,
    color: '#8b5cf6', // Purple/Indigo
    startingWeapon: 'summon',
    baseStats: {
      maxHp: 95,
      hp: 95,
      speed: 2.4,
      might: 1.6,
      armor: 1,
      magnetRange: 120,
      area: 1.4,
      cooldownReduction: 0.10,
    },
  },
];

interface ClassSelectProps {
  onSelect: (selectedClass: PlayerClass) => void;
}

export function ClassSelect({ onSelect }: ClassSelectProps) {
  const [selectedId, setSelectedId] = React.useState<string>(CLASSES[0].id);

  const selectedClass = CLASSES.find((c) => c.id === selectedId) || CLASSES[0];

  const handleSelectClass = (id: string) => {
    sfx.playSelect();
    setSelectedId(id);
  };

  const handleStartGame = () => {
    sfx.playUpgradeSelect();
    onSelect(selectedClass);
  };

  const getWeaponLabel = (weapon: WeaponType) => {
    switch (weapon) {
      case 'whip': return 'ホーリーホイップ (前方・後方スラッシュ攻撃)';
      case 'fireball': return 'マジックファントム (至近の敵へ魔法追尾弾)';
      case 'garlic': return 'ダークオーラ結界 (周囲にダメージ地帯＋ノックバック)';
      case 'axe': return 'セイントアックス (上空へ投擲、放物線貫通攻撃)';
      case 'bible': return '聖書の旋回円 (プレイヤーの周囲を自動周回する防護壁)';
      case 'lightning': return '雷の天罰指輪 (ランダムな敵に超高威力の落雷ダメージ)';
      case 'hadouken': return '気功波動拳 (前方の敵を貫通し消し去る巨大なエネルギー波)';
      case 'note': return '流麗な音符弾 (敵に弾んで連鎖し、周囲を魅了する音符攻撃)';
      case 'summon': return '守護天竜の召喚 (プレイヤーの周りをぐるぐる追尾し、周囲の敵を火球と突進で蹂躙する召喚獣)';
      default: return '未知の兵器';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] text-zinc-100 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-mono tracking-[0.4em] uppercase text-red-500 font-bold block mb-2">HERO SELECTION</span>
          <h1 className="text-4xl md:text-5xl font-sans font-extrabold tracking-tight bg-gradient-to-r from-red-500 via-amber-400 to-red-600 bg-clip-text text-transparent drop-shadow-lg">
            生存者の選択
          </h1>
          <p className="text-xs md:text-sm font-mono text-zinc-400 max-w-xl mx-auto mt-3 leading-relaxed">
            アビリティと初期ステータスが異なる8名の戦士。
            プレイスタイルに合わせた生存者を選択し、深淵の邪悪に立ち向かえ。
          </p>
        </motion.div>
      </div>

      {/* Grid Layout of Select and Detail Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        {/* Left Side: Avatar Cards */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2 className="text-sm font-mono tracking-widest text-zinc-500 uppercase px-1">SELECT A CLASS</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {CLASSES.map((cls) => {
              const isSelected = cls.id === selectedId;
              return (
                <motion.button
                  key={cls.id}
                  id={`btn-class-${cls.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectClass(cls.id)}
                  style={{
                    borderColor: isSelected ? cls.color : '#27272a',
                    boxShadow: isSelected ? `0 0 16px ${cls.color}25` : 'none',
                  }}
                  className={`relative select-none text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden group ${
                    isSelected ? 'bg-zinc-900/60' : 'bg-zinc-950/40 hover:bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  {/* Subtle Background Radial Aura */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.06] blur-2xl"
                      style={{ background: `radial-gradient(circle, ${cls.color} 0%, transparent 70%)` }}
                    />
                  )}

                  <div className="flex items-start gap-3 md:gap-4 relative z-10">
                    <span className="text-3xl md:text-4xl bg-zinc-800/80 p-2 md:p-3 rounded-xl block outline-none ring-0 overflow-hidden flex items-center justify-center w-12 h-12 md:w-16 md:h-16 shrink-0">
                      {cls.image ? (
                        <img
                          src={cls.image}
                          alt={cls.name}
                          className="w-full h-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        cls.emoji
                      )}
                    </span>
                    <div className="min-w-0 transition-transform duration-300">
                      <h3
                        style={{ color: isSelected ? cls.color : '#f4f4f5' }}
                        className="text-base md:text-lg font-bold tracking-tight line-clamp-1"
                      >
                        {cls.name}
                      </h3>
                      <p className="text-xxs font-mono text-zinc-500 uppercase tracking-widest mt-0.5 line-clamp-1">
                        {cls.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xxs font-mono">
                    <span className="text-zinc-400">初期武器</span>
                    <span
                      style={{ color: cls.color }}
                      className="font-semibold uppercase tracking-wider bg-zinc-800/50 px-2 py-0.5 rounded-md"
                    >
                      {cls.startingWeapon}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Stat Detail Cards */}
        <div className="lg:col-span-5">
          <motion.div
            key={selectedClass.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 relative justify-between overflow-hidden"
          >
            {/* Visual Header Grid Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-10 bg-radial from-red-500 to-transparent blur-xl" />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl p-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center w-20 h-20 shrink-0">
                  {selectedClass.image ? (
                    <img
                      src={selectedClass.image}
                      alt={selectedClass.name}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    selectedClass.emoji
                  )}
                </span>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    {selectedClass.name}
                  </h2>
                  <p className="text-xs font-mono tracking-wider text-zinc-400 uppercase">
                    {selectedClass.subtitle}
                  </p>
                </div>
              </div>

              <div className="border-t border-b border-zinc-800/60 py-3 mb-5">
                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                  {selectedClass.description}
                </p>
              </div>

              <div className="flex flex-col gap-3.5 mb-6">
                <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">HERO ATTRIBUTES</h3>

                {/* HP Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                    <span className="flex items-center gap-1"><Heart size={13} className="text-red-400" /> MAX HP</span>
                    <span className="font-bold text-red-400">{selectedClass.baseStats.maxHp}</span>
                  </div>
                  <div className="bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedClass.baseStats.maxHp / 200) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Might Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                    <span className="flex items-center gap-1"><Swords size={13} className="text-amber-400" /> 攻撃威力 (Might)</span>
                    <span className="font-bold text-amber-400">{Math.round(selectedClass.baseStats.might * 100)}%</span>
                  </div>
                  <div className="bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedClass.baseStats.might / 1.5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Speed Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                    <span className="flex items-center gap-1"><Zap size={13} className="text-emerald-400" /> 移動速度 (Speed)</span>
                    <span className="font-bold text-emerald-400">{Math.round(selectedClass.baseStats.speed * 10)}</span>
                  </div>
                  <div className="bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedClass.baseStats.speed / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Armor Slider */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                    <span className="flex items-center gap-1"><Shield size={13} className="text-blue-400" /> 防御力 (Armor)</span>
                    <span className="font-bold text-blue-400">{selectedClass.baseStats.armor}</span>
                  </div>
                  <div className="bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedClass.baseStats.armor / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Other perks info */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-2.5 flex items-center gap-2">
                    <Eye size={14} className="text-purple-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">回収範囲</div>
                      <div className="text-xs font-bold text-zinc-200">{selectedClass.baseStats.magnetRange}px</div>
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-2.5 flex items-center gap-2">
                    <Clock size={14} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase">クールダウン</div>
                      <div className="text-xs font-bold text-zinc-200">
                        {selectedClass.baseStats.cooldownReduction > 0
                          ? `-${Math.round(selectedClass.baseStats.cooldownReduction * 100)}%`
                          : '標準速'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weapon Display */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl mb-6">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 block mb-2 uppercase">STARTING WEAPON</span>
                <p className="text-xs font-bold text-zinc-100 mb-1 flex items-center gap-1.5">
                  <span className="text-lg bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                    {selectedClass.startingWeapon === 'whip' && '🪢'}
                    {selectedClass.startingWeapon === 'fireball' && '🔥'}
                    {selectedClass.startingWeapon === 'garlic' && '🧄'}
                    {selectedClass.startingWeapon === 'axe' && '🪓'}
                    {selectedClass.startingWeapon === 'bible' && '📖'}
                    {selectedClass.startingWeapon === 'lightning' && '⚡'}
                    {selectedClass.startingWeapon === 'hadouken' && '🌀'}
                    {selectedClass.startingWeapon === 'note' && '🎵'}
                    {selectedClass.startingWeapon === 'summon' && '🐉'}
                  </span>
                  {getWeaponLabel(selectedClass.startingWeapon)}
                </p>
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              id="btn-start-game"
              whileHover={{ scale: 1.03, boxShadow: `0 0 25px ${selectedClass.color}40` }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartGame}
              style={{ backgroundColor: selectedClass.color }}
              className="w-full text-zinc-950 font-black text-sm uppercase tracking-widest py-4.5 rounded-2xl cursor-pointer hover:brightness-110 active:brightness-90 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Swords size={18} className="animate-pulse" />
              このヒーローで出発する
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
