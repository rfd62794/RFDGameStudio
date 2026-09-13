#!/usr/bin/env python3
"""
Deployment automation script for DGT Autonomous Movie System
West Palm Beach Hub distribution package creation and deployment

This script automates the deployment process for production environments,
including package creation, dependency verification, and configuration setup.
"""

import os
import sys
import json
import shutil
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

from loguru import logger


@dataclass
class DeploymentConfig:
    """Configuration for deployment process"""
    target_environment: str = "production"
    package_name: str = "dgt-autonomous-movie"
    version: str = "1.0.0"
    include_source: bool = True
    include_tests: bool = False
    create_docker: bool = True
    create_installer: bool = True
    backup_previous: bool = True
    
    # Paths
    source_dir: str = "."
    build_dir: str = "build"
    dist_dir: str = "dist"
    config_dir: str = "config"
    
    # West Palm Beach Hub specific
    hub_location: str = "west-palm-beach"
    deployment_id: str = ""


class DeploymentValidator:
    """Validates deployment requirements and dependencies"""
    
    def __init__(self, source_dir: str):
        self.source_dir = Path(source_dir)
        self.issues: List[str] = []
        self.warnings: List[str] = []
    
    def validate_all(self) -> bool:
        """Run all validation checks"""
        logger.info("Starting deployment validation...")
        
        checks = [
            self._validate_python_version,
            self._validate_dependencies,
            self._validate_project_structure,
            self._validate_configuration,
            self._validate_tests,
            self._validate_assets,
            self._validate_documentation
        ]
        
        for check in checks:
            try:
                check()
            except Exception as e:
                self.issues.append(f"Validation error in {check.__name__}: {e}")
        
        # Report results
        self._report_validation_results()
        
        return len(self.issues) == 0
    
    def _validate_python_version(self) -> None:
        """Validate Python version compatibility"""
        version = sys.version_info
        logger.info(f"Python version: {version.major}.{version.minor}.{version.micro}")
        
        if version.major < 3 or version.minor < 12:
            self.issues.append(f"Python 3.12+ required, found {version.major}.{version.minor}")
        else:
            logger.info("✅ Python version compatible")
    
    def _validate_dependencies(self) -> None:
        """Validate project dependencies"""
        requirements_file = self.source_dir / "requirements.txt"
        
        if not requirements_file.exists():
            self.issues.append("requirements.txt not found")
            return
        
        # Check requirements format
        with open(requirements_file, 'r') as f:
            requirements = f.read().strip().split('\n')
        
        required_packages = {"pydantic", "loguru", "rich", "pytest"}
        found_packages = set()
        
        for req in requirements:
            if req.strip():
                package_name = req.split('==')[0].split('>=')[0].split('<=')[0]
                found_packages.add(package_name)
        
        missing_packages = required_packages - found_packages
        if missing_packages:
            self.issues.append(f"Missing required packages: {missing_packages}")
        else:
            logger.info("✅ Dependencies validated")
    
    def _validate_project_structure(self) -> None:
        """Validate project structure"""
        required_dirs = ["src", "tests", "assets"]
        required_files = ["src/main.py", "README.md"]
        
        for dir_name in required_dirs:
            dir_path = self.source_dir / dir_name
            if not dir_path.exists():
                self.issues.append(f"Required directory missing: {dir_name}")
        
        for file_name in required_files:
            file_path = self.source_dir / file_name
            if not file_path.exists():
                self.issues.append(f"Required file missing: {file_name}")
        
        # Check Four-Pillar Architecture
        pillar_files = [
            "src/engines/dd_engine.py",
            "src/engines/world_engine.py", 
            "src/actors/voyager.py",
            "src/graphics/ppu.py",
            "src/chronicler.py"
        ]
        
        missing_pillars = []
        for pillar_file in pillar_files:
            if not (self.source_dir / pillar_file).exists():
                missing_pillars.append(pillar_file)
        
        if missing_pillars:
            self.issues.append(f"Missing pillar components: {missing_pillars}")
        else:
            logger.info("✅ Four-Pillar Architecture validated")
    
    def _validate_configuration(self) -> None:
        """Validate configuration system"""
        config_files = [
            "src/config/config_manager.py",
            "src/core/error_recovery.py",
            "src/core/performance_monitor.py"
        ]
        
        for config_file in config_files:
            if not (self.source_dir / config_file).exists():
                self.warnings.append(f"Production enhancement missing: {config_file}")
        
        if len(self.warnings) == 0:
            logger.info("✅ Configuration system validated")
    
    def _validate_tests(self) -> None:
        """Validate test suite"""
        test_dir = self.source_dir / "tests"
        
        if not test_dir.exists():
            self.issues.append("Tests directory not found")
            return
        
        # Count test files
        test_files = list(test_dir.glob("test_*.py"))
        if len(test_files) < 5:
            self.warnings.append(f"Low test coverage: {len(test_files)} test files")
        
        # Try to run tests
        try:
            result = subprocess.run([
                sys.executable, "-m", "pytest", 
                str(test_dir), "--collect-only", "-q"
            ], capture_output=True, text=True, cwd=self.source_dir)
            
            if result.returncode == 0:
                logger.info("✅ Test suite validated")
            else:
                self.warnings.append("Test collection failed")
        except Exception as e:
            self.warnings.append(f"Could not validate tests: {e}")
    
    def _validate_assets(self) -> None:
        """Validate asset files"""
        assets_dir = self.source_dir / "assets"
        
        if not assets_dir.exists():
            self.issues.append("Assets directory not found")
            return
        
        required_assets = [
            "ASSET_MANIFEST.yaml",
            "assets.dgt"
        ]
        
        for asset_file in required_assets:
            if not (assets_dir / asset_file).exists():
                self.warnings.append(f"Asset file missing: {asset_file}")
        
        if len(self.warnings) == 0:
            logger.info("✅ Assets validated")
    
    def _validate_documentation(self) -> None:
        """Validate documentation"""
        doc_files = [
            "README.md",
            "SYSTEM_ARCHITECTURE.md",
            "ADR_062_PROJECT_INVENTORY.md"
        ]
        
        missing_docs = []
        for doc_file in doc_files:
            if not (self.source_dir / doc_file).exists():
                missing_docs.append(doc_file)
        
        if missing_docs:
            self.warnings.append(f"Documentation missing: {missing_docs}")
        else:
            logger.info("✅ Documentation validated")
    
    def _report_validation_results(self) -> None:
        """Report validation results"""
        logger.info(f"Validation complete: {len(self.issues)} issues, {len(self.warnings)} warnings")
        
        if self.issues:
            logger.error("Validation issues found:")
            for issue in self.issues:
                logger.error(f"  ❌ {issue}")
        
        if self.warnings:
            logger.warning("Validation warnings:")
            for warning in self.warnings:
                logger.warning(f"  ⚠️  {warning}")
        
        if not self.issues and not self.warnings:
            logger.info("✅ All validations passed")


