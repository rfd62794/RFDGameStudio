/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Good, Lot, MarketState } from './types';

// Helper for generating unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Format numbers into professional currency (e.g. $1,250.00)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Database of atmospheric, realistic goods names and descriptions by Category
const ITEM_TEMPLATES: Record<Category, Array<{ name: string; description: string; baseValueMin: number; baseValueMax: number }>> = {
  [Category.FINE_ART]: [
    {
      name: "Storm on the Sea of Galilee (Sketch)",
      description: "A dark, ink-heavy study on coarse parchment, reminiscent of Rembrandt's style.",
      baseValueMin: 500,
      baseValueMax: 1200,
    },
    {
      name: "Mystic Landscape Miniature Oil",
      description: "A tiny 17th-century wooden panel painting of a moonlit river with deep blue tones.",
      baseValueMin: 350,
      baseValueMax: 800,
    },
    {
      name: "Faded Renaissance Charcoal Portrait",
      description: "A delicate sketch of a nobleman. The crosshatching on the clothing is incredibly detailed.",
      baseValueMin: 400,
      baseValueMax: 900,
    },
    {
      name: "Bronze Abstract Figurine",
      description: "A slim, elongated mid-century bronze statue. Heavy, cold, with a rich dark-green patina.",
      baseValueMin: 250,
      baseValueMax: 600,
    },
    {
      name: "Ethereal Watercolor Landscape",
      description: "An unsigned 19th-century watercolor showing mist-shrouded peaks with exquisite bleeding edges.",
      baseValueMin: 200,
      baseValueMax: 500,
    }
  ],
  [Category.VINTAGE_WATCHES]: [
    {
      name: "1912 Officer's Silver Trench Watch",
      description: "A military watch with a wire-lug sterling case, cathedral hands, and a protective grill cage.",
      baseValueMin: 450,
      baseValueMax: 900,
    },
    {
      name: "1940s Triple Calendar Chronograph",
      description: "A complex steel wrist watch featuring elegant sub-dials, day-date indicators, and copper numerals.",
      baseValueMin: 600,
      baseValueMax: 1300,
    },
    {
      name: "Art Deco Platinum Dress Watch",
      description: "Ultra-slim watch with a diamond-set perimeter bezel and tiny, elegant Breguet hands.",
      baseValueMin: 800,
      baseValueMax: 1800,
    },
    {
      name: "1960s Divemaster Steel Chronometer",
      description: "A chunky, durable diver's watch with a rotating black bezel and glowing tritium indices.",
      baseValueMin: 350,
      baseValueMax: 750,
    },
    {
      name: "1920s Gold Pocket Watch",
      description: "18k gold-filled hunter-case pocket watch featuring detailed floral filigree engraving on the spine.",
      baseValueMin: 500,
      baseValueMax: 1100,
    }
  ],
  [Category.RARE_BOOKS]: [
    {
      name: "1682 Treatise on Celestial Motions",
      description: "A thin leatherbound folio containing several fold-out copperplate astronomical diagrams.",
      baseValueMin: 120,
      baseValueMax: 300,
    },
    {
      name: "Gothic Folio of Cryptic Botanicals",
      description: "Thick vellum pages adorned with hand-colored sketches of toxic or mystical nightshade plants.",
      baseValueMin: 150,
      baseValueMax: 450,
    },
    {
      name: "Signed First Edition of Victorian Novel",
      description: "Bound in original green cloth with gold lettering. A signature is stamped on the title page.",
      baseValueMin: 100,
      baseValueMax: 250,
    },
    {
      name: "Leatherbound Alchemical Compendium",
      description: "Smells of beeswax and aged paper. Contains diagrams of geometric symbols and purification circles.",
      baseValueMin: 180,
      baseValueMax: 400,
    },
    {
      name: "Hand-illuminated Psalter Fragment",
      description: "A single, incredibly ornate leaf from a medieval choir book. Real gold leaf flakes around the borders.",
      baseValueMin: 220,
      baseValueMax: 600,
    }
  ],
  [Category.ANCIENT_COINS]: [
    {
      name: "Roman Gold Solidus (Constantine)",
      description: "An exceptionally well-preserved gold coin showing the laurel-crowned profile of the emperor.",
      baseValueMin: 300,
      baseValueMax: 700,
    },
    {
      name: "17th Century Spanish Silver Doubloon",
      description: "A hand-struck silver cob with a crude Jerusalem cross and pillars of Hercules imprint.",
      baseValueMin: 200,
      baseValueMax: 500,
    },
    {
      name: "Byzantine Amethyst Signet Ring",
      description: "A heavy gold loop carrying a deep purple amethyst engraved with an archangel emblem.",
      baseValueMin: 400,
      baseValueMax: 950,
    },
    {
      name: "Viking Silver Braided Torc Segment",
      description: "Thick, tightly-twisted silver wires showing fine punch marks on the decorative terminal ends.",
      baseValueMin: 250,
      baseValueMax: 600,
    },
    {
      name: "Gilded Hellenistic Intaglio Pendant",
      description: "A dark carnelian stone carved with a hunting scene, set inside an intricate woven gold frame.",
      baseValueMin: 350,
      baseValueMax: 800,
    }
  ],
  [Category.COLLECTIBLES]: [
    {
      name: "Lunar Meteorite Fragment (NWA 112)",
      description: "An irregular black stone with a fusion crust, displaying light grey anorthositic clasts under a loupe.",
      baseValueMin: 300,
      baseValueMax: 1500,
    },
    {
      name: "1840 Penny Black Stamp (Uncancelled)",
      description: "A pristine Queen Victoria adhesive stamp, full original gum, showing crisp borders and flawless coloring.",
      baseValueMin: 150,
      baseValueMax: 1000,
    },
    {
      name: "Carved Obsidian Skull of Unknown Age",
      description: "A beautifully polished skull carved from high-sheen black volcanic glass. Uncannily anatomically correct.",
      baseValueMin: 200,
      baseValueMax: 1200,
    },
    {
      name: "Mechanical Brass Astrolabe Fragment",
      description: "Intricately geared disk with astrological alignment notations, smelling of cold antique brass.",
      baseValueMin: 250,
      baseValueMax: 1400,
    },
    {
      name: "Fossilized Leviathan Tooth",
      description: "A massive, heavy predatory tooth with deep mineralization and jagged, prehistoric feeding ridges.",
      baseValueMin: 180,
      baseValueMax: 1100,
    }
  ]
};

