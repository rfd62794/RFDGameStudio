"""
DGT Platform Version Gatekeeper
Enforces Python 3.12 requirement for production deployment
"""

import sys
from loguru import logger


def verify_python_version() -> bool:
    """Enforce the DGT 3.12 Standard.
    
    Returns:
        bool: True if Python version is valid, False otherwise
        
    Raises:
        SystemExit: If Python version is not supported
    """
    if sys.version_info.major == 3 and sys.version_info.minor == 12:
        logger.info(f"✅ DGT Environment Validated: Python {sys.version}")
        return True
    else:
        logger.critical(f"❌ FATAL: DGT Platform requires Python 3.12")
        logger.critical(f"❌ Detected: {sys.version}")
        logger.critical(f"❌ Please install Python 3.12: https://www.python.org/downloads/")
        sys.exit(1)


def get_python_version_info() -> dict:
    """Get detailed Python version information for debugging.
    
    Returns:
        dict: Python version details
    """
    return {
        "major": sys.version_info.major,
        "minor": sys.version_info.minor,
        "micro": sys.version_info.micro,
        "releaselevel": sys.version_info.releaselevel,
        "serial": sys.version_info.serial,
        "version": sys.version,
        "platform": sys.platform,
        "implementation": sys.implementation.name if hasattr(sys, 'implementation') else 'unknown'
    }


def check_compatibility_features() -> dict:
    """Check for Python 3.12 specific features used by DGT Platform.
    
    Returns:
        dict: Feature compatibility status
    """
    features = {
        "f_string_performance": True,  # 3.12 improved f-string performance
        "type_statement_syntax": True,  # 3.12 type alias syntax
        "typing_improvements": True,    # 3.12 typing enhancements
        "memory_efficiency": True,       # 3.12 memory optimizations
        "concurrency_improvements": True  # 3.12 threading improvements
    }
    
    # Check if we're actually running on 3.12
    if not (sys.version_info.major == 3 and sys.version_info.minor == 12):
        for feature in features:
            features[feature] = False
    
    return features


def log_system_info() -> None:
    """Log detailed system information for debugging."""
    version_info = get_python_version_info()
    features = check_compatibility_features()
    
    logger.info("🔍 DGT Platform System Information")
    logger.info(f"📋 Python Version: {version_info['version']}")
    logger.info(f"🖥️  Platform: {version_info['platform']}")
    logger.info(f"⚙️  Implementation: {version_info['implementation']}")
    
    logger.info("🚀 Python 3.12 Features:")
    for feature, available in features.items():
        status = "✅" if available else "❌"
        logger.info(f"   {status} {feature.replace('_', ' ').title()}")


# Automatic version check on import
if __name__ == "__main__":
    verify_python_version()
else:
    # When imported as a module, verify version but don't exit
    if not (sys.version_info.major == 3 and sys.version_info.minor == 12):
        logger.warning(f"⚠️  Warning: DGT Platform recommends Python 3.12")
        logger.warning(f"⚠️  Current version: {sys.version}")
        logger.warning(f"⚠️  Some features may not work correctly")
