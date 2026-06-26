/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlayerClass,
  WeaponState,
  PassiveState,
  ActiveUpgrade,
  Enemy,
  Projectile,
  ExpGem,
  FloatingText,
  Particle,
  WeaponType,
  PassiveType,
  GameStats,
} from '../types';
import { UpgradeScreen } from './UpgradeScreen';
import { ChestScreen } from './ChestScreen';
import { sfx } from '../utils/audio';
import { Skull, Heart, Timer, Zap, Shield, Volume2, VolumeX, Pause, Play, Coins, Award, Swords, Clock } from 'lucide-react';

// New enemy pixel art images
import zombieImage from '../assets/images/zombie_pixel_1781679591842.jpg';
import skeletonImage from '../assets/images/skeleton_pixel_1781679606311.jpg';
import ghostImage from '../assets/images/ghost_pixel_1781679622600.jpg';
import wolfImage from '../assets/images/wolf_pixel_1781679635356.jpg';
import batImage from '../assets/images/bat_pixel_1781682195973.jpg';
import medusaImage from '../assets/images/medusa_pixel_1781682795082.jpg';
import golemImage from '../assets/images/golem_pixel_1781682811481.jpg';
import archmageImage from '../assets/images/archmage_pixel_1781682828347.jpg';
import dragonImage from '../assets/images/dragon_pixel_1781682915205.jpg';
import phoenixImage from '../assets/images/phoenix_pixel_1781682935560.jpg';
import darklordImage from '../assets/images/darklord_pixel_1782473216056.jpg';
import whiteReaperImage from '../assets/images/white_reaper_pixel_1782473612350.jpg';

import whipImage from '../assets/images/whip_pixel_1782472362145.jpg';
import fireballImage from '../assets/images/fireball_pixel_1782472376447.jpg';
import garlicImage from '../assets/images/garlic_pixel_1782472386492.jpg';
import axeImage from '../assets/images/axe_pixel_1782472402626.jpg';
import bibleImage from '../assets/images/bible_pixel_1782472426654.jpg';
import hadoukenImage from '../assets/images/hadouken_pixel_1782472416063.jpg';
import noteImage from '../assets/images/note_pixel_1782472440238.jpg';

interface GameCanvasProps {
  playerClass: PlayerClass;
  onGameOver: (stats: GameStats) => void;
  onBackToTitle: () => void;
}

