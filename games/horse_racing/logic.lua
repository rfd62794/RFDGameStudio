-- horse_racing/logic.lua
-- Pure game logic. No I/O. No rendering. No side effects.
-- All functions are pure: same inputs -> same outputs.
-- The runtime seeds math.random() before calling any function here.
--
-- Systems implemented:
--   GeneticsSystem  — genome generation, inheritance, trait expression
--   StatSystem      — six-stat block derived from genome
--   OddsSystem      — race odds calculation from field stats
--   BreedingSystem  — parent selection, offspring generation
--   RaceSystem      — race resolution with fatigue and variance

-- ---------------------------------------------------------------------------
-- Utilities
-- ---------------------------------------------------------------------------

--- Clamp a value between lo and hi.
local function clamp(v, lo, hi)
    if v < lo then return lo end
    if v > hi then return hi end
    return v
end

--- Weighted random choice. weights is {key: weight} table.
--- Returns chosen key.
local function weighted_choice(weights)
    local total = 0
    for _, w in pairs(weights) do total = total + w end
    local r = math.random() * total
    local cumulative = 0
    for k, w in pairs(weights) do
        cumulative = cumulative + w
        if r <= cumulative then return k end
    end
end

-- ---------------------------------------------------------------------------
-- GeneticsSystem
-- ---------------------------------------------------------------------------

--- Generate a founding-generation genome for a horse.
--- Returns a genome table with allele values in [1, 10].
function generate_genome()
    return {
        speed_allele    = math.random(1, 10),
        stamina_allele  = math.random(1, 10),
        temperament_allele = math.random(1, 10),
    }
end

--- Inherit an allele from two parent alleles with optional mutation.
--- mutation_chance is a float in [0, 1] (from data.yaml constants.breeding).
local function inherit_allele(parent_a, parent_b, mutation_chance)
    local base = math.random() < 0.5 and parent_a or parent_b
    if math.random() < mutation_chance then
        base = clamp(base + math.random(-2, 2), 1, 10)
    end
    return base
end

--- Produce an offspring genome from two parent genomes.
--- mutation_chance from data.yaml constants.breeding.trait_mutation_chance.
function breed_genomes(genome_a, genome_b, mutation_chance)
    return {
        speed_allele = inherit_allele(
            genome_a.speed_allele, genome_b.speed_allele, mutation_chance),
        stamina_allele = inherit_allele(
            genome_a.stamina_allele, genome_b.stamina_allele, mutation_chance),
        temperament_allele = inherit_allele(
            genome_a.temperament_allele, genome_b.temperament_allele, mutation_chance),
    }
end

-- ---------------------------------------------------------------------------
-- StatSystem
-- ---------------------------------------------------------------------------

--- Derive the six-stat block from a genome.
--- Returns {VIT, PWR, AGI, MND, RES, CHM} with values in [1, 100].
--- Allele range [1, 10] maps to stat range [1, 100] with variance.
function derive_stats(genome)
    local function stat_from_allele(allele, base_weight, variance)
        local raw = allele * base_weight + math.random(-variance, variance)
        return clamp(raw, 1, 100)
    end

    return {
        VIT = stat_from_allele(genome.stamina_allele, 9, 5),
        PWR = stat_from_allele(genome.speed_allele, 9, 5),
        AGI = stat_from_allele(genome.speed_allele, 7, 8),
        MND = stat_from_allele(genome.temperament_allele, 8, 6),
        RES = stat_from_allele(genome.stamina_allele, 8, 7),
        CHM = stat_from_allele(genome.temperament_allele, 9, 4),
    }
end

-- ---------------------------------------------------------------------------
-- OddsSystem
-- ---------------------------------------------------------------------------

