"""
Specialized asset loader following Single Responsibility Principle.

Handles only the loading and validation of binary assets from disk.
Optimized with proper resource cleanup and memory management.
"""

import mmap
import struct
import gzip
import pickle
import weakref
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from contextlib import contextmanager
import threading

from loguru import logger

from .interfaces import IAssetLoader, AssetMetadata, LoadResult


class MemoryMappedFile:
    """
    RAII wrapper for memory-mapped files with automatic cleanup.
    
    Ensures proper resource cleanup even in exception scenarios.
    """
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._file_handle = None
        self._mmap_handle = None
        self._lock = threading.RLock()
        self._closed = False
        
    def __enter__(self):
        """Context manager entry."""
        self.open()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with cleanup."""
        self.close()
        
    def open(self) -> None:
        """Open file for memory mapping."""
        with self._lock:
            if self._closed:
                raise ValueError("File handle has been closed")
            
            if self._file_handle is not None:
                return  # Already open
            
            try:
                self._file_handle = open(self.file_path, 'rb')
                self._mmap_handle = mmap.mmap(
                    self._file_handle.fileno(),
                    0,
                    access=mmap.ACCESS_READ
                )
                logger.debug(f"📂 Memory-mapped file: {self.file_path}")
                
            except Exception as e:
                self._cleanup_handles()
                raise RuntimeError(f"Failed to memory-map file {self.file_path}: {e}")
    
    def close(self) -> None:
        """Close file handles and cleanup."""
        with self._lock:
            if self._closed:
                return
            
            self._cleanup_handles()
            self._closed = True
            logger.debug(f"🗑️ Closed memory-mapped file: {self.file_path}")
    
    def read(self, offset: int, size: int) -> bytes:
        """Read data from memory-mapped file."""
        with self._lock:
            if self._closed or self._mmap_handle is None:
                raise ValueError("File is not open")
            
            return self._mmap_handle[offset:offset + size]
    
    def slice(self, offset: int = 0) -> bytes:
        """Get slice of memory-mapped data."""
        with self._lock:
            if self._closed or self._mmap_handle is None:
                raise ValueError("File is not open")
            
            return self._mmap_handle[offset:]
    
    @property
    def size(self) -> int:
        """Get file size."""
        with self._lock:
            if self._closed or self._mmap_handle is None:
                raise ValueError("File is not open")
            
            return len(self._mmap_handle)
    
    def _cleanup_handles(self) -> None:
        """Internal cleanup method."""
        if self._mmap_handle:
            try:
                self._mmap_handle.close()
            except Exception as e:
                logger.error(f"❌ Error closing mmap handle: {e}")
            finally:
                self._mmap_handle = None
        
        if self._file_handle:
            try:
                self._file_handle.close()
            except Exception as e:
                logger.error(f"❌ Error closing file handle: {e}")
            finally:
                self._file_handle = None


class BinaryAssetLoader(IAssetLoader):
    """
    Loads and validates binary DGT asset files.
    
    Single responsibility: Asset loading and format validation.
    Optimized with proper resource management and cleanup.
    """
    
    def __init__(self, validation_enabled: bool = True):
        self.validation_enabled = validation_enabled
        self._mapped_file: Optional[MemoryMappedFile] = None
        self._asset_data: Optional[Dict[str, Any]] = None
        self._metadata: Optional[AssetMetadata] = None
        self._cleanup_callbacks: List[Callable] = []
        
        # Register cleanup with weakref finalizer
        self._finalizer = weakref.finalize(self, self._force_cleanup)
        
    def load_assets(self, asset_path: Path) -> bool:
        """
        Load assets from binary file with memory mapping.
        
        Args:
            asset_path: Path to the assets.dgt binary file
            
        Returns:
            True if loading succeeded, False otherwise
        """
        try:
            logger.info(f"📦 Loading binary assets from {asset_path}")
            
            # Use RAII for file handling
            with MemoryMappedFile(asset_path) as mapped_file:
                self._mapped_file = mapped_file
                
                # Validate and parse header
                self._metadata = self._parse_header()
                if not self._metadata:
                    return False
                
                # Read and decompress asset data
                self._asset_data = self._read_asset_data(self._metadata.data_offset)
                
                if self.validation_enabled:
                    self._validate_asset_data()
                
                logger.info(f"✅ Successfully loaded {self._metadata.asset_count} assets")
                return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load assets: {e}")
            self.cleanup()
            return False
    
    def validate_asset_format(self, data: bytes) -> bool:
        """
        Validate binary asset format.
        
        Args:
            data: Raw binary data to validate
            
        Returns:
            True if format is valid, False otherwise
        """
        try:
            if len(data) < 40:
                return False
            
            magic = data[:4]
            return magic == b'DGT\x01'
            
        except Exception:
            return False
    
    def get_asset_data(self) -> Optional[Dict[str, Any]]:
        """Get loaded asset data."""
        return self._asset_data
    
    def get_metadata(self) -> Optional[AssetMetadata]:
        """Get asset metadata from loaded file."""
        return self._metadata
    
    def add_cleanup_callback(self, callback: Callable) -> None:
        """Add cleanup callback for custom resource cleanup."""
        self._cleanup_callbacks.append(callback)
    
    def cleanup(self) -> None:
        """Clean up memory-mapped resources."""
        # Execute cleanup callbacks
        for callback in self._cleanup_callbacks:
            try:
                callback()
            except Exception as e:
                logger.error(f"❌ Cleanup callback failed: {e}")
        
        self._cleanup_callbacks.clear()
        
        # Clear data
        self._asset_data = None
        self._metadata = None
        
        # Close mapped file
        if self._mapped_file:
            self._mapped_file.close()
            self._mapped_file = None
        
        logger.info("🧹 AssetLoader cleaned up")
    
    def _parse_header(self) -> Optional[AssetMetadata]:
        """Parse and validate file header."""
        try:
            if not self._mapped_file:
                raise ValueError("No file mapped")
            
            header_data = self._mapped_file.read(0, 40)
            magic = header_data[:4]
            version = struct.unpack('<I', header_data[4:8])[0]
            build_time = struct.unpack('<d', header_data[8:16])[0]
            checksum = header_data[16:32]
            asset_count = struct.unpack('<I', header_data[32:36])[0]
            data_offset = struct.unpack('<I', header_data[36:40])[0]
            
            if magic != b'DGT\x01':
                logger.error(f"❌ Invalid file format: {magic}")
                return None
            
            metadata = AssetMetadata(
                version=version,
                build_time=build_time,
                checksum=checksum.hex(),
                asset_count=asset_count,
                data_offset=data_offset
            )
            
            logger.info(f"✅ Validated DGT binary v{metadata.version}")
            logger.info(f"📊 Assets: {metadata.asset_count}")
            logger.info(f"🔤 Checksum: {metadata.checksum}")
            
            return metadata
            
        except Exception as e:
            logger.error(f"❌ Failed to parse header: {e}")
            return None
    
    def _read_asset_data(self, data_offset: int) -> Optional[Dict[str, Any]]:
        """Read and decompress asset data."""
        try:
            if not self._mapped_file:
                raise ValueError("No file mapped")
            
            # Read compressed data
            raw_data = self._mapped_file.slice(data_offset)
            
            # Find gzip start
            gzip_start = raw_data.find(b'\x1f\x8b')
            if gzip_start == -1:
                raise ValueError("No gzip data found in file")
            
            compressed_data = raw_data[gzip_start:]
            asset_data = pickle.loads(gzip.decompress(compressed_data))
            
            logger.debug("✅ Asset data decompressed successfully")
            return asset_data
            
        except Exception as e:
            logger.error(f"❌ Failed to read asset data: {e}")
            return None
    
    def _validate_asset_data(self) -> None:
        """Validate loaded asset data structure."""
        if not self._asset_data:
            raise ValueError("No asset data to validate")
        
        required_keys = ['sprite_bank', 'tile_registry', 'object_registry', 
                        'environment_registry', 'interaction_registry']
        
        missing_keys = [key for key in required_keys if key not in self._asset_data]
        if missing_keys:
            raise ValueError(f"Missing required asset keys: {missing_keys}")
        
        # Validate asset counts match metadata
        total_assets = 0
        for registry_key in required_keys:
            registry = self._asset_data[registry_key]
            if isinstance(registry, dict):
                total_assets += len(registry.get('sprites', {})) if 'sprites' in registry else len(registry)
        
        if total_assets != self._metadata.asset_count:
            logger.warning(f"⚠️ Asset count mismatch: expected {self._metadata.asset_count}, found {total_assets}")
        
        logger.debug("✅ Asset data validation passed")
    
    def _force_cleanup(self) -> None:
        """Force cleanup called by finalizer."""
        try:
            self.cleanup()
        except Exception:
            pass  # Ignore errors during finalization


class LoadResultFactory:
    """Factory for creating LoadResult objects."""
    
    @staticmethod
    def success(metadata: AssetMetadata) -> LoadResult:
        """Create successful load result."""
        return LoadResult(success=True, metadata=metadata)
    
    @staticmethod
    def failure(error: str) -> LoadResult:
        """Create failed load result."""
        return LoadResult(success=False, error=error)