export function GameCanvas({ playerClass, onGameOver, onBackToTitle }: GameCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Sound triggers
  const [isMuted, setIsMuted] = React.useState<boolean>(sfx.getMuteState());

  // Game Play States
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = React.useState<boolean>(false);
  const [levelUpOptions, setLevelUpOptions] = React.useState<ActiveUpgrade[]>([]);

  // Chest States
  const [showChest, setShowChest] = React.useState<boolean>(false);
  const [chestAwards, setChestAwards] = React.useState<ActiveUpgrade[]>([]);
  const [chestUpgradeCount, setChestUpgradeCount] = React.useState<number>(1);

  // Statistics State for HUD
  const [hudStats, setHudStats] = React.useState<GameStats>({
    timeElapsed: 0,
    kills: 0,
    level: 1,
    exp: 0,
    nextLevelExp: 5,
    gold: 0,
  });

  const [playerHp, setPlayerHp] = React.useState<number>(playerClass.baseStats.hp);
  const [weaponsList, setWeaponsList] = React.useState<WeaponState[]>([]);
  const [passivesList, setPassivesList] = React.useState<PassiveState[]>([]);

  // References used to keep game state separate from React and avoid context render bottlenecks
  const stateRef = React.useRef({
    showLevelUp: false,
    showChest: false,
    isPaused: false,
    playerImgElement: null as HTMLImageElement | HTMLCanvasElement | null,
    enemyImages: {} as Record<string, HTMLImageElement | HTMLCanvasElement | null>,
    weaponImages: {} as Record<string, HTMLImageElement | HTMLCanvasElement | null>,
    player: {
      x: 0,
      y: 0,
      radius: 16,
      stats: { ...playerClass.baseStats },
      invulnTimer: 0,
      animationFrame: 0,
    },
    keys: {} as Record<string, boolean>,
    virtualJoystick: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      vx: 0,
      vy: 0,
    },
    stats: {
      timeElapsed: 0,
      kills: 0,
      level: 1,
      exp: 0,
      nextLevelExp: 5,
      gold: 0,
    },
    weapons: [] as WeaponState[],
    passives: [] as PassiveState[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    enemyProjectiles: [] as {
      id: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      damage: number;
      color: string;
      rotation: number;
      duration: number;
      emoji: string;
    }[],
    gems: [] as ExpGem[],
    floatingTexts: [] as FloatingText[],
    particles: [] as Particle[],
    waveTimer: 0,
    camera: { x: 0, y: 0 },
    dimensions: { width: 800, height: 600 },
    isGameOverCalled: false,
    enemySpawnAccumulator: 0,
    reaperSpawned: false,
    darkLordSpawned: false,
    darkLordDefeated: false,
    whiteReaperSpawned: false,
    whiteReaperCountdown: null as number | null,
    whiteReaperTouchTimer: null as number | null,
  });

  // Sound check toggle
  const handleToggleMute = () => {
    const nextMute = sfx.toggleMute();
    setIsMuted(nextMute);
  };

  // Initialize Game Loops
  React.useEffect(() => {
    // Start background track
    sfx.startBgm();

    // Helper to remove white/black background from pixel art using BFS flood-fill
    const removeBackground = (img: HTMLImageElement, callback: (canvas: HTMLCanvasElement) => void) => {
      img.crossOrigin = 'anonymous';
      const handleLoad = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 128;
        canvas.height = img.naturalHeight || img.height || 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const width = canvas.width;
            const height = canvas.height;
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            const visited = new Uint8Array(width * height);
            const queue = new Int32Array(width * height);
            let qHead = 0;
            let qTail = 0;
            
            // First, scan all outer border pixels to detect the dominant background color profile (White vs Black)
            let whiteCount = 0;
            let blackCount = 0;
            
            const borderIndices: number[] = [];
            for (let x = 0; x < width; x++) {
              borderIndices.push(0 * width + x); // top line
              borderIndices.push((height - 1) * width + x); // bottom line
            }
            for (let y = 1; y < height - 1; y++) {
              borderIndices.push(y * width + 0); // left column
              borderIndices.push(y * width + (width - 1)); // right column
            }
            
            for (const vIdx of borderIndices) {
              const idx = vIdx * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              if (r > 150 && g > 150 && b > 150) {
                whiteCount++;
              } else if (r < 100 && g < 100 && b < 100) {
                blackCount++;
              }
            }
            
            const isWhiteBgMode = whiteCount > blackCount;
            
            // Seed all border pixels matching the dominant background profile
            for (const vIdx of borderIndices) {
              const idx = vIdx * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const isNeutral = (max - min) < 30;
              
              let isMatch = false;
              if (isWhiteBgMode) {
                isMatch = (r > 130 && g > 130 && b > 130) || (max > 100 && isNeutral);
              } else {
                isMatch = (r < 110 && g < 110 && b < 110) || (max < 120 && isNeutral);
              }
              
              if (isMatch && visited[vIdx] === 0) {
                queue[qTail++] = vIdx;
                visited[vIdx] = 1;
                data[idx + 3] = 0; // Transparent
              }
            }
            
            // BFS Outer-background Flood Fill
            while (qHead < qTail) {
              const currIdx = queue[qHead++];
              const x = currIdx % width;
              const y = Math.floor(currIdx / width);
              
              const neighbors = [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1]
              ];
              
              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = ny * width + nx;
                  if (visited[nIdx] === 0) {
                    const dIdx = nIdx * 4;
                    const r = data[dIdx];
                    const g = data[dIdx + 1];
                    const b = data[dIdx + 2];
                    
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const isNeutral = (max - min) < 35;
                    
                    let isBackground = false;
                    if (isWhiteBgMode) {
                      isBackground = (r > 140 && g > 140 && b > 140) || (max > 120 && isNeutral);
                    } else {
                      isBackground = (r < 95 && g < 95 && b < 95) || (max < 105 && isNeutral);
                    }
                    
                    if (isBackground) {
                      queue[qTail++] = nIdx;
                      visited[nIdx] = 1;
                      data[dIdx + 3] = 0; // Transparent
                    }
                  }
                }
              }
            }
            
            // Halo Clean-up Sweep: Check non-transparent pixels bordering transparent ones
            // and eliminate compression artifacts/halos around edges
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const vIdx = y * width + x;
                const dIdx = vIdx * 4;
                
                if (data[dIdx + 3] > 0) {
                  const hasTransparentNeighbor = 
                    data[((y - 1) * width + x) * 4 + 3] === 0 ||
                    data[((y + 1) * width + x) * 4 + 3] === 0 ||
                    data[(y * width + (x - 1)) * 4 + 3] === 0 ||
                    data[(y * width + (x + 1)) * 4 + 3] === 0;
                    
                  if (hasTransparentNeighbor) {
                    const r = data[dIdx];
                    const g = data[dIdx + 1];
                    const b = data[dIdx + 2];
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const isNeutral = (max - min) < 45;
                    
                    let matchStrength = 0;
                    if (isWhiteBgMode) {
                      if (max > 120 && isNeutral) {
                        matchStrength = (max - 120) / 135;
                      } else if (r > 130 && g > 130 && b > 130) {
                        matchStrength = (Math.min(r, g, b) - 130) / 125;
                      }
                    } else {
                      if (max < 110 && isNeutral) {
                        matchStrength = (110 - max) / 110;
                      } else if (r < 100 && g < 100 && b < 100) {
                        matchStrength = (100 - Math.max(r, g, b)) / 100;
                      }
                    }
                    
                    if (matchStrength > 0.1) {
                      if (matchStrength > 0.3) {
                        data[dIdx + 3] = 0; // fully remove border halo
                      } else {
                        data[dIdx + 3] = Math.round(data[dIdx + 3] * (1 - matchStrength));
                      }
                    }
                  }
                }
              }
            }
            
            ctx.putImageData(imageData, 0, 0);
            callback(canvas);
          } catch (e) {
            console.error('Error transparentizing image background:', e);
            callback(canvas);
          }
        }
      };
      if (img.complete) {
        handleLoad();
      } else {
        img.onload = handleLoad;
      }
    };

    // Load custom player class image if any
    if (playerClass.image) {
      const img = new Image();
      img.src = playerClass.image;
      removeBackground(img, (canvas) => {
        stateRef.current.playerImgElement = canvas;
      });
      stateRef.current.playerImgElement = img; // Fallback
    } else {
      stateRef.current.playerImgElement = null;
    }

    // Load custom enemy images and apply flood-fill background transparency
    const zombieImg = new Image();
    zombieImg.src = zombieImage;
    removeBackground(zombieImg, (canvas) => {
      stateRef.current.enemyImages['zombie'] = canvas;
    });

    const skeletonImg = new Image();
    skeletonImg.src = skeletonImage;
    removeBackground(skeletonImg, (canvas) => {
      stateRef.current.enemyImages['skeleton'] = canvas;
    });

    const ghostImg = new Image();
    ghostImg.src = ghostImage;
    removeBackground(ghostImg, (canvas) => {
      stateRef.current.enemyImages['ghost'] = canvas;
    });

    const wolfImg = new Image();
    wolfImg.src = wolfImage;
    removeBackground(wolfImg, (canvas) => {
      stateRef.current.enemyImages['werewolf'] = canvas;
    });

    const batImg = new Image();
    batImg.src = batImage;
    removeBackground(batImg, (canvas) => {
      stateRef.current.enemyImages['bat'] = canvas;
    });

    const medusaImg = new Image();
    medusaImg.src = medusaImage;
    removeBackground(medusaImg, (canvas) => {
      stateRef.current.enemyImages['medusa_boss'] = canvas;
    });

    const golemImg = new Image();
    golemImg.src = golemImage;
    removeBackground(golemImg, (canvas) => {
      stateRef.current.enemyImages['golem_boss'] = canvas;
    });

    const archmageImg = new Image();
    archmageImg.src = archmageImage;
    removeBackground(archmageImg, (canvas) => {
      stateRef.current.enemyImages['archmage_boss'] = canvas;
    });

    const dragonImg = new Image();
    dragonImg.src = dragonImage;
    removeBackground(dragonImg, (canvas) => {
      stateRef.current.enemyImages['dragon_boss'] = canvas;
    });

    const phoenixImg = new Image();
    phoenixImg.src = phoenixImage;
    removeBackground(phoenixImg, (canvas) => {
      stateRef.current.enemyImages['phoenix_boss'] = canvas;
    });

    const darklordImg = new Image();
    darklordImg.src = darklordImage;
    removeBackground(darklordImg, (canvas) => {
      stateRef.current.enemyImages['dark_lord_boss'] = canvas;
    });

    const whiteReaperImg = new Image();
    whiteReaperImg.src = whiteReaperImage;
    removeBackground(whiteReaperImg, (canvas) => {
      stateRef.current.enemyImages['white_reaper'] = canvas;
    });

    // Load custom weapon images
    const whipImg = new Image();
    whipImg.src = whipImage;
    removeBackground(whipImg, (canvas) => {
      stateRef.current.weaponImages['whip'] = canvas;
    });

    const fireballImg = new Image();
    fireballImg.src = fireballImage;
    removeBackground(fireballImg, (canvas) => {
      stateRef.current.weaponImages['fireball'] = canvas;
    });

    const garlicImg = new Image();
    garlicImg.src = garlicImage;
    removeBackground(garlicImg, (canvas) => {
      stateRef.current.weaponImages['garlic'] = canvas;
    });

    const axeImg = new Image();
    axeImg.src = axeImage;
    removeBackground(axeImg, (canvas) => {
      stateRef.current.weaponImages['axe'] = canvas;
    });

    const hadoukenImg = new Image();
    hadoukenImg.src = hadoukenImage;
    removeBackground(hadoukenImg, (canvas) => {
      stateRef.current.weaponImages['hadouken'] = canvas;
    });

    const bibleImg = new Image();
    bibleImg.src = bibleImage;
    removeBackground(bibleImg, (canvas) => {
      stateRef.current.weaponImages['bible'] = canvas;
    });

    const noteImg = new Image();
    noteImg.src = noteImage;
    removeBackground(noteImg, (canvas) => {
      stateRef.current.weaponImages['note'] = canvas;
    });

    // Set Initial Weapons
    const initialWeaponState: WeaponState = {
      type: playerClass.startingWeapon,
      level: 1,
      cooldownTimer: 0,
    };
    stateRef.current.weapons = [initialWeaponState];
    stateRef.current.stats.hp = playerClass.baseStats.hp;
    stateRef.current.enemies = [];
    stateRef.current.projectiles = [];
    stateRef.current.enemyProjectiles = [];
    stateRef.current.gems = [];
    stateRef.current.particles = [];
    stateRef.current.floatingTexts = [];
    stateRef.current.waveTimer = 0;
    stateRef.current.isGameOverCalled = false;
    stateRef.current.reaperSpawned = false;
    stateRef.current.darkLordSpawned = false;
    stateRef.current.darkLordDefeated = false;
    stateRef.current.whiteReaperSpawned = false;
    stateRef.current.whiteReaperCountdown = null;
    stateRef.current.whiteReaperTouchTimer = null;

    setWeaponsList([initialWeaponState]);
    setPassivesList([]);

    // Set dimensions
    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const isAlreadyDown = stateRef.current.keys[k];
      stateRef.current.keys[k] = true;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stateRef.current.keys[e.key] = true;
      }
      
      // Cheat code / Debug keys hold handling
      if ((k === 't' || k === 'l') && !isAlreadyDown) {
        stateRef.current.debugHoldStartTimes = stateRef.current.debugHoldStartTimes || {};
        stateRef.current.debugHoldStartTimes[k] = Date.now();

        stateRef.current.debugHoldTimers = stateRef.current.debugHoldTimers || {};
        if (stateRef.current.debugHoldTimers[k]) {
          stateRef.current.debugHoldTimers[k].forEach((t: any) => clearTimeout(t));
        }
        stateRef.current.debugHoldTimers[k] = [];

        const keyName = k.toUpperCase();
        
        // Show initial feedback
        stateRef.current.floatingTexts.push({
          id: Math.random().toString(),
          text: `⏳ ${keyName}キー長押し中: 3秒...`,
          x: stateRef.current.player.x,
          y: stateRef.current.player.y - 120,
          color: '#fbbf24',
          duration: 60,
          size: 16,
        });

        // Countdown: 2s
        stateRef.current.debugHoldTimers[k].push(setTimeout(() => {
          if (stateRef.current.keys[k]) {
            stateRef.current.floatingTexts.push({
              id: Math.random().toString(),
              text: `⏳ ${keyName}キー長押し中: 2秒...`,
              x: stateRef.current.player.x,
              y: stateRef.current.player.y - 120,
              color: '#fbbf24',
              duration: 60,
              size: 16,
            });
          }
        }, 1000));

        // Countdown: 1s
        stateRef.current.debugHoldTimers[k].push(setTimeout(() => {
          if (stateRef.current.keys[k]) {
            stateRef.current.floatingTexts.push({
              id: Math.random().toString(),
              text: `⏳ ${keyName}キー長押し中: 1秒...`,
              x: stateRef.current.player.x,
              y: stateRef.current.player.y - 120,
              color: '#f87171',
              duration: 60,
              size: 16,
            });
          }
        }, 2000));

        // Trigger action after 3s
        stateRef.current.debugHoldTimers[k].push(setTimeout(() => {
          if (stateRef.current.keys[k]) {
            if (k === 't') {
              stateRef.current.waveTimer = 595 * 60; // 9:55
              stateRef.current.stats.timeElapsed = 595;
              
              // Grant all weapons at level 10
              stateRef.current.weapons = [
                { type: 'whip', level: 10, cooldownTimer: 0 },
                { type: 'fireball', level: 10, cooldownTimer: 0 },
                { type: 'garlic', level: 10, cooldownTimer: 0 },
                { type: 'axe', level: 10, cooldownTimer: 0 },
                { type: 'bible', level: 10, cooldownTimer: 0 },
                { type: 'lightning', level: 10, cooldownTimer: 0 },
                { type: 'hadouken', level: 10, cooldownTimer: 0 },
                { type: 'note', level: 10, cooldownTimer: 0 },
                { type: 'summon', level: 10, cooldownTimer: 0 }
              ];

              // Grant all passives at level 8
              stateRef.current.passives = [
                { type: 'might', level: 8 },
                { type: 'armor', level: 8 },
                { type: 'speed', level: 8 },
                { type: 'magnet', level: 8 },
                { type: 'maxHp', level: 8 },
                { type: 'cooldown', level: 8 }
              ];

              // Sync React Lists and stats
              setWeaponsList([...stateRef.current.weapons]);
              setPassivesList([...stateRef.current.passives]);
              applyPassivesToPlayerStats();
              setPlayerHp(stateRef.current.player.stats.hp);
              setHudStats({ ...stateRef.current.stats });

              stateRef.current.floatingTexts.push({
                id: Math.random().toString(),
                text: '⏩ タイムラッシュ！(9分55秒へスキップ)',
                x: stateRef.current.player.x,
                y: stateRef.current.player.y - 80,
                color: '#38bdf8',
                duration: 120,
                size: 15,
              });

              stateRef.current.floatingTexts.push({
                id: Math.random().toString(),
                text: '🔥 全装備アイテム獲得！レベルMAX！ 🔥',
                x: stateRef.current.player.x,
                y: stateRef.current.player.y - 125,
                color: '#facc15',
                duration: 180,
                size: 18,
              });
            } else if (k === 'l') {
              const state = stateRef.current;
              state.whiteReaperSpawned = true;
              state.darkLordDefeated = true; // Mark as true so that other state variables can align
              state.whiteReaperCountdown = 0; // Clear any pending spawning countdown
              
              // Spawn White Reaper from off-screen
              const angle = Math.random() * Math.PI * 2;
              const spawnX = state.player.x + Math.cos(angle) * 450;
              const spawnY = state.player.y + Math.sin(angle) * 450;

              // Check if a White Reaper is already present to prevent duplicate summons
              const hasReaper = state.enemies.some(e => e.type === 'white_reaper');
              if (!hasReaper) {
                state.enemies.push({
                  id: Math.random().toString(),
                  type: 'white_reaper',
                  x: spawnX,
                  y: spawnY,
                  hp: 999999999, // Extremely immortal HP
                  maxHp: 999999999,
                  speed: 15.0, // Extremely fast, inescapable death!
                  damage: 99999, // Massive damage
                  size: 40,
                  color: '#ffffff',
                  isBoss: true,
                  scoreValue: 0,
                  expValue: 0,
                  goldChance: 0,
                  animationFrame: 0,
                  knockbackX: 0,
                  knockbackY: 0,
                });

                // Ominous warning text
                state.floatingTexts.push({
                  id: Math.random().toString(),
                  text: '☠️ 死神が召喚されました！ (DEATH SUMMONED) ☠️',
                  x: state.player.x,
                  y: state.player.y - 120,
                  color: '#ffffff',
                  duration: 180,
                  size: 20,
                });

                // Massive white flash particles
                for (let i = 0; i < 40; i++) {
                  const pAngle = Math.random() * Math.PI * 2;
                  const pSpeed = 3 + Math.random() * 9;
                  state.particles.push({
                    x: state.player.x,
                    y: state.player.y,
                    vx: Math.cos(pAngle) * pSpeed,
                    vy: Math.sin(pAngle) * pSpeed,
                    size: 3 + Math.random() * 6,
                    color: '#ffffff',
                    opacity: 0.95,
                    duration: 50,
                  });
                }
              } else {
                state.floatingTexts.push({
                  id: Math.random().toString(),
                  text: '⚠️ 死神は既に存在しています',
                  x: state.player.x,
                  y: state.player.y - 80,
                  color: '#f87171',
                  duration: 120,
                  size: 16,
                });
              }
            }
          }
          if (stateRef.current.debugHoldStartTimes) {
            delete stateRef.current.debugHoldStartTimes[k];
          }
        }, 3000));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      stateRef.current.keys[k] = false;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stateRef.current.keys[e.key] = false;
      }

      // If a debug key is released, clear timers and trigger cancel notification
      if (stateRef.current.debugHoldTimers && stateRef.current.debugHoldTimers[k]) {
        stateRef.current.debugHoldTimers[k].forEach((t: any) => clearTimeout(t));
        delete stateRef.current.debugHoldTimers[k];

        if (stateRef.current.debugHoldStartTimes && stateRef.current.debugHoldStartTimes[k]) {
          const heldDuration = Date.now() - stateRef.current.debugHoldStartTimes[k];
          if (heldDuration < 3000 && heldDuration > 150) {
            stateRef.current.floatingTexts.push({
              id: Math.random().toString(),
              text: '❌ 長押し解除',
              x: stateRef.current.player.x,
              y: stateRef.current.player.y - 120,
              color: '#ef4444',
              duration: 45,
              size: 14,
            });
          }
          delete stateRef.current.debugHoldStartTimes[k];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start request animation frame
    let frameId: number;
    const loop = () => {
      updateAndRender();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      sfx.stopBgm();
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      resizeObserver.disconnect();
    };
  }, []);

  const handleResize = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = Math.min(containerRef.current.clientHeight, window.innerHeight - 100);
    
    stateRef.current.dimensions = { width, height };
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  };

  // Mouse / Touch Virtual Joystick Actions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.showLevelUp || stateRef.current.showChest || stateRef.current.isPaused) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    stateRef.current.virtualJoystick = {
      active: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      vx: 0,
      vy: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const joy = stateRef.current.virtualJoystick;
    if (!joy.active || stateRef.current.showLevelUp || stateRef.current.showChest || stateRef.current.isPaused) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    joy.currentX = clientX;
    joy.currentY = clientY;

    const dx = clientX - joy.startX;
    const dy = clientY - joy.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const maxDistance = 50;
      const angle = Math.atan2(dy, dx);
      const intensity = Math.min(dist, maxDistance) / maxDistance;
      joy.vx = Math.cos(angle) * intensity;
      joy.vy = Math.sin(angle) * intensity;
    } else {
      joy.vx = 0;
      joy.vy = 0;
    }
  };

  const handlePointerUp = () => {
    stateRef.current.virtualJoystick.active = false;
    stateRef.current.virtualJoystick.vx = 0;
    stateRef.current.virtualJoystick.vy = 0;
  };

  // Trigger screen clear explosion
  const triggerHolyBomb = () => {
    sfx.playLightningStrike();
    const state = stateRef.current;
    
    // Create big screen blast particle effect
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      state.particles.push({
        x: state.player.x,
        y: state.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: '#fef08a', // soft sun yellow
        opacity: 1,
        duration: 30 + Math.random() * 30,
      });
    }

    // Damage all current enemies
    state.enemies.forEach((enemy) => {
      const damage = 100 * state.player.stats.might;
      enemy.hp -= damage;
      
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: `BOOM! ${Math.round(damage)}`,
        x: enemy.x,
        y: enemy.y - 12,
        color: '#facc15', // yellow damage popup
        duration: 40,
        size: 16,
      });

      // Spawn dust
      for (let p = 0; p < 3; p++) {
        state.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: 2 + Math.random() * 3,
          color: '#ef4444',
          opacity: 0.8,
          duration: 20,
        });
      }
    });
  };

  // Trigger Magnet vacuum
  const triggerMagnetVacuum = () => {
    sfx.playChicken();
    stateRef.current.gems.forEach((gem) => {
      // Flag gem to vacuum straight to player
      gem.isMagnet = true;
    });
  };

  // Get all available upgrades currently eligible
  const getAvailableUpgradesPool = (): ActiveUpgrade[] => {
    const state = stateRef.current;
    const availablePool: ActiveUpgrade[] = [];

    // Check weapons list
    const currentWeaponsMap = new Map<WeaponType, number>();
    state.weapons.forEach((w) => currentWeaponsMap.set(w.type, w.level));

    const totalWeaponsAndPassives = state.weapons.length + state.passives.length;
    const canTakeNew = totalWeaponsAndPassives < 6; // Limit 6 active slots total

    const weaponTypesList: WeaponType[] = ['whip', 'fireball', 'garlic', 'axe', 'bible', 'lightning', 'hadouken', 'note', 'summon'];
    
    weaponTypesList.forEach((wType) => {
      const level = currentWeaponsMap.get(wType) || 0;
      if (level > 0 && level < 10) {
        // Upgrade existing
        availablePool.push({
          id: `w-${wType}-${level + 1}`,
          name: getUpgradeName(wType),
          description: getUpgradeDescription(wType, level + 1),
          icon: '⚔️',
          type: 'weapon',
          targetType: wType,
          level: level + 1,
        });
      } else if (level === 0 && canTakeNew) {
        // Get new
        availablePool.push({
          id: `w-${wType}-1`,
          name: getUpgradeName(wType),
          description: getUpgradeDescription(wType, 1),
          icon: '⚔️',
          type: 'weapon',
          targetType: wType,
          level: 1,
        });
      }
    });

    // Check passives list
    const currentPassivesMap = new Map<PassiveType, number>();
    state.passives.forEach((p) => currentPassivesMap.set(p.type, p.level));

    const passiveTypesList: PassiveType[] = ['might', 'armor', 'speed', 'magnet', 'maxHp', 'cooldown'];
    passiveTypesList.forEach((pType) => {
      const level = currentPassivesMap.get(pType) || 0;
      if (level > 0 && level < 8) {
        availablePool.push({
          id: `p-${pType}-${level + 1}`,
          name: getUpgradeName(pType),
          description: getUpgradeDescription(pType, level + 1),
          icon: '✨',
          type: 'passive',
          targetType: pType,
          level: level + 1,
        });
      } else if (level === 0 && canTakeNew) {
        availablePool.push({
          id: `p-${pType}-1`,
          name: getUpgradeName(pType),
          description: getUpgradeDescription(pType, 1),
          icon: '✨',
          type: 'passive',
          targetType: pType,
          level: 1,
        });
      }
    });

    return availablePool;
  };

  // Formulate Upgrades on Level Up
  const triggerLevelUpTransition = () => {
    sfx.playLevelUp();
    const availablePool = getAvailableUpgradesPool();

    // Shuffle pool and select 3
    const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
    const finalOptions = shuffled.slice(0, 3);

    setLevelUpOptions(finalOptions);
    stateRef.current.showLevelUp = true;
    setShowLevelUp(true);
  };

  // Apply upgrade directly from Chest
  const applyChestUpgrade = (option: ActiveUpgrade) => {
    const state = stateRef.current;

    if (option.id.startsWith('gold')) {
      state.stats.gold += 150;
    } else if (option.type === 'weapon') {
      const target = option.targetType as WeaponType;
      const existing = state.weapons.find((w) => w.type === target);
      if (existing) {
        existing.level = option.level;
      } else {
        state.weapons.push({ type: target, level: 1, cooldownTimer: 0 });
      }
    } else {
      const target = option.targetType as PassiveType;
      const existing = state.passives.find((p) => p.type === target);
      if (existing) {
        existing.level = option.level;
      } else {
        state.passives.push({ type: target, level: 1 });
      }
    }

    // Sync state back to react arrays for rendering in HUD
    setWeaponsList([...state.weapons]);
    setPassivesList([...state.passives]);

    // Re-apply passives
    applyPassivesToPlayerStats();
  };

  // Handle Chest Pickup Events
  const handleChestPickup = () => {
    // Drop logic chances:
    // Regular: 1 item/equipment
    // 10% chance: 3 items/equipment
    // 5% chance: 5 items/equipment
    let count = 1;
    const r1 = Math.random();
    const r2 = Math.random();

    if (r2 < 0.05) {
      count = 5;
    } else if (r1 < 0.10) {
      count = 3;
    }

    const pool = getAvailableUpgradesPool();
    const awardedUpgrades: ActiveUpgrade[] = [];
    const chosenIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      const eligible = pool.filter((upg) => !chosenIds.has(upg.id));
      if (eligible.length > 0) {
        const selected = eligible[Math.floor(Math.random() * eligible.length)];
        awardedUpgrades.push(selected);
        chosenIds.add(selected.id);
        applyChestUpgrade(selected);
      } else {
        // Fallback gold reward
        const goldUpgrade: ActiveUpgrade = {
          id: `gold-${Math.random()}`,
          name: '宝箱の特大金貨袋 (Chest Gold)',
          description: 'すべての装備・支援能力がすでに極限に達しているため、代わりに追加金貨150Gが贈られます！',
          icon: '💰',
          type: 'passive',
          targetType: 'might',
          level: 1,
        };
        awardedUpgrades.push(goldUpgrade);
        applyChestUpgrade(goldUpgrade);
      }
    }

    setChestAwards(awardedUpgrades);
    setChestUpgradeCount(count);
    stateRef.current.showChest = true;
    setShowChest(true);
    stateRef.current.isPaused = true;
  };

  // Names Helper
  const getUpgradeName = (type: string): string => {
    switch (type) {
      case 'whip': return 'ホーリーホイップ (Whip)';
      case 'fireball': return 'マジックファントム (Fireball)';
      case 'garlic': return 'ダークオーラ結界 (Garlic)';
      case 'axe': return 'セイントアックス (Axe)';
      case 'bible': return '聖書の旋回円 (Holy Bible)';
      case 'lightning': return '雷の天罰指輪 (Lightning)';
      case 'hadouken': return '気功波動拳 (Hadouken)';
      case 'note': return '流麗な音符弾 (Music Note)';
      case 'summon': return '守護竜の召喚 (Summon Dragon)';
      case 'might': return 'ほうき星の力 (Might +10%)';
      case 'armor': return 'ホーリーシールド (Armor +1)';
      case 'speed': return 'エンジェルスピード (Speed +10%)';
      case 'magnet': return '磁力引力石 (Magnet +25%)';
      case 'maxHp': return 'エナジーライフ (Max HP +20)';
      case 'cooldown': return 'ハヤブサ時計 (Cooldown -8%)';
      default: return '未知の強化アイテム';
    }
  };

  // Full level specs
  const getUpgradeDescription = (type: string, level: number): string => {
    switch (type) {
      case 'whip':
        if (level === 1) return '前方と後力を薙ぎ払う聖槍鞭。一定頻度で一閃を放つ。';
        if (level === 2) return '攻撃面積が10%拡大し、鞭の弾数が最大3回連続に向上します。';
        if (level === 3) return '鞭ダメージ威力が 30% 強化されます。';
        if (level === 4) return '攻撃面積が15%拡大し、鞭の弾数が最大4回連続に向上します。';
        if (level === 5) return '【究極聖鞭】鞭全弾に無限貫通付与。さらに敵を攻撃した時に微量のHPを吸収します。';
        if (level === 6) return '攻撃範囲がさらに10%拡大し、鞭の弾数が最大4回連続からさらに引き上げられます。';
        if (level === 7) return '鞭の基礎ダメージが 25% 増加します。';
        if (level === 8) return '敵ヒット時のHP吸収率と回復効果がさらに増加します。';
        if (level === 9) return '攻撃速度と範囲が大幅に超絶強化されます。';
        return '【極・覇王聖鞭】全弾超大ダメージ＋常時倍率の一撃。究極を超えた至高の一閃を放ちます。(MAX)';
      case 'fireball':
        if (level === 1) return '最も近い敵に自動誘導する聖火弾を放ちます。';
        if (level === 2) return '火炎弾の装填クールダウン時間が 15% 減少。';
        if (level === 3) return '火炎弾の同時発射数が +1 増加し、弾速も上がります。';
        if (level === 4) return '火弾に小さな爆風判定を追加、基礎ダメージ +25%。';
        if (level === 5) return '【極星炎弾】ヒット時に周囲を巻き込む火炎衝撃波を発生させ、連鎖ダメージを発生させます。';
        if (level === 6) return '弾速が 20% 増加し、同時発射数がさらに +1 増加します。';
        if (level === 7) return '爆風の判定サイズ（爆破判定）が 15% 拡大します。';
        if (level === 8) return '火炎弾の威力と爆風威力が +30% 増加します。';
        if (level === 9) return '装填クールダウンがさらに 10% 短縮されます。';
        return '【煉獄極星弾】連鎖炎嵐。爆風が画面を埋め尽くし、敵弾を低確率でかき消します。(MAX)';
      case 'garlic':
        if (level === 1) return '自身の足元に高ダメージのニンニク魔力結界を展開し、侵入者を削ります。';
        if (level === 2) return 'オーラ半径が +20% 拡大し、ダメージ判定のサイクルを短縮。';
        if (level === 3) return '結界の攻撃力が +25% 増加し、軽微なノックバックを誘発します。';
        if (level === 4) return 'オーラ半径がさらに +15% 増加。';
        if (level === 5) return '【漆黒の蝕国】オーラ内の敵の移動速度を 30% 低下。さらに相手の敵弾を相殺して保護します。';
        if (level === 6) return 'デバフ効果を拡張し、範囲内エネミーの移動速度を 40% 低下させます。';
        if (level === 7) return 'オーラ結界のダメージ判定周期がさらに 15% 高速化。';
        if (level === 8) return 'オーラ半径がさらに +20% 拡大します。';
        if (level === 9) return '結界の総合ダメージ威力が +35% 向上。';
        return '【混沌魔界障壁】侵入した敵の被ダメージを2.5倍に跳ね上げ、完全なる絶対無敵領域へ。(MAX)';
      case 'axe':
        if (level === 1) return '上空へ向け放物線に高威力の聖斧を投げ渡します。敵を多く貫通します。';
        if (level === 2) return '同時投擲数が +1 増加。基礎攻撃力 +15%。';
        if (level === 3) return '斧のサイズが 30% 巨大化。ノックバック率が倍増。';
        if (level === 4) return '投擲時の同時飛散数が +2 増加。ダメージ +30%。';
        if (level === 5) return '【死神の鎌】無限貫通の刃。時折、全画面にランダムな巨大刃の雨を降らせる事があります。';
        if (level === 6) return '投擲数がさらに +1 増加、攻撃の射程が大幅向上します。';
        if (level === 7) return '鎌のベース威力ダメージがさらに +20% 増加。';
        if (level === 8) return 'ノックバックパワーが驚異の 1.5倍 に覚醒します。';
        if (level === 9) return '巨大な鎌の雨の発生確率が 2倍 に大幅向上します。';
        return '【創世神王の鎌】天空より敵を瞬時に両断する、超巨大覇王鎌を引き連れて乱舞します。(MAX)';
      case 'bible':
        if (level === 1) return 'プレイヤーを囲みながら旋回する聖書バリアを1枚、召喚します。';
        if (level === 2) return '本が +1 増え、周囲の回転スピードが 20% 向上。';
        if (level === 3) return '周回時間が 1.5秒 延長され、ヒット間隔が減少、威力 +20%。';
        if (level === 4) return '本がさらに +1。旋回円周半径が拡大し、より遠隔を防ぎます。';
        if (level === 5) return '【終焉の啓示】制限時間が完全に消失。聖なる本が常に周囲を周回し身を守ります。';
        if (level === 6) return '周回する本の数がさらに +1 枚追加されます。';
        if (level === 7) return 'バリア本のサイズが 25% 拡張され、防御壁の死角を塞ぎます。';
        if (level === 8) return '旋回スピードがさらに 25% 上昇し、ノックバック性能が追加されます。';
        if (level === 9) return 'バリアに守られている間、プレイヤーの全ダメージカット力が向上します。';
        return '【創世黙示録】絶対防護光輪。聖書がプレイヤーを取り巻く光輪となり、すべてを粉砕します。(MAX)';
      case 'lightning':
        if (level === 1) return 'ランダムな敵1体の上に天界の稲妻を落とします。極めて大ダメージ。';
        if (level === 2) return '落雷の同時回数が +1 回増加。';
        if (level === 3) return '雷の爆砕サイズが +25% 増加。威力が +30% 向上。';
        if (level === 4) return '落雷の回数がさらに +1 回増加。';
        if (level === 5) return '【裁きの大嵐】豪雨。雷と同時に対象周囲の広範囲へ連鎖電撃を走らせます。';
        if (level === 6) return '落雷回数がさらに +1 回増加、連撃スピードが上昇します。';
        if (level === 7) return '落雷ダメージ威力が 25% 強化され、落雷サイズが 15% 拡大。';
        if (level === 8) return '落雷時に周囲の敵へ1.5秒間のマヒ（移動停止）を誘発します。';
        if (level === 9) return '同時落雷数がさらに +1 回追加され、雷の網をつくります。';
        return '【神罰ハルマゲドン】終焉の断罪。連鎖される電撃が視界内の全敵へ電波し、雷の嵐を浴びせます。(MAX)';
      case 'hadouken':
        if (level === 1) return '前方に向けて敵を貫通し消し去る巨大な波動拳を放ちます。';
        if (level === 2) return '波動拳の威力が 25% 増加し、サイズが 15% 巨大化。';
        if (level === 3) return 'クールダウン時間が 15% 短縮され、さらに連射が可能に。';
        if (level === 4) return '貫通可能数が増加し、同時に2方向へ放つようになります。';
        if (level === 5) return '【真空波動拳】巨大なエネルギー波が一直線のすべての敵を完全に焼き尽くします。';
        if (level === 6) return '同時発射数が 3方向に増加し、さらに広範囲を制圧します。';
        if (level === 7) return '波動拳の威力が 30% 増加します。';
        if (level === 8) return '弾速が 20% 増加し、貫通力が向上します。';
        if (level === 9) return '波動の光線が敵を攻撃した時に爆発を引き起こすようになります。';
        return '【滅・覇王波動拳】神気の極み。画面前方の全ての敵を飲み込む、宇宙のエネルギービームと化します。(MAX)';
      case 'note':
        if (level === 1) return '敵に向けてバウンドし拡散する音符を1つ放ちます。';
        if (level === 2) return '音符の数が +1 増え、バウンド数が 1回 増加します。';
        if (level === 3) return '音符の攻撃力が 25% 増加し、爆発的な音波を伴う。';
        if (level === 4) return '音符の数が +1 増え、攻撃の貫通力が向上します。';
        if (level === 5) return '【シンフォニック・コーラス】音符が周囲 of 敵に当たると、周囲に美しい音波の衝撃波を放ちます。';
        if (level === 6) return '同時発射される音符の数がさらに +1 増えます。';
        if (level === 7) return '音符のサイズが 20% 巨大化。バウンド回数がさらに +1 増加します。';
        if (level === 8) return '敵を混乱（一瞬気絶）させる効果が追加されます。';
        if (level === 9) return 'すべての音符の威力が 30% 上昇。';
        return '【天界の狂詩曲 -ラプソディ-】美しきオーケストラ。音符が敵にぶつかるたびに弾け、無数の小音符が画面を舞います。(MAX)';
      case 'summon':
        if (level === 1) return 'プレイヤーの周囲をぐるぐる追尾して体当たり攻撃する守護竜を1体召喚します。';
        if (level === 2) return '守護竜の体当たりダメージが 25% 増加し、サイズが 15% 巨大化します。';
        if (level === 3) return '守護竜が一定時間ごとに近くの敵へ自動で貫通火球を吐き出すようになります。';
        if (level === 4) return '守護竜の体当たりのノックバック力が大幅に向上します。';
        if (level === 5) return '【天界の守護神竜】天竜の力が覚醒。一定時間ごとに周囲の敵を吹き飛ばす咆哮を放ちます。';
        if (level === 6) return '召喚される守護竜が 2体 に増加し、より強固に周囲を追尾・防衛します。';
        if (level === 7) return '守護竜が吐き出す火球の攻撃力が 40% 上昇し、連射速度がアップします。';
        if (level === 8) return '守護竜の移動軌道が拡大し、より遠くの敵まで薙ぎ払います。';
        if (level === 9) return 'すべての体当たりダメージがさらに 30% 増加。';
        return '【超神竜・バハムート】神格の極み。召喚される守護竜が 3体 となり、プレイヤーの周囲を凄まじい速度で旋回し、触れる敵すべてを焼き尽くします。(MAX)';
      case 'might':
        return `力を 10% 向上。すべての武器およびスキルの与ダメージが増加します。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      case 'armor':
        return `聖衣の防護を強化。敵から受けるすべてのダメージをフラットで常に1削減します。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      case 'speed':
        return `移動の俊敏性を 10% 向上。モンスターと距離を保ちやすくなります。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      case 'magnet':
        return `引き寄せる引力を 25% 拡大。ジェムやアイテムの自動収集半径が広がります。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      case 'maxHp':
        return `最大健康寿命を +20 増加。同時に失われたHPを全回復します。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      case 'cooldown':
        return `すべての武器のクールダウン待機時間を 8% 短縮。攻撃回転率が上がります。(現在のLV: ${level}${level === 8 ? ' - MAX' : ''})`;
      default:
        return '基礎能力を引き上げます。';
    }
  };

  // Apply Selected Upgrade
  const handleUpgradeSelected = (option: ActiveUpgrade) => {
    const state = stateRef.current;

    if (option.id === 'gold') {
      state.stats.gold += 100;
      sfx.playUpgradeSelect();
    } else if (option.type === 'weapon') {
      const target = option.targetType as WeaponType;
      const existing = state.weapons.find((w) => w.type === target);
      if (existing) {
        existing.level = option.level;
      } else {
        state.weapons.push({ type: target, level: 1, cooldownTimer: 0 });
      }
    } else {
      const target = option.targetType as PassiveType;
      const existing = state.passives.find((p) => p.type === target);
      if (existing) {
        existing.level = option.level;
      } else {
        state.passives.push({ type: target, level: 1 });
      }
    }

    // Sync state back to react arrays for rendering in HUD
    setWeaponsList([...state.weapons]);
    setPassivesList([...state.passives]);

    // Update screen
    stateRef.current.showLevelUp = false;
    setShowLevelUp(false);

    // Subtract level thresholds
    state.stats.exp -= state.stats.nextLevelExp;
    state.stats.level += 1;
    // Escalate next level requirements like Vampire Survivors
    state.stats.nextLevelExp = Math.round(5 + state.stats.level * 4.5);

    // Re-apply passives & level-up stats modifications to player.stats dynamically 
    applyPassivesToPlayerStats();

    // If leftover exp is still enough for another level up, restart level trigger
    if (state.stats.exp >= state.stats.nextLevelExp) {
      setTimeout(() => {
        triggerLevelUpTransition();
      }, 100);
    }
  };

  const applyPassivesToPlayerStats = () => {
    const state = stateRef.current;
    // Reset player stats back to base class stats
    const stats = { ...playerClass.baseStats };

    // Apply level-up Might bonus: +20% (0.20) attack power per level gained
    const levelBonusMight = (state.stats.level - 1) * 0.20;
    stats.might += levelBonusMight;

    state.passives.forEach((p) => {
      if (p.type === 'might') {
        stats.might += p.level * 0.1;
      } else if (p.type === 'armor') {
        stats.armor += p.level * 1;
      } else if (p.type === 'speed') {
        stats.speed += p.level * 0.1 * playerClass.baseStats.speed;
      } else if (p.type === 'magnet') {
        stats.magnetRange += p.level * 25;
      } else if (p.type === 'maxHp') {
        const addedHp = p.level * 20;
        stats.maxHp += addedHp;
        // Also heal when unlocking MaxHp
        state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + addedHp);
      } else if (p.type === 'cooldown') {
        stats.cooldownReduction = Math.min(0.5, p.level * 0.08);
      }
    });

    // Make sure player HP matches constraints
    state.player.stats = stats;
  };

  // Helper inside loop: Weapon Triggers
  const processWeaponsFiring = (state: any, count: number) => {
    const px = state.player.x;
    const py = state.player.y;

    state.weapons.forEach((w: WeaponState) => {
      // Cooldown decrement
      const cdr = state.player.stats.cooldownReduction; // e.g. 0.0 to 0.5
      const speedModifier = 1 - cdr;
      let baseCooldown = 60; // default in ticks (approx 1s)

      if (w.type === 'whip') baseCooldown = 80 * speedModifier;
      if (w.type === 'fireball') baseCooldown = 50 * speedModifier;
      if (w.type === 'garlic') baseCooldown = 1; // Garlic is permanent tick
      if (w.type === 'axe') baseCooldown = 110 * speedModifier;
      if (w.type === 'bible') baseCooldown = 180 * speedModifier;
      if (w.type === 'lightning') baseCooldown = 130 * speedModifier;
      if (w.type === 'hadouken') {
        let cd = 95;
        if (w.level >= 3) cd = 75;
        baseCooldown = cd * speedModifier;
      }
      if (w.type === 'note') baseCooldown = 70 * speedModifier;

      w.cooldownTimer--;

      if (w.cooldownTimer <= 0) {
        w.cooldownTimer = baseCooldown;

        // Perform Attack Trigger
        if (w.type === 'whip') {
          sfx.playWhip();
          const areaMult = state.player.stats.area;
          const dmg = 22 * state.player.stats.might * (1 + (w.level - 1) * 0.25);
          const slashWidth = 140 * areaMult;
          const slashHeight = 35 * areaMult;

          // Whip shoots front and back
          // Left Slash
          state.projectiles.push({
            id: Math.random().toString(),
            type: 'whip',
            x: px - slashWidth / 2 - 10,
            y: py,
            vx: 0,
            vy: 0,
            damage: dmg,
            size: slashWidth,
            color: '#ffffff',
            rotation: 0,
            rotationSpeed: 0,
            duration: 10,
            maxDuration: 10,
            pierce: 9999, // Piercing
          });

          // Right slash (Level 2+ extra slashes)
          const repeats = w.level >= 4 ? 3 : (w.level >= 2 ? 2 : 1);
          for (let r = 0; r < repeats; r++) {
            setTimeout(() => {
              if (stateRef.current.showLevelUp || stateRef.current.isPaused) return;
              state.projectiles.push({
                id: Math.random().toString(),
                type: 'whip',
                x: px + slashWidth / 2 + 10,
                y: py,
                vx: 0,
                vy: 0,
                damage: dmg,
                size: slashWidth,
                color: '#fef08a',
                rotation: 0,
                rotationSpeed: 0,
                duration: 10,
                maxDuration: 10,
                pierce: 9999,
              });
            }, r * 100);
          }
        }

        if (w.type === 'fireball') {
          // Shoot magical orbs tracking nearest enemy
          const target = getNearestEnemy(state);
          if (target) {
            sfx.playFireball();
            const angle = Math.atan2(target.y - py, target.x - px);
            const bulletSpeed = 6;
            const dmg = 28 * state.player.stats.might;

            const baseShots = w.level >= 3 ? 2 : 1;
            for (let i = 0; i < baseShots; i++) {
              const spreadAngle = angle + (i - (baseShots - 1) / 2) * 0.15;
              state.projectiles.push({
                id: Math.random().toString(),
                type: 'fireball',
                x: px,
                y: py,
                vx: Math.cos(spreadAngle) * bulletSpeed,
                vy: Math.sin(spreadAngle) * bulletSpeed,
                damage: dmg,
                size: 10 * state.player.stats.area,
                color: '#c084fc', // purple ball
                rotation: Math.random() * Math.PI,
                rotationSpeed: 0.1,
                duration: 150,
                maxDuration: 150,
                pierce: w.level >= 5 ? 2 : 1, // Lvl 5 gets splash explode pierce
              });
            }
          }
        }

        if (w.type === 'garlic') {
          // Garlic aura is checked permanently in frame loops. 
          // We trigger sound/visual puff occasionally
          if (count % 35 === 0) {
            sfx.playGarlicAura();
            const size = (65 + w.level * 15) * state.player.stats.area;
            state.particles.push({
              x: px,
              y: py,
              vx: 0,
              vy: 0,
              size: size,
              color: 'rgba(163, 230, 53, 0.04)', // neon-lime puff
              opacity: 0.3,
              duration: 15,
            });
          }
        }

        if (w.type === 'axe') {
          sfx.playAxeThrow();
          const target = getNearestEnemy(state);
          const aimAngle = target ? Math.atan2(target.y - py, target.x - px) : -Math.PI / 2;
          const dmg = 45 * state.player.stats.might * (1 + (w.level - 1) * 0.2);
          const countAxes = w.level >= 4 ? 4 : (w.level >= 2 ? 2 : 1);

          for (let i = 0; i < countAxes; i++) {
            const spreadSpeedX = (Math.cos(aimAngle) * 2) + (i - (countAxes - 1) / 2) * 1.5;
            state.projectiles.push({
              id: Math.random().toString(),
              type: 'axe',
              x: px,
              y: py,
              vx: spreadSpeedX,
              vy: -7 - Math.random() * 2, // gravity toss upwards
              damage: dmg,
              size: (12 + w.level * 3) * state.player.stats.area,
              color: '#94a3b8',
              rotation: Math.random() * Math.PI,
              rotationSpeed: 0.18,
              duration: 160,
              maxDuration: 160,
              pierce: w.level >= 3 ? 999 : 5, // Huge pierce
            });
          }
        }

        if (w.type === 'bible') {
          sfx.playBibleSpirt();
          // Spawn orbiting bible projectile
          const numBooks = w.level >= 4 ? 4 : (w.level >= 2 ? 3 : 2);
          const dmg = 24 * state.player.stats.might;
          
          // Clear current bibles first to refresh locations
          state.projectiles = state.projectiles.filter((p: Projectile) => p.type !== 'bible');

          for (let i = 0; i < numBooks; i++) {
            const angleOffset = (i / numBooks) * Math.PI * 2;
            state.projectiles.push({
              id: Math.random().toString(),
              type: 'bible',
              x: px,
              y: py,
              vx: 0,
              vy: 0,
              damage: dmg,
              size: 14 * state.player.stats.area,
              color: '#38bdf8', // sky-blue bible
              rotation: 0,
              rotationSpeed: 0.08, // Orbit speed
              duration: w.level >= 5 ? 99999 : 300, // Level 5+ infinite duration!
              maxDuration: w.level >= 5 ? 99999 : 300,
              pierce: 9999, // Infinite pierce
              angleOffset: angleOffset,
            });
          }
        }

        if (w.type === 'summon') {
          // Maintain dragon projectiles in state
          const numDragons = w.level >= 9 ? 3 : (w.level >= 6 ? 2 : 1);
          const currentSummons = state.projectiles.filter((p: Projectile) => p.type === 'summon');
          
          if (currentSummons.length !== numDragons) {
            // Re-spawn
            state.projectiles = state.projectiles.filter((p: Projectile) => p.type !== 'summon');
            for (let i = 0; i < numDragons; i++) {
              const angleOffset = (i / numDragons) * Math.PI * 2;
              state.projectiles.push({
                id: Math.random().toString(),
                type: 'summon',
                x: px + Math.cos(angleOffset) * 90,
                y: py + Math.sin(angleOffset) * 90,
                vx: 0,
                vy: 0,
                damage: 28 * state.player.stats.might * (1 + (w.level - 1) * 0.22),
                size: 20 * state.player.stats.area * (w.level >= 4 ? 1.2 : 1.0),
                color: '#22c55e', // emerald/green dragon
                rotation: angleOffset,
                rotationSpeed: 0.04,
                duration: 999999,
                maxDuration: 999999,
                pierce: 99999,
                angleOffset: angleOffset,
              });
            }
          }
          
          // Dragon special attacking actions (Level 3+ fires fireballs, Level 5+ emits Roar)
          if (w.cooldownTimer <= 0) {
            let fired = false;
            
            // Level 3+ fires piercing fireballs
            if (w.level >= 3) {
              const summons = state.projectiles.filter((p: Projectile) => p.type === 'summon');
              if (summons.length > 0) {
                fired = true;
                sfx.playFireball();
                summons.forEach((drag: Projectile) => {
                  const target = getNearestEnemy(state);
                  const angle = target ? Math.atan2(target.y - drag.y, target.x - drag.x) : drag.rotation;
                  
                  const numFireballs = w.level >= 7 ? 2 : 1;
                  for (let f = 0; f < numFireballs; f++) {
                    const fAngle = angle + (f - (numFireballs - 1) / 2) * 0.25;
                    state.projectiles.push({
                      id: Math.random().toString(),
                      type: 'fireball',
                      x: drag.x,
                      y: drag.y,
                      vx: Math.cos(fAngle) * 5.5,
                      vy: Math.sin(fAngle) * 5.5,
                      damage: 25 * state.player.stats.might * (w.level >= 7 ? 1.4 : 1.0),
                      size: 14 * state.player.stats.area,
                      color: '#4ade80', // emerald green fireball
                      rotation: fAngle,
                      rotationSpeed: 0,
                      duration: 150,
                      maxDuration: 150,
                      pierce: 3,
                    });
                  }
                });
              }
            }
            
            // Level 5+ Dragon Roar!
            if (w.level >= 5) {
              const summons = state.projectiles.filter((p: Projectile) => p.type === 'summon');
              if (summons.length > 0) {
                fired = true;
                sfx.playLightningStrike(); // Roaring sound
                summons.forEach((drag: Projectile) => {
                  // Shockwave particles
                  for (let r = 0; r < 12; r++) {
                    const rAngle = (r / 12) * Math.PI * 2;
                    state.particles.push({
                      x: drag.x,
                      y: drag.y,
                      vx: Math.cos(rAngle) * 2.8,
                      vy: Math.sin(rAngle) * 2.8,
                      size: 3 + Math.random() * 3,
                      color: '#4ade80',
                      opacity: 0.85,
                      duration: 20,
                    });
                  }
                  
                  // Damage enemies in roar radius
                  const roarRadius = 110 * state.player.stats.area;
                  state.enemies.forEach((enemy: Enemy) => {
                    const dDist = Math.sqrt((enemy.x - drag.x) ** 2 + (enemy.y - drag.y) ** 2);
                    if (dDist < roarRadius) {
                      const roarDmg = 35 * state.player.stats.might;
                      enemy.hp -= roarDmg;
                      
                      const kbAngle = Math.atan2(enemy.y - drag.y, enemy.x - drag.x);
                      enemy.knockbackX += Math.cos(kbAngle) * 5.5;
                      enemy.knockbackY += Math.sin(kbAngle) * 5.5;
                      
                      state.floatingTexts.push({
                        id: Math.random().toString(),
                        text: `ROAR! ${Math.round(roarDmg)}`,
                        x: enemy.x,
                        y: enemy.y - 10,
                        color: '#22c55e',
                        duration: 25,
                        size: 12,
                      });
                    }
                  });
                });
              }
            }
            
            if (fired) {
              w.cooldownTimer = Math.max(30, 95 * speedModifier);
            }
          }
        }

        if (w.type === 'lightning') {
          // Thunder strikes! Play sound, damage surrounding
          const visibleEnemies = state.enemies.filter((e: Enemy) => {
            const distX = Math.abs(e.x - px);
            const distY = Math.abs(e.y - py);
            return distX < state.dimensions.width / 2 && distY < state.dimensions.height / 2;
          });

          if (visibleEnemies.length > 0) {
            sfx.playLightningStrike();
            const maxStrikes = w.level >= 4 ? 4 : (w.level >= 2 ? 2 : 1);
            const strikes = visibleEnemies.sort(() => 0.5 - Math.random()).slice(0, maxStrikes);

            strikes.forEach((tgt: Enemy) => {
              const dmg = 70 * state.player.stats.might * (1 + (w.level - 1) * 0.3);
              const radius = (40 + w.level * 10) * state.player.stats.area;

              // Create striking visual bolt lines particle effect immediately on target
              for (let line = 0; line < 5; line++) {
                state.particles.push({
                  x: tgt.x + (Math.random() - 0.5) * 10,
                  y: tgt.y - (100 + Math.random() * 200),
                  vx: 0,
                  vy: 7 + Math.random() * 5,
                  size: 2 + Math.random() * 2,
                  color: '#fbbf24', // golden yellow lightning particle
                  opacity: 1,
                  duration: 12,
                });
              }

              // Create lightning splash trigger projectile
              state.projectiles.push({
                id: Math.random().toString(),
                type: 'lightning',
                x: tgt.x,
                y: tgt.y,
                vx: 0,
                vy: 0,
                damage: dmg,
                size: radius,
                color: 'rgba(250, 204, 21, 0.4)',
                rotation: 0,
                rotationSpeed: 0,
                duration: 6,
                maxDuration: 6,
                pierce: 9999,
              });
            });
          }
        }

        if (w.type === 'hadouken') {
          sfx.playHadouken();
          const target = getNearestEnemy(state);
          const baseAngle = target ? Math.atan2(target.y - py, target.x - px) : 0;
          const bulletSpeed = 6.5;
          const dmg = 35 * state.player.stats.might * (1 + (w.level - 1) * 0.25);
          const areaMult = state.player.stats.area;
          const baseSize = 16 * areaMult * (1 + (w.level - 1) * 0.15);
          
          const numHadoukens = w.level >= 6 ? 3 : (w.level >= 4 ? 2 : 1);
          for (let i = 0; i < numHadoukens; i++) {
            const angle = baseAngle + (i - (numHadoukens - 1) / 2) * 0.3;
            state.projectiles.push({
              id: Math.random().toString(),
              type: 'hadouken',
              x: px,
              y: py,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              damage: dmg,
              size: baseSize,
              color: '#38bdf8', // sky blue
              rotation: angle,
              rotationSpeed: 0,
              duration: 180,
              maxDuration: 180,
              pierce: w.level >= 5 ? 9999 : (4 + w.level * 2),
            });
          }
        }

        if (w.type === 'note') {
          sfx.playNote();
          const target = getNearestEnemy(state);
          const baseAngle = target ? Math.atan2(target.y - py, target.x - px) : Math.random() * Math.PI * 2;
          const bulletSpeed = 5;
          const dmg = 24 * state.player.stats.might * (1 + (w.level - 1) * 0.22);
          const areaMult = state.player.stats.area;
          const baseSize = 12 * areaMult * (1 + (w.level - 1) * 0.1);

          const numNotes = w.level >= 6 ? 4 : (w.level >= 4 ? 3 : (w.level >= 2 ? 2 : 1));
          for (let i = 0; i < numNotes; i++) {
            const angle = baseAngle + (i - (numNotes - 1) / 2) * 0.4;
            state.projectiles.push({
              id: Math.random().toString(),
              type: 'note',
              x: px,
              y: py,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              damage: dmg,
              size: baseSize,
              color: '#f472b6', // pink
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: 0.05 + Math.random() * 0.05,
              duration: 200,
              maxDuration: 200,
              pierce: w.level >= 4 ? 4 : 2,
              bounce: w.level >= 7 ? 4 : (w.level >= 2 ? 3 : 2), // bounce count
            });
          }
        }
      }
    });
  };

  const getNearestEnemy = (state: any): Enemy | null => {
    let nearest: Enemy | null = null;
    let minDist = 999999;
    const px = state.player.x;
    const py = state.player.y;

    state.enemies.forEach((e: Enemy) => {
      const dx = e.x - px;
      const dy = e.y - py;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });

    return nearest;
  };

  // Central Game update, physics, collision and rendering frame
  const updateAndRender = () => {
    if (stateRef.current.showLevelUp || stateRef.current.isPaused || stateRef.current.isGameOverCalled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    const width = state.dimensions.width;
    const height = state.dimensions.height;

    // Increment wave frame count
    state.waveTimer++;
    const currentSecond = Math.floor(state.waveTimer / 60);

    if (currentSecond !== state.stats.timeElapsed) {
      state.stats.timeElapsed = currentSecond;
      // Triggers update for React view overlays every second
      setHudStats({ ...state.stats });

      // Spawn background bats or increase wave triggers based on minute
      escalateSpawns(state);
    }

    // Handle White Reaper Spawning Countdown (5 seconds = 300 frames after Dark Lord defeated)
    if (state.darkLordDefeated && state.whiteReaperCountdown !== null && state.whiteReaperCountdown > 0) {
      state.whiteReaperCountdown--;
      if (state.whiteReaperCountdown === 0) {
        state.whiteReaperSpawned = true;
        // Spawn White Reaper from off-screen
        const angle = Math.random() * Math.PI * 2;
        const spawnX = state.player.x + Math.cos(angle) * 450;
        const spawnY = state.player.y + Math.sin(angle) * 450;

        state.enemies.push({
          id: Math.random().toString(),
          type: 'white_reaper',
          x: spawnX,
          y: spawnY,
          hp: 999999999, // Extremely immortal HP
          maxHp: 999999999,
          speed: 15.0, // Extremely fast, inescapable death!
          damage: 99999, // Unused but massive
          size: 40,
          color: '#ffffff',
          isBoss: true,
          scoreValue: 0,
          expValue: 0,
          goldChance: 0,
          animationFrame: 0,
          knockbackX: 0,
          knockbackY: 0,
        });

        // Ominous text warning
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: '☠️ 死神があなたの魂を刈り取りに来ました... ☠️',
          x: state.player.x,
          y: state.player.y - 120,
          color: '#ffffff',
          duration: 180,
          size: 20,
        });

        // Massive white flash particles
        for (let i = 0; i < 40; i++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = 3 + Math.random() * 9;
          state.particles.push({
            x: state.player.x,
            y: state.player.y,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            size: 3 + Math.random() * 6,
            color: '#ffffff',
            opacity: 0.95,
            duration: 50,
          });
        }
      }
    }

    // Handle White Reaper Touch/Instant-Death countdown (2 seconds = 120 frames)
    if (state.whiteReaperTouchTimer !== null && state.whiteReaperTouchTimer > 0) {
      state.whiteReaperTouchTimer--;
      
      // Screen shaking or flash during death sequence!
      if (state.whiteReaperTouchTimer % 10 === 0) {
        // Red and black flash particles on player
        const pAngle = Math.random() * Math.PI * 2;
        state.particles.push({
          x: state.player.x,
          y: state.player.y,
          vx: Math.cos(pAngle) * 4,
          vy: Math.sin(pAngle) * 4,
          size: 6 + Math.random() * 8,
          color: '#7f1d1d', // very dark red
          opacity: 0.9,
          duration: 30,
        });
      }

      if (state.whiteReaperTouchTimer % 30 === 0) {
        const remainingSecs = (state.whiteReaperTouchTimer / 60).toFixed(1);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: `⏳ 死の宣告: ${remainingSecs}秒...`,
          x: state.player.x,
          y: state.player.y - 65,
          color: '#ef4444',
          duration: 30,
          size: 18,
        });
      }

      if (state.whiteReaperTouchTimer === 0) {
        // Instant Death trigger by White Reaper - triggers Game Clear / Victory!
        state.stats.isVictory = true;
        state.player.stats.hp = 0;
        setPlayerHp(0);
        if (!state.isGameOverCalled) {
          state.isGameOverCalled = true;
          sfx.playGameOver();
          handleRunGameOver();
        }
      }
    }

    // 1. UPDATE PLAYER MOVEMENT
    let dx = 0;
    let dy = 0;

    // Keyboard checks
    if (state.keys['w'] || state.keys['ArrowUp']) dy -= 1;
    if (state.keys['s'] || state.keys['ArrowDown']) dy += 1;
    if (state.keys['a'] || state.keys['ArrowLeft']) dx -= 1;
    if (state.keys['d'] || state.keys['ArrowRight']) dx += 1;

    // Normalize keyboard vector
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    // Blend in virtual joystick if active
    const joy = state.virtualJoystick;
    if (joy.active) {
      dx = joy.vx;
      dy = joy.vy;
    }

    // Apply movement
    let baseSpeed = state.player.stats.speed;
    if (state.whiteReaperTouchTimer !== null) {
      baseSpeed *= 0.12; // Inescapable slowed down state
    }
    state.player.x += dx * baseSpeed;
    state.player.y += dy * baseSpeed;

    // Keep animate frame running if player is moving
    if (dx !== 0 || dy !== 0) {
      state.player.animationFrame += 0.15;
    }

    // Decrement player invuln frame timer
    if (state.player.invulnTimer > 0) state.player.invulnTimer--;

    // Update Camera position to track player smooth center
    const targetCamX = state.player.x - width / 2;
    const targetCamY = state.player.y - height / 2;
    state.camera.x += (targetCamX - state.camera.x) * 0.12;
    state.camera.y += (targetCamY - state.camera.y) * 0.12;

    // 2. TRIGGER WEAPONS AUTOMATED FIRING
    processWeaponsFiring(state, state.waveTimer);

    // Dynamic Garlic Continuous tick dmg
    const garlicWeapon = state.weapons.find((w) => w.type === 'garlic');
    if (garlicWeapon) {
      const px = state.player.x;
      const py = state.player.y;
      const radius = (65 + garlicWeapon.level * 15) * state.player.stats.area;
      const dmg = 1.2 * state.player.stats.might * garlicWeapon.level;

      state.enemies.forEach((enemy: Enemy) => {
        const dist = Math.sqrt((enemy.x - px) ** 2 + (enemy.y - py) ** 2);
        if (dist < radius + enemy.size) {
          // Continuous garlic tick check (every 30 frames)
          if (state.waveTimer % 30 === 0) {
            enemy.hp -= dmg;
            
            // Pushback
            const kbAngle = Math.atan2(enemy.y - py, enemy.x - px);
            const kbForce = (1.5 + garlicWeapon.level * 0.5);
            enemy.knockbackX += Math.cos(kbAngle) * kbForce;
            enemy.knockbackY += Math.sin(kbAngle) * kbForce;

            // Little damage green number
            state.floatingTexts.push({
              id: Math.random().toString(),
              text: `${Math.round(dmg)}`,
              x: enemy.x + (Math.random() - 0.5) * 10,
              y: enemy.y - 12,
              color: '#84cc16', // neon lime
              duration: 25,
              size: 11,
            });

            // Particles
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: 2,
              color: '#a3e635',
              opacity: 0.6,
              duration: 15,
            });
          }
        }
      });
    }

    // 3. PROJECTILES PHYSICS & COLLISION
    state.projectiles.forEach((proj: Projectile) => {
      if (proj.type === 'bible') {
        // Orbit motion
        proj.angleOffset = (proj.angleOffset || 0) + proj.rotationSpeed;
        const radius = 80 * state.player.stats.area;
        proj.x = state.player.x + Math.cos(proj.angleOffset) * radius;
        proj.y = state.player.y + Math.sin(proj.angleOffset) * radius;
        proj.rotation += 0.1;
      } else if (proj.type === 'summon') {
        // Find summon level to scale behavior
        const summonLvl = state.weapons.find((w: any) => w.type === 'summon')?.level || 1;
        const baseSpeed = 0.025 + (summonLvl >= 10 ? 0.015 : 0);
        proj.angleOffset = (proj.angleOffset || 0) + baseSpeed;

        const baseRadius = summonLvl >= 8 ? 115 : 85;
        const radius = baseRadius * state.player.stats.area;

        const targetX = state.player.x + Math.cos(proj.angleOffset) * radius;
        const targetY = state.player.y + Math.sin(proj.angleOffset) * radius;

        const oldX = proj.x;
        const oldY = proj.y;

        // Smoothly follow the target location
        proj.x += (targetX - proj.x) * 0.11;
        proj.y += (targetY - proj.y) * 0.11;

        const dx = proj.x - oldX;
        const dy = proj.y - oldY;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
          proj.rotation = Math.atan2(dy, dx);
        }

        proj.duration = 999999;
      } else if (proj.type === 'axe') {
        // Axe gravity arcs
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.vy += 0.15; // Gravity acceleration downward
        proj.rotation += proj.rotationSpeed;
      } else {
        // Linear travel
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.rotation += proj.rotationSpeed;
      }

      proj.duration--;

      // Check bullet collisions with enemies
      if (proj.type !== 'lightning') { // lightning deals localized blast on spawn
        state.enemies.forEach((enemy: Enemy) => {
          if (proj.pierce <= 0) return;

          const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
          const contactSize = (proj.type === 'whip') ? proj.size / 2 + enemy.size : proj.size + enemy.size;

          if (dist < contactSize) {
            // Weapon hit! Damage enemy
            enemy.hp -= proj.damage;
            proj.pierce--;

            // Note bounce pierce preservation
            if (proj.type === 'note' && proj.bounce && proj.bounce > 0) {
              proj.pierce = 1;
            }
            if (proj.type === 'summon') {
              proj.pierce = 99999;
            }

            // Life steal for Level 5 Whip
            if (proj.type === 'whip') {
              const whipLvl = state.weapons.find((w) => w.type === 'whip')?.level || 0;
              if (whipLvl >= 5 && Math.random() < 0.2) {
                state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + 1);
                setPlayerHp(state.player.stats.hp);
                // green floating text
                state.floatingTexts.push({
                  id: Math.random().toString(),
                  text: '+1 HP',
                  x: state.player.x,
                  y: state.player.y - 20,
                  color: '#22c55e',
                  duration: 30,
                  size: 12,
                });
              }
            }

            // Fireball Level 5 splash explode triggers
            if (proj.type === 'fireball' && proj.pierce === 0) {
              const fireballLvl = state.weapons.find((w) => w.type === 'fireball')?.level || 0;
              if (fireballLvl >= 5) {
                sfx.playLightningStrike();
                // Spawn splash ring
                const splashArea = 80;
                
                // Explode particles
                for (let e = 0; e < 15; e++) {
                  const pAngle = Math.random() * Math.PI * 2;
                  const pSpeed = 1 + Math.random() * 4;
                  state.particles.push({
                    x: proj.x,
                    y: proj.y,
                    vx: Math.cos(pAngle) * pSpeed,
                    vy: Math.sin(pAngle) * pSpeed,
                    size: 2 + Math.random() * 4,
                    color: '#f97316', // orange heat
                    opacity: 1,
                    duration: 25,
                  });
                }

                state.enemies.forEach((otherEnemy: Enemy) => {
                  const splDist = Math.sqrt((otherEnemy.x - proj.x) ** 2 + (otherEnemy.y - proj.y) ** 2);
                  if (splDist < splashArea) {
                    const splDmg = proj.damage * 0.6;
                    otherEnemy.hp -= splDmg;
                    // Yellow numbers
                    state.floatingTexts.push({
                      id: Math.random().toString(),
                      text: `${Math.round(splDmg)}`,
                      x: otherEnemy.x,
                      y: otherEnemy.y - 10,
                      color: '#f97316',
                      duration: 30,
                      size: 12,
                    });
                  }
                });
              }
            }

            // Hadouken Level 9 blast explosion
            if (proj.type === 'hadouken') {
              const hadoukenLvl = state.weapons.find((w) => w.type === 'hadouken')?.level || 0;
              if (hadoukenLvl >= 9) {
                sfx.playLightningStrike();
                const splashArea = 90;
                for (let e = 0; e < 10; e++) {
                  const pAngle = Math.random() * Math.PI * 2;
                  const pSpeed = 1.5 + Math.random() * 3.5;
                  state.particles.push({
                    x: proj.x,
                    y: proj.y,
                    vx: Math.cos(pAngle) * pSpeed,
                    vy: Math.sin(pAngle) * pSpeed,
                    size: 2 + Math.random() * 3,
                    color: '#38bdf8', // sky blue sparks
                    opacity: 1,
                    duration: 20,
                  });
                }
                state.enemies.forEach((otherEnemy: Enemy) => {
                  const splDist = Math.sqrt((otherEnemy.x - proj.x) ** 2 + (otherEnemy.y - proj.y) ** 2);
                  if (splDist < splashArea) {
                    const splDmg = proj.damage * 0.45;
                    otherEnemy.hp -= splDmg;
                    state.floatingTexts.push({
                      id: Math.random().toString(),
                      text: `${Math.round(splDmg)}`,
                      x: otherEnemy.x,
                      y: otherEnemy.y - 10,
                      color: '#38bdf8',
                      duration: 25,
                      size: 11,
                    });
                  }
                });
              }
            }

            // Note bouncing and Level 5 symphonic chorus shockwave
            if (proj.type === 'note') {
              if (proj.bounce && proj.bounce > 0) {
                proj.bounce--;
                const otherEnemies = state.enemies.filter((e: Enemy) => e.id !== enemy.id);
                let targetEnemy: Enemy | null = null;
                let minDist = 250;
                
                otherEnemies.forEach((e: Enemy) => {
                  const dist = Math.sqrt((e.x - proj.x) ** 2 + (e.y - proj.y) ** 2);
                  if (dist < minDist) {
                    minDist = dist;
                    targetEnemy = e;
                  }
                });
                
                if (targetEnemy) {
                  const bAngle = Math.atan2((targetEnemy as Enemy).y - proj.y, (targetEnemy as Enemy).x - proj.x);
                  const bSpeed = 5.5;
                  proj.vx = Math.cos(bAngle) * bSpeed;
                  proj.vy = Math.sin(bAngle) * bSpeed;
                  proj.rotation = bAngle;
                } else {
                  const bAngle = Math.random() * Math.PI * 2;
                  const bSpeed = 4.5;
                  proj.vx = Math.cos(bAngle) * bSpeed;
                  proj.vy = Math.sin(bAngle) * bSpeed;
                  proj.rotation = bAngle;
                }
                
                sfx.playNote();
                
                const noteLvl = state.weapons.find((w) => w.type === 'note')?.level || 0;
                if (noteLvl >= 5) {
                  for (let r = 0; r < 8; r++) {
                    const rAngle = (r / 8) * Math.PI * 2;
                    state.particles.push({
                      x: proj.x,
                      y: proj.y,
                      vx: Math.cos(rAngle) * 2,
                      vy: Math.sin(rAngle) * 2,
                      size: 2,
                      color: '#ec4899', // pink shockwave
                      opacity: 0.8,
                      duration: 15,
                    });
                  }
                  
                  otherEnemies.forEach((otherEnemy: Enemy) => {
                    const dist = Math.sqrt((otherEnemy.x - proj.x) ** 2 + (otherEnemy.y - proj.y) ** 2);
                    if (dist < 60) {
                      const waveDmg = proj.damage * 0.4;
                      otherEnemy.hp -= waveDmg;
                      state.floatingTexts.push({
                        id: Math.random().toString(),
                        text: `${Math.round(waveDmg)}`,
                        x: otherEnemy.x,
                        y: otherEnemy.y - 10,
                        color: '#f472b6',
                        duration: 25,
                        size: 10,
                      });
                    }
                  });
                }
              }
            }

            // Create blood/impact particles
            const particleColor = enemy.color;
            for (let p = 0; p < 3; p++) {
              state.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 4 + proj.vx * 0.2,
                vy: (Math.random() - 0.5) * 4 + proj.vy * 0.2,
                size: 2 + Math.random() * 3,
                color: particleColor,
                opacity: 0.8,
                duration: 20,
              });
            }

            // Knockback pushback
            const angle = Math.atan2(enemy.y - proj.y, enemy.x - proj.x);
            let force = (proj.type === 'axe') ? 5 : 2;
            if (proj.type === 'whip') force = 3.5;
            if (proj.type === 'hadouken') force = 6;
            if (proj.type === 'note') force = 2;
            if (proj.type === 'summon') {
              const summonLvl = state.weapons.find((w: any) => w.type === 'summon')?.level || 1;
              force = summonLvl >= 4 ? 6.5 : 4.0;
            }
            enemy.knockbackX += Math.cos(angle) * force;
            enemy.knockbackY += Math.sin(angle) * force;

            // Damage Text Popup
            const textPopupColor = proj.type === 'summon' ? '#22c55e' : '#ffffff';
            state.floatingTexts.push({
              id: Math.random().toString(),
              text: `${Math.round(proj.damage)}`,
              x: enemy.x + (Math.random() - 0.5) * 15,
              y: enemy.y - 12,
              color: textPopupColor,
              duration: 30,
              size: 12,
            });
          }
        });
      }
    });

    // Remove expired or spent projectiles
    state.projectiles = state.projectiles.filter((p: Projectile) => p.duration > 0 && p.pierce > 0);

    // Update enemy projectiles
    if (state.enemyProjectiles) {
      const activeEP: any[] = [];
      state.enemyProjectiles.forEach((ep: any) => {
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.rotation += 0.08;
        ep.duration--;

        // Check contact hit on player
        const pDist = Math.sqrt((ep.x - state.player.x) ** 2 + (ep.y - state.player.y) ** 2);
        if (pDist < ep.size + state.player.radius) {
          if (state.player.invulnTimer <= 0) {
            const finalDamage = Math.max(1, ep.damage - state.player.stats.armor);
            state.player.stats.hp -= finalDamage;
            state.player.invulnTimer = 40;
            setPlayerHp(state.player.stats.hp);
            sfx.playHurt();

            // floating text
            state.floatingTexts.push({
              id: Math.random().toString(),
              text: `-${Math.round(finalDamage)}`,
              x: state.player.x,
              y: state.player.y - 25,
              color: '#f87171',
              duration: 40,
              size: 15,
            });

            if (state.player.stats.hp <= 0 && !state.isGameOverCalled) {
              state.isGameOverCalled = true;
              sfx.playGameOver();
              handleRunGameOver();
            }
          }
          // disappears on hitting player
          ep.duration = 0;
        }

        if (ep.duration > 0) {
          activeEP.push(ep);
        }
      });
      state.enemyProjectiles = activeEP;
    }

    // 4. ENEMIES UPDATES, PHYSICS & DAMAGE TO PLAYER
    state.enemies.forEach((enemy: Enemy) => {
      if (enemy.type === 'white_reaper') {
        enemy.knockbackX = 0;
        enemy.knockbackY = 0;
      }

      // Apply Decaying Knockbacks
      enemy.x += enemy.knockbackX;
      enemy.y += enemy.knockbackY;
      enemy.knockbackX *= 0.82;
      enemy.knockbackY *= 0.82;

      // Enemy Walks toward player
      const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
      const pDist = Math.sqrt((enemy.x - state.player.x) ** 2 + (enemy.y - state.player.y) ** 2);
      
      let moveSpeed = enemy.speed;
      let shouldMove = true;

      // --- WHITE REAPER AI MOVEMENT ---
      if (enemy.type === 'white_reaper') {
        // Direct, relentless movement towards player
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
        shouldMove = false;

        // Spawn black shadowy trail particles
        if (state.waveTimer % 3 === 0) {
          state.particles.push({
            x: enemy.x + (Math.random() - 0.5) * 15,
            y: enemy.y + (Math.random() - 0.5) * 15,
            vx: -Math.cos(angle) * 1.5,
            vy: -Math.sin(angle) * 1.5,
            size: 4 + Math.random() * 6,
            color: '#111827', // dark slate black
            opacity: 0.8,
            duration: 35,
          });
        }
      }

      // --- SKELETON AI: THROWS BONES REMOVED ---

      // --- WEREWOLF AI: DASH CHARGE ---
      if (enemy.type === 'werewolf') {
        if (enemy.chargeTimer === undefined) enemy.chargeTimer = 0;
        if (enemy.chargeCooldown === undefined) enemy.chargeCooldown = 120 + Math.random() * 80;
        
        if (enemy.chargeTimer > 0) {
          // Dash active! High speed
          enemy.chargeTimer--;
          moveSpeed = enemy.speed * 3.5;
          
          // Leave some cloud dust particles behind
          if (state.waveTimer % 5 === 0) {
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: -Math.cos(angle) * 1,
              vy: -Math.sin(angle) * 1,
              size: 3 + Math.random() * 3,
              color: 'rgba(202, 138, 4, 0.4)',
              opacity: 0.6,
              duration: 20,
            });
          }
        } else {
          enemy.chargeCooldown--;
          if (pDist < 200 && enemy.chargeCooldown <= 0) {
            // Trigger 35-frame lunge charge!
            sfx.playWhip(); // whoosh dash sound
            enemy.chargeTimer = 35;
            enemy.chargeCooldown = 140 + Math.random() * 60;
          }
        }
      }

      // --- ELITE VAMPIRE BOSS AI ---
      if (enemy.type === 'vampire_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 100;
        if (enemy.teleportTimer === undefined) enemy.teleportTimer = 300;
        
        enemy.shootCooldown--;
        enemy.teleportTimer--;

        // 1. Spiral Blood Orb Ring
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 200; // 3.3 seconds
          sfx.playFireball();
          
          const numOrbs = 8;
          for (let i = 0; i < numOrbs; i++) {
            const orbAngle = (i / numOrbs) * Math.PI * 2;
            const orbSpeed = 2.2;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(orbAngle) * orbSpeed,
              vy: Math.sin(orbAngle) * orbSpeed,
              size: 14,
              damage: enemy.damage * 0.9,
              color: '#ef4444',
              rotation: Math.random() * Math.PI,
              duration: 250,
              emoji: '🩸',
            });
          }
          
          // Spawn little red minions
          for (let m = 0; m < 2; m++) {
            const mAngle = Math.random() * Math.PI * 2;
            state.enemies.push({
              id: Math.random().toString(),
              type: 'bat',
              x: enemy.x + Math.cos(mAngle) * 30,
              y: enemy.y + Math.sin(mAngle) * 30,
              hp: 15,
              maxHp: 15,
              speed: 2.5,
              damage: 6,
              size: 10,
              color: '#dc2626',
              isBoss: false,
              scoreValue: 0,
              expValue: 0,
              goldChance: 0,
              animationFrame: Math.random() * 10,
              knockbackX: 0,
              knockbackY: 0,
            });
          }
        }

        // 2. Teleport Warning-Blast
        if (enemy.teleportTimer <= 0) {
          enemy.teleportTimer = 360 + Math.random() * 60; // 6-7s cooldown
          sfx.playLightningStrike();
          
          // Pick a random spot close to the player
          const tpAngle = Math.random() * Math.PI * 2;
          const tpX = state.player.x + Math.cos(tpAngle) * 100;
          const tpY = state.player.y + Math.sin(tpAngle) * 100;
          
          // Create bloody circle dynamic warning at the target
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: '⚡ BLOOD TELEPORT ⚠️',
            x: tpX,
            y: tpY - 20,
            color: '#dc2626',
            duration: 45,
            size: 12,
          });

          // Animation particles of boss disappearing
          for (let p = 0; p < 25; p++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 5;
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              size: 2 + Math.random() * 4,
              color: '#ef4444',
              opacity: 0.9,
              duration: 30,
            });
          }

          // Move the boss
          enemy.x = tpX;
          enemy.y = tpY;

          // Animation particles of boss appearing
          for (let p = 0; p < 25; p++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 5;
            state.particles.push({
              x: tpX,
              y: tpY,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              size: 2 + Math.random() * 4,
              color: '#f43f5e',
              opacity: 0.9,
              duration: 30,
            });
          }
        }
      }

      // --- MEDUSA BOSS AI (60s) ---
      if (enemy.type === 'medusa_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 90;
        enemy.shootCooldown--;

        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 150; // Every 2.5 seconds
          sfx.playLightningStrike(); // Crackle sound

          // Fires 3 snake/stone rays in a forward arc
          for (let i = -1; i <= 1; i++) {
            const bulletAngle = angle + (i * 0.25);
            const bSpeed = 2.0;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(bulletAngle) * bSpeed,
              vy: Math.sin(bulletAngle) * bSpeed,
              size: 15,
              damage: enemy.damage * 0.8,
              color: '#86efac',
              rotation: Math.random() * Math.PI,
              duration: 180,
              emoji: '👁️', // Gaze
            });
          }

          // Visual effect
          for (let p = 0; p < 15; p++) {
            const ang = Math.random() * Math.PI * 2;
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(ang) * 2,
              vy: Math.sin(ang) * 2,
              size: 2 + Math.random() * 3,
              color: '#22c55e',
              opacity: 0.8,
              duration: 25,
            });
          }
        }
      }

      // --- STONE GOLEM BOSS AI (120s) ---
      if (enemy.type === 'golem_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 120;
        enemy.shootCooldown--;

        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 180; // Every 3 seconds
          sfx.playLightningStrike(); // Heavy stomp sound

          // Stomp earthquake! Spawns 8 flying boulders outwards
          const boulderCount = 8;
          for (let i = 0; i < boulderCount; i++) {
            const bAngle = (i / boulderCount) * Math.PI * 2;
            const bSpeed = 1.6;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(bAngle) * bSpeed,
              vy: Math.sin(bAngle) * bSpeed,
              size: 18,
              damage: enemy.damage * 1.2, // Heavy DMG!
              color: '#93c5fd',
              rotation: Math.random() * Math.PI,
              duration: 200,
              emoji: '🪨',
            });
          }

          // Earth shockwave particles
          for (let p = 0; p < 30; p++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 0.5 + Math.random() * 4;
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              size: 4 + Math.random() * 4,
              color: '#3b82f6',
              opacity: 0.8,
              duration: 40,
            });
          }

          state.floatingTexts.push({
            id: Math.random().toString(),
            text: '💥 GOLEM CRUSH! 💥',
            x: enemy.x,
            y: enemy.y - 30,
            color: '#60a5fa',
            duration: 60,
            size: 12,
          });
        }
      }

      // --- DARK ARCHMAGE BOSS AI (180s) ---
      if (enemy.type === 'archmage_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 80;
        if (enemy.teleportTimer === undefined) enemy.teleportTimer = 220;
        
        enemy.shootCooldown--;
        enemy.teleportTimer--;

        // Magical starburst ring
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 140; // Every 2.3 seconds
          sfx.playFireball();

          const stars = 10;
          for (let i = 0; i < stars; i++) {
            const sAngle = (i / stars) * Math.PI * 2;
            const sSpeed = 2.4;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(sAngle) * sSpeed,
              vy: Math.sin(sAngle) * sSpeed,
              size: 14,
              damage: enemy.damage * 0.9,
              color: '#c084fc',
              rotation: Math.random() * Math.PI,
              duration: 220,
              emoji: '🔮',
            });
          }
        }

        // Archmage Teleportation
        if (enemy.teleportTimer <= 0) {
          enemy.teleportTimer = 250 + Math.random() * 80;
          sfx.playLightningStrike();

          const tpAngle = Math.random() * Math.PI * 2;
          const tpX = state.player.x + Math.cos(tpAngle) * 110;
          const tpY = state.player.y + Math.sin(tpAngle) * 110;

          state.floatingTexts.push({
            id: Math.random().toString(),
            text: '✨ PORTAL DISTORTION ✨',
            x: tpX,
            y: tpY - 20,
            color: '#a855f7',
            duration: 50,
            size: 12,
          });

          // Disappear sparks
          for (let p = 0; p < 20; p++) {
            const ang = Math.random() * Math.PI * 2;
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(ang) * 3,
              vy: Math.sin(ang) * 3,
              size: 2 + Math.random() * 4,
              color: '#d8b4fe',
              opacity: 0.9,
              duration: 35,
            });
          }

          enemy.x = tpX;
          enemy.y = tpY;

          // Reappear sparks
          for (let p = 0; p < 20; p++) {
            const ang = Math.random() * Math.PI * 2;
            state.particles.push({
              x: tpX,
              y: tpY,
              vx: Math.cos(ang) * 3,
              vy: Math.sin(ang) * 3,
              size: 2 + Math.random() * 4,
              color: '#c084fc',
              opacity: 0.9,
              duration: 35,
            });
          }
        }
      }

      // --- RED DRAGON BOSS AI (240s) ---
      if (enemy.type === 'dragon_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 60;
        enemy.shootCooldown--;

        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 110; // Every 1.8 seconds! Quite active
          sfx.playFireball();

          // Dragon flame breath cone
          for (let i = -2; i <= 2; i++) {
            const fAngle = angle + (i * 0.15);
            const fSpeed = 3.0 + Math.random() * 1.5;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(fAngle) * fSpeed,
              vy: Math.sin(fAngle) * fSpeed,
              size: 16,
              damage: enemy.damage * 0.85,
              color: '#f87171',
              rotation: Math.random() * Math.PI,
              duration: 120,
              emoji: '🔥',
            });
          }

          // Flame roar particles
          for (let p = 0; p < 25; p++) {
            const pAngle = angle + (Math.random() - 0.5) * 0.6;
            const pSpeed = 2 + Math.random() * 5;
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(pAngle) * pSpeed,
              vy: Math.sin(pAngle) * pSpeed,
              size: 3 + Math.random() * 6,
              color: '#ef4444',
              opacity: 0.9,
              duration: 30,
            });
          }
        }
      }

      // --- GENUINE PHOENIX BOSS AI (300s+) ---
      if (enemy.type === 'phoenix_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 50;
        if (enemy.chargeTimer === undefined) enemy.chargeTimer = 0;
        if (enemy.chargeCooldown === undefined) enemy.chargeCooldown = 100;

        enemy.shootCooldown--;

        // Fast spark lunge!
        if (enemy.chargeTimer > 0) {
          enemy.chargeTimer--;
          moveSpeed = enemy.speed * 2.8; // High speed flying

          if (state.waveTimer % 4 === 0) {
            state.particles.push({
              x: enemy.x,
              y: enemy.y,
              vx: -Math.cos(angle) * 2,
              vy: -Math.sin(angle) * 2,
              size: 4 + Math.random() * 5,
              color: '#f97316',
              opacity: 0.8,
              duration: 25,
            });
          }
        } else {
          enemy.chargeCooldown--;
          if (enemy.chargeCooldown <= 0) {
            enemy.chargeTimer = 45; // Lunge for 45 frames
            enemy.chargeCooldown = 120;
            sfx.playWhip();
          }
        }

        // Ring of sacred fire
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 90; // Active flame bursts
          sfx.playFireball();

          const fCount = 12;
          for (let i = 0; i < fCount; i++) {
            const frAngle = (i / fCount) * Math.PI * 2;
            const frSpeed = 2.5;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(frAngle) * frSpeed,
              vy: Math.sin(frAngle) * frSpeed,
              size: 15,
              damage: enemy.damage * 0.95,
              color: '#f97316',
              rotation: Math.random() * Math.PI,
              duration: 160,
              emoji: '✨',
            });
          }
        }
      }

      // --- GRIM REAPER BOSS AI: CONSTANT RAGE ---
      if (enemy.type === 'reaper') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 40;
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 45;
          sfx.playAxeThrow();
          // Reaper throws a lethal spinning scythe (emoji 🪓 or 🔮 as a dark core)
          const scAngle = angle + (Math.random() - 0.5) * 0.4;
          const scSpeed = 3.8;
          state.enemyProjectiles.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(scAngle) * scSpeed,
            vy: Math.sin(scAngle) * scSpeed,
            size: 20,
            damage: 60,
            color: '#dc2626',
            rotation: 0,
            duration: 300,
            emoji: '🪓', // Reusing axe styled or blade scythe
          });
        }
      }

      // --- DARK LORD BOSS AI: ULTIMATE APOCALYPSE ---
      if (enemy.type === 'dark_lord_boss') {
        if (enemy.shootCooldown === undefined) enemy.shootCooldown = 60;
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 110; // Around 1.8 seconds
          sfx.playLightningStrike();

          // Fire majestic spiral of 18 purple dark fireballs
          const fCount = 18;
          for (let i = 0; i < fCount; i++) {
            const frAngle = (i / fCount) * Math.PI * 2 + (state.waveTimer * 0.03);
            const frSpeed = 3.2;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(frAngle) * frSpeed,
              vy: Math.sin(frAngle) * frSpeed,
              size: 16,
              damage: enemy.damage * 0.7,
              color: '#a855f7', // Deep purple
              rotation: Math.random() * Math.PI,
              duration: 220,
              emoji: '🔥',
            });
          }

          // Triple targeted void orbs towards player
          for (let i = -1; i <= 1; i++) {
            const aimedAngle = angle + i * 0.22;
            const aimedSpeed = 4.0;
            state.enemyProjectiles.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(aimedAngle) * aimedSpeed,
              vy: Math.sin(aimedAngle) * aimedSpeed,
              size: 20,
              damage: enemy.damage * 1.1,
              color: '#4c1d95', // Rich Indigo
              rotation: 0,
              duration: 250,
              emoji: '🔮',
            });
          }
        }
      }

      if (shouldMove) {
        enemy.x += Math.cos(angle) * moveSpeed;
        enemy.y += Math.sin(angle) * moveSpeed;
      }

      // Animate walking
      enemy.animationFrame += (enemy.type === 'ghost' ? 0.05 : 0.1);

      // --- GHOST FLICKER & SPEED DRIFT ---
      if (enemy.type === 'ghost') {
        // Ghosts drift slightly from direct lines to feel floaty
        const yaw = Math.sin(state.waveTimer * 0.05) * 0.5;
        enemy.x += Math.cos(angle + Math.PI/2) * yaw;
        enemy.y += Math.sin(angle + Math.PI/2) * yaw;
      }

      // 3. Separation push (prevent clumped enemies)
      // Skip ghosts so ghosts float freely over arrays of zombies
      if (enemy.type !== 'ghost' && enemy.type !== 'white_reaper') {
        for (let j = 0; j < state.enemies.length; j++) {
          const other = state.enemies[j];
          if (other.id === enemy.id || other.type === 'ghost' || other.type === 'white_reaper') continue;
          const dxSep = enemy.x - other.x;
          const dySep = enemy.y - other.y;
          const distSepSq = dxSep * dxSep + dySep * dySep;
          const minDist = enemy.size + other.size;
          if (distSepSq < minDist * minDist) {
            const distSep = Math.sqrt(distSepSq);
            if (distSep > 0) {
              const overlap = minDist - distSep;
              enemy.x += (dxSep / distSep) * overlap * 0.22;
              enemy.y += (dySep / distSep) * overlap * 0.22;
            }
          }
        }
      }

      // Enemy contact vs Player Damage Check
      if (pDist < enemy.size + state.player.radius) {
        if (enemy.type === 'white_reaper') {
          if (state.whiteReaperTouchTimer === null) {
            state.whiteReaperTouchTimer = 60; // 1 second
            sfx.playGameOver(); // play ominous countdown melody
            state.floatingTexts.push({
              id: Math.random().toString(),
              text: '☠️ 死の宣告 (TOUCHED BY DEATH) ☠️',
              x: state.player.x,
              y: state.player.y - 100,
              color: '#ffffff',
              duration: 120,
              size: 20,
            });
          }
        } else if (state.player.invulnTimer <= 0) {
          // Calculate flat armor reduction
          const finalDamage = Math.max(1, enemy.damage - state.player.stats.armor);
          state.player.stats.hp -= finalDamage;
          state.player.invulnTimer = 40; // ~0.6 second invulnerability
          setPlayerHp(state.player.stats.hp);
          sfx.playHurt();

          // Camera shake effect or particles
          for (let p = 0; p < 8; p++) {
            state.particles.push({
              x: state.player.x,
              y: state.player.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              size: 3 + Math.random() * 3,
              color: '#ef4444', // blood red damage
              opacity: 1,
              duration: 25,
            });
          }

          // Damage Text Popup on Player
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: `-${Math.round(finalDamage)}`,
            x: state.player.x,
            y: state.player.y - 25,
            color: '#ef4444', // crimson red
            duration: 40,
            size: 16,
          });

          // Check Player Death
          if (state.player.stats.hp <= 0 && !state.isGameOverCalled) {
            state.isGameOverCalled = true;
            sfx.playGameOver();
            handleRunGameOver();
          }
        }
      }
    });

    // Handle defeated enemies, reward XP, Drop Gems
    const activeEnemies: Enemy[] = [];
    state.enemies.forEach((enemy: Enemy) => {
      if (enemy.type === 'white_reaper') {
        enemy.hp = enemy.maxHp; // Force absolute immortality
      }
      if (enemy.hp <= 0) {
        // ENEMY DEFEATED!
        state.stats.kills += 1;
        sfx.playEnemyDefeat(enemy.isBoss);

        // Explode defeat particles
        for (let p = 0; p < (enemy.isBoss ? 15 : 4); p++) {
          state.particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: 2 + Math.random() * 3,
            color: enemy.color,
            opacity: 0.9,
            duration: 25,
          });
        }

        // Spawn XP Gem/Pickup
        const rand = Math.random();

        // 5% chance to drop a treasure chest!
        if (Math.random() < 0.05) {
          state.gems.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            value: 0,
            color: '#f59e0b',
            isGold: false,
            isChest: true,
          });
        }

        if (enemy.isBoss) {
          if (enemy.type === 'dark_lord_boss') {
            // Ultimate victory trigger!
            state.darkLordDefeated = true;
            state.whiteReaperCountdown = 300; // 5 seconds at 60 FPS
            
            // Dramatic victory text
            state.floatingTexts.push({
              id: Math.random().toString(),
              text: '🏆 VICTORY! 魔王カオスロードを討伐した！',
              x: state.player.x,
              y: state.player.y - 120,
              color: '#fbbf24',
              duration: 250,
              size: 24,
            });

            state.floatingTexts.push({
              id: Math.random().toString(),
              text: '⌛ 5秒後に何かがやってくる...',
              x: state.player.x,
              y: state.player.y - 80,
              color: '#f87171',
              duration: 250,
              size: 16,
            });

            sfx.playLevelUp(); // Play level up sound as triumphant fanfare
            
            // Spawn tons of gold coins around the corpse as an ultimate reward
            for (let i = 0; i < 40; i++) {
              const theta = Math.random() * Math.PI * 2;
              const dist = 10 + Math.random() * 80;
              state.gems.push({
                id: Math.random().toString(),
                x: enemy.x + Math.cos(theta) * dist,
                y: enemy.y + Math.sin(theta) * dist,
                value: 50,
                color: '#eab308',
                isGold: true,
              });
            }
          } else {
            // Drop Chest containing Chicken heal asset or massive red chest item
            state.gems.push({
              id: Math.random().toString(),
              x: enemy.x,
              y: enemy.y,
              value: 0,
              color: '#ef4444', // beautiful gold chest chicken
              isGold: false,
              isChicken: true,
            });
            // Also drop magnet with 50% chance
            if (Math.random() < 0.5) {
              state.gems.push({
                id: Math.random().toString(),
                x: enemy.x + 20,
                y: enemy.y + 20,
                value: 0,
                color: '#a855f7',
                isGold: false,
                isMagnet: true,
              });
            } else {
              // Drop Holy bomb with 50% chance
              state.gems.push({
                id: Math.random().toString(),
                x: enemy.x - 20,
                y: enemy.y - 20,
                value: 0,
                color: '#fbbf24',
                isGold: false,
                isBomb: true,
              });
            }
          }
        } else if (rand < 0.05) {
          // Drop Roast Chicken (HP Recovery)
          state.gems.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            value: 0,
            color: '#f87171',
            isGold: false,
            isChicken: true,
          });
        } else if (rand < 0.12 && enemy.goldChance > 0) {
          // Drop gold coin!
          state.gems.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            value: Math.round(5 + Math.random() * 10),
            color: '#eab308', // gold yellow
            isGold: true,
          });
        } else {
          // Drop XP Gem
          let gemCol = '#60a5fa'; // Blue (1 exp)
          let gemVal = enemy.expValue;
          if (gemVal >= 5 && gemVal < 20) {
            gemCol = '#22c55e'; // Green (5 exp)
          } else if (gemVal >= 20) {
            gemCol = '#ef4444'; // Red (20+ exp)
          }

          state.gems.push({
            id: Math.random().toString(),
            x: enemy.x,
            y: enemy.y,
            value: gemVal,
            color: gemCol,
            isGold: false,
          });
        }
      } else {
        activeEnemies.push(enemy);
      }
    });
    state.enemies = activeEnemies;

    // 5. XP GEMS & COLLECTION MAGNET PHYSICS
    state.gems.forEach((gem: ExpGem) => {
      const gDist = Math.sqrt((gem.x - state.player.x) ** 2 + (gem.y - state.player.y) ** 2);
      const isAttracted = gem.isMagnet || gDist < state.player.stats.magnetRange;

      if (isAttracted) {
        // Pull item towards player smoothly
        const pullAngle = Math.atan2(state.player.y - gem.y, state.player.x - gem.x);
        // speed increases the closer they get
        const pullSpeed = Math.min(10, 2 + (120 / Math.max(1, gDist)) * 6);
        gem.x += Math.cos(pullAngle) * pullSpeed;
        gem.y += Math.sin(pullAngle) * pullSpeed;
      }

      // Collect gems check
      if (gDist < state.player.radius + 10) {
        if (gem.isChest) {
          handleChestPickup();
        } else if (gem.isChicken) {
          // Heals 30% or 30HP
          sfx.playChicken();
          state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + 35);
          setPlayerHp(state.player.stats.hp);
          // Green feedback text
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: '+35 HP',
            x: state.player.x,
            y: state.player.y - 25,
            color: '#4ade80',
            duration: 35,
            size: 13,
          });
        } else if (gem.isMagnet) {
          triggerMagnetVacuum();
        } else if (gem.isBomb) {
          triggerHolyBomb();
        } else if (gem.isGold) {
          // Collect Gold
          sfx.playExp();
          state.stats.gold += gem.value;
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: `+${gem.value}G`,
            x: gem.x,
            y: gem.y - 10,
            color: '#fbbf24',
            duration: 25,
            size: 11,
          });
        } else {
          // Collect Experience Gem
          sfx.playExp();
          state.stats.exp += gem.value;
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: `+${gem.value} XP`,
            x: gem.x,
            y: gem.y - 12,
            color: '#60a5fa',
            duration: 25,
            size: 11,
          });

          // Check continuous Level Up
          if (state.stats.exp >= state.stats.nextLevelExp) {
            triggerLevelUpTransition();
          }
        }
        // Flag gem null for clean filter
        gem.id = '';
      }
    });

    state.gems = state.gems.filter((g) => g.id !== '');

    // 6. FLOATING TEXTS & PARTICLES DECUMULATE TIMERS
    state.floatingTexts.forEach((ft) => {
      ft.duration--;
      ft.y -= 0.6; // Rise up
    });
    state.floatingTexts = state.floatingTexts.filter((ft) => ft.duration > 0);

    state.particles.forEach((p) => {
      p.duration--;
      p.x += p.vx;
      p.y += p.vy;
      // apply light friction speed decay
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.opacity = p.duration / (p.duration + 10);
    });
    state.particles = state.particles.filter((p) => p.duration > 0);

    // ================== RENDERING LOGIC ==================
    // Clear screen
    ctx.fillStyle = '#09090b'; // dark deep obsidian background
    ctx.fillRect(0, 0, width, height);

    // Dynamic Camera details
    const cx = state.camera.x;
    const cy = state.camera.y;

    // Draw scrolling background tile grids
    ctx.strokeStyle = '#18181b'; // dark slate grid lines
    ctx.lineWidth = 1;
    const gridSize = 80;
    const startX = Math.floor(cx / gridSize) * gridSize;
    const startY = Math.floor(cy / gridSize) * gridSize;

    // Outer render grid lines
    for (let gx = startX; gx < startX + width + gridSize; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx - cx, 0);
      ctx.lineTo(gx - cx, height);
      ctx.stroke();
    }
    for (let gy = startY; gy < startY + height + gridSize; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy - cy);
      ctx.lineTo(width, gy - cy);
      ctx.stroke();
    }

    // Occasional ground detail tiles to establish pixel atmosphere
    ctx.fillStyle = '#111115';
    for (let gx = startX; gx < startX + width + gridSize; gx += gridSize) {
      for (let gy = startY; gy < startY + height + gridSize; gy += gridSize) {
        // Pseudorandom scatter index
        const hash = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233)) * 43758.5453;
        if (hash % 100 < 5) {
          ctx.beginPath();
          ctx.arc(gx - cx + gridSize / 2, gy - cy + gridSize / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hash % 100 > 98) {
          // Draw tiny floor bone pile
          ctx.fillStyle = '#1c1917'; // stone bone-grey
          ctx.fillRect(gx - cx + 20, gy - cy + 20, 10, 5);
          ctx.fillRect(gx - cx + 25, gy - cy + 18, 5, 8);
          ctx.fillStyle = '#111115';
        }
      }
    }

    // 1. DRAW EXPERIENCE GEMS & PICKUPS
    state.gems.forEach((gem: ExpGem) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = gem.color;

      if (gem.isChest) {
        // Draw chest icon
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', gem.x - cx, gem.y - cy);
      } else if (gem.isChicken) {
        // Draw chicken icon text
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍗', gem.x - cx, gem.y - cy);
      } else if (gem.isMagnet) {
        // Draw magnet icon
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', gem.x - cx, gem.y - cy);
      } else if (gem.isBomb) {
        // Draw bomb icon
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', gem.x - cx, gem.y - cy);
      } else if (gem.isGold) {
        // Gold coin
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪙', gem.x - cx, gem.y - cy);
      } else {
        // Standard geometric 4-sided diamond gem
        const sz = 6;
        ctx.fillStyle = gem.color;
        ctx.beginPath();
        ctx.moveTo(gem.x - cx, gem.y - cy - sz);
        ctx.lineTo(gem.x - cx + sz, gem.y - cy);
        ctx.lineTo(gem.x - cx, gem.y - cy + sz);
        ctx.lineTo(gem.x - cx - sz, gem.y - cy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // 2. DRAW ENEMIES
    state.enemies.forEach((enemy: Enemy) => {
      const rx = enemy.x - cx;
      const ry = enemy.y - cy;

      // Draw active circular monster avatar
      ctx.save();
      ctx.shadowBlur = enemy.isBoss ? 15 : 0;
      ctx.shadowColor = enemy.color;

      // Slight wiggle animation
      const wiggle = Math.sin(enemy.animationFrame) * 3;

      // Check if image is ready and loaded
      const enemyImg = state.enemyImages[enemy.type];
      const isReadyImage = enemyImg && (
        (enemyImg instanceof HTMLImageElement && enemyImg.complete && enemyImg.naturalWidth > 0) ||
        (enemyImg instanceof HTMLCanvasElement && enemyImg.width > 0)
      );

      if (isReadyImage && enemyImg) {
        // Draw custom pixel art sprite centered
        // We scale the size slightly based on enemy radius to look proportional and majestic
        let sizeMultiplier = 3.8;
        if (enemy.type === 'werewolf') sizeMultiplier = 4.8;
        else if (enemy.type === 'dark_lord_boss') sizeMultiplier = 5.2; // Majestic giant size
        else if (enemy.type === 'white_reaper') sizeMultiplier = 4.8; // Great reaper size
        else if (enemy.isBoss) sizeMultiplier = 4.4;
        
        const drawW = enemy.size * sizeMultiplier;
        const drawH = enemy.size * sizeMultiplier;
        ctx.drawImage(enemyImg, rx - drawW / 2, ry + wiggle - drawH / 2, drawW, drawH);
      } else {
        // Fallback outer circle background
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(rx, ry, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // Enemy class text overlay decoration (Vampire bat / zombies)
        ctx.font = `${enemy.size * 2.1}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let monsterEmoji = 'BAT'; // fallback
        if (enemy.type === 'bat') monsterEmoji = '🦇';
        if (enemy.type === 'zombie') monsterEmoji = '🧟';
        if (enemy.type === 'ghost') monsterEmoji = '👻';
        if (enemy.type === 'skeleton') monsterEmoji = '💀';
        if (enemy.type === 'werewolf') monsterEmoji = '🐺';
        if (enemy.type === 'vampire_boss') monsterEmoji = '🧛';
        if (enemy.type === 'reaper') monsterEmoji = '👹';
        if (enemy.type === 'medusa_boss') monsterEmoji = '🐍';
        if (enemy.type === 'golem_boss') monsterEmoji = '🪨';
        if (enemy.type === 'archmage_boss') monsterEmoji = '🔮';
        if (enemy.type === 'dragon_boss') monsterEmoji = '🐉';
        if (enemy.type === 'phoenix_boss') monsterEmoji = '🔥';
        if (enemy.type === 'dark_lord_boss') monsterEmoji = '👑';
        if (enemy.type === 'white_reaper') monsterEmoji = '☠️';

        ctx.fillText(monsterEmoji, rx, ry + wiggle);
      }

      // Enemy HP Bar in Bosses
      if (enemy.isBoss && enemy.hp > 0 && enemy.type !== 'white_reaper') {
        const barW = enemy.size * 2;
        const barH = 4;
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(rx - barW / 2, ry - enemy.size - 8, barW, barH);
        
        ctx.fillStyle = '#ef4444'; // Red health
        const ratio = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillRect(rx - barW / 2, ry - enemy.size - 8, barW * ratio, barH);
      }

      ctx.restore();
    });

    // 3. DRAW BULLET PROJECTILES
    state.projectiles.forEach((proj: Projectile) => {
      const rx = proj.x - cx;
      const ry = proj.y - cy;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(proj.rotation);

      if (proj.type === 'whip') {
        const img = state.weaponImages['whip'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          ctx.save();
          const drawW = proj.size;
          const drawH = proj.size * 0.35;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        } else {
          // Draw whipping electric/energy slashing crescent arc
          ctx.strokeStyle = proj.color;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 3, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8'; // light sky blue details
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 3 + 3, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();
        }
      } else if (proj.type === 'fireball') {
        const img = state.weaponImages['fireball'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          const drawSize = proj.size * 1.8;
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          // Spinning fire drop
          ctx.font = '22px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔥', 0, 0);
        }
      } else if (proj.type === 'axe') {
        const img = state.weaponImages['axe'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          const drawSize = proj.size * 1.8;
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          // Spinning iron axe icon
          ctx.font = `${proj.size * 1.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🪓', 0, 0);
        }
      } else if (proj.type === 'bible') {
        const img = state.weaponImages['bible'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          const drawSize = proj.size * 1.6;
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          // Spinning glowing azure spell book
          ctx.font = `${proj.size * 1.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📖', 0, 0);
        }
      } else if (proj.type === 'lightning') {
        // Circular expanding lightning ring splash visual
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const animScale = (6 - proj.duration) / 6; // scale out
        ctx.arc(0, 0, proj.size * animScale, 0, Math.PI * 2);
        ctx.stroke();
      } else if (proj.type === 'hadouken') {
        const img = state.weaponImages['hadouken'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          const drawSize = proj.size * 1.8;
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.font = `${proj.size * 1.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌀', 0, 0);
        }
      } else if (proj.type === 'note') {
        const img = state.weaponImages['note'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );
        if (isReadyImage && img) {
          const drawSize = proj.size * 1.8;
          ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.font = `${proj.size * 1.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎵', 0, 0);
        }
      } else if (proj.type === 'summon') {
        // Glowing magic aura
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.size * 1.6);
        grad.addColorStop(0, 'rgba(34, 197, 94, 0.45)');
        grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, proj.size * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw custom pixel art dragon_boss if loaded
        const img = state.enemyImages['dragon_boss'];
        const isReadyImage = img && (
          (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
          (img instanceof HTMLCanvasElement && img.width > 0)
        );

        if (isReadyImage && img) {
          ctx.save();
          // The pixel art naturally faces left, scale horizontally so 0 degrees points right
          ctx.scale(-1, 1);
          const drawW = proj.size * 2.5;
          const drawH = proj.size * 2.5;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        } else {
          // Fallback with cute green dragon emoji
          ctx.font = `${proj.size * 1.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐉', 0, 0);
        }
      }

      ctx.restore();
    });

    // 3.5 DRAW ENEMY PROJECTILES
    if (state.enemyProjectiles) {
      state.enemyProjectiles.forEach((ep: any) => {
        const rx = ep.x - cx;
        const ry = ep.y - cy;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(ep.rotation);
        
        ctx.font = `${ep.size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ep.emoji, 0, 0);
        ctx.restore();
      });
    }

    // 4. DRAW PLAYER CHARACTER
    const px = state.player.x - cx;
    const py = state.player.y - cy;

    ctx.save();
    // Soft outer color shadow halo glows
    ctx.shadowBlur = 25;
    ctx.shadowColor = playerClass.color;

    // Outer shield circle if invulnerable
    if (state.player.invulnTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, state.player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Aura ring indicating magnet pick radius subtly is awesome!
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, state.player.stats.magnetRange, 0, Math.PI * 2);
    ctx.stroke();

    // Add heavy walking animation bobble
    const bobY = Math.abs(Math.sin(state.player.animationFrame)) * -4;

    const img = state.playerImgElement;
    const isReady = img && (
      (img instanceof HTMLImageElement && img.complete && img.naturalWidth !== 0) ||
      (img instanceof HTMLCanvasElement && img.width > 0)
    );
    if (isReady && img) {
      // Draw custom pixel art image centered over (px, py + bobY) with adjusted height
      const imgHeight = state.player.radius * 9.0; // Slightly smaller vertically as requested
      const imgWidth = state.player.radius * 8.5; 
      ctx.drawImage(img, px - imgWidth / 2, py + bobY - imgHeight / 2, imgWidth, imgHeight);
    } else {
      // Body fallback
      ctx.fillStyle = playerClass.color;
      ctx.beginPath();
      ctx.arc(px, py, state.player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Drawing the class emoji over center
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(playerClass.emoji, px, py + bobY - 2);
    }

    ctx.restore();

    // 4.5 DRAW GARLIC AURA Around Player
    const garlicWeaponState = state.weapons.find((w: any) => w.type === 'garlic');
    if (garlicWeaponState) {
      const radius = (65 + garlicWeaponState.level * 15) * state.player.stats.area;
      const img = state.weaponImages['garlic'];
      const isReadyImage = img && (
        (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0) ||
        (img instanceof HTMLCanvasElement && img.width > 0)
      );

      ctx.save();
      ctx.translate(px, py);
      // Slow rotation for vortex effect
      const rotationAngle = (state.waveTimer * 0.015) % (Math.PI * 2);
      ctx.rotate(rotationAngle);
      ctx.globalAlpha = 0.35 + Math.sin(state.waveTimer * 0.05) * 0.05; // pulsing effect

      if (isReadyImage && img) {
        ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
      } else {
        // Fallback: draw a beautiful glowing purple ring
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 4 + Math.sin(state.waveTimer * 0.05) * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // draw small glowing purple center aura
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. DRAW SYSTEM PARTICLES
    state.particles.forEach((p: Particle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cx, p.y - cy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. DRAW FLOATING DAMAGE NOTIFICATIONS & XP TEXTS
    state.floatingTexts.forEach((ft: FloatingText) => {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px Arial`;
      ctx.textAlign = 'center';
      
      // Shadow contrast offset
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, ft.x - cx + 1, ft.y - cy + 1);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x - cx, ft.y - cy);
      ctx.restore();
    });

    // 7. DRAW TOUCH JOYSTICK SYSTEM IF ACTIVE OR DRAGGED
    if (joy.active) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      
      // Draw outer circular base pad
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(joy.startX, joy.startY, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Draw inside stick pad representing intensity heading vector
      ctx.fillStyle = playerClass.color;
      ctx.beginPath();
      ctx.arc(joy.startX + joy.vx * 50, joy.startY + joy.vy * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const escalateSpawns = (state: any) => {
    // Escalate wave timer triggers and spawns based on elapsed time!
    const elapsedSeconds = state.stats.timeElapsed;
    state.enemySpawnAccumulator++;

    // Base spawning frequency: lower rate represents faster ticks (e.g. spawn every 40 ticks)
    let baseSpawnCheck = 35;
    if (elapsedSeconds > 60) baseSpawnCheck = 25; // Minute 1
    if (elapsedSeconds > 120) baseSpawnCheck = 18; // Minute 2
    if (elapsedSeconds > 180) baseSpawnCheck = 12; // Minute 3
    if (elapsedSeconds > 240) baseSpawnCheck = 8; // Minute 4

    if (state.enemySpawnAccumulator >= baseSpawnCheck) {
      state.enemySpawnAccumulator = 0;

      // Spawn more monsters depending on elapsed difficulty to dramatically increase density!
      const monsterCount = 3 + Math.floor(elapsedSeconds / 30);

      for (let i = 0; i < monsterCount; i++) {
        // Spawn distance outside camera circle boundaries
        const angle = Math.random() * Math.PI * 2;
        const outerRange = 400 + Math.random() * 100;
        const spawnX = state.player.x + Math.cos(angle) * outerRange;
        const spawnY = state.player.y + Math.sin(angle) * outerRange;

        // Choose class of enemy
        let enemyType: 'bat' | 'zombie' | 'ghost' | 'skeleton' | 'werewolf' = 'bat';
        let color = '#f87171'; // pale red bats
        let size = 12;
        let hp = 10 + elapsedSeconds * 0.4;
        let damage = 5 + elapsedSeconds * 0.15;
        let speed = 1.3 + Math.random() * 0.4;
        let expValue = 1;

        if (elapsedSeconds < 45) {
          // Zone 0: mostly Bats and Zombies
          if (Math.random() < 0.4) {
            enemyType = 'zombie';
            color = '#10b981'; // green zombie
            hp *= 1.8;
            speed = 0.8;
            damage *= 1.5;
            expValue = 1;
          }
        } else if (elapsedSeconds >= 45 && elapsedSeconds < 120) {
          // Zone 1: Intro Ghosts and Skeletons
          const r = Math.random();
          if (r < 0.45) {
            enemyType = 'zombie';
            color = '#4ade80';
            hp *= 1.8;
            speed = 0.9;
            damage *= 1.5;
            expValue = 1;
          } else if (r >= 0.45 && r < 0.8) {
            enemyType = 'skeleton';
            color = '#e2e8f0'; // white skeleton
            hp *= 1.4;
            speed = 1.1;
            damage *= 1.2;
            expValue = 2; // Green gem
          } else {
            enemyType = 'ghost';
            color = '#a5b4fc'; // purple specter
            hp *= 0.8;
            speed = 1.9; // Fast ghostly
            damage *= 0.8;
            expValue = 1;
          }
        } else {
          // Zone 2 (Over 2 minutes): Addition of heavy Werewolves
          const r = Math.random();
          if (r < 0.3) {
            enemyType = 'ghost';
            color = '#b8a5fc';
            hp *= 0.9;
            speed = 2.1;
            expValue = 1;
          } else if (r >= 0.3 && r < 0.75) {
            enemyType = 'skeleton';
            color = '#cbd5e1';
            hp *= 2.0;
            speed = 1.2;
            expValue = 2;
          } else {
            enemyType = 'werewolf';
            color = '#ca8a04'; // dark yellow hunter hound
            hp *= 3.8;
            size = 18;
            speed = 1.5;
            damage *= 2.0;
            expValue = 5; // Direct Green Gem!
          }
        }

        state.enemies.push({
          id: Math.random().toString(),
          type: enemyType,
          x: spawnX,
          y: spawnY,
          hp: hp,
          maxHp: hp,
          speed: speed,
          damage: damage,
          size: size,
          color: color,
          isBoss: false,
          scoreValue: 10,
          expValue: expValue,
          goldChance: 0.15,
          animationFrame: Math.random() * 10,
          knockbackX: 0,
          knockbackY: 0,
        });
      }
    }

    // Spawn additional enemies every 6 seconds, scaling with player level (leveling up twice adds +2 enemies)
    if (elapsedSeconds > 0 && elapsedSeconds % 6 === 0) {
      const spawnCount = 5 + Math.floor((state.stats.level - 1) / 2) * 2;
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const outerRange = 400 + Math.random() * 100;
        const spawnX = state.player.x + Math.cos(angle) * outerRange;
        const spawnY = state.player.y + Math.sin(angle) * outerRange;

        let enemyType: 'bat' | 'zombie' | 'ghost' | 'skeleton' | 'werewolf' = 'bat';
        let color = '#f87171';
        let size = 12;
        let hp = 10 + elapsedSeconds * 0.4;
        let damage = 5 + elapsedSeconds * 0.15;
        let speed = 1.3 + Math.random() * 0.4;
        let expValue = 1;

        if (elapsedSeconds < 45) {
          if (Math.random() < 0.4) {
            enemyType = 'zombie';
            color = '#10b981';
            hp *= 1.8;
            speed = 0.8;
            damage *= 1.5;
            expValue = 1;
          }
        } else if (elapsedSeconds >= 45 && elapsedSeconds < 120) {
          const r = Math.random();
          if (r < 0.45) {
            enemyType = 'zombie';
            color = '#4ade80';
            hp *= 1.8;
            speed = 0.9;
            damage *= 1.5;
            expValue = 1;
          } else if (r >= 0.45 && r < 0.8) {
            enemyType = 'skeleton';
            color = '#e2e8f0';
            hp *= 1.4;
            speed = 1.1;
            damage *= 1.2;
            expValue = 2;
          } else {
            enemyType = 'ghost';
            color = '#a5b4fc';
            hp *= 0.8;
            speed = 1.9;
            damage *= 0.8;
            expValue = 1;
          }
        } else {
          const r = Math.random();
          if (r < 0.3) {
            enemyType = 'ghost';
            color = '#b8a5fc';
            hp *= 0.9;
            speed = 2.1;
            expValue = 1;
          } else if (r >= 0.3 && r < 0.75) {
            enemyType = 'skeleton';
            color = '#cbd5e1';
            hp *= 2.0;
            speed = 1.2;
            expValue = 2;
          } else {
            enemyType = 'werewolf';
            color = '#ca8a04';
            hp *= 3.8;
            size = 18;
            speed = 1.5;
            damage *= 2.0;
            expValue = 5;
          }
        }

        state.enemies.push({
          id: Math.random().toString(),
          type: enemyType,
          x: spawnX,
          y: spawnY,
          hp: hp,
          maxHp: hp,
          speed: speed,
          damage: damage,
          size: size,
          color: color,
          isBoss: false,
          scoreValue: 10,
          expValue: expValue,
          goldChance: 0.15,
          animationFrame: Math.random() * 10,
          knockbackX: 0,
          knockbackY: 0,
        });
      }

      state.floatingTexts.push({
        id: Math.random().toString(),
        text: `💀 6秒毎の増援 +${spawnCount} 体！ 💀`,
        x: state.player.x,
        y: state.player.y - 100,
        color: '#fbbf24',
        duration: 80,
        size: 15,
      });
    }

    // Spawn minibosses at designated times (e.g. every 60 seconds / 1 minute)
    if (elapsedSeconds > 0 && elapsedSeconds % 60 === 0 && state.waveTimer % 60 === 0) {
      const minuteIndex = Math.floor(elapsedSeconds / 60);
      const angle = Math.random() * Math.PI * 2;
      const spawnX = state.player.x + Math.cos(angle) * 350;
      const spawnY = state.player.y + Math.sin(angle) * 350;

      let bossType: 'medusa_boss' | 'golem_boss' | 'archmage_boss' | 'dragon_boss' | 'phoenix_boss' | 'vampire_boss' = 'medusa_boss';
      let bossName = '【深淵の妖女】メデューサ';
      let bossHp = 1500; // Increased from 400
      let bossSpeed = 1.1;
      let bossDamage = 18;
      let bossSize = 28;
      let bossColor = '#4ade80';

      if (minuteIndex === 2) {
        bossType = 'golem_boss';
        bossName = '【古代の巨神】ゴーレム';
        bossHp = 3000; // Increased from 800
        bossSpeed = 0.8;
        bossDamage = 28;
        bossSize = 34;
        bossColor = '#60a5fa';
      } else if (minuteIndex === 3) {
        bossType = 'archmage_boss';
        bossName = '【魔界の覇王】アークメイジ';
        bossHp = 2500; // Increased from 650
        bossSpeed = 1.2;
        bossDamage = 24;
        bossSize = 28;
        bossColor = '#c084fc';
      } else if (minuteIndex === 4) {
        bossType = 'dragon_boss';
        bossName = '【煉獄の滅竜】レッドドラゴン';
        bossHp = 4500; // Increased from 1250
        bossSpeed = 1.4;
        bossDamage = 34;
        bossSize = 36;
        bossColor = '#f87171';
      } else if (minuteIndex >= 5) {
        bossType = 'phoenix_boss';
        bossName = '【不死の極炎】フェニックス';
        bossHp = 4000; // Increased from 1000
        bossSpeed = 1.8;
        bossDamage = 30;
        bossSize = 32;
        bossColor = '#f97316';
      }

      state.enemies.push({
        id: Math.random().toString(),
        type: bossType,
        x: spawnX,
        y: spawnY,
        hp: bossHp + elapsedSeconds * 10, // Increased scaling multiplier from 2 to 10
        maxHp: bossHp + elapsedSeconds * 10,
        speed: bossSpeed,
        damage: bossDamage + elapsedSeconds * 0.1,
        size: bossSize,
        color: bossColor,
        isBoss: true,
        scoreValue: 1000,
        expValue: 30, // MASSIVE red gem drop
        goldChance: 1.0, // Guaranteed massive gold!
        animationFrame: 0,
        knockbackX: 0,
        knockbackY: 0,
      });

      // Announce boss warning
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: `⚠️ Boss: ${bossName} 出現！`,
        x: state.player.x,
        y: state.player.y - 65,
        color: bossColor,
        duration: 120,
        size: 16,
      });
    }

    // Spawn final unstoppable Grim Reaper 「死神」 over 5 minutes to challenge endgame boundaries!
    if (elapsedSeconds >= 300 && !state.reaperSpawned) {
      state.reaperSpawned = true;
      const angle = Math.random() * Math.PI * 2;
      const spawnX = state.player.x + Math.cos(angle) * 380;
      const spawnY = state.player.y + Math.sin(angle) * 380;

      state.enemies.push({
        id: Math.random().toString(),
        type: 'reaper',
        x: spawnX,
        y: spawnY,
        hp: 999999, // Near-impossible health! (Increased from 99999)
        maxHp: 999999,
        speed: 1.6,
        damage: 150, // Massive blow
        size: 32,
        color: '#dc2626', // extreme red
        isBoss: true,
        scoreValue: 5000,
        expValue: 200,
        goldChance: 1.0,
        animationFrame: 0,
        knockbackX: 0,
        knockbackY: 0,
      });

      state.floatingTexts.push({
        id: Math.random().toString(),
        text: '💀 終焉の死神が降臨。最後の審判を生き延びろ！',
        x: state.player.x,
        y: state.player.y - 75,
        color: '#dc2626',
        duration: 150,
        size: 16,
      });
    }

    // Spawn Ultimate Final Boss: Dark Lord 「【混沌の支配者】カオスロード」 at 10 minutes (600s)!
    if (elapsedSeconds >= 600 && !state.darkLordSpawned) {
      state.darkLordSpawned = true;
      
      // Dramatic event: wipe out all minor enemies to prepare for the ultimate duel!
      state.enemies = state.enemies.filter((e: any) => e.isBoss && e.type !== 'reaper');

      const angle = Math.random() * Math.PI * 2;
      const spawnX = state.player.x + Math.cos(angle) * 320;
      const spawnY = state.player.y + Math.sin(angle) * 320;

      state.enemies.push({
        id: Math.random().toString(),
        type: 'dark_lord_boss',
        x: spawnX,
        y: spawnY,
        hp: 400000, // Balanced majestic final boss HP
        maxHp: 400000,
        speed: 1.0, // Slow but immense presence
        damage: 85, // Heavy hitting
        size: 45, // Extremely large
        color: '#c084fc', // purple majestic aura
        isBoss: true,
        scoreValue: 50000,
        expValue: 500,
        goldChance: 1.0,
        animationFrame: 0,
        knockbackX: 0,
        knockbackY: 0,
      });

      state.floatingTexts.push({
        id: Math.random().toString(),
        text: '👑 警告: 【混沌の支配者】カオスロード 降臨！ 👑',
        x: state.player.x,
        y: state.player.y - 80,
        color: '#c084fc',
        duration: 200,
        size: 18,
      });

      // Big warp burst
      for (let i = 0; i < 30; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pSpeed = 2 + Math.random() * 8;
        state.particles.push({
          x: state.player.x,
          y: state.player.y,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          size: 4 + Math.random() * 5,
          color: '#c084fc',
          opacity: 0.9,
          duration: 40,
        });
      }
    }
  };

  const handleRunGameOver = () => {
    const finalStats = { ...stateRef.current.stats };
    // Trigger onGameOver back to app after a brief dramatic delay
    setTimeout(() => {
      onGameOver(finalStats);
    }, 1500);
  };

  const handleManualPause = () => {
    sfx.playSelect();
    const nextPaused = !stateRef.current.isPaused;
    stateRef.current.isPaused = nextPaused;
    setIsPaused(nextPaused);
  };

  const formatTimerVal = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none" ref={containerRef}>
      {/* Top HUD Metrics Bar */}
      <div className="bg-zinc-950/95 border-b border-zinc-800 p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono z-30">
        
        {/* Left corner: Level & EXP meters */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            LV.{hudStats.level}
          </span>
          
          {/* XP Bar */}
          <div className="flex flex-col min-w-[140px] md:min-w-[200px]">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5 font-bold">
              <span>EXP {hudStats.exp} / {hudStats.nextLevelExp}</span>
              <span>{Math.round((hudStats.exp / hudStats.nextLevelExp) * 100)}%</span>
            </div>
            <div className="bg-zinc-900 h-2.5 rounded-full border border-zinc-800 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (hudStats.exp / hudStats.nextLevelExp) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Weapons Inventory Tray */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 justify-start md:justify-center mx-2 max-w-full">
          {weaponsList.map((wl, idx) => (
            <div key={`w-${idx}`} className="flex items-center bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1 rounded-xl shrink-0 text-xs">
              <span className="flex items-center justify-center w-5 h-5 mr-1.5" title={wl.type}>
                {wl.type === 'whip' && <img src={whipImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Whip" />}
                {wl.type === 'fireball' && <img src={fireballImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Fireball" />}
                {wl.type === 'garlic' && <img src={garlicImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Garlic" />}
                {wl.type === 'axe' && <img src={axeImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Axe" />}
                {wl.type === 'bible' && <img src={bibleImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Bible" />}
                {wl.type === 'lightning' && <span className="text-sm">⚡</span>}
                {wl.type === 'hadouken' && <img src={hadoukenImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Hadouken" />}
                {wl.type === 'note' && <img src={noteImage} className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" alt="Note" />}
                {wl.type === 'summon' && <span className="text-sm">🐉</span>}
              </span>
              <span className="font-bold text-zinc-300 text-[10px]">L.{wl.level}</span>
            </div>
          ))}
          {passivesList.map((pl, idx) => (
            <div key={`p-${idx}`} className="flex items-center bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1 rounded-xl shrink-0 text-xs">
              <span className="text-sm mr-1.5" title={pl.type}>
                {pl.type === 'might' && <Swords size={12} className="inline text-amber-500" />}
                {pl.type === 'armor' && <Shield size={12} className="inline text-blue-500" />}
                {pl.type === 'speed' && <Zap size={12} className="inline text-emerald-500" />}
                {pl.type === 'magnet' && <Award size={12} className="inline text-purple-500" />}
                {pl.type === 'maxHp' && <Heart size={12} className="inline text-red-500" />}
                {pl.type === 'cooldown' && <Clock size={12} className="inline text-cyan-500" />}
              </span>
              <span className="font-bold text-zinc-300 text-[10px]">L.{pl.level}</span>
            </div>
          ))}
        </div>

        {/* Right side: Timer, Kills, Gold & Sounds */}
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 font-bold">
          {/* Time timer */}
          <div className="flex items-center gap-1.5 text-zinc-100 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800/60 text-sm">
            <Timer size={14} className="text-emerald-400" />
            <span>{formatTimerVal(hudStats.timeElapsed)}</span>
          </div>

          {/* Kills */}
          <div className="flex items-center gap-1.5 text-zinc-100 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800/60 text-sm">
            <Skull size={14} className="text-rose-500" />
            <span>{hudStats.kills}</span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-1.5 text-yellow-400 bg-zinc-900 px-3 py-1 rounded-lg border border-yellow-500/20 text-sm">
            <Coins size={14} className="text-yellow-400" />
            <span>{hudStats.gold}g</span>
          </div>

          {/* Controls toggle */}
          <div className="flex items-center gap-1">
            <button
              id="btn-sound-toggle"
              onClick={handleToggleMute}
              className="p-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer border border-zinc-800 outline-none hover:border-zinc-700"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              id="btn-manual-pause"
              onClick={handleManualPause}
              className="p-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 cursor-pointer border border-zinc-800 outline-none hover:border-zinc-700 font-sans"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Stage Wrapper */}
      <div className="relative flex-1 bg-zinc-950 overflow-hidden cursor-crosshair">
        
        {/* HTML Canvas Element */}
        <canvas
          id="active-game-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Float Player HP Bar on bottom left overlay too */}
        <div className="absolute bottom-5 left-5 bg-zinc-950/80 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow z-20">
          <Heart size={20} className="text-red-500 animate-pulse shrink-0" />
          <div className="flex flex-col min-w-[100px]">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">HP STATUS</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-zinc-100">
                {Math.max(0, playerHp)} / {hudStats.level > 1 ? stateRef.current.player.stats.maxHp : playerClass.baseStats.maxHp}
              </span>
              <div className="flex-1 bg-zinc-900 border border-zinc-800 h-2 rounded-full overflow-hidden w-24">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (playerHp / (stateRef.current.player.stats.maxHp || playerClass.baseStats.maxHp)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard instructions panel floating */}
        <div className="hidden md:block absolute bottom-5 right-5 bg-zinc-950/40 border border-zinc-900/50 px-3 py-1.5 rounded-xl font-mono text-[10px] text-zinc-500">
          <span>MOVE: WASD / ARROWS, OR MOUSE CLICK-DRAG</span>
        </div>

        {/* Level Up selection Modal */}
        <AnimatePresence>
          {showLevelUp && (
            <UpgradeScreen
              options={levelUpOptions}
              onSelect={handleUpgradeSelected}
            />
          )}
        </AnimatePresence>

        {/* Chest reward screen Modal */}
        <AnimatePresence>
          {showChest && (
            <ChestScreen
              upgrades={chestAwards}
              count={chestUpgradeCount}
              onClose={() => {
                setShowChest(false);
                stateRef.current.showChest = false;
                // Only unpause if standard pause is not active
                if (!isPaused) {
                  stateRef.current.isPaused = false;
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Game Paused Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
            >
              <div className="text-center px-4">
                <h2 className="text-3xl font-black font-mono tracking-widest text-zinc-100 uppercase mb-2">GAME PAUSED</h2>
                <p className="text-zinc-500 text-xs font-mono mb-6">一時停止中。ボタンを押すかクリックで再開します。</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleManualPause}
                    className="w-40 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-black rounded-xl cursor-pointer text-xs transition-colors"
                  >
                    ゲームを再開
                  </motion.button>
                  <motion.button
                    id="btn-paused-title-return"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      sfx.playSelect();
                      onBackToTitle();
                    }}
                    className="w-40 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold rounded-xl cursor-pointer text-xs transition-colors"
                  >
                    タイトルに戻る
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
