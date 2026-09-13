"""
Python Version Manager - Enforces Python 3.12 for DGT Platform

Extracted and adapted from DuggerGitTools to provide strict version enforcement.
This ensures deterministic behavior and protects against version drift.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import Optional, Tuple

from loguru import logger


class PythonVersionManager:
    """Manages Python version detection and enforcement for DGT Platform.
    
    Key Features:
    - Strict Python 3.12.x enforcement
    - Cross-platform version detection
    - Virtual environment management
    - Version validation and error reporting
    """
    
    REQUIRED_VERSION = (3, 12)
    VERSION_STRING = "3.12"
    
    def __init__(self, project_root: Path):
        """Initialize PythonVersionManager for a project.
        
        Args:
            project_root: Project root directory
        """
        self.project_root = project_root
        self.logger = logger.bind(component="PythonVersionManager")
    
    def check_current_version(self) -> Tuple[bool, str]:
        """Check if current Python version meets requirements.
        
        Returns:
            Tuple of (is_valid, error_message_or_version_info)
        """
        current_version = (
            sys.version_info.major, 
            sys.version_info.minor, 
            sys.version_info.micro
        )
        current_version_str = f"{current_version[0]}.{current_version[1]}.{current_version[2]}"
        
        if not (self.REQUIRED_VERSION <= (current_version[0], current_version[1]) < (self.REQUIRED_VERSION[0], self.REQUIRED_VERSION[1] + 1)):
            error_msg = (
                f"DGT Platform requires Python {self.VERSION_STRING}.x. "
                f"Current version: {current_version_str}\n"
                "This ensures deterministic behavior and protects against version drift.\n"
                "Please install Python 3.12 and create a fresh virtual environment.\n"
                "\nInstallation commands:\n"
                "  # Windows (use py launcher)\n"
                "  py -3.12 -m venv .venv\n"
                "  .venv\\Scripts\\activate\n"
                "\n"
                "  # Linux/macOS\n"
                "  python3.12 -m venv .venv\n"
                "  source .venv/bin/activate"
            )
            return False, error_msg
        
        return True, current_version_str
    
    def find_python_312(self) -> Optional[str]:
        """Find Python 3.12 executable on the system.
        
        Returns:
            Command string for Python 3.12, or None if not found
        """
        # Windows: Try py launcher first
        if os.name == "nt":
            candidates = [
                f"py -{self.VERSION_STRING}",
                f"python{self.VERSION_STRING}",
                "python"
            ]
        else:
            candidates = [
                f"python{self.VERSION_STRING}",
                f"python3.{self.VERSION_STRING.split('.')[1]}",
                "python3",
                "python"
            ]
        
        for cmd in candidates:
            try:
                result = subprocess.run(
                    cmd.split() + ["-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0 and result.stdout.strip().startswith(self.VERSION_STRING):
                    self.logger.info(f"Found Python {self.VERSION_STRING}: {cmd}")
                    return cmd
            except Exception:
                continue
        
        self.logger.error(f"Python {self.VERSION_STRING} not found on system")
        return None
    
    def create_venv_312(self, venv_name: str = ".venv") -> bool:
        """Create Python 3.12 virtual environment.
        
        Args:
            venv_name: Name of virtual environment directory
            
        Returns:
            True if successful, False otherwise
        """
        python_cmd = self.find_python_312()
        if not python_cmd:
            self.logger.error(f"Cannot create venv: Python {self.VERSION_STRING} not found")
            return False
        
        venv_path = self.project_root / venv_name
        
        self.logger.info(f"Creating Python {self.VERSION_STRING} venv at {venv_path}")
        
        try:
            subprocess.run(
                python_cmd.split() + ["-m", "venv", str(venv_path)],
                check=True,
                capture_output=True,
                text=True
            )
            
            # Verify creation
            if os.name == "nt":
                python_exe = venv_path / "Scripts" / "python.exe"
            else:
                python_exe = venv_path / "bin" / "python"
            
            if not python_exe.exists():
                self.logger.error(f"Venv created but Python executable not found: {python_exe}")
                return False
            
            # Verify version
            result = subprocess.run(
                [str(python_exe), "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout.strip().startswith(self.VERSION_STRING):
                self.logger.info(f"✅ Successfully created Python {self.VERSION_STRING} venv: {venv_path}")
                return True
            else:
                self.logger.error(f"Venv created but wrong Python version: {result.stdout.strip()}")
                return False
                
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Failed to create venv: {e.stderr}")
            return False
    
    def check_venv_version(self, venv_path: Path) -> Tuple[bool, str]:
        """Check Python version in existing virtual environment.
        
        Args:
            venv_path: Path to virtual environment
            
        Returns:
            Tuple of (is_valid, version_or_error_message)
        """
        if os.name == "nt":
            python_exe = venv_path / "Scripts" / "python.exe"
        else:
            python_exe = venv_path / "bin" / "python"
        
        if not python_exe.exists():
            return False, f"Python executable not found: {python_exe}"
        
        try:
            result = subprocess.run(
                [str(python_exe), "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode != 0:
                return False, f"Failed to get version from venv: {result.stderr}"
            
            version = result.stdout.strip()
            if version.startswith(self.VERSION_STRING):
                return True, version
            else:
                return False, f"Wrong Python version in venv: {version} (requires {self.VERSION_STRING}.x)"
                
        except Exception as e:
            return False, f"Error checking venv version: {e}"
    
    def enforce_version_or_exit(self) -> None:
        """Enforce Python 3.12 requirement, exit if not met.
        
        This is the main entry point for version enforcement.
        Call this at the start of your application.
        """
        is_valid, message = self.check_current_version()
        
        if not is_valid:
            self.logger.error(message)
            sys.exit(1)
        
        self.logger.info(f"✅ Python version validated: {message}")
    
    def setup_or_validate_venv(self, auto_create: bool = True) -> bool:
        """Set up or validate Python 3.12 virtual environment.
        
        Args:
            auto_create: Create venv if not found
            
        Returns:
            True if valid venv exists or was created successfully
        """
        # Check if we're in a venv
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            # We're in a venv, check its version
            is_valid, message = self.check_current_version()
            if is_valid:
                self.logger.info(f"✅ Active venv has correct Python version: {message}")
                return True
            else:
                self.logger.error(f"Active venv has wrong Python version: {message}")
                return False
        
        # Check for existing venv
        venv_names = [".venv", "venv", "env", ".env"]
        for venv_name in venv_names:
            venv_path = self.project_root / venv_name
            if venv_path.exists():
                is_valid, message = self.check_venv_version(venv_path)
                if is_valid:
                    self.logger.info(f"✅ Found valid venv: {venv_path} (Python {message})")
                    self.logger.info(f"Activate with: {'source' if os.name != 'nt' else ''} {venv_path}{('/bin/activate' if os.name != 'nt' else '\\Scripts\\activate')}")
                    return True
                else:
                    self.logger.warning(f"Invalid venv found: {message}")
        
        # Create new venv if allowed
        if auto_create:
            self.logger.info("No valid venv found, creating new Python 3.12 venv...")
            return self.create_venv_312()
        else:
            self.logger.error("No valid Python 3.12 venv found and auto_create=False")
            return False


# Convenience function for direct usage
def enforce_python_312(project_root: Optional[Path] = None) -> None:
    """Convenience function to enforce Python 3.12 requirement.
    
    Args:
        project_root: Project root path (defaults to current working directory)
    """
    if project_root is None:
        project_root = Path.cwd()
    
    manager = PythonVersionManager(project_root)
    manager.enforce_version_or_exit()
