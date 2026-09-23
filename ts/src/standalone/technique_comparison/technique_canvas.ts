/**
 * Technique 7: Procedural Canvas Rendering
 *
 * Canvas 2D with radial gradients and blend-mode compositing.
 * A genuinely different rendering pipeline from SVG — uses
 * globalCompositeOperation for layer blending, radial gradients
 * for soft volumetric look. Still fully deterministic.
 *
 * Family: Smooth-procedural-vector
 *
 * Note: This technique returns an HTML <canvas> element with an
 * inline draw script, not SVG. The entry point handles it specially.
 */

import { FILL, STROKE } from './shared';

export function renderCanvasContainer(): string {
  // Returns an HTML canvas element. The drawing happens in a
  // script tag that runs after the canvas is in the DOM.
  const canvasId = 'technique-canvas';
  return `<canvas id="${canvasId}" width="200" height="200" style="image-rendering: auto;"></canvas>
  <script>
    (function() {
      var canvas = document.getElementById('${canvasId}');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 200, 200);

      // Helper: draw a radial-gradient circle (soft volumetric look)
      function gradientCircle(cx, cy, r, color) {
        var grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, 0, cx, cy, r);
        grad.addColorStop(0, lightenColor(color, 0.3));
        grad.addColorStop(0.7, color);
        grad.addColorStop(1, darkenColor(color, 0.3));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      function lightenColor(hex, amt) {
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        r = Math.min(255, Math.round(r + (255-r)*amt));
        g = Math.min(255, Math.round(g + (255-g)*amt));
        b = Math.min(255, Math.round(b + (255-b)*amt));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }

      function darkenColor(hex, amt) {
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        r = Math.max(0, Math.round(r * (1-amt)));
        g = Math.max(0, Math.round(g * (1-amt)));
        b = Math.max(0, Math.round(b * (1-amt)));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }

      var color = '${FILL}';

      // Use 'source-over' for body parts (normal compositing)
      ctx.globalCompositeOperation = 'source-over';

      // Draw body parts as radial-gradient circles
      // Head
      gradientCircle(100, 35, 14, color);
      // Torso
      gradientCircle(100, 75, 22, color);
      // Arms
      gradientCircle(74, 78, 10, color);
      gradientCircle(68, 95, 8, color);
      gradientCircle(126, 78, 10, color);
      gradientCircle(132, 95, 8, color);
      // Legs
      gradientCircle(90, 120, 11, color);
      gradientCircle(88, 145, 9, color);
      gradientCircle(110, 120, 11, color);
      gradientCircle(112, 145, 9, color);

      // Add a subtle outline using 'source-atop' composite
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = '${STROKE}';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.5, 0.5, 199, 199);
    })();
  </script>`;
}

export const techniqueInfo = {
  id: 'canvas',
  name: '7. Procedural Canvas Rendering',
  family: 'Smooth-procedural-vector',
  description: 'Canvas 2D with radial gradients for soft volumetric look. Different rendering pipeline from SVG. Blend modes for layer compositing.',
};