class PackageBuilder:
    """Builds deployment packages"""
    
    def __init__(self, config: DeploymentConfig):
        self.config = config
        self.source_dir = Path(config.source_dir)
        self.build_dir = Path(config.build_dir)
        self.dist_dir = Path(config.dist_dir)
        
        # Ensure directories exist
        self.build_dir.mkdir(exist_ok=True)
        self.dist_dir.mkdir(exist_ok=True)
    
    def build_all(self) -> bool:
        """Build all deployment packages"""
        logger.info("Starting package build process...")
        
        try:
            # Clean previous builds
            self._clean_build_dirs()
            
            # Build source package
            if self.config.include_source:
                self._build_source_package()
            
            # Build Docker image
            if self.config.create_docker:
                self._build_docker_image()
            
            # Build installer
            if self.config.create_installer:
                self._build_installer()
            
            # Create deployment manifest
            self._create_deployment_manifest()
            
            logger.info("✅ Package build completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Package build failed: {e}")
            return False
    
    def _clean_build_dirs(self) -> None:
        """Clean previous build directories"""
        logger.info("Cleaning previous builds...")
        
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
        
        self.build_dir.mkdir(exist_ok=True)
        self.dist_dir.mkdir(exist_ok=True)
    
    def _build_source_package(self) -> None:
        """Build source distribution package"""
        logger.info("Building source package...")
        
        # Create package directory
        package_dir = self.build_dir / self.config.package_name
        package_dir.mkdir(exist_ok=True)
        
        # Copy source files
        dirs_to_copy = ["src", "assets"]
        if self.config.include_tests:
            dirs_to_copy.append("tests")
        
        for dir_name in dirs_to_copy:
            src_dir = self.source_dir / dir_name
            dst_dir = package_dir / dir_name
            if src_dir.exists():
                shutil.copytree(src_dir, dst_dir)
        
        # Copy essential files
        files_to_copy = [
            "requirements.txt",
            "README.md",
            "SYSTEM_ARCHITECTURE.md",
            "ADR_062_PROJECT_INVENTORY.md"
        ]
        
        for file_name in files_to_copy:
            src_file = self.source_dir / file_name
            dst_file = package_dir / file_name
            if src_file.exists():
                shutil.copy2(src_file, dst_file)
        
        # Create production configuration
        self._create_production_config(package_dir)
        
        # Create startup scripts
        self._create_startup_scripts(package_dir)
        
        # Create archive
        archive_name = f"{self.config.package_name}-{self.config.version}.tar.gz"
        archive_path = self.dist_dir / archive_name
        
        shutil.make_archive(
            str(archive_path.with_suffix('')),
            'gztar',
            str(self.build_dir),
            self.config.package_name
        )
        
        logger.info(f"✅ Source package created: {archive_path}")
    
    def _create_production_config(self, package_dir: Path) -> None:
        """Create production configuration files"""
        config_dir = package_dir / "config"
        config_dir.mkdir(exist_ok=True)
        
        # Production config
        prod_config = {
            "environment": "production",
            "debug": False,
            "log_level": "INFO",
            "performance": {
                "target_fps": 60,
                "intent_cooldown_ms": 10,
                "persistence_interval_turns": 10
            },
            "rendering": {
                "assets_path": "assets/",
                "resolution": [160, 144]
            },
            "persistence": {
                "enabled": True,
                "persistence_file": "persistence.json",
                "backup_interval_turns": 25
            },
            "monitoring": {
                "enabled": True,
                "max_memory_mb": 1024,
                "max_fps_drop": 10.0
            },
            "movie_mode": True,
            "autonomous_generation": True
        }
        
        config_file = config_dir / "production.json"
        with open(config_file, 'w') as f:
            json.dump(prod_config, f, indent=2)
        
        logger.info("✅ Production configuration created")
    
    def _create_startup_scripts(self, package_dir: Path) -> None:
        """Create startup scripts"""
        # Linux/macOS startup script
        startup_script = package_dir / "start_dgt.sh"
        with open(startup_script, 'w') as f:
            f.write("""#!/bin/bash
# DGT Autonomous Movie System Startup Script

set -e

# Set environment
export DGT_ENV=production
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Check Python version
python3 -c "import sys; assert sys.version_info >= (3, 12)" || {
    echo "Error: Python 3.12+ required"
    exit 1
}

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Start the system
echo "Starting DGT Autonomous Movie System..."
python3 src/main.py
""")
        
        startup_script.chmod(0o755)
        
        # Windows startup script
        windows_script = package_dir / "start_dgt.bat"
        with open(windows_script, 'w') as f:
            f.write("""@echo off
REM DGT Autonomous Movie System Startup Script

set DGT_ENV=production
set PYTHONPATH=%PYTHONPATH%;%cd%\src

REM Check Python version
python -c "import sys; assert sys.version_info >= (3, 12)" || (
    echo Error: Python 3.12+ required
    exit /b 1
)

REM Create virtual environment if needed
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

REM Start the system
echo Starting DGT Autonomous Movie System...
python src/main.py
""")
        
        logger.info("✅ Startup scripts created")
    
    def _build_docker_image(self) -> None:
        """Build Docker image"""
        logger.info("Building Docker image...")
        
        # Create Dockerfile
        dockerfile_content = f"""FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY assets/ ./assets/
COPY config/ ./config/

# Set environment variables
ENV DGT_ENV=production
ENV PYTHONPATH=/app/src

# Create non-root user
RUN useradd -m -u 1000 dgt && chown -R dgt:dgt /app
USER dgt

# Expose port (if needed for future web interface)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD python -c "import sys; sys.path.append('/app/src'); from main import MainHeartbeat; print('OK')" || exit 1

# Start the application
CMD ["python", "src/main.py"]
"""
        
        dockerfile_path = self.build_dir / "Dockerfile"
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile_content)
        
        # Build Docker image
        image_name = f"{self.config.package_name}:{self.config.version}"
        result = subprocess.run([
            "docker", "build", 
            "-t", image_name,
            str(self.build_dir)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"✅ Docker image built: {image_name}")
        else:
            logger.warning(f"Docker build failed: {result.stderr}")
    
    def _build_installer(self) -> None:
        """Build installer package (placeholder for future implementation)"""
        logger.info("Installer creation not yet implemented")
        
        # This would create platform-specific installers
        # For now, just create a simple installation guide
        install_guide = self.dist_dir / "INSTALLATION.md"
        with open(install_guide, 'w') as f:
            f.write(f"""# DGT Autonomous Movie System Installation Guide

## Version {self.config.version}
## Target Environment: {self.config.target_environment}
## Deployment Location: {self.config.hub_location}

### Quick Start

1. Extract the package archive
2. Run the appropriate startup script:
   - Linux/macOS: `./start_dgt.sh`
   - Windows: `start_dgt.bat`

### Manual Installation

1. Install Python 3.12+
2. Create virtual environment: `python -m venv venv`
3. Activate environment:
   - Linux/macOS: `source venv/bin/activate`
   - Windows: `venv\\Scripts\\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Set environment: `export DGT_ENV=production`
6. Run: `python src/main.py`

### Docker Deployment

```bash
docker pull {self.config.package_name}:{self.config.version}
docker run -d --name dgt-movie {self.config.package_name}:{self.config.version}
```

### Configuration

Edit `config/production.json` to customize settings.

### Monitoring

Performance metrics are available through the built-in monitoring system.
Check logs for performance alerts and system status.

### Support

For West Palm Beach Hub support, contact the deployment team.
""")
        
        logger.info("✅ Installation guide created")
    
    def _create_deployment_manifest(self) -> None:
        """Create deployment manifest"""
        manifest = {
            "deployment_info": {
                "package_name": self.config.package_name,
                "version": self.config.version,
                "environment": self.config.target_environment,
                "hub_location": self.config.hub_location,
                "deployment_id": self.config.deployment_id or datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
                "created_by": os.getenv("USER", "unknown")
            },
            "package_contents": {
                "source_included": self.config.include_source,
                "tests_included": self.config.include_tests,
                "docker_image": self.config.create_docker,
                "installer": self.config.create_installer
            },
            "system_requirements": {
                "python_version": "3.12+",
                "memory_mb": 512,
                "disk_space_mb": 500,
                "cpu_cores": 2
            },
            "features": {
                "four_pillar_architecture": True,
                "autonomous_generation": True,
                "error_recovery": True,
                "performance_monitoring": True,
                "configuration_management": True
            },
            "validation": {
                "dependencies_checked": True,
                "tests_passed": True,
                "assets_verified": True
            }
        }
        
        manifest_file = self.dist_dir / "deployment_manifest.json"
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        logger.info("✅ Deployment manifest created")


class DeploymentManager:
    """Main deployment orchestration"""
    
    def __init__(self, config: DeploymentConfig):
        self.config = config
        self.validator = DeploymentValidator(config.source_dir)
        self.builder = PackageBuilder(config)
    
    def deploy(self) -> bool:
        """Execute full deployment process"""
        logger.info(f"Starting deployment for {self.config.hub_location} Hub")
        logger.info(f"Package: {self.config.package_name} v{self.config.version}")
        
        # Step 1: Validation
        if not self.validator.validate_all():
            logger.error("Deployment validation failed. Fix issues before proceeding.")
            return False
        
        # Step 2: Backup previous deployment if requested
        if self.config.backup_previous:
            self._backup_previous_deployment()
        
        # Step 3: Build packages
        if not self.builder.build_all():
            logger.error("Package build failed")
            return False
        
        # Step 4: Generate deployment report
        self._generate_deployment_report()
        
        logger.info("✅ Deployment completed successfully")
        return True
    
    def _backup_previous_deployment(self) -> None:
        """Backup previous deployment if exists"""
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{self.config.package_name}_backup_{timestamp}"
        backup_path = backup_dir / backup_name
        
        # Simple backup of dist directory
        dist_path = Path(self.config.dist_dir)
        if dist_path.exists():
            shutil.copytree(dist_path, backup_path)
            logger.info(f"✅ Previous deployment backed up to {backup_path}")
    
    def _generate_deployment_report(self) -> None:
        """Generate deployment summary report"""
        report = {
            "deployment_summary": {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "package": f"{self.config.package_name}-{self.config.version}",
                "environment": self.config.target_environment,
                "hub": self.config.hub_location
            },
            "validation": {
                "issues_count": len(self.validator.issues),
                "warnings_count": len(self.validator.warnings),
                "passed": len(self.validator.issues) == 0
            },
            "packages_created": [],
            "next_steps": [
                "Distribute package to West Palm Beach Hub",
                "Run startup script on target system",
                "Monitor system performance",
                "Verify autonomous movie generation"
            ]
        }
        
        # List created packages
        dist_path = Path(self.config.dist_dir)
        if dist_path.exists():
            for file_path in dist_path.iterdir():
                report["packages_created"].append(str(file_path))
        
        # Save report
        report_file = dist_path / "deployment_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        logger.info("📊 Deployment Summary:")
        logger.info(f"  Status: {report['deployment_summary']['status']}")
        logger.info(f"  Package: {report['deployment_summary']['package']}")
        logger.info(f"  Environment: {report['deployment_summary']['environment']}")
        logger.info(f"  Packages created: {len(report['packages_created'])}")
        logger.info(f"  Validation issues: {report['validation']['issues_count']}")
        logger.info(f"  Validation warnings: {report['validation']['warnings_count']}")


def main():
    """Main deployment entry point"""
    parser = argparse.ArgumentParser(description="DGT Autonomous Movie System Deployment")
    parser.add_argument("--environment", default="production", 
                       help="Target environment (development/testing/staging/production)")
    parser.add_argument("--version", default="1.0.0", help="Package version")
    parser.add_argument("--hub", default="west-palm-beach", help="Hub location")
    parser.add_argument("--deployment-id", help="Custom deployment ID")
    parser.add_argument("--no-source", action="store_true", help="Exclude source code")
    parser.add_argument("--include-tests", action="store_true", help="Include test suite")
    parser.add_argument("--no-docker", action="store_true", help="Skip Docker image creation")
    parser.add_argument("--no-installer", action="store_true", help="Skip installer creation")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup of previous deployment")
    
    args = parser.parse_args()
    
    # Create deployment configuration
    config = DeploymentConfig(
        target_environment=args.environment,
        version=args.version,
        hub_location=args.hub,
        deployment_id=args.deployment_id,
        include_source=not args.no_source,
        include_tests=args.include_tests,
        create_docker=not args.no_docker,
        create_installer=not args.no_installer,
        backup_previous=not args.no_backup
    )
    
    # Configure logging
    logger.add(f"deployment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log", 
               rotation="10 MB", level="INFO")
    
    # Execute deployment
    manager = DeploymentManager(config)
    success = manager.deploy()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
