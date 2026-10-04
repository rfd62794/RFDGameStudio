import { useCallback, RefObject, MutableRefObject } from 'react';
import {
  BuildingCategory,
  BuildingDef,
  BuildingInstance,
  MaterialType,
  PipeDirection,
  PipeRouteState,
} from '../types';
import { CellularGrid, GRID_HEIGHT, GRID_WIDTH } from '../simulation/grid';
import { BuildingManager, computeRoute } from '../simulation/buildings';
import { BUILDING_TILE } from '../simulation/buildingDefs';
import { ToolMode } from '../components/BuildPanel';

interface CanvasInputParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  gridRef: MutableRefObject<CellularGrid>;
  buildingMgrRef: MutableRefObject<BuildingManager>;
  pipeRouteStateRef: MutableRefObject<PipeRouteState>;
  isPanningRef: MutableRefObject<boolean>;
  isPaintingRef: MutableRefObject<boolean>;
  panStartRef: MutableRefObject<{ x: number; y: number }>;
  pan: { x: number; y: number };
  zoom: number;
  setPan: (p: { x: number; y: number }) => void;
  setZoom: (z: number) => void;
  setHoverCell: (c: { x: number; y: number } | null) => void;
  clampPan: (px: number, py: number, zoom: number, w: number, h: number) => { x: number; y: number };
  toolMode: ToolMode;
  selectedDef: BuildingDef | null;
  setSelectedDef: (d: BuildingDef | null) => void;
  pipeDirection: PipeDirection;
  brushMaterial: MaterialType;
  brushSize: number;
  freeBuild: boolean;
  structuralSolidAvailable: number;
  selectedBuilding: BuildingInstance | null;
  setSelectedBuilding: (b: BuildingInstance | null) => void;
  setFilterPopupPos: (p: { x: number; y: number } | null) => void;
}

