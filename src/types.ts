/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeaponType = 'whip' | 'fireball' | 'garlic' | 'axe' | 'bible' | 'lightning' | 'hadouken' | 'note' | 'summon';

export type PassiveType = 'might' | 'armor' | 'speed' | 'magnet' | 'maxHp' | 'cooldown';

export interface CharacterStats {
  maxHp: number;
  hp: number;
  speed: number;
  might: number; // Damage multiplier (e.g. 1.0 = 100%)
  armor: number; // Flat damage reduction
  magnetRange: number; // Pickup range (pixels)
  area: number; // Attack size multiplier (e.g. 1.0 = 100%)
  cooldownReduction: number; // Speed up weapon cooldown (e.g. 0.0 to 0.5)
}

export interface PlayerClass {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  image?: string;
  baseStats: CharacterStats;
  startingWeapon: WeaponType;
  color: string;
}

export interface WeaponState {
  type: WeaponType;
  level: number;
  cooldownTimer: number;
}

export interface PassiveState {
  type: PassiveType;
  level: number;
}

export interface ActiveUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weapon' | 'passive';
  targetType: WeaponType | PassiveType;
  level: number;
}

export interface GameStats {
  timeElapsed: number; // In seconds
  kills: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  gold: number;
  isVictory?: boolean;
}

export interface HighScore {
  className: string;
  classId: string;
  timeElapsed: number;
  kills: number;
  level: number;
  gold: number;
  date: string;
  isVictory?: boolean;
}

// Entity Interfaces used inside Canvas
export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  type: 'bat' | 'zombie' | 'ghost' | 'skeleton' | 'werewolf' | 'vampire_boss' | 'reaper' | 'medusa_boss' | 'golem_boss' | 'archmage_boss' | 'dragon_boss' | 'phoenix_boss' | 'dark_lord_boss' | 'white_reaper';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  size: number;
  color: string;
  isBoss: boolean;
  scoreValue: number;
  expValue: number;
  goldChance: number;
  animationFrame: number;
  knockbackX: number;
  knockbackY: number;
  // AI Behavior states
  shootCooldown?: number;
  chargeTimer?: number;
  chargeCooldown?: number;
  teleportTimer?: number;
}

export interface Projectile {
  id: string;
  type: WeaponType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  duration: number; // ticks left
  maxDuration: number;
  pierce: number; // Remaining Pierce counts
  angleOffset?: number; // for circular motions
  bounce?: number; // Bounce count for note bouncing
  customTargetId?: string; // Target tracking
}

export interface ExpGem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  isGold: boolean;
  isMagnet?: boolean;
  isChicken?: boolean; // Health restore item
  isBomb?: boolean;
  isChest?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  duration: number; // remaining frames
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  duration: number; // remaining frames
}