// Atmospheric clues for counterfeit items (found during inspection)
const COUNTERFEIT_CLUES = [
  "Paper fibers appear suspiciously modern under UV light.",
  "Engraving displays mechanical printing dots under magnification.",
  "Patina easily scratches off, revealing fresh copper underneath.",
  "Metal feels lighter than gold, likely gilded lead-alloy.",
  "The maker's stamp contains a subtle spelling error.",
  "Screws in the watch movement are slotted steel rather than flame-blued.",
  "Smell of synthetic adhesive or linseed oil indicates recent production.",
  "The ink appears water-soluble and shows no age-related bleeding.",
  "The weight is off by exactly 15% from historical benchmarks.",
];

const AUTHENTIC_CLUES = [
  "Authentic heavy oxidation in the deep recesses conforms to natural aging.",
  "Genuine hand-drawn charcoal strokes show varying carbon deposits.",
  "Movement features hand-finished chamfered edges and genuine ruby pivots.",
  "Vellum exhibits correct animal-skin hair follicles on the back side.",
  "Fossil contains natural crystalline mineralization veins matching deep strata.",
  "Mint luster matches genuine high-pressure strike dies of the era.",
  "Inlaid gold wire shows irregular, manual thickness variations.",
];

// Generate a randomized item
export function generateGood(category: Category, isAuction: boolean = false): Good {
  const templates = ITEM_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // ~18% base fake rate for walk-ins, ~10% for auctions
  const fakeChance = isAuction ? 0.10 : 0.18;
  const authenticity = Math.random() < fakeChance ? 'counterfeit' : 'authentic';
  
  // Quality modifiers: pristine (1.4x), fair (1.0x), poor (0.7x)
  const qualityRoll = Math.random();
  let quality: 'poor' | 'fair' | 'pristine' = 'fair';
  if (qualityRoll < 0.2) quality = 'poor';
  else if (qualityRoll > 0.8) quality = 'pristine';
  
  // Calculate base price
  const rawBaseValue = Math.floor(Math.random() * (template.baseValueMax - template.baseValueMin) + template.baseValueMin);
  
  // Generate atmospheric notes (hints for player inspection)
  const qualityText = quality === 'pristine' ? "Flawless condition, highly preserved." : quality === 'poor' ? "Shows significant wear, scratches, and chips." : "Standard preservation, minor wear.";
  const clueText = authenticity === 'counterfeit' 
    ? COUNTERFEIT_CLUES[Math.floor(Math.random() * COUNTERFEIT_CLUES.length)]
    : AUTHENTIC_CLUES[Math.floor(Math.random() * AUTHENTIC_CLUES.length)];
  
  const notes = `${qualityText} [INSPECT FOR AUTHENTICITY DETAILS]`;

  return {
    id: generateId(),
    name: template.name,
    description: template.description,
    category,
    baseValue: rawBaseValue,
    authenticity,
    isInspected: false,
    quality,
    acquiredPrice: 0,
    acquiredDay: null,
    notes,
  };
}

