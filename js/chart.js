// chart.js — Pie chart drawing (Canvas 2D API)
// Feature: expense-budget-visualizer

/**
 * Fixed category color map per spec.
 * @type {{ Food: string, Transport: string, Fun: string }}
 */
export const CATEGORY_COLORS = {
  Food: '#FF6384',
  Transport: '#36A2EB',
  Fun: '#FFCE56',
};

/**
 * Compute chart segments from a totals object.
 * Zero-value categories are excluded from the result.
 *
 * @param {{ Food: number, Transport: number, Fun: number, total: number }} totals
 * @returns {Array<{ label: string, value: number, color: string }>}
 *   label is formatted as "CategoryName XX.X%" (percentage rounded to 1 decimal place).
 */
export function computeSegments(totals) {
  const categories = ['Food', 'Transport', 'Fun'];
  const total = totals.total;

  return categories
    .filter((cat) => totals[cat] > 0)
    .map((cat) => {
      const value = totals[cat];
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
      return {
        label: `${cat} ${pct}%`,
        value,
        color: CATEGORY_COLORS[cat],
      };
    });
}

/**
 * Draw a pie chart onto the provided <canvas> element.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @param {Array<{ label: string, value: number, color: string }>} segments
 *   Each segment has:
 *     - label: formatted string e.g. "Food 45.3%"
 *     - value: raw positive amount
 *     - color: hex color string
 *
 * When segments is empty (or all values are zero), draws a centered
 * placeholder message and returns without rendering any arcs.
 */
export function drawPieChart(canvas, segments) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // --- Empty / no-data state ---
  const hasData = segments && segments.length > 0 &&
    segments.reduce((sum, s) => sum + s.value, 0) > 0;

  if (!hasData) {
    ctx.save();
    ctx.fillStyle = '#888888';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data to display', cx, cy);
    ctx.restore();
    return;
  }

  // --- Geometry ---
  const radius = Math.min(cx, cy) * 0.7;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Pre-compute per-slice data (angles, midpoints)
  let startAngle = -Math.PI / 2; // Start from 12 o'clock
  const slices = segments.map((seg) => {
    const sliceAngle = (seg.value / total) * 2 * Math.PI;
    const midAngle = startAngle + sliceAngle / 2;
    const slice = { seg, startAngle, sliceAngle, midAngle };
    startAngle += sliceAngle;
    return slice;
  });

  // --- Draw filled arcs ---
  slices.forEach(({ seg, startAngle: sa, sliceAngle }) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, sa, sa + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    // White border between slices for visual separation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // --- Draw labels ---
  // Labels are placed inside the slice at 65% of the radius.
  // For very small slices (angle < ~17°), labels are pushed outside to avoid overlap.
  const SMALL_SLICE_THRESHOLD = (17 / 180) * Math.PI;

  slices.forEach(({ seg, sliceAngle, midAngle }) => {
    const isSmall = sliceAngle < SMALL_SLICE_THRESHOLD;
    const labelRadius = isSmall ? radius * 1.2 : radius * 0.65;
    const lx = cx + Math.cos(midAngle) * labelRadius;
    const ly = cy + Math.sin(midAngle) * labelRadius;

    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Use the pre-formatted label from the segment (e.g. "Food 45.3%")
    const labelText = seg.label;

    // Subtle shadow for readability on any background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(labelText, lx + 1, ly + 1);

    // White text inside slices; dark text for outside labels
    ctx.fillStyle = isSmall ? '#333333' : '#ffffff';
    ctx.fillText(labelText, lx, ly);

    ctx.restore();
  });
}
