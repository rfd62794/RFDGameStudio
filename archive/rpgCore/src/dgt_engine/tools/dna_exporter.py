"""
DNA Exporter - ADR 094: The Automated Harvesting Protocol
Exports harvested sprites to SovereignRegistry-compatible YAML format
"""

import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from loguru import logger
import json
from datetime import datetime

@dataclass
class AssetDNA:
    """DNA structure for harvested asset"""
    asset_id: str
    asset_type: str  # 'actor' or 'object'
    material_id: str
    sprite_id: str
    description: str
    tags: List[str]
    collision: bool
    interaction_hooks: List[str]
    d20_checks: Dict[str, Any]
    palette: List[str]
    source_sheet: str
    grid_position: List[int]
    harvest_timestamp: str
    version: str = "1.0"

@dataclass
class HarvestMetadata:
    """Metadata for harvesting session"""
    session_id: str
    source_file: str
    harvest_timestamp: str
    total_assets: int
    asset_types: Dict[str, int]
    materials_used: List[str]
    version: str = "1.0"

class DNAExporter:
    """Exports harvested assets to SovereignRegistry-compatible format"""
    
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Subdirectories
        self.assets_dir = self.output_dir / "assets"
        self.assets_dir.mkdir(exist_ok=True)
        
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        
        self.metadata_dir = self.output_dir / "metadata"
        self.metadata_dir.mkdir(exist_ok=True)
        
        logger.info(f"🧬 DNA Exporter initialized for {self.output_dir}")
    
    def export_asset_dna(self, dna: AssetDNA) -> bool:
        """Export single asset DNA to YAML"""
        try:
            # Create YAML data
            yaml_data = asdict(dna)
            
            # Add export metadata
            yaml_data['export_metadata'] = {
                'exported_by': 'DGT Asset Ingestor',
                'export_timestamp': datetime.now().isoformat(),
                'format_version': dna.version
            }
            
            # Save YAML
            yaml_path = self.assets_dir / f"{dna.asset_id}.yaml"
            with open(yaml_path, 'w') as f:
                yaml.dump(yaml_data, f, default_flow_style=False, sort_keys=False)
            
            logger.info(f"🧬 Exported DNA: {dna.asset_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export DNA {dna.asset_id}: {e}")
            return False
    
    def export_batch_dna(self, assets: List[AssetDNA], session_id: str) -> bool:
        """Export batch of assets with session metadata"""
        try:
            # Create harvest metadata
            metadata = self._create_harvest_metadata(assets, session_id)
            
            # Export individual assets
            exported_count = 0
            for asset in assets:
                if self.export_asset_dna(asset):
                    exported_count += 1
            
            # Export session metadata
            metadata_path = self.metadata_dir / f"harvest_{session_id}.yaml"
            with open(metadata_path, 'w') as f:
                yaml.dump(asdict(metadata), f, default_flow_style=False, sort_keys=False)
            
            # Export batch summary
            summary = {
                'session_id': session_id,
                'exported_assets': exported_count,
                'failed_assets': len(assets) - exported_count,
                'export_timestamp': datetime.now().isoformat(),
                'assets': [asset.asset_id for asset in assets]
            }
            
            summary_path = self.output_dir / "harvest_summary.json"
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"🧬 Exported batch: {exported_count}/{len(assets)} assets")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export batch {session_id}: {e}")
            return False
    
    def _create_harvest_metadata(self, assets: List[AssetDNA], session_id: str) -> HarvestMetadata:
        """Create metadata for harvest session"""
        # Count asset types
        asset_types = {}
        materials_used = set()
        
        for asset in assets:
            asset_types[asset.asset_type] = asset_types.get(asset.asset_type, 0) + 1
            materials_used.add(asset.material_id)
        
        return HarvestMetadata(
            session_id=session_id,
            source_file="asset_ingestor",
            harvest_timestamp=datetime.now().isoformat(),
            total_assets=len(assets),
            asset_types=asset_types,
            materials_used=list(materials_used)
        )
    
    def export_sovereign_registry(self, assets: List[AssetDNA]) -> bool:
        """Export assets in SovereignRegistry format"""
        try:
            # Create registry structure
            registry_data = {
                'version': '2.0',
                'harvested_assets': {},
                'metadata': {
                    'total_assets': len(assets),
                    'harvest_timestamp': datetime.now().isoformat(),
                    'exporter': 'DGT Asset Ingestor',
                    'format': 'sovereign_registry'
                }
            }
            
            # Add assets to registry
            for asset in assets:
                registry_data['harvested_assets'][asset.asset_id] = {
                    'object_type': asset.asset_type,
                    'material_id': asset.material_id,
                    'sprite_id': asset.sprite_id,
                    'description': asset.description,
                    'tags': asset.tags,
                    'collision': asset.collision,
                    'interaction_hooks': asset.interaction_hooks,
                    'd20_checks': asset.d20_checks,
                    'palette': asset.palette,
                    'source': asset.source_sheet,
                    'position': asset.grid_position,
                    'harvested_at': asset.harvest_timestamp
                }
            
            # Save registry
            registry_path = self.output_dir / "sovereign_registry.yaml"
            with open(registry_path, 'w') as f:
                yaml.dump(registry_data, f, default_flow_style=False, sort_keys=False)
            
            logger.info(f"🧬 Exported SovereignRegistry with {len(assets)} assets")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export SovereignRegistry: {e}")
            return False
    
    def export_material_presets(self, assets: List[AssetDNA]) -> bool:
        """Export material presets based on harvested assets"""
        try:
            # Collect material information
            materials = {}
            
            for asset in assets:
                if asset.material_id not in materials:
                    materials[asset.material_id] = {
                        'color': asset.palette[0] if asset.palette else '#808080',
                        'tags': [],
                        'assets': [],
                        'palettes': []
                    }
                
                # Add asset to material
                materials[asset.material_id]['assets'].append(asset.asset_id)
                
                # Add palette if unique
                if asset.palette and asset.palette not in materials[asset.material_id]['palettes']:
                    materials[asset.material_id]['palettes'].append(asset.palette)
                
                # Merge tags
                for tag in asset.tags:
                    if tag not in materials[asset.material_id]['tags']:
                        materials[asset.material_id]['tags'].append(tag)
            
            # Save material presets
            materials_path = self.output_dir / "material_presets.yaml"
            with open(materials_path, 'w') as f:
                yaml.dump(materials, f, default_flow_style=False, sort_keys=False)
            
            logger.info(f"🧬 Exported {len(materials)} material presets")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export material presets: {e}")
            return False
    
    def validate_export(self, asset: AssetDNA) -> List[str]:
        """Validate asset DNA before export"""
        issues = []
        
        # Check required fields
        if not asset.asset_id:
            issues.append("Missing asset_id")
        
        if not asset.asset_type:
            issues.append("Missing asset_type")
        
        if not asset.material_id:
            issues.append("Missing material_id")
        
        # Check asset type
        if asset.asset_type not in ['actor', 'object']:
            issues.append(f"Invalid asset_type: {asset.asset_type}")
        
        # Check palette
        if not asset.palette or len(asset.palette) == 0:
            issues.append("Missing palette")
        
        # Check grid position
        if not asset.grid_position or len(asset.grid_position) != 2:
            issues.append("Invalid grid_position")
        
        return issues
    
    def get_export_summary(self) -> Dict[str, Any]:
        """Get summary of exported assets"""
        summary = {
            'output_directory': str(self.output_dir),
            'subdirectories': {
                'assets': str(self.assets_dir),
                'images': str(self.images_dir),
                'metadata': str(self.metadata_dir)
            }
        }
        
        # Count exported files
        if self.assets_dir.exists():
            yaml_files = list(self.assets_dir.glob("*.yaml"))
            summary['exported_yaml_files'] = len(yaml_files)
            summary['exported_assets'] = [f.stem for f in yaml_files]
        
        return summary