--- Calculate decimal race odds for a field of horses.
--- field is a list of horse tables, each with a .stats block.
--- house_take is a float in [0, 1] (from data.yaml constants.betting.house_take).
--- Returns a map of horse_id -> decimal odds.
function calculate_odds(field, house_take)
    -- Performance score: simple linear combination
    local scores = {}
    local total = 0
    for _, horse in ipairs(field) do
        local s = horse.stats
        local score = (s.PWR * 0.35) + (s.AGI * 0.25) + (s.VIT * 0.25) + (s.MND * 0.15)
        scores[horse.id] = score
        total = total + score
    end

    -- Convert scores to win probabilities then to decimal odds
    local odds = {}
    for id, score in pairs(scores) do
        local prob = score / total
        local fair_odds = 1.0 / prob
        -- Apply house take: inflate odds by (1 - house_take)
        odds[id] = fair_odds * (1.0 - house_take)
    end
    return odds
end

-- ---------------------------------------------------------------------------
-- RaceSystem
-- ---------------------------------------------------------------------------

--- Resolve a single race.
--- field: list of horse tables (each with .id and .stats)
--- distance: integer (from data.yaml constants.race.base_distance)
--- fatigue_factor: float (from data.yaml constants.race.fatigue_factor)
--- upset_variance: float (from data.yaml constants.race.upset_variance)
--- Returns finishing_order: list of horse IDs from first to last.
function resolve_race(field, distance, fatigue_factor, upset_variance)
    local performance = {}

    for _, horse in ipairs(field) do
        local s = horse.stats
        -- Base speed from PWR and AGI
        local base_speed = (s.PWR * 0.6) + (s.AGI * 0.4)
        -- Stamina penalty over distance: VIT reduces fatigue drain
        local fatigue_penalty = distance * fatigue_factor * (1.0 - (s.VIT / 200.0))
        -- Mental composure under race pressure
        local focus_bonus = s.MND * 0.05
        -- Random upset factor (upset_variance controls spread)
        local noise = (math.random() * 2 - 1) * upset_variance * base_speed
        -- Final performance score (higher is faster)
        local score = base_speed - fatigue_penalty + focus_bonus + noise
        performance[#performance + 1] = {id = horse.id, score = score}
    end

    -- Sort descending by score
    table.sort(performance, function(a, b) return a.score > b.score end)

    local finishing_order = {}
    for _, entry in ipairs(performance) do
        finishing_order[#finishing_order + 1] = entry.id
    end
    return finishing_order
end

-- ---------------------------------------------------------------------------
-- BreedingSystem
-- ---------------------------------------------------------------------------

--- Generate a foal from two parent horses.
--- sire, dam: full horse tables (id, name, genome, stats, generation)
--- foal_id: string identifier for the new horse
--- foal_name: display name
--- mutation_chance: float (from data.yaml constants.breeding.trait_mutation_chance)
--- coat_colors: list of valid coat color strings (from data.yaml tables.coat_colors)
--- Returns a new horse table ready for insertion into game state.
function breed_horses(sire, dam, foal_id, foal_name, mutation_chance, coat_colors)
    local genome = breed_genomes(sire.genome, dam.genome, mutation_chance)
    local stats  = derive_stats(genome)
    local generation = math.max(sire.generation, dam.generation) + 1

    -- Random coat color
    local coat = coat_colors[math.random(1, #coat_colors)]

    return {
        id         = foal_id,
        name       = foal_name,
        generation = generation,
        genome     = genome,
        stats      = stats,
        age        = 0,
        wins       = 0,
        races      = 0,
        coat       = coat,
    }
end

-- ---------------------------------------------------------------------------
-- Betting Resolution
-- ---------------------------------------------------------------------------

--- Resolve a placed bet against race results.
--- bet: {horse_id, amount, race_id}
--- finishing_order: list of horse IDs (first = winner)
--- odds: map of horse_id -> decimal odds
--- Returns {won: bool, payout: integer}
function resolve_bet(bet, finishing_order, odds)
    local winner_id = finishing_order[1]
    if bet.horse_id == winner_id then
        local payout = math.floor(bet.amount * odds[bet.horse_id])
        return {won = true, payout = payout}
    end
    return {won = false, payout = 0}
end
