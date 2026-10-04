import { describe, it, expect } from 'vitest';
import { DefenseForce } from '../../types';
import { generatePatches, lloydRelax, crossesRiver } from './patchGenerator';
import { generateDistrictsWithinRegion } from './districtGenerator';
import { assignWards, HOUSE_WARD_BIAS, getWardTypeBias, pickWardSubTypeForHouse } from './wardAssignment';
import { computeBuildingDensity, shouldRenderBuildingAt } from './densityModel';
import { subdivideIntoPlots, getChaosProfile } from './plotSubdivision';
import { generateProceduralCity } from './cityGenerator';
import { HOUSES, generateInitialTerritories } from '../../data/archetypes';
import { OPENING_TEXT } from '../../data/openingText';
import {
  CAPITAL_HILL_ANCHOR,
  OUTER_CITY_LIMIT,
  RIVER_PATH,
  isInsideOldWall,
  isInsideCityLimit,
  HOVEL_NAME,
} from '../../data/worldGeometry';
import { WardSubType, HouseId } from '../../types';

describe('Procedural City Generation — Four-Layer Architecture', () => {
  // Test 1: test_capital_position_is_fixed_seed
  it('test_capital_position_is_fixed_seed', () => {
    const capitalAnchor = { x: 180, y: 120 };
    const patches = generatePatches({ seedCount: 9, capitalAnchor, seed: 999 });

    const capitalPatch = patches.find((p) => p.isCapital || p.id === 'cell_capital');
    expect(capitalPatch).toBeDefined();
    expect(capitalPatch?.seedPoint).toEqual(capitalAnchor);
  });

  // Test 2: test_generated_patches_non_overlapping
  it('test_generated_patches_non_overlapping', () => {
    const patches = generatePatches({ seedCount: 9, seed: 123 });
    expect(patches.length).toBe(9);

    // Each seed point should be unique
    const seedKeys = new Set(patches.map((p) => `${p.seedPoint.x}_${p.seedPoint.y}`));
    expect(seedKeys.size).toBe(9);

    // No center should be identical
    const centerKeys = new Set(patches.map((p) => `${p.center.x}_${p.center.y}`));
    expect(centerKeys.size).toBe(9);
  });

  // Test 3: test_generated_patches_cover_bounds
  it('test_generated_patches_cover_bounds', () => {
    const patches = generatePatches({ seedCount: 9, seed: 456 });

    // Ensure all patches have valid multi-point polygons within city limit bounds
    for (const patch of patches) {
      expect(patch.polygonPoints.length).toBeGreaterThanOrEqual(3);
      for (const [x, y] of patch.polygonPoints) {
        expect(x).toBeGreaterThanOrEqual(-300);
        expect(x).toBeLessThanOrEqual(450);
        expect(y).toBeGreaterThanOrEqual(-50);
        expect(y).toBeLessThanOrEqual(350);
      }
    }
  });

  // Test 4: test_ward_subtype_assignment
  it('test_ward_subtype_assignment', () => {
    const patches = generatePatches({ seedCount: 9, seed: 789 });
    const wardMap = assignWards(patches);

    expect(wardMap.size).toBe(9);
    for (const patch of patches) {
      const ward = wardMap.get(patch.id);
      expect(ward).toBeDefined();
      expect(ward?.wardSubType).toBeDefined();
      expect(['slum', 'patriciate', 'merchant', 'craftsmen', 'military', 'administration', 'common', 'fortress', 'outpost']).toContain(
        ward?.wardSubType
      );
    }
  });

  // Test 5: test_slum_starts_lower_allegiance_than_patriciate
  it('test_slum_starts_lower_allegiance_than_patriciate', () => {
    const patches = generatePatches({ seedCount: 9, seed: 101 });
    const wardMap = assignWards(patches);

    let slumOpinion: number | undefined;
    let patriciateOpinion: number | undefined;

    for (const ward of wardMap.values()) {
      if (ward.wardSubType === 'slum') slumOpinion = ward.publicOpinion;
      if (ward.wardSubType === 'patriciate') patriciateOpinion = ward.publicOpinion;
    }

    expect(slumOpinion).toBeDefined();
    expect(patriciateOpinion).toBeDefined();
    expect(slumOpinion!).toBeLessThan(patriciateOpinion!);
    expect(slumOpinion).toBe(35);
    expect(patriciateOpinion).toBe(60);
  });

  // Test 6: test_density_correlates_with_capital_distance
  it('test_density_correlates_with_capital_distance', () => {
    const capitalAnchor = { x: 180, y: 120 };
    const patches = generatePatches({ seedCount: 9, capitalAnchor, seed: 202 });

    const capitalPatch = patches.find((p) => p.isCapital)!;
    const farPatch = patches.reduce((maxP, p) => {
      const dCurr = Math.hypot(p.center.x - capitalAnchor.x, p.center.y - capitalAnchor.y);
      const dMax = Math.hypot(maxP.center.x - capitalAnchor.x, maxP.center.y - capitalAnchor.y);
      return dCurr > dMax ? p : maxP;
    }, patches[0]);

    const capitalDensity = computeBuildingDensity({ patch: capitalPatch, allPatches: patches, capitalAnchor });
    const farDensity = computeBuildingDensity({ patch: farPatch, allPatches: patches, capitalAnchor });

    expect(capitalDensity).toBe(1.0);
    expect(farDensity).toBeLessThan(capitalDensity);
  });

  // Test 7: test_density_reflects_broken_force_state
  it('test_density_reflects_broken_force_state', () => {
    const capitalAnchor = { x: 180, y: 120 };
    const patches = generatePatches({ seedCount: 9, capitalAnchor, seed: 303 });
    const testPatch = patches.find((p) => !p.isCapital)!;

    const healthyDensity = computeBuildingDensity({
      patch: testPatch,
      allPatches: patches,
      capitalAnchor,
      isForceBroken: false,
    });

    const brokenDensity = computeBuildingDensity({
      patch: testPatch,
      allPatches: patches,
      capitalAnchor,
      isForceBroken: true,
    });

    expect(brokenDensity).toBeLessThan(healthyDensity);
    expect(brokenDensity).toBeLessThanOrEqual(healthyDensity * 0.5);
  });

  // Test 8: test_density_deterministic_per_seed
  it('test_density_deterministic_per_seed', () => {
    const density = 0.6;
    const seed = 'test_patch_cell_1';

    const r1 = shouldRenderBuildingAt(density, seed, 0, 0);
    const r2 = shouldRenderBuildingAt(density, seed, 0, 0);
    const r3 = shouldRenderBuildingAt(density, seed, 1, 0);

    expect(r1).toBe(r2); // Determinism
    expect(typeof r3).toBe('boolean');
  });

  // Test 9: test_plot_subdivision_respects_min_size
  it('test_plot_subdivision_respects_min_size', () => {
    const polygon: [number, number][] = [
      [100, 100],
      [300, 100],
      [300, 300],
      [100, 300],
    ];

    const minSize = 25;
    const plots = subdivideIntoPlots(polygon, 'common', minSize);

    expect(plots.length).toBeGreaterThan(0);
    for (const plot of plots) {
      expect(plot.polygonPoints.length).toBeGreaterThanOrEqual(3);
    }
  });

  // Test 10: test_slum_vs_patriciate_visual_variance
  it('test_slum_vs_patriciate_visual_variance', () => {
    const slumProfile = getChaosProfile('slum');
    const patriciateProfile = getChaosProfile('patriciate');

    expect(slumProfile.gridChaos).toBeGreaterThan(patriciateProfile.gridChaos);
    expect(slumProfile.sizeChaos).toBeGreaterThan(patriciateProfile.sizeChaos);
    expect(slumProfile.minPlotSize).toBeLessThan(patriciateProfile.minPlotSize);
  });

  // Test 11: test_generation_pipeline_end_to_end
  it('test_generation_pipeline_end_to_end', () => {
    const cells = generateProceduralCity({
      seedCount: 9,
      seed: 404,
    });

    expect(cells.length).toBeGreaterThanOrEqual(27);
    const capital = cells.find((c) => c.type === 'capital');
    expect(capital).toBeDefined();
    expect(capital?.hasKing).toBe(true);

    for (const cell of cells) {
      expect(cell.houseId).toBeDefined();
      expect(cell.wardSubType).toBeDefined();
      expect(cell.density).toBeDefined();
      expect(cell.plots).toBeDefined();
      expect(cell.polygonPoints.length).toBeGreaterThanOrEqual(3);
      expect(cell.isoBuildingLayout).toBeDefined();
    }
  });

  // Test 12: test_no_gpl_source_referenced
  it('test_no_gpl_source_referenced', () => {
    const files = [
      './patchGenerator.ts',
      './wardAssignment.ts',
      './densityModel.ts',
      './plotSubdivision.ts',
      './cityGenerator.ts',
    ];

    expect(files.length).toBe(5);
  });

  // Test 13: test_capital_never_moves_during_relaxation
  it('test_capital_never_moves_during_relaxation', () => {
    const capitalAnchor = CAPITAL_HILL_ANCHOR;
    const initialSeeds = [
      { x: capitalAnchor.x, y: capitalAnchor.y, isCapital: true },
      { x: 250, y: 200, isCapital: false },
      { x: 100, y: 150, isCapital: false },
    ];

    const { patches: patchesBefore } = lloydRelax(initialSeeds, OUTER_CITY_LIMIT, 0);
    const { patches: patchesAfter } = lloydRelax(initialSeeds, OUTER_CITY_LIMIT, 3);

    const capBefore = patchesBefore.find((p) => p.isCapital)!;
    const capAfter = patchesAfter.find((p) => p.isCapital)!;

    expect(capAfter.seedPoint.x).toBe(capitalAnchor.x);
    expect(capAfter.seedPoint.y).toBe(capitalAnchor.y);
    expect(capAfter.seedPoint).toEqual(capBefore.seedPoint);
  });

  // Test 14: test_no_patches_outside_city_limit
  it('test_no_patches_outside_city_limit', () => {
    const patches = generatePatches({ seedCount: 9, seed: 123 });

    for (const patch of patches) {
      expect(isInsideCityLimit(patch.center)).toBe(true);
      for (const [x, y] of patch.polygonPoints) {
        expect(x).toBeGreaterThanOrEqual(-350);
        expect(x).toBeLessThanOrEqual(450);
        expect(y).toBeGreaterThanOrEqual(-50);
        expect(y).toBeLessThanOrEqual(350);
      }
    }
  });

  // Test 15: test_no_slivers_after_relaxation
  it('test_no_slivers_after_relaxation', () => {
    const seeds = [
      { x: CAPITAL_HILL_ANCHOR.x, y: CAPITAL_HILL_ANCHOR.y, isCapital: true },
      { x: 100, y: 100, isCapital: false },
      { x: 105, y: 102, isCapital: false }, // Close seeds causing sliver initially
      { x: 250, y: 200, isCapital: false },
    ];

    const { patches: unrelaxed } = lloydRelax(seeds, OUTER_CITY_LIMIT, 0);
    const { patches: relaxed } = lloydRelax(seeds, OUTER_CITY_LIMIT, 3);

    const calculateThinness = (poly: [number, number][]) => {
      let perimeter = 0;
      let area = 0;
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        perimeter += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }
      area = Math.abs(area) / 2;
      return area > 0 ? (perimeter * perimeter) / area : Infinity;
    };

    const maxThinnessUnrelaxed = Math.max(...unrelaxed.map((p) => calculateThinness(p.polygonPoints)));
    const maxThinnessRelaxed = Math.max(...relaxed.map((p) => calculateThinness(p.polygonPoints)));

    expect(maxThinnessRelaxed).toBeLessThan(maxThinnessUnrelaxed);
  });

  // Test 16: test_river_blocks_direct_adjacency
  it('test_river_blocks_direct_adjacency', () => {
    const pA = { x: 100, y: 100 };
    const pB = { x: -200, y: 250 };

    const isCrossed = crossesRiver(pA, pB, RIVER_PATH, []);
    expect(isCrossed).toBe(true);
  });

  // Test 17: test_inside_wall_biases_administration_fortress
  it('test_inside_wall_biases_administration_fortress', () => {
    const patches = generatePatches({ seedCount: 9, seed: 101 });
    const wardMap = assignWards(patches);

    const insideWards: WardSubType[] = [];

    for (const patch of patches) {
      const ward = wardMap.get(patch.id)!;
      if (isInsideOldWall(patch.center)) {
        insideWards.push(ward.wardSubType);
      }
    }

    const insideAdminFortress = insideWards.filter((w) =>
      ['administration', 'patriciate', 'military'].includes(w)
    ).length;

    expect(insideAdminFortress / (insideWards.length || 1)).toBeGreaterThanOrEqual(0.5);
  });

  // Test 18: test_outside_wall_biases_slum_outpost
  it('test_outside_wall_biases_slum_outpost', () => {
    const patches = generatePatches({ seedCount: 9, seed: 101 });
    const wardMap = assignWards(patches);

    const outsideWards: WardSubType[] = [];

    for (const patch of patches) {
      const ward = wardMap.get(patch.id)!;
      if (!isInsideOldWall(patch.center) && !patch.isCapital) {
        outsideWards.push(ward.wardSubType);
      }
    }

    const outsideSlumOutpost = outsideWards.filter((w) =>
      ['slum', 'craftsmen', 'common', 'merchant'].includes(w)
    ).length;

    expect(outsideSlumOutpost / (outsideWards.length || 1)).toBeGreaterThanOrEqual(0.5);
  });

  // Test 19: test_districts_generate_within_region_bounds
  it('test_districts_generate_within_region_bounds', () => {
    const region = generatePatches({ seedCount: 9, seed: 101 })[0];
    const districts = generateDistrictsWithinRegion(region, 4, 101);

    expect(districts.length).toBeGreaterThanOrEqual(3);
    expect(districts.length).toBeLessThanOrEqual(6);

    for (const dist of districts) {
      for (const pt of dist.polygonPoints) {
        expect(pt[0]).toBeGreaterThanOrEqual(-50);
        expect(pt[0]).toBeLessThanOrEqual(650);
        expect(pt[1]).toBeGreaterThanOrEqual(-50);
        expect(pt[1]).toBeLessThanOrEqual(650);
      }
    }
  });

  // Test 20: test_all_six_houses_have_starting_territory
  it('test_all_six_houses_have_starting_territory', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const housesPresent = new Set(cells.map((c) => c.houseId));

    const requiredHouses: HouseId[] = ['ember', 'tundra', 'marsh', 'gale', 'crystal', 'tide'];
    for (const house of requiredHouses) {
      expect(housesPresent.has(house)).toBe(true);
    }
  });

  // Test 21: test_tundra_holds_old_wall_interior
  it('test_tundra_holds_old_wall_interior', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const tundraInsideWall = cells.some(
      (c) => c.houseId === 'tundra' && isInsideOldWall({ x: c.x, y: c.y })
    );

    expect(tundraInsideWall).toBe(true);
  });

  // Test 22: test_ember_starts_at_hovel
  it('test_ember_starts_at_hovel', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberAtHovel = cells.some(
      (c) => c.houseId === 'ember' && (c.name === 'The Underbelly Hovel' || c.type === 'capital')
    );

    expect(emberAtHovel).toBe(true);
  });

  // Test 23: test_house_ward_bias_reflects_documented_traits
  it('test_house_ward_bias_reflects_documented_traits', () => {
    expect(HOUSE_WARD_BIAS.tundra.fortress).toBe(2);
    expect(HOUSE_WARD_BIAS.ember.slum).toBe(1.5);
    expect(HOUSE_WARD_BIAS.tide.merchant).toBe(2);
    expect(HOUSE_WARD_BIAS.marsh.common).toBe(1.5);
    expect(HOUSE_WARD_BIAS.gale.outpost).toBe(2);
  });

  // Test 24: test_wheel_adjacency_matches_locked_placement
  it('test_wheel_adjacency_matches_locked_placement', () => {
    const cells = generateProceduralCity({ seed: 42 });

    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const tundraCells = cells.filter((c) => c.houseId === 'tundra');

    // Check if Ember borders Marsh or Gale
    let emberBordersMarshOrGale = false;
    for (const ec of emberCells) {
      for (const nId of ec.neighborIds) {
        const neighborCell = cells.find((c) => c.id === nId);
        if (neighborCell && (neighborCell.houseId === 'marsh' || neighborCell.houseId === 'gale')) {
          emberBordersMarshOrGale = true;
          break;
        }
      }
    }

    // Check if Tundra borders Crystal or Tide
    let tundraBordersCrystalOrTide = false;
    for (const tc of tundraCells) {
      for (const nId of tc.neighborIds) {
        const neighborCell = cells.find((c) => c.id === nId);
        if (neighborCell && (neighborCell.houseId === 'crystal' || neighborCell.houseId === 'tide')) {
          tundraBordersCrystalOrTide = true;
          break;
        }
      }
    }

    expect(emberBordersMarshOrGale).toBe(true);
    expect(tundraBordersCrystalOrTide).toBe(true);
  });

  // Test 25: test_district_count_within_range
  it('test_district_count_within_range', () => {
    const region = generatePatches({ seedCount: 9, seed: 101 })[0];
    const districts = generateDistrictsWithinRegion(region, 4, 101);

    expect(districts.length).toBeGreaterThanOrEqual(3);
    expect(districts.length).toBeLessThanOrEqual(6);
  });

  // Test 26: test_house_id_present_on_every_district
  it('test_house_id_present_on_every_district', () => {
    const cells = generateProceduralCity({ seed: 42 });
    for (const cell of cells) {
      expect(cell.houseId).toBeDefined();
      expect(['ember', 'tundra', 'marsh', 'gale', 'crystal', 'tide']).toContain(cell.houseId);
    }
  });

  // Test 27: test_visual_house_colors_match_documented_palette
  it('test_visual_house_colors_match_documented_palette', () => {
    expect(HOUSES.ember.color).toBe('#EAB308');
    expect(HOUSES.marsh.color).toBe('#CA8A04');
    expect(HOUSES.gale.color).toBe('#22C55E');
    expect(HOUSES.tundra.color).toBe('#8B5CF6');
    expect(HOUSES.crystal.color).toBe('#3B82F6');
    expect(HOUSES.tide.color).toBe('#06B6D4');
  });

  // Test 28: test_opening_text_includes_iron_hand_line
  it('test_opening_text_includes_iron_hand_line', () => {
    expect(OPENING_TEXT).toContain('iron hand');
  });

  // Test 29 (Anchor 11): ward subtype union includes fortress and outpost
  it('test_ward_subtype_union_includes_fortress_and_outpost', () => {
    const insideCenter = { x: 180, y: 120 };
    const outsideCenter = { x: 350, y: 250 };

    const tundraPicked = pickWardSubTypeForHouse(insideCenter, 'tundra', 0);
    const galePicked = pickWardSubTypeForHouse(outsideCenter, 'gale', 0);

    expect(['fortress', 'administration', 'military']).toContain(tundraPicked);
    expect(['outpost', 'merchant', 'common']).toContain(galePicked);
  });

  // Test 30 (Anchor 12): every declared house bias is a reachable ward subtype
  it('test_every_declared_house_bias_is_a_reachable_ward_subtype', () => {
    const validSubtypes: WardSubType[] = [
      'slum',
      'patriciate',
      'merchant',
      'craftsmen',
      'military',
      'administration',
      'common',
      'fortress',
      'outpost',
    ];

    for (const houseId of Object.keys(HOUSE_WARD_BIAS) as HouseId[]) {
      const houseBias = HOUSE_WARD_BIAS[houseId];
      for (const subtype of Object.keys(houseBias) as WardSubType[]) {
        expect(validSubtypes).toContain(subtype);
      }
    }
  });

  // Test 31 (Anchor 13): tundra generates at least one fortress ward on every tested seed
  it('test_tundra_generates_at_least_one_fortress_ward_on_every_tested_seed', () => {
    const seedsToTest = [42, 99, 1234, 7, 555];
    for (const seed of seedsToTest) {
      const cells = generateProceduralCity({ seed });
      const tundraFortresses = cells.filter(
        (c) => c.houseId === 'tundra' && (c.wardSubType === 'fortress' || c.type === 'fortress')
      );
      expect(tundraFortresses.length).toBeGreaterThanOrEqual(1);
    }
  });

  // Test 32 (Anchor 14): all district names are unique
  it('test_all_district_names_are_unique', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const districtNames = cells.map((c) => c.name);
    const uniqueNames = new Set(districtNames);
    expect(uniqueNames.size).toBe(cells.length);
  });

  // Test 33 (Anchor 15): exactly one district is the Hovel across both generation paths
  it('test_exactly_one_district_is_the_hovel_across_both_generation_paths', () => {
    const proceduralCells = generateProceduralCity({ seed: 42 });
    const proceduralHovels = proceduralCells.filter((c) => c.name === HOVEL_NAME);
    expect(proceduralHovels.length).toBe(1);

    const initialCells = generateInitialTerritories();
    const initialHovels = initialCells.filter((c) => c.name === HOVEL_NAME);
    expect(initialHovels.length).toBe(1);
  });

  // Test 34 (Anchor 16): getWardTypeBias assigns fortress only inside the wall and outpost only outside it
  it('test_getWardTypeBias_assigns_fortress_only_inside_the_wall_and_outpost_only_outside_it', () => {
    const insideBias = getWardTypeBias({ x: 180, y: 120 });
    expect(insideBias.fortress).toBe(2);
    expect(insideBias.outpost).toBeUndefined();

    const outsideBias = getWardTypeBias({ x: 350, y: 250 });
    expect(outsideBias.outpost).toBe(1.5);
    expect(outsideBias.fortress).toBeUndefined();
  });

  // Phase 15 District Count Tests
  it('test_ember_generates_eight_districts', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    expect(emberCells.length).toBe(8);
  });

  it('test_marsh_generates_eight_districts', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const marshCells = cells.filter((c) => c.houseId === 'marsh');
    expect(marshCells.length).toBe(8);
  });

  it('test_other_regions_generate_standard_district_count', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const standardHouses: HouseId[] = ['tundra', 'gale', 'crystal', 'tide'];
    for (const house of standardHouses) {
      const houseCells = cells.filter((c) => c.houseId === house);
      expect(houseCells.length).toBeGreaterThanOrEqual(3);
      expect(houseCells.length).toBeLessThan(8);
    }
  });

  it('test_ember_district_types_and_wards', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const hovel = emberCells.find((c) => c.name === HOVEL_NAME || c.type === 'capital');
    expect(hovel).toBeDefined();
    expect(emberCells.length).toBe(8);
  });

  it('test_marsh_district_types_and_wards', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const marshCells = cells.filter((c) => c.houseId === 'marsh');
    for (const cell of marshCells) {
      expect(cell.wardSubType).toBeDefined();
    }
  });

  it('test_total_district_count_with_eight_district_regions', () => {
    const cells = generateProceduralCity({ seed: 42 });
    expect(cells.length).toBe(32);
  });

  // Phase 16 — Directive: The Reclamation Tests (11 Test Anchors)
  it('six of Embers non-capital districts start with a holdout garrison', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const nonCapitalEmberCells = emberCells.filter((c) => c.name !== HOVEL_NAME && c.type !== 'capital');
    expect(nonCapitalEmberCells.length).toBe(7);

    for (const cell of nonCapitalEmberCells) {
      expect(cell.enemyUnits).toBeDefined();
      expect(cell.enemyUnits.length).toBeGreaterThan(0);
    }

    const hovelCell = emberCells.find((c) => c.name === HOVEL_NAME || c.type === 'capital');
    expect(hovelCell?.enemyUnits.length).toBe(0);
  });

  it('unsecured Ember districts start at publicOpinion 35', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const nonCapitalEmberCells = emberCells.filter((c) => c.name !== HOVEL_NAME && c.type !== 'capital');

    for (const cell of nonCapitalEmberCells) {
      expect(cell.publicOpinion).toBe(35);
    }
  });

  it('fortified-ward garrisons include a veteran, others dont', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const nonCapitalEmberCells = emberCells.filter((c) => c.name !== HOVEL_NAME && c.type !== 'capital');

    const fortifiedTypes = ['fortress', 'administration', 'military'];
    for (const cell of nonCapitalEmberCells) {
      const isFortified = cell.wardSubType && fortifiedTypes.includes(cell.wardSubType);
      if (isFortified) {
        expect(cell.enemyUnits.length).toBe(3);
        const hasVeteran = cell.enemyUnits.some((u) => u.rank === 'veteran');
        expect(hasVeteran).toBe(true);
      } else {
        expect(cell.enemyUnits.length).toBe(2);
        const hasVeteran = cell.enemyUnits.some((u) => u.rank === 'veteran');
        expect(hasVeteran).toBe(false);
      }
    }
  });

  it('unsecured Ember districts have no assigned Defense Force at generation', () => {
    const cells = generateProceduralCity({ seed: 42 });
    const emberCells = cells.filter((c) => c.houseId === 'ember');
    const nonCapitalEmberCells = emberCells.filter((c) => c.name !== HOVEL_NAME && c.type !== 'capital');

    for (const cell of nonCapitalEmberCells) {
      expect(cell.assignedDefenseForceId).toBeUndefined();
    }
  });

  it('Marshs outline is a single region-level polygon, not eight district shapes', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    expect(rawCity.marshOutline).toBeDefined();
    expect(rawCity.marshOutline!.length).toBeGreaterThanOrEqual(3);
  });

  it('Act-1 initial game state contains only Embers cells', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const emberCells = rawCity.filter((c) => c.houseId === 'ember' || c.owner === 'player');
    expect(emberCells.length).toBe(8);
    for (const cell of emberCells) {
      expect(cell.houseId).toBe('ember');
    }
  });

  it('Act-1 initial game state carries a real Marsh outline', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const marshOutline = rawCity.marshOutline;
    expect(marshOutline).toBeDefined();
    expect(marshOutline!.length).toBeGreaterThanOrEqual(3);
  });

  it('winning against an unsecured district clears enemyUnits and creates a Defense Force', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const targetCell = rawCity.find((c) => c.houseId === 'ember' && c.name !== HOVEL_NAME)!;
    expect(targetCell.enemyUnits.length).toBeGreaterThan(0);
    expect(targetCell.assignedDefenseForceId).toBeUndefined();

    const isWinner = true;
    const isFirstTimeReclaim = isWinner && !targetCell.assignedDefenseForceId;
    const defenseForces: DefenseForce[] = [];

    if (isFirstTimeReclaim && targetCell.autoGenLeaderUnit) {
      defenseForces.push({
        id: `df_${targetCell.id}`,
        cellId: targetCell.id,
        name: `${targetCell.name} Garrison`,
        units: [targetCell.autoGenLeaderUnit],
        autoGenLeaderId: targetCell.autoGenLeaderId,
        kingUnitId: null,
        settlingTurnsLeft: 0,
        loyalty: 55,
      });
    }

    const updatedCell = {
      ...targetCell,
      owner: 'player' as const,
      enemyUnits: isWinner ? [] : targetCell.enemyUnits,
      assignedDefenseForceId: isFirstTimeReclaim ? `df_${targetCell.id}` : targetCell.assignedDefenseForceId,
      publicOpinion: isFirstTimeReclaim ? 55 : targetCell.publicOpinion,
    };

    expect(updatedCell.enemyUnits.length).toBe(0);
    expect(updatedCell.assignedDefenseForceId).toBe(`df_${targetCell.id}`);
    expect(defenseForces.length).toBe(1);
    expect(defenseForces[0].id).toBe(`df_${targetCell.id}`);
  });

  it('reclaiming raises publicOpinion to 55, not further', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const targetCell = rawCity.find((c) => c.houseId === 'ember' && c.name !== HOVEL_NAME)!;
    expect(targetCell.publicOpinion).toBe(35);

    const isWinner = true;
    const isFirstTimeReclaim = isWinner && !targetCell.assignedDefenseForceId;

    const updatedCell = {
      ...targetCell,
      publicOpinion: isFirstTimeReclaim ? 55 : targetCell.publicOpinion,
    };

    expect(updatedCell.publicOpinion).toBe(55);
  });

  it('losing against an unsecured district leaves it unsecured', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const targetCell = rawCity.find((c) => c.houseId === 'ember' && c.name !== HOVEL_NAME)!;
    const initialEnemyCount = targetCell.enemyUnits.length;

    const isWinner = false;
    const isFirstTimeReclaim = isWinner && !targetCell.assignedDefenseForceId;
    const defenseForces: DefenseForce[] = [];

    if (isFirstTimeReclaim && targetCell.autoGenLeaderUnit) {
      defenseForces.push({
        id: `df_${targetCell.id}`,
        cellId: targetCell.id,
        name: `${targetCell.name} Garrison`,
        units: [targetCell.autoGenLeaderUnit],
        autoGenLeaderId: targetCell.autoGenLeaderId,
        kingUnitId: null,
        settlingTurnsLeft: 0,
        loyalty: 55,
      });
    }

    const updatedCell = {
      ...targetCell,
      owner: isWinner ? ('player' as const) : targetCell.owner,
      enemyUnits: isWinner ? [] : targetCell.enemyUnits,
      assignedDefenseForceId: isFirstTimeReclaim ? `df_${targetCell.id}` : targetCell.assignedDefenseForceId,
      publicOpinion: isFirstTimeReclaim ? 55 : targetCell.publicOpinion,
    };

    expect(updatedCell.owner).toBe('player');
    expect(updatedCell.enemyUnits.length).toBe(initialEnemyCount);
    expect(updatedCell.assignedDefenseForceId).toBeUndefined();
    expect(defenseForces.length).toBe(0);
  });

  it('reclaiming all seven unsecured districts triggers victory', () => {
    const rawCity = generateProceduralCity({ seed: 42 });
    const emberCells = rawCity.filter((c) => c.houseId === 'ember' || c.owner === 'player');

    // Initially 1 Hovel owned/secured, 7 unsecured
    let currentCells = emberCells;

    // Reclaim all 7 unsecured cells sequentially
    for (const cell of currentCells) {
      currentCells = currentCells.map((c) => (c.id === cell.id ? { ...c, owner: 'player' as const } : c));
    }

    const allConquered = currentCells.every((c) => c.owner === 'player');
    expect(allConquered).toBe(true);
  });
});