# Factory function
def create_dna_exporter(output_dir: Path) -> DNAExporter:
    """Create DNA exporter instance"""
    return DNAExporter(output_dir)

if __name__ == "__main__":
    # Test the DNA exporter
    from pathlib import Path
    from palette_extractor import create_palette_extractor
    
    # Create test output directory
    output_dir = Path("test_output")
    
    # Create exporter
    exporter = create_dna_exporter(output_dir)
    
    # Create test asset DNA
    test_dna = AssetDNA(
        asset_id="test_tree_00",
        asset_type="object",
        material_id="wood",
        sprite_id="test_tree_00",
        description="Test tree asset",
        tags=["tree", "organic", "harvested"],
        collision=True,
        interaction_hooks=["examine", "chop"],
        d20_checks={},
        palette=["#5d4037", "#6b5447", "#4d3027", "#7b6557"],
        source_sheet="test_spritesheet",
        grid_position=[0, 0],
        harvest_timestamp=datetime.now().isoformat()
    )
    
    # Export test DNA
    success = exporter.export_asset_dna(test_dna)
    
    if success:
        print("✅ Test DNA export successful")
        
        # Get summary
        summary = exporter.get_export_summary()
        print(f"📊 Export Summary: {summary}")
    else:
        print("❌ Test DNA export failed")
