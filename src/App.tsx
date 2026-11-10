/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Sword,
  Wand2,
  Scroll,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Crown,
  MapPin,
  Heart,
  BookOpen,
  Feather,
  Compass,
  Image as ImageIcon,
  FlaskConical,
  Zap,
  BookmarkPlus,
  Trash2,
  Layers,
} from 'lucide-react';

export interface CardStats {
  health: number;
  mana: number;
  strength: number;
}

export interface FantasyCharacter {
  id: string;
  name: string;
  class: string;
  title: string;
  race: string;
  origin: string;
  alignment: string;
  signatureItem: string;
  stats: CardStats;
  createdAt: string;
}

export interface DeckCard {
  id: string;
  name: string;
  class: string;
  title: string;
  race: string;
  origin: string;
  stats: CardStats;
  portraitUrl: string | null;
  backstory: string | null;
  savedAt: string;
}

export default function App() {
  const [character, setCharacter] = useState<FantasyCharacter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Backstory feature state
  const [backstory, setBackstory] = useState<string | null>(null);
  const [isBackstoryLoading, setIsBackstoryLoading] = useState<boolean>(false);
  const [backstoryError, setBackstoryError] = useState<string | null>(null);

  // Portrait feature state
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [isPortraitLoading, setIsPortraitLoading] = useState<boolean>(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitVariation, setPortraitVariation] = useState<number>(0);

  // "My Deck" saved cards list
  const [deck, setDeck] = useState<DeckCard[]>(() => {
    try {
      const saved = localStorage.getItem('alchemist_rpg_deck');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Save deck to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alchemist_rpg_deck', JSON.stringify(deck));
    } catch {
      // LocalStorage error handled quietly
    }
  }, [deck]);

  const generateCharacter = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);
    setJustSaved(false);

    // Clear backstory and portrait when a new character is generated
    setBackstory(null);
    setBackstoryError(null);
    setIsBackstoryLoading(false);

    setPortraitUrl(null);
    setPortraitError(null);
    setIsPortraitLoading(false);
    setPortraitVariation(0);

    try {
      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to divine fantasy character from the alchemical crucible.');
      }

      const rawChar = data.character;

      // Ensure randomly generated stats for Health, Mana, and Strength (new random numbers 1 to 100 for each new character)
      const randomStats: CardStats = {
        health: rawChar.stats?.health || Math.floor(Math.random() * 100) + 1,
        mana: rawChar.stats?.mana || Math.floor(Math.random() * 100) + 1,
        strength: rawChar.stats?.strength || Math.floor(Math.random() * 100) + 1,
      };

      const newChar: FantasyCharacter = {
        ...rawChar,
        stats: randomStats,
      };

      setCharacter(newChar);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(
        err.message || 'An unexpected error occurred while communicating with the Gemini API. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBackstory = async () => {
    if (!character || isBackstoryLoading) return;

    setIsBackstoryLoading(true);
    setBackstoryError(null);

    try {
      const response = await fetch('/api/generate-backstory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character.name,
          className: character.class,
          race: character.race,
          title: character.title,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.backstory) {
        throw new Error(data.error || 'Failed to inscribe backstory with Gemini API.');
      }

      setBackstory(data.backstory);
    } catch (err: any) {
      console.error('Backstory generation error:', err);
      setBackstoryError(
        err.message || 'Failed to divine character origin story. Please try again.'
      );
    } finally {
      setIsBackstoryLoading(false);
    }
  };

  const handleGeneratePortrait = async (isRegenerate: boolean = false) => {
    if (!character || isPortraitLoading) return;

    setIsPortraitLoading(true);
    setPortraitError(null);

    const nextVariation = isRegenerate ? portraitVariation + 1 : 0;
    setPortraitVariation(nextVariation);

    try {
      const response = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character.name,
          className: character.class,
          race: character.race,
          title: character.title,
          signatureItem: character.signatureItem,
          variation: nextVariation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to distill character portrait with Gemini API.');
      }

      setPortraitUrl(data.imageUrl);
    } catch (err: any) {
      console.error('Portrait error:', err);
      setPortraitError(
        err.message || 'Failed to distill character portrait. Please try again.'
      );
    } finally {
      setIsPortraitLoading(false);
    }
  };

  const saveToDeck = () => {
    if (!character) return;

    const newCard: DeckCard = {
      id: `deck_${character.id}_${Date.now()}`,
      name: character.name,
      class: character.class,
      title: character.title,
      race: character.race,
      origin: character.origin,
      stats: { ...character.stats },
      portraitUrl: portraitUrl,
      backstory: backstory,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDeck((prev) => [newCard, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const removeFromDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeck((prev) => prev.filter((c) => c.id !== id));
  };

  const loadFromDeck = (card: DeckCard) => {
    setCharacter({
      id: card.id,
      name: card.name,
      class: card.class,
      title: card.title,
      race: card.race,
      origin: card.origin,
      alignment: 'Saved Adventurer',
      signatureItem: 'Guild Relic',
      stats: card.stats,
      createdAt: card.savedAt,
    });
    setPortraitUrl(card.portraitUrl);
    setBackstory(card.backstory);
    setPortraitError(null);
    setBackstoryError(null);
  };

  const copyCharacterSheet = () => {
    if (!character) return;
    const text = `RPG Trading Card:
Name: ${character.name}
Class: ${character.class}
Title: ${character.title}
Race: ${character.race}
Stats:
- Health: ${character.stats.health}/100
- Mana: ${character.stats.mana}/100
- Strength: ${character.stats.strength}/100
${backstory ? `Origin Story: ${backstory}\n` : ''}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClassTheme = (className: string) => {
    const c = className.toLowerCase();
    if (c.includes('mage') || c.includes('wizard') || c.includes('sorcerer') || c.includes('warlock')) {
      return {
        accent: 'text-purple-300',
        badgeBg: 'bg-[#29172f]',
        border: 'border-purple-600/40',
        icon: Wand2,
      };
    }
    if (c.includes('rogue') || c.includes('thief') || c.includes('assassin') || c.includes('shadow')) {
      return {
        accent: 'text-emerald-300',
        badgeBg: 'bg-[#15291e]',
        border: 'border-emerald-600/40',
        icon: Feather,
      };
    }
    if (c.includes('paladin') || c.includes('cleric')) {
      return {
        accent: 'text-amber-200',
        badgeBg: 'bg-[#2e2311]',
        border: 'border-amber-500/50',
        icon: Shield,
      };
    }
    if (c.includes('ranger') || c.includes('druid') || c.includes('hunter')) {
      return {
        accent: 'text-lime-300',
        badgeBg: 'bg-[#1e2b14]',
        border: 'border-lime-600/40',
        icon: Feather,
      };
    }
    return {
      accent: 'text-rose-300',
      badgeBg: 'bg-[#2d1612]',
      border: 'border-rose-600/40',
      icon: Sword,
    };
  };

  const theme = character ? getClassTheme(character.class) : getClassTheme('warrior');
  const ClassIcon = theme.icon;

  return (
    <div className="min-h-screen workbench-bg text-[#f3ebd4] flex flex-col justify-between selection:bg-amber-600/30 selection:text-amber-200">
      {/* Alchemist's Workbench Tabletop Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/15 via-amber-700/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-[450px] h-[450px] bg-yellow-700/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-amber-900/15 blur-3xl rounded-full" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center">
        {/* Ancient Alchemist's Header */}
        <header className="text-center mb-7 sm:mb-8 w-full">
          <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-[#1e150d] border border-amber-600/40 text-amber-300 text-xs font-cinzel tracking-widest uppercase shadow-md shadow-black/60">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Alchemist Trading Card Forge</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <span className="text-amber-400/80 text-[10px]">Gemini 3.8</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-cinzel tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fef3c7] via-[#f59e0b] to-[#b45309] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Fantasy Character Creator
          </h1>

          <p className="mt-2 text-sm text-[#c7b299] max-w-lg mx-auto font-serif italic">
            Forge an RPG trading card with randomized stats, custom cartoon portrait, and divined origin lore.
          </p>

          {/* Core Action Button: Exactly one button labeled "Generate Character" */}
          <div className="mt-5 flex flex-col items-center justify-center">
            <button
              id="generate-character-btn"
              onClick={generateCharacter}
              disabled={isLoading}
              className={`relative inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-cinzel font-bold text-base tracking-wider uppercase transition-all duration-200 cursor-pointer border border-[#d4af37]/60 shadow-[0_4px_20px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.3)] ${
                isLoading
                  ? 'bg-[#3d2716] text-amber-200/60 cursor-not-allowed scale-[0.99] border-amber-800'
                  : 'bg-gradient-to-b from-[#b8860b] via-[#8c591b] to-[#5a390e] hover:from-[#d4af37] hover:via-[#a06820] hover:to-[#6d4411] text-[#fef9c3] hover:shadow-[0_0_25px_rgba(217,119,6,0.45)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                  <span>Generate Character</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Character</span>
                </>
              )}
            </button>

            {isLoading && (
              <p className="mt-2.5 text-xs text-amber-300/90 font-cinzel tracking-wider animate-pulse">
                Transmuting card attributes & traits...
              </p>
            )}
          </div>
        </header>

        {/* Error Notification Alert */}
        {error && (
          <div className="w-full max-w-lg mb-6 p-4 rounded-xl bg-[#2a130f] border border-red-800/60 flex items-start gap-3 text-red-200 shadow-xl">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-cinzel font-semibold text-red-300">Crucible Flaw (Error)</p>
              <p className="mt-1 text-red-200/90 font-serif">{error}</p>
              <button
                onClick={generateCharacter}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-cinzel font-medium bg-red-900/40 hover:bg-red-800/50 text-red-200 border border-red-700/50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Incantation
              </button>
            </div>
          </div>
        )}

        {/* Empty State before any character is generated */}
        {!character && !isLoading && !error && (
          <div className="w-full max-w-md rounded-2xl parchment-sheet alchemist-border p-8 text-center backdrop-blur-sm relative overflow-hidden my-4 shadow-2xl">
            <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#b8860b]/60" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#b8860b]/60" />
            <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#b8860b]/60" />
            <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#b8860b]/60" />

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#170f09] border border-amber-600/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-cinzel font-bold text-amber-200">Empty Trading Card Slot</h3>
            <p className="mt-2 text-sm text-[#baa58d] max-w-sm mx-auto font-serif">
              Click <span className="text-amber-300 font-semibold font-cinzel">"Generate Character"</span> above to craft an original RPG trading card with randomized stats, artwork, and lore.
            </p>
          </div>
        )}

        {/* SINGLE BORDERED PLAYER CARD: Formatted like an RPG Trading Card */}
        {character && (
          <div className="w-full max-w-md sm:max-w-lg mb-10">
            <div
              id="player-trading-card"
              className="relative rounded-2xl parchment-sheet alchemist-border p-5 sm:p-6 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.95)] border-2 border-[#b8860b]/80 transition-all duration-300 overflow-hidden"
            >
              {/* Outer Trading Card Ornate Brass Filigree Corners */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#d4af37] pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#d4af37] pointer-events-none" />

              {/* Card Top Header Banner */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#5e3b1c]/80 text-xs">
                <div className="flex items-center gap-1.5 text-[#baa58d] font-cinzel">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate max-w-[200px] text-amber-200/90">{character.title}</span>
                  <span className="text-amber-800">·</span>
                  <span className="font-serif italic text-amber-300/80">{character.race}</span>
                </div>

                <button
                  onClick={copyCharacterSheet}
                  title="Copy Card Summary"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-cinzel font-medium text-amber-200 bg-[#1e140d] hover:bg-[#2e1f14] border border-[#8b5a2b]/60 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Character Name & Class Header Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Character Name in Fantasy Font */}
                <div className="p-3 rounded-xl bg-[#19100a]/95 border border-[#8c591b]/60 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold font-cinzel block">
                    Name
                  </span>
                  <h2 className="mt-0.5 text-xl sm:text-2xl font-bold font-name tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fde68a] to-[#d97706] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
                    {character.name}
                  </h2>
                </div>

                {/* Character Class */}
                <div className={`p-3 rounded-xl ${theme.badgeBg} border ${theme.border} shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] flex items-center gap-2.5`}>
                  <div className="p-2 rounded-lg bg-[#140c07] border border-[#8c591b]/60 text-amber-400 shrink-0">
                    <ClassIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold font-cinzel block">
                      Class
                    </span>
                    <h3 className={`text-lg sm:text-xl font-bold font-cinzel ${theme.accent} tracking-wide truncate`}>
                      {character.class}
                    </h3>
                  </div>
                </div>
              </div>

              {/* PORTRAIT SECTION: Inside the Player Card */}
              <div className="mb-4">
                <div className="relative rounded-xl bg-[#120a06] border-2 border-[#8c591b] p-3 shadow-inner flex flex-col items-center">
                  {/* Portrait Section Header & Controls */}
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#3b2311]">
                    <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-200">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Portrait</span>
                    </div>

                    {/* Two buttons labeled exactly "Generate" and "Regenerate" */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGeneratePortrait(false)}
                        disabled={isPortraitLoading}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-cinzel font-bold text-[11px] tracking-wider uppercase transition-all cursor-pointer border border-[#d4af37]/60 ${
                          isPortraitLoading
                            ? 'bg-[#3b2716] text-amber-300/40 cursor-not-allowed opacity-75'
                            : 'bg-gradient-to-b from-[#b8860b] to-[#6d4411] hover:from-[#d4af37] hover:to-[#8c591b] text-[#fef9c3] shadow-md hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        {isPortraitLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-amber-300" />
                        )}
                        <span>Generate</span>
                      </button>

                      <button
                        onClick={() => handleGeneratePortrait(true)}
                        disabled={isPortraitLoading}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-cinzel font-bold text-[11px] tracking-wider uppercase transition-all cursor-pointer border border-[#784c20] ${
                          isPortraitLoading
                            ? 'bg-[#1e140d] text-amber-500/40 cursor-not-allowed'
                            : 'bg-[#1c1209] hover:bg-[#2b1c10] text-[#f3ebd4] hover:text-amber-200 border-[#8b5a2b]/70 active:scale-[0.98]'
                        }`}
                      >
                        <RefreshCw className={`w-3 h-3 text-amber-400 ${isPortraitLoading ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Portrait Error Notification */}
                  {portraitError && (
                    <div className="w-full mb-2 p-2.5 rounded-lg bg-[#2a130f] border border-red-800/60 flex items-start gap-2 text-red-200 text-xs font-serif">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <p className="flex-1">{portraitError}</p>
                    </div>
                  )}

                  {/* Portrait Canvas */}
                  <div className="w-full aspect-square max-w-[260px] sm:max-w-[280px] rounded-lg overflow-hidden border border-[#5a3717] bg-[#1a1009] flex flex-col items-center justify-center relative">
                    {isPortraitLoading ? (
                      <div className="flex flex-col items-center justify-center p-4 text-center animate-pulse">
                        <Sparkles className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                        <span className="text-xs font-cinzel font-bold text-amber-200">Painting Portrait...</span>
                        <span className="text-[10px] text-[#baa58d] font-serif italic mt-0.5">
                          Rendering {character.name} ({character.class})
                        </span>
                      </div>
                    ) : portraitUrl ? (
                      <img
                        src={portraitUrl}
                        alt={`Portrait of ${character.name}`}
                        className="w-full h-full object-cover rounded shadow-inner"
                      />
                    ) : (
                      <div className="p-4 text-center text-[#8c6d4e] flex flex-col items-center justify-center">
                        <ImageIcon className="w-8 h-8 mb-1.5 text-[#784c20]" />
                        <span className="text-xs font-cinzel font-bold text-[#baa58d]">No Portrait</span>
                        <span className="text-[10px] text-[#8c6d4e] font-serif italic mt-0.5">
                          Click "Generate" for cartoon art
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RANDOMLY GENERATED STATS: Health, Mana, Strength (1 to 100 for each new character) */}
              <div className="mb-4">
                <div className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-[#d4af37] mb-1.5 text-center sm:text-left">
                  Card Combat Attributes
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Health Stat Card */}
                  <div className="p-2.5 rounded-xl bg-[#1b0d0a] border border-rose-900/60 text-center shadow-inner">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-cinzel font-bold text-rose-300 mb-0.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
                      <span>Health</span>
                    </div>
                    <div className="text-2xl font-black font-cinzel text-rose-200">
                      {character.stats.health}
                    </div>
                    <div className="w-full bg-[#2a1410] rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-600 to-rose-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, character.stats.health))}%` }}
                      />
                    </div>
                  </div>

                  {/* Mana Stat Card */}
                  <div className="p-2.5 rounded-xl bg-[#0d141e] border border-cyan-900/60 text-center shadow-inner">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-cinzel font-bold text-cyan-300 mb-0.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-500/20" />
                      <span>Mana</span>
                    </div>
                    <div className="text-2xl font-black font-cinzel text-cyan-200">
                      {character.stats.mana}
                    </div>
                    <div className="w-full bg-[#10202d] rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, character.stats.mana))}%` }}
                      />
                    </div>
                  </div>

                  {/* Strength Stat Card */}
                  <div className="p-2.5 rounded-xl bg-[#1d140a] border border-amber-800/60 text-center shadow-inner">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-cinzel font-bold text-amber-300 mb-0.5">
                      <Sword className="w-3.5 h-3.5 text-amber-400" />
                      <span>Strength</span>
                    </div>
                    <div className="text-2xl font-black font-cinzel text-amber-200">
                      {character.stats.strength}
                    </div>
                    <div className="w-full bg-[#2d1f11] rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-600 to-amber-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, character.stats.strength))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BACKSTORY SECTION: Inside the Player Card */}
              <div className="mb-4 pt-3 border-t border-[#5e3b1c]/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-200">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Origin Story</span>
                  </div>

                  {/* Button labeled "Generate Backstory" */}
                  <button
                    id="generate-backstory-btn"
                    onClick={handleGenerateBackstory}
                    disabled={isBackstoryLoading}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-cinzel font-bold text-[11px] tracking-wider uppercase transition-all cursor-pointer border border-[#d4af37]/60 ${
                      isBackstoryLoading
                        ? 'bg-[#3b2716] text-amber-300/40 cursor-not-allowed opacity-75'
                        : 'bg-gradient-to-b from-[#b8860b] to-[#6d4411] hover:from-[#d4af37] hover:to-[#8c591b] text-[#fef9c3] shadow-md hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isBackstoryLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                    ) : (
                      <Scroll className="w-3 h-3 text-amber-300" />
                    )}
                    <span>Generate Backstory</span>
                  </button>
                </div>

                {/* Backstory Error Notification */}
                {backstoryError && (
                  <div className="mb-2 p-2.5 rounded-lg bg-[#2a130f] border border-red-800/60 flex items-start gap-2 text-red-200 text-xs font-serif">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="flex-1">{backstoryError}</p>
                  </div>
                )}

                {/* Backstory Parchment Frame */}
                <div className="p-3 rounded-xl bg-[#140c07]/95 border border-[#6b421a]/70 shadow-inner min-h-[64px] flex items-center justify-center">
                  {isBackstoryLoading ? (
                    <div className="flex items-center gap-2 text-amber-300 animate-pulse text-xs">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="font-serif italic text-[#e6d8c3]">
                        Inscribing origin story for {character.name}...
                      </span>
                    </div>
                  ) : backstory ? (
                    <p className="text-xs sm:text-sm leading-relaxed text-[#f7eed9] italic font-serif text-center sm:text-left">
                      "{backstory}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8c6d4e] font-serif italic text-center">
                      No backstory inscribed. Click <strong className="text-amber-300 font-cinzel font-normal">"Generate Backstory"</strong> to reveal origin.
                    </p>
                  )}
                </div>
              </div>

              {/* CARD FOOTER ACTIONS: Button labeled "Save to Deck" */}
              <div className="pt-3 border-t border-[#5e3b1c]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[#8c6d4e] font-serif italic">
                  Guild Relic: {character.signatureItem}
                </div>

                {/* Button labeled exactly "Save to Deck" */}
                <button
                  id="save-to-deck-btn"
                  onClick={saveToDeck}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-cinzel font-bold text-xs tracking-wider uppercase transition-all cursor-pointer border border-[#d4af37]/80 shadow-[0_4px_15px_rgba(0,0,0,0.6)] ${
                    justSaved
                      ? 'bg-emerald-800 text-emerald-100 border-emerald-500 scale-[0.98]'
                      : 'bg-gradient-to-b from-[#d4af37] via-[#b8860b] to-[#784c20] hover:from-[#fef08a] hover:via-[#d4af37] hover:to-[#8c591b] text-slate-950 font-black hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {justSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Saved to Deck!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4 text-slate-950" />
                      <span>Save to Deck</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: "My Deck" - Displayed on the page below the card */}
        <section className="w-full max-w-4xl mt-4 pt-8 border-t border-[#5e3b1c]/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-cinzel font-bold text-amber-200">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>My Deck</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1c120a] border border-[#8c591b]/60 text-amber-300 font-mono">
                {deck.length} {deck.length === 1 ? 'Card' : 'Cards'}
              </span>
            </div>

            {deck.length > 0 && (
              <button
                onClick={() => setDeck([])}
                className="text-xs text-[#8c6d4e] hover:text-red-400 transition-colors flex items-center gap-1 font-cinzel cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Deck</span>
              </button>
            )}
          </div>

          {deck.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#140c07]/80 border border-dashed border-[#5e3b1c]/70 text-center text-[#8c6d4e]">
              <Layers className="w-8 h-8 mx-auto mb-2 text-[#5a391e]" />
              <p className="font-cinzel text-sm text-[#baa58d]">Your Deck is Empty</p>
              <p className="font-serif italic text-xs mt-1">
                Generate a fantasy character, customize their portrait and backstory, then click <strong className="text-amber-300 font-cinzel font-normal">"Save to Deck"</strong> to add them to your collection.
              </p>
            </div>
          ) : (
            /* Each saved character appears as a small card in "My Deck" */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {deck.map((card) => {
                const miniTheme = getClassTheme(card.class);
                const MiniIcon = miniTheme.icon;

                return (
                  <div
                    key={card.id}
                    onClick={() => loadFromDeck(card)}
                    className="relative group p-3 rounded-xl parchment-sheet alchemist-border border border-[#8c591b]/70 hover:border-amber-400 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:-translate-y-1 flex flex-col justify-between"
                  >
                    {/* Small Card Brass Corner Accents */}
                    <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-[#d4af37]/80 pointer-events-none" />
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-[#d4af37]/80 pointer-events-none" />

                    {/* Delete button from mini card */}
                    <button
                      onClick={(e) => removeFromDeck(card.id, e)}
                      title="Remove from deck"
                      className="absolute top-2 right-2 p-1 rounded-full bg-[#120a06]/90 hover:bg-red-950 text-[#8c6d4e] hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div>
                      {/* Mini Portrait Thumbnail */}
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-[#5a3717] bg-[#120a06] mb-2 relative">
                        {card.portraitUrl ? (
                          <img
                            src={card.portraitUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-[#784c20]">
                            <MiniIcon className="w-6 h-6 text-amber-500/60" />
                          </div>
                        )}
                      </div>

                      {/* Mini Card Name in Fantasy Font */}
                      <h4 className="font-name font-bold text-xs text-amber-200 truncate">
                        {card.name}
                      </h4>

                      {/* Mini Card Class */}
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#baa58d]">
                        <MiniIcon className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="font-cinzel truncate">{card.class}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#4a2e15]">
                      {/* Mini Card Stats */}
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-cinzel font-bold">
                        <div className="bg-[#24100c] text-rose-300 rounded py-0.5" title="Health">
                          HP {card.stats.health}
                        </div>
                        <div className="bg-[#0f1a26] text-cyan-300 rounded py-0.5" title="Mana">
                          MP {card.stats.mana}
                        </div>
                        <div className="bg-[#26190a] text-amber-300 rounded py-0.5" title="Strength">
                          ST {card.stats.strength}
                        </div>
                      </div>

                      {card.backstory && (
                        <p className="mt-1.5 text-[10px] text-[#baa58d] font-serif italic line-clamp-2">
                          "{card.backstory}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Alchemist's Workbench Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-[#8c6d4e] border-t border-[#3b2512]/60 font-serif italic">
        <p>Ancient Alchemist's Trading Card Forge · Powered by Gemini 3.8 Flash & Gemini Image Generation</p>
      </footer>
    </div>
  );
}