// Generate an active walk-in or Dutch auction lot
export function generateLot(day: number, shopTier: number, forceType?: 'walk_in' | 'dutch_auction'): Lot {
  // Select type
  const type = forceType || (Math.random() < 0.6 ? 'walk_in' : 'dutch_auction');
  
  // Select category
  const categories = Object.values(Category);
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  const isAuction = type === 'dutch_auction';
  const good = generateGood(category, isAuction);
  
  // Calculate multiplier for price based on quality
  const qualityMultiplier = good.quality === 'pristine' ? 1.4 : good.quality === 'poor' ? 0.7 : 1.0;
  const estimatedMarketValue = Math.round(good.baseValue * qualityMultiplier);

  if (type === 'walk_in') {
    // Walk-ins offer the item at a slight discount or premium depending on quality
    // They generally ask between 75% and 110% of standard market value
    const walkInDiscountFactor = 0.75 + Math.random() * 0.35;
    const askingPrice = Math.round(estimatedMarketValue * walkInDiscountFactor);
    
    // Decay rate for walk-in represents patience decay (patience ticks down each turn)
    // Between 1.5% and 3.5% per clock tick
    const decayRate = 1.5 + Math.random() * 2.0;

    return {
      id: generateId(),
      type: 'walk_in',
      good,
      askingPrice,
      patience: 100,
      rivalInterest: 0,
      rivalRate: 0,
      decayRate,
      auctionStartPrice: 0,
      auctionFloorPrice: 0,
      isInspecting: false,
      inspectProgress: 0,
    };
  } else {
    // Dutch Auctions: Price starts extremely high (e.g., 180% - 220% of estimated value)
    // Ticks down towards a floor (e.g., 40% - 60% of estimated value)
    const auctionStartPrice = Math.round(estimatedMarketValue * (1.8 + Math.random() * 0.4));
    const auctionFloorPrice = Math.round(estimatedMarketValue * (0.45 + Math.random() * 0.15));
    
    // Price drops by a decay multiplier per tick
    // We want the auction to last roughly 25-40 seconds of game clock (e.g. 15-25 ticks)
    // Let's drop price in steps
    const decayRate = Math.round((auctionStartPrice - auctionFloorPrice) / (20 + Math.random() * 15));
    
    // Rivals are interested.
    // Rival rate is interest added per tick.
    // Interest grows faster as the price approaches the floor.
    // Base rate is between 3% and 6% per tick.
    const rivalRate = 3.5 + Math.random() * 2.5;

    return {
      id: generateId(),
      type: 'dutch_auction',
      good,
      askingPrice: auctionStartPrice,
      patience: 100,
      rivalInterest: 0,
      rivalRate,
      decayRate,
      auctionStartPrice,
      auctionFloorPrice,
      isInspecting: false,
      inspectProgress: 0,
    };
  }
}

// Generate starting market states
export function generateInitialMarket(): Record<Category, MarketState> {
  const initialMarket: Partial<Record<Category, MarketState>> = {};
  
  Object.values(Category).forEach((category) => {
    const isCollectibles = category === Category.COLLECTIBLES;
    
    // Random initial price multiplier centered around 1.0
    // Collectibles have wider initial swings
    const baseMult = isCollectibles 
      ? 0.7 + Math.random() * 0.8  // 0.7 - 1.5
      : 0.9 + Math.random() * 0.25; // 0.9 - 1.15
      
    initialMarket[category] = {
      category,
      currentPriceMultiplier: Math.round(baseMult * 100) / 100,
      suppressionDaysRemaining: 0,
      suppressionFactor: 1.0,
      driftHistory: [baseMult, baseMult, baseMult],
      volatility: isCollectibles ? 'high' : (category === Category.FINE_ART || category === Category.ANCIENT_COINS ? 'moderate' : 'low'),
    };
  });
  
  return initialMarket as Record<Category, MarketState>;
}

