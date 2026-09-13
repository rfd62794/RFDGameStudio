// DGT Harvest Rust Core - Simplified for PyO3 0.23
// Minimal viable implementation for Python 3.12

use pyo3::prelude::*;
use std::collections::HashMap;

/// Material DNA - Complete sprite analysis
#[pyclass]
#[derive(Clone)]
struct MaterialDNA {
    #[pyo3(get)]
    alpha_bounding_box: (u32, u32, u32, u32),
    
    #[pyo3(get)]
    material_type: String,
    
    #[pyo3(get)]
    confidence: f64,
    
    #[pyo3(get)]
    color_profile: HashMap<String, f64>,
    
    #[pyo3(get)]
    edge_density: f64,
    
    #[pyo3(get)]
    is_object: bool,
    
    #[pyo3(get)]
    dominant_color: (u8, u8, u8),
    
    #[pyo3(get)]
    transparency_ratio: f64,
}

/// High-performance Material Triage Engine
#[pyclass]
struct MaterialTriageEngine {
    edge_threshold: f64,
}

#[pymethods]
impl MaterialTriageEngine {
    #[new]
    fn new() -> Self {
        Self {
            edge_threshold: 0.2,
        }
    }

    /// Complete Material Triage Analysis
    fn analyze_sprite(&self, pixels: &[u8], width: u32, height: u32) -> PyResult<MaterialDNA> {
        if pixels.len() != (width * height * 4) as usize {
            return Err(pyo3::exceptions::PyValueError::new_err(
                "Pixel data length doesn't match dimensions"
            ));
        }

        // Simple analysis for MVP
        let mut color_counts = HashMap::new();
        let mut total_pixels = 0u32;
        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0u32;
        let mut max_y = 0u32;
        
        // Process pixels in chunks of 4 (RGBA)
        for (i, chunk) in pixels.chunks_exact(4).enumerate() {
            let x = (i as u32) % width;
            let y = (i as u32) / width;
            
            let r = chunk[0];
            let g = chunk[1];
            let b = chunk[2];
            let a = chunk[3];
            
            if a > 0 {
                total_pixels += 1;
                
                // Update bounding box
                min_x = min_x.min(x);
                min_y = min_y.min(y);
                max_x = max_x.max(x);
                max_y = max_y.max(y);
                
                // Classify color
                let color_class = self.classify_color(r, g, b);
                *color_counts.entry(color_class).or_insert(0) += 1;
            }
        }
        
        // Convert to percentages
        let mut color_profile = HashMap::new();
        if total_pixels > 0 {
            for (color, count) in color_counts {
                color_profile.insert(color, count as f64 / total_pixels as f64);
            }
        }
        
        // Calculate bounding box
        let bbox_width = if max_x >= min_x { max_x - min_x + 1 } else { 0 };
        let bbox_height = if max_y >= min_y { max_y - min_y + 1 } else { 0 };
        
        // Determine material type
        let material_type = self.classify_material(&color_profile);
        
        // Calculate confidence
        let confidence = self.calculate_confidence(&color_profile, &material_type);
        
        // Get dominant color
        let dominant_color = self.get_dominant_color(pixels, width, height);
        
        // Calculate transparency ratio
        let transparency_ratio = if total_pixels > 0 {
            ((width * height - total_pixels) as f64) / (width * height) as f64
        } else {
            1.0
        };
        
        // Simple edge density (placeholder)
        let edge_density = 0.1;
        let is_object = edge_density > self.edge_threshold;
        
        Ok(MaterialDNA {
            alpha_bounding_box: (min_x, min_y, bbox_width, bbox_height),
            material_type,
            confidence,
            color_profile,
            edge_density,
            is_object,
            dominant_color,
            transparency_ratio,
        })
    }

    /// Get Alpha-Bounding Box (ABB)
    fn get_alpha_bounding_box(&self, pixels: &[u8], width: u32, height: u32) -> PyResult<(u32, u32, u32, u32)> {
        if pixels.len() != (width * height * 4) as usize {
            return Err(pyo3::exceptions::PyValueError::new_err(
                "Pixel data length doesn't match dimensions"
            ));
        }

        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0u32;
        let mut max_y = 0u32;
        
        for (i, chunk) in pixels.chunks_exact(4).enumerate() {
            let x = (i as u32) % width;
            let y = (i as u32) / width;
            let a = chunk[3];
            
            if a > 0 {
                min_x = min_x.min(x);
                min_y = min_y.min(y);
                max_x = max_x.max(x);
                max_y = max_y.max(y);
            }
        }
        
        let bbox_width = if max_x >= min_x { max_x - min_x + 1 } else { 0 };
        let bbox_height = if max_y >= min_y { max_y - min_y + 1 } else { 0 };
        
        Ok((min_x, min_y, bbox_width, bbox_height))
    }
}

impl MaterialTriageEngine {
    /// Classify individual pixel color
    fn classify_color(&self, r: u8, g: u8, b: u8) -> String {
        // Wood detection (Brown range)
        if (100 <= r && r <= 150) && (50 <= g && g <= 100) && (20 <= b && b <= 60) {
            return "wood".to_string();
        }
        
        // Stone detection (Gray range)
        let gray_variance = ((r as i32 - g as i32).abs() + (g as i32 - b as i32).abs()) as u8;
        if gray_variance < 30 {
            return "stone".to_string();
        }
        
        // Grass detection (Green dominant)
        if g > r && g > b && g > 100 {
            return "grass".to_string();
        }
        
        // Water detection (Blue dominant)
        if b > 150 && b > r && b > g {
            return "water".to_string();
        }
        
        "other".to_string()
    }

    /// Classify material based on color profile
    fn classify_material(&self, color_profile: &HashMap<String, f64>) -> String {
        let mut max_ratio = 0.0;
        let mut material_type = "unknown";
        
        for (color, ratio) in color_profile {
            if *ratio > max_ratio {
                max_ratio = *ratio;
                material_type = color;
            }
        }
        
        material_type.to_string()
    }

    /// Calculate confidence in material classification
    fn calculate_confidence(&self, color_profile: &HashMap<String, f64>, material_type: &str) -> f64 {
        if let Some(ratio) = color_profile.get(material_type) {
            // Base confidence from dominant color ratio
            let base_confidence = *ratio;
            
            // Boost confidence if material is well-defined
            let confidence_boost = match material_type {
                "wood" | "stone" | "grass" | "water" => 0.2,
                _ => 0.0,
            };
            
            (base_confidence + confidence_boost).min(1.0)
        } else {
            0.5 // Default confidence for unknown materials
        }
    }

    /// Get dominant RGB color
    fn get_dominant_color(&self, pixels: &[u8], width: u32, height: u32) -> (u8, u8, u8) {
        let mut r_sum = 0u32;
        let mut g_sum = 0u32;
        let mut b_sum = 0u32;
        let mut count = 0u32;
        
        for chunk in pixels.chunks_exact(4) {
            let a = chunk[3];
            if a > 0 {
                r_sum += chunk[0] as u32;
                g_sum += chunk[1] as u32;
                b_sum += chunk[2] as u32;
                count += 1;
            }
        }
        
        if count > 0 {
            (
                (r_sum / count) as u8,
                (g_sum / count) as u8,
                (b_sum / count) as u8,
            )
        } else {
            (0, 0, 0)
        }
    }
}

/// Python module definition
#[pymodule]
fn dgt_harvest_rust(_py: Python, m: &Bound<PyModule>) -> PyResult<()> {
    m.add_class::<MaterialTriageEngine>()?;
    m.add_class::<MaterialDNA>()?;
    
    Ok(())
}
