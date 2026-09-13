// DGT Harvest Rust Core - High-Performance Image Processing
// Rust-powered semantic scanning for instant asset analysis
// Python 3.12 Compatible

use pyo3::prelude::*;
use pyo3::types::PyBytes;
use image::{GenericImageView, Rgba, DynamicImage, GrayImage, Luma};
use rayon::prelude::*;
use std::collections::HashMap;

/// Material DNA - Complete sprite analysis
#[pyclass]
#[derive(Clone)]
struct MaterialDNA {
    #[pyo3(get)]
    alpha_bounding_box: (u32, u32, u32, u32), // x, y, width, height
    
    #[pyo3(get)]
    material_type: String,
    
    #[pyo3(get)]
    confidence: f64,
    
    #[pyo3(get)]
    color_profile: HashMap<String, f64>,
    
    #[pyo3(get)]
    edge_density: f64,
    
    #[pyo3(get)]
    is_object: bool, // High edge density = object, low = texture
    
    #[pyo3(get)]
    dominant_color: (u8, u8, u8), // RGB
    
    #[pyo3(get)]
    transparency_ratio: f64,
}

/// Material Types for Intelligent Classification
#[derive(Debug, Clone, PartialEq)]
enum MaterialType {
    Wood,
    Stone,
    Grass,
    Water,
    Metal,
    Glass,
    Organic,
    Unknown,
}

impl MaterialType {
    fn to_string(&self) -> String {
        match self {
            MaterialType::Wood => "wood".to_string(),
            MaterialType::Stone => "stone".to_string(),
            MaterialType::Grass => "grass".to_string(),
            MaterialType::Water => "water".to_string(),
            MaterialType::Metal => "metal".to_string(),
            MaterialType::Glass => "glass".to_string(),
            MaterialType::Organic => "organic".to_string(),
            MaterialType::Unknown => "unknown".to_string(),
        }
    }
}

/// High-performance Material Triage Engine
#[pyclass]
struct MaterialTriageEngine {
    wood_threshold: (u8, u8, u8), // RGB ranges for wood
    stone_threshold: (u8, u8, u8), // RGB ranges for stone
    grass_threshold: (u8, u8, u8), // RGB ranges for grass
    water_threshold: (u8, u8, u8), // RGB ranges for water
    edge_threshold: f64, // Edge density threshold for object vs texture
}

#[pymethods]
impl MaterialTriageEngine {
    #[new]
    fn new() -> Self {
        Self {
            // Wood: High Brown (R: 100-150, G: 50-100, B: 20-60)
            wood_threshold: (125, 75, 40),
            // Stone: Gray Neutral (R ≈ G ≈ B)
            stone_threshold: (128, 128, 128),
            // Grass: High Green (G > R & B)
            grass_threshold: (80, 150, 60),
            // Water: High Blue (B > 150)
            water_threshold: (60, 80, 180),
            edge_threshold: 0.2, // 20% edge density threshold
        }
    }

    /// Complete Material Triage Analysis
    fn analyze_sprite<'a>(&self, py: Python<'a>, pixels: &'a PyBytes, width: u32, height: u32) -> PyResult<MaterialDNA> {
        let pixels_data = unsafe { std::slice::from_raw_parts(pixels.as_ptr(), pixels.len()?) };
        
        if pixels_data.len() != (width * height * 4) as usize {
            return Err(pyo3::exceptions::PyValueError::new_err(
                "Pixel data length doesn't match dimensions"
            ));
        }

        // Rust-powered Material Triage
        let dna = self.material_triage_internal(pixels_data, width, height);
        
        Ok(MaterialDNA {
            alpha_bounding_box: dna.alpha_bounding_box,
            material_type: dna.material_type.to_string(),
            confidence: dna.confidence,
            color_profile: dna.color_profile,
            edge_density: dna.edge_density,
            is_object: dna.is_object,
            dominant_color: dna.dominant_color,
            transparency_ratio: dna.transparency_ratio,
        })
    }

    /// Get Alpha-Bounding Box (ABB) - Tight bounding box of non-transparent pixels
    fn get_alpha_bounding_box<'a>(&self, py: Python<'a>, pixels: &'a PyBytes, width: u32, height: u32) -> PyResult<(u32, u32, u32, u32)> {
        let pixels_data = unsafe { std::slice::from_raw_parts(pixels.as_ptr(), pixels.len()?) };
        let abb = self.calculate_alpha_bounding_box(pixels_data, width, height);
        Ok(abb)
    }

    /// Get Color Histogram for Material Profiling
    fn get_color_histogram<'a>(&self, py: Python<'a>, pixels: &'a PyBytes, width: u32, height: u32) -> PyResult<HashMap<String, f64>> {
        let pixels_data = unsafe { std::slice::from_raw_parts(pixels.as_ptr(), pixels.len()?) };
        let histogram = self.calculate_color_histogram(pixels_data, width, height);
        Ok(histogram)
    }

    /// Get Edge Density for Object vs Texture Detection
    fn get_edge_density<'a>(&self, py: Python<'a>, pixels: &'a PyBytes, width: u32, height: u32) -> PyResult<f64> {
        let pixels_data = unsafe { std::slice::from_raw_parts(pixels.as_ptr(), pixels.len()?) };
        let edge_density = self.calculate_edge_density(pixels_data, width, height);
        Ok(edge_density)
    }
}