// Daily market drift. Suppressed prices slowly recover, other prices drift randomly.
// News events can spark specific category trends!
export function calculateMarketDrift(
  currentMarket: Record<Category, MarketState>,
  newsCategory: Category | null,
  newsTrend: 'boom' | 'bust' | null
): Record<Category, MarketState> {
  const nextMarket = { ...currentMarket };
  
  Object.values(Category).forEach((category) => {
    const state = { ...nextMarket[category] };
    const isCollectibles = category === Category.COLLECTIBLES;
    
    // 1. Decay suppression factor back toward 1.0
    if (state.suppressionDaysRemaining > 0) {
      state.suppressionDaysRemaining -= 1;
      // Recover suppression factor by 50% of the remaining gap
      state.suppressionFactor = Math.min(1.0, state.suppressionFactor + (1.0 - state.suppressionFactor) * 0.5);
    } else {
      state.suppressionFactor = 1.0;
    }
    
    // 2. Base drift
    let driftMultiplier = 1.0;
    const baseRoll = Math.random();
    
    if (isCollectibles) {
      // High volatility: swings can be up to 30% up or down
      driftMultiplier = 1.0 + (Math.random() * 0.6 - 0.3); // -30% to +30%
    } else if (state.volatility === 'moderate') {
      // Moderate: up to 15% up or down
      driftMultiplier = 1.0 + (Math.random() * 0.3 - 0.15); // -15% to +15%
    } else {
      // Low: up to 8% up or down
      driftMultiplier = 1.0 + (Math.random() * 0.16 - 0.08); // -8% to +8%
    }
    
    // Apply news multiplier if applicable
    if (category === newsCategory && newsTrend) {
      if (newsTrend === 'boom') {
        // Massive boost to value: +25% to +50%
        driftMultiplier *= (1.25 + Math.random() * 0.25);
      } else if (newsTrend === 'bust') {
        // Crash value: -20% to -40%
        driftMultiplier *= (0.6 + Math.random() * 0.2);
      }
    }
    
    // Apply drift & clamp to absolute boundaries
    let nextMultiplier = state.currentPriceMultiplier * driftMultiplier;
    
    // Collectibles can go wild (0.4x to 2.5x), others are more grounded (0.5x to 1.8x)
    const minCap = isCollectibles ? 0.4 : 0.55;
    const maxCap = isCollectibles ? 2.6 : 1.7;
    
    nextMultiplier = Math.max(minCap, Math.min(maxCap, nextMultiplier));
    state.currentPriceMultiplier = Math.round(nextMultiplier * 100) / 100;
    
    // Update drift history sparkline
    const updatedHistory = [...state.driftHistory, state.currentPriceMultiplier];
    if (updatedHistory.length > 5) {
      updatedHistory.shift();
    }
    state.driftHistory = updatedHistory;
    
    nextMarket[category] = state;
  });
  
  return nextMarket;
}

// Return the true resale value of a Good in the current market
export function calculateSellValue(good: Good, marketState: MarketState): { value: number; isFakeRevealed: boolean } {
  const qualityMultiplier = good.quality === 'pristine' ? 1.4 : good.quality === 'poor' ? 0.7 : 1.0;
  
  // Standard market value
  const baseValue = good.baseValue * qualityMultiplier * marketState.currentPriceMultiplier;
  
  // Apply market suppression factor
  const suppressedValue = baseValue * marketState.suppressionFactor;
  
  // Counterfeits are worth basically scrap value when sold (5% - 12% of the standard value, cap at $60)
  if (good.authenticity === 'counterfeit') {
    const scrapMultiplier = 0.05 + Math.random() * 0.07;
    const counterfeitValue = Math.min(60, Math.round(suppressedValue * scrapMultiplier));
    return {
      value: counterfeitValue,
      isFakeRevealed: true,
    };
  }
  
  return {
    value: Math.round(suppressedValue),
    isFakeRevealed: false,
  };
}

