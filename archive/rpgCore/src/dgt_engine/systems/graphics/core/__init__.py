"""
Graphics Engine Core
"""
from .material_analyzer import MaterialAnalyzer

class GraphicsEngine:
    def __init__(self):
        self.analyzer = MaterialAnalyzer()