impl MaterialTriageEngine {
    /// Internal Material Triage Engine
    fn material_triage_internal(&self, pixels: &[u8], width: u32, height: u32) -> MaterialDNAInternal {
        // 1. Calculate Alpha-Bounding Box
        let abb = self.calculate_alpha_bounding_box(pixels, width, height);
        
        // 2. Calculate Color Histogram
        let color_profile = self.calculate_color_histogram(pixels, width, height);
        
        // 3. Calculate Edge Density
        let edge_density = self.calculate_edge_density(pixels, width, height);
        
        // 4. Determine Material Type
        let material_type = self.classify_material(&color_profile, edge_density);
        
        // 5. Calculate Confidence
        let confidence = self.calculate_confidence(&color_profile, &material_type);
        
        // 6. Get Dominant Color
        let dominant_color = self.get_dominant_color(pixels, width, height);
        
        // 7. Calculate Transparency Ratio
        let transparency_ratio = self.calculate_transparency_ratio(pixels, width, height);
        
        // 8. Determine if Object vs Texture
        let is_object = edge_density > self.edge_threshold;
        
        MaterialDNAInternal {
            alpha_bounding_box: abb,
            material_type,
            confidence,
            color_profile,
            edge_density,
            is_object,
            dominant_color,
            transparency_ratio,
        }
    }

    /// Calculate Alpha-Bounding Box (ABB) - Tight bounding box of non-transparent pixels
    fn calculate_alpha_bounding_box(&self, pixels: &[u8], width: u32, height: u32) -> (u32, u32, u32, u32) {
        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0;
        let mut max_y = 0;
        
        // Process pixels in chunks of 4 (RGBA)
        for (i, chunk) in pixels.chunks_exact(4).enumerate() {
            let x = (i as u32) % width;
            let y = (i as u32) / width;
            
            let a = chunk[3]; // Alpha channel
            
            if a > 0 {  // Non-transparent pixel
                min_x = min_x.min(x);
                min_y = min_y.min(y);
                max_x = max_x.max(x);
                max_y = max_y.max(y);
            }
        }
        
        // Return (x, y, width, height)
        let bbox_width = if max_x >= min_x { max_x - min_x + 1 } else { 0 };
        let bbox_height = if max_y >= min_y { max_y - min_y + 1 } else { 0 };
        
        (min_x, min_y, bbox_width, bbox_height)
    }

    /// Calculate Color Histogram for Material Profiling
    fn calculate_color_histogram(&self, pixels: &[u8], width: u32, height: u32) -> HashMap<String, f64> {
        let mut color_counts = HashMap::new();
        let mut total_pixels = 0u32;
        
        // Process pixels in chunks of 4 (RGBA)
        for chunk in pixels.chunks_exact(4) {
            let r = chunk[0];
            let g = chunk[1];
            let b = chunk[2];
            let a = chunk[3];
            
            if a > 0 {  // Non-transparent pixel
                total_pixels += 1;
                
                // Classify color
                let color_class = self.classify_color(r, g, b);
                *color_counts.entry(color_class).or_insert(0) += 1;
            }
        }
        
        // Convert to percentages
        let mut histogram = HashMap::new();
        if total_pixels > 0 {
            for (color, count) in color_counts {
                histogram.insert(color, count as f64 / total_pixels as f64);
            }
        }
        
        histogram
    }

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
        
        // Metal detection (High contrast, metallic)
        if (r > 200 || g > 200 || b > 200) && gray_variance > 50 {
            return "metal".to_string();
        }
        
        // Glass detection (Translucent-like colors)
        if (r > 180 && g > 180 && b > 200) || (r > 200 && g > 200 && b > 200) {
            return "glass".to_string();
        }
        
        // Organic detection (Natural colors)
        if (r > 100 && g > 80 && b < 100) || (r > 150 && g < 100 && b < 100) {
            return "organic".to_string();
        }
        