// Generate a random daily market news flash to set the vibe and mechanical focus
export function generateNewsFlash(day: number): { message: string; category: Category | null; trend: 'boom' | 'bust' | null } {
  const newsRoll = Math.random();
  
  // Day 1 has no drastic trends
  if (day === 1 || newsRoll < 0.25) {
    return {
      message: "The local trade board reports normal volume. No macro market shifts observed.",
      category: null,
      trend: null,
    };
  }
  
  const categories = Object.values(Category);
  const targetCategory = categories[Math.floor(Math.random() * categories.length)];
  const isBoom = Math.random() < 0.6; // 60% chance news is positive
  
  const newsData: Record<Category, { boom: string[]; bust: string[] }> = {
    [Category.FINE_ART]: {
      boom: [
        "A private auction in Zurich saw record-setting bids for classical sketches. Art valuation surges!",
        "Gallerists declare a 'Neo-Classical Revival'—fine sketches and oil miniatures are highly sought after."
      ],
      bust: [
        "Major gallery heist in Milan floods the black market with high-end sketches. Fine art prices plunge.",
        "Art critics label traditional oil studies as 'outdated and over-inflated'. Collector interest cools."
      ]
    },
    [Category.VINTAGE_WATCHES]: {
      boom: [
        "Sotheby's vintage watch catalog goes viral. Wealthy collectors are scrambling for trench watches.",
        "A prominent lifestyle magazine names high-end mechanical watches as the ultimate status symbol this season."
      ],
      bust: [
        "A flood of hyper-accurate replica movements from Asia damages collector confidence in vintage chronographs.",
        "Reputable watchmakers warn of 'bubble valuations' on steel mechanical watches. Market undergoes a correction."
      ]
    },
    [Category.RARE_BOOKS]: {
      boom: [
        "A newly discovered medieval manuscript fragment re-sparks academic and private collector demand for rare books.",
        "Billionaire tech founders are buying up alchemical and astronomical treatises, driving valuations skyward."
      ],
      bust: [
        "A sudden liquid damage scandal at a major national library vault causes panic among paper preservationists.",
        "A quiet day for collectors; academic libraries report budget cuts, capping acquisitions for rare folios."
      ]
    },
    [Category.ANCIENT_COINS]: {
      boom: [
        "Gold price index hits record highs. Antique signet rings and ancient coins see massive collateral appreciation.",
        "A hoard of Roman coinage was cleared for lawful private trade, validating historic valuations worldwide."
      ],
      bust: [
        "Tax authorities announce aggressive compliance audits on precious-metal relics, prompting liquidations.",
        "Uncertified metal-detector finds on the black market temporary depress price benchmarks for ancient silver cob coins."
      ]
    },
    [Category.COLLECTIBLES]: {
      boom: [
        "An anonymous collector spends millions on fossil specimens, causing high-volatility collectibles to enter a speculative boom!",
        "Conspiracy forums and mainstream science clash over obsidian relics, triggering a hyper-volatile stampede of buyers."
      ],
      bust: [
        "Scrap markets declare meteorite fragments 'highly oversupplied' due to a recent public cluster sale. Prices plummet.",
        "A prominent appraiser is exposed for certifying modern stamp replicas, causing panic in high-volatility collectible lanes."
      ]
    }
  };

  const messages = isBoom ? newsData[targetCategory].boom : newsData[targetCategory].bust;
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    message,
    category: targetCategory,
    trend: isBoom ? 'boom' : 'bust',
  };
}

// Detail strings for authentic clues found during Inspection
export function getInspectionDetailText(good: Good): string {
  if (good.authenticity === 'counterfeit') {
    return `[COUNTERFEIT FLAGGED] ${good.quality === 'pristine' ? 'Pristine exterior, but' : 'Wear pattern masks '} suspicious traits under deep UV appraisal. Base metal is lead/pewter gilded with thin electroplating. High risk of heavy loss.`;
  } else {
    return `[VERIFIED AUTHENTIC] Genuine material composition, micro-wear patterns conform exactly to normal historical oxidation and hand-finishing. Quality level: ${good.quality.toUpperCase()}.`;
  }
}