export function useCanvasInput(p: CanvasInputParams) {
  const {
    canvasRef,
    gridRef,
    buildingMgrRef,
    pipeRouteStateRef,
    isPanningRef,
    isPaintingRef,
    panStartRef,
    pan,
    zoom,
    setPan,
    setZoom,
    setHoverCell,
    clampPan,
    toolMode,
    selectedDef,
    setSelectedDef,
    pipeDirection,
    brushMaterial,
    brushSize,
    freeBuild,
    structuralSolidAvailable,
    selectedBuilding,
    setSelectedBuilding,
    setFilterPopupPos,
  } = p;

  // Convert screen mouse coordinates to grid cell coordinates
  const screenToGrid = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const gridX = Math.floor((screenX - pan.x) / zoom);
      const gridY = Math.floor((screenY - pan.y) / zoom);

      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        return { x: gridX, y: gridY };
      }
      return null;
    },
    [canvasRef, pan, zoom]
  );

  const executeActionAt = useCallback(
    (caX: number, caY: number, screenClientX?: number, screenClientY?: number) => {
      const grid = gridRef.current;
      const bMgr = buildingMgrRef.current;

      const tileX = Math.floor(caX / BUILDING_TILE);
      const tileY = Math.floor(caY / BUILDING_TILE);

      if (toolMode === 'DEMOLISH') {
        bMgr.removeBuildingOrPipe(grid, tileX, tileY);
        if (selectedBuilding && (selectedBuilding.tileX === tileX || selectedBuilding.tileY === tileY)) {
          setSelectedBuilding(null);
          setFilterPopupPos(null);
        }
        return;
      }

      if (toolMode === 'PAINT') {
        const radius = brushSize;
        for (let dy = -radius + 1; dy < radius; dy++) {
          for (let dx = -radius + 1; dx < radius; dx++) {
            if (dx * dx + dy * dy < radius * radius) {
              const tx = caX + dx;
              const ty = caY + dy;
              if (grid.isInBounds(tx, ty) && grid.structureFlags[grid.getIndex(tx, ty)] !== 1) {
                grid.setCell(tx, ty, brushMaterial);
              }
            }
          }
        }
        return;
      }

      if (toolMode === 'BUILD') {
        if (selectedDef) {
          // Placement check
          const check = bMgr.canPlaceBuilding(grid, selectedDef, tileX, tileY);
          if (!check.valid) return;

          // Resource cost check
          if (!freeBuild && structuralSolidAvailable < selectedDef.cost) {
            return;
          }

          const placed = bMgr.placeBuilding(grid, selectedDef, tileX, tileY, pipeDirection);
          if (
            placed !== null ||
            selectedDef.category === BuildingCategory.PIPE ||
            selectedDef.category === BuildingCategory.WALL
          ) {
            if (!freeBuild) {
              bMgr.consumeMaterialFromContainers(MaterialType.STRUCTURAL_SOLID, selectedDef.cost);
            }
          }
        } else {
          // No building selected -> Click on placed building opens Filter Popup
          const clickedBuilding = bMgr.getBuildingAt(tileX, tileY);
          if (clickedBuilding) {
            setSelectedBuilding(clickedBuilding);
            // Calculate screen position anchored at top-right of building
            const canvas = canvasRef.current;
            const rect = canvas?.getBoundingClientRect();
            const screenX = (rect?.left || 0) + pan.x + (clickedBuilding.tileX + clickedBuilding.tileW) * BUILDING_TILE * zoom;
            const screenY = (rect?.top || 0) + pan.y + clickedBuilding.tileY * BUILDING_TILE * zoom;
            setFilterPopupPos({
              x: screenClientX !== undefined ? screenClientX + 15 : screenX + 10,
              y: screenClientY !== undefined ? screenClientY - 20 : screenY,
            });
          } else {
            // Clicked empty cell -> Deselect
            setSelectedBuilding(null);
            setFilterPopupPos(null);
          }
        }
      }
    },
    [
      gridRef,
      buildingMgrRef,
      toolMode,
      selectedBuilding,
      setSelectedBuilding,
      setFilterPopupPos,
      brushSize,
      brushMaterial,
      selectedDef,
      freeBuild,
      structuralSolidAvailable,
      pipeDirection,
      canvasRef,
      pan,
      zoom,
    ]
  );

  // Canvas Mouse & Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle click or Alt + Left click: Pan view
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // Right Click: If drawing route, cancel. If building is selected, cancel placement. Otherwise, demolish structure.
    if (e.button === 2) {
      e.preventDefault();
      if (pipeRouteStateRef.current.mode === 'drawing') {
        pipeRouteStateRef.current = { mode: 'idle' };
        return;
      }
      if (selectedDef !== null) {
        setSelectedDef(null);
        return;
      }
      const coords = screenToGrid(e.clientX, e.clientY);
      if (coords) {
        const tileX = Math.floor(coords.x / BUILDING_TILE);
        const tileY = Math.floor(coords.y / BUILDING_TILE);
        buildingMgrRef.current.removeBuildingOrPipe(gridRef.current, tileX, tileY);
      }
      return;
    }

    // Left Click Action
    if (e.button === 0) {
      const coords = screenToGrid(e.clientX, e.clientY);
      if (!coords) return;

      if (toolMode === 'BUILD' && selectedDef?.category === BuildingCategory.PIPE) {
        const tileX = Math.floor(coords.x / BUILDING_TILE);
        const tileY = Math.floor(coords.y / BUILDING_TILE);
        const tilePos = { tx: tileX, ty: tileY };
        const initialRoute = computeRoute(tilePos, tilePos, true, buildingMgrRef.current);
        pipeRouteStateRef.current = {
          mode: 'drawing',
          startTile: tilePos,
          currentTile: tilePos,
          route: initialRoute,
          horizontalFirst: true,
          valid: initialRoute.length > 0,
        };
        return;
      }

      isPaintingRef.current = true;
      executeActionAt(coords.x, coords.y, e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      const canvas = canvasRef.current;
      const cWidth = canvas?.width || 960;
      const cHeight = canvas?.height || 600;

      const rawPanX = e.clientX - panStartRef.current.x;
      const rawPanY = e.clientY - panStartRef.current.y;
      const clamped = clampPan(rawPanX, rawPanY, zoom, cWidth, cHeight);
      setPan(clamped);
      return;
    }

    const coords = screenToGrid(e.clientX, e.clientY);
    setHoverCell(coords);

    if (pipeRouteStateRef.current.mode === 'drawing' && coords) {
      const curTile = {
        tx: Math.floor(coords.x / BUILDING_TILE),
        ty: Math.floor(coords.y / BUILDING_TILE),
      };
      pipeRouteStateRef.current.currentTile = curTile;
      const route = computeRoute(
        pipeRouteStateRef.current.startTile,
        curTile,
        pipeRouteStateRef.current.horizontalFirst,
        buildingMgrRef.current
      );
      pipeRouteStateRef.current.route = route;
      pipeRouteStateRef.current.valid = route.length > 0;
      return;
    }

    if (isPaintingRef.current && coords) {
      executeActionAt(coords.x, coords.y, e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    isPaintingRef.current = false;

    if (pipeRouteStateRef.current.mode === 'drawing') {
      const state = pipeRouteStateRef.current;
      pipeRouteStateRef.current = { mode: 'idle' };

      if (state.valid && state.route.length > 0 && selectedDef) {
        const totalCost = state.route.length * (selectedDef.cost || 1);
        if (freeBuild || structuralSolidAvailable >= totalCost) {
          buildingMgrRef.current.placePipeRoute(gridRef.current, state.route, pipeDirection);
          if (!freeBuild) {
            buildingMgrRef.current.consumeMaterialFromContainers(
              MaterialType.STRUCTURAL_SOLID,
              totalCost
            );
          }
        }
      }
    }
  };

  const handleMouseLeave = () => {
    isPanningRef.current = false;
    isPaintingRef.current = false;
    setHoverCell(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;

    const defaultCellSize = Math.max(
      1,
      Math.min(
        Math.floor(cWidth / GRID_WIDTH),
        Math.floor(cHeight / GRID_HEIGHT)
      )
    );

    const minZoom = Math.max(1.0, 0.5 * defaultCellSize);
    const maxZoom = 8.0 * defaultCellSize;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * zoomFactor));

    // Anchor zoom relative to mouse cursor
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rawPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const rawPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    const clamped = clampPan(rawPanX, rawPanY, newZoom, cWidth, cHeight);

    setZoom(newZoom);
    setPan(clamped);
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
  };
}