        "other".to_string()
    }

    /// Calculate Edge Density using Canny-like edge detection
    fn calculate_edge_density(&self, pixels: &[u8], width: u32, height: u32) -> f64 {
        // Convert to grayscale for edge detection
        let mut gray_pixels = vec![0u8; (width * height) as usize];
        
        for (i, chunk) in pixels.chunks_exact(4).enumerate() {
            let r = chunk[0] as f32;
            let g = chunk[1] as f32;
            let b = chunk[2] as f32;
            let a = chunk[3];
            
            if a > 0 {
                // Convert to grayscale using luminance formula
                gray_pixels[i] = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
            } else {
                gray_pixels[i] = 0;
            }
        }
        
        // Simple edge detection using Sobel operator
        let mut edge_pixels = vec![0u8; (width * height) as usize];
        let mut edge_count = 0u32;
        
        for y in 1..height-1 {
            for x in 1..width-1 {
                let idx = (y * width + x) as usize;
                
                // Get surrounding pixels
                let tl = gray_pixels[((y-1) * width + (x-1)) as usize] as i32;
                let tm = gray_pixels[((y-1) * width + x) as usize] as i32;
                let tr = gray_pixels[((y-1) * width + (x+1)) as usize] as i32;
                let ml = gray_pixels[(y * width + (x-1)) as usize] as i32;
                let mr = gray_pixels[(y * width + (x+1)) as usize] as i32;
                let bl = gray_pixels[((y+1) * width + (x-1)) as usize] as i32;
                let bm = gray_pixels[((y+1) * width + x) as usize] as i32;
                let br = gray_pixels[((y+1) * width + (x+1)) as usize] as i32;
                
                // Sobel X and Y
                let sobel_x = (-tl + tr - 2*ml + 2*mr - bl + br).abs();
                let sobel_y = (-tl - 2*tm - tr + bl + 2*bm + br).abs();
                
                // Edge magnitude
                let edge_magnitude = (sobel_x + sobel_y) as u8;
                
                if edge_magnitude > 30 { // Threshold for edge detection
                    edge_pixels[idx] = 255;
                    edge_count += 1;
                }
            }
        }
        
        // Calculate edge density
        let total_pixels = width * height;
        if total_pixels > 0 {
            edge_count as f64 / total_pixels as f64
        } else {
            0.0
        }
    }

    /// Classify material based on color profile and edge density
    fn classify_material(&self, color_profile: &HashMap<String, f64>, edge_density: f64) -> MaterialType {
        // Find dominant color
        let mut max_ratio = 0.0;
        let mut dominant_color = "unknown";
        
        for (color, ratio) in color_profile {
            if *ratio > max_ratio {
                max_ratio = *ratio;
                dominant_color = color;
            }
        }
        
        // Apply "Vase vs Ocean" logic
        match dominant_color {
            "water" => {
                if edge_density > 0.15 {
                    MaterialType::Glass // Vase - high edge density
                } else {
                    MaterialType::Water // Ocean - low edge density
                }
            }
            "wood" => MaterialType::Wood,
            "stone" => MaterialType::Stone,
            "grass" => MaterialType::Grass,
            "metal" => MaterialType::Metal,
            "glass" => MaterialType::Glass,
            "organic" => MaterialType::Organic,
            _ => MaterialType::Unknown,
        }
    }

    /// Calculate confidence in material classification
    fn calculate_confidence(&self, color_profile: &HashMap<String, f64>, material_type: &MaterialType) -> f64 {
        let material_str = material_type.to_string();
        
        if let Some(ratio) = color_profile.get(&material_str) {
            // Base confidence from dominant color ratio
            let base_confidence = *ratio;
            
            // Boost confidence if material is well-defined
            let confidence_boost = match material_type {
                MaterialType::Wood | MaterialType::Stone | MaterialType::Grass | MaterialType::Water => 0.2,
                MaterialType::Metal | MaterialType::Glass => 0.1,
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

    /// Calculate transparency ratio
    fn calculate_transparency_ratio(&self, pixels: &[u8], width: u32, height: u32) -> f64 {
        let mut transparent_count = 0u32;
        let mut total_count = 0u32;
        
        for chunk in pixels.chunks_exact(4) {
            total_count += 1;
            if chunk[3] == 0 {
                transparent_count += 1;
            }
        }
        
        if total_count > 0 {
            transparent_count as f64 / total_count as f64
        } else {
            0.0
        }
    }
}

/// Internal MaterialDNA structure
struct MaterialDNAInternal {
    alpha_bounding_box: (u32, u32, u32, u32),
    material_type: MaterialType,
    confidence: f64,
    color_profile: HashMap<String, f64>,
    edge_density: f64,
    is_object: bool,
    dominant_color: (u8, u8, u8),
    transparency_ratio: f64,
}

/// Python module definition
#[pymodule]
fn dgt_harvest_rust(_py: Python, m: &Bound<PyModule>) -> PyResult<()> {
    m.add_class::<MaterialTriageEngine>()?;
    m.add_class::<MaterialDNA>()?;
    
    Ok(())
}
