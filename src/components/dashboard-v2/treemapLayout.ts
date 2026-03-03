/**
 * Squarified Treemap Layout (Bruls-Huizing-van Wijk 2000)
 * No external dependencies. Outputs percentage-based coordinates.
 */

import type { MetricInsight } from './types';

export interface TreemapItem {
  id: string;                // "M1-obs-0", "M5-rec-2"
  metricCode: string;
  type: 'observation' | 'recommendation';
  text: string;
  weight: number;            // max(100 - score, 5)
  metricScore: number;
  metricName: string;
}

export interface TreemapRect {
  item: TreemapItem;
  x: number; y: number;     // percentage 0-100
  w: number; h: number;     // percentage 0-100
}

/** Collect all observations + recommendations as treemap items */
export function buildTreemapItems(
  insights: MetricInsight[],
  activeFilters?: Set<string>
): TreemapItem[] {
  const items: TreemapItem[] = [];

  for (const insight of insights) {
    if (activeFilters && activeFilters.size > 0 && !activeFilters.has(insight.metric_code)) {
      continue;
    }
    const weight = Math.max(100 - (insight.score || 0), 5);

    insight.observations?.forEach((text, i) => {
      items.push({
        id: `${insight.metric_code}-obs-${i}`,
        metricCode: insight.metric_code,
        type: 'observation',
        text,
        weight,
        metricScore: insight.score || 0,
        metricName: insight.metric_name || insight.metric_code,
      });
    });

    insight.recommendations?.forEach((text, i) => {
      items.push({
        id: `${insight.metric_code}-rec-${i}`,
        metricCode: insight.metric_code,
        type: 'recommendation',
        text,
        weight,
        metricScore: insight.score || 0,
        metricName: insight.metric_name || insight.metric_code,
      });
    });
  }

  // Sort by weight descending for optimal layout
  items.sort((a, b) => b.weight - a.weight);
  return items;
}

/** Aspect ratio of a row of items within a container of given length */
function worstRatio(row: number[], length: number): number {
  const totalArea = row.reduce((s, v) => s + v, 0);
  if (totalArea === 0 || length === 0) return Infinity;
  let worst = 0;
  for (const area of row) {
    const rowWidth = totalArea / length;
    const rowHeight = area / rowWidth;
    const ratio = Math.max(rowWidth / rowHeight, rowHeight / rowWidth);
    if (ratio > worst) worst = ratio;
  }
  return worst;
}

/** Squarified treemap — lays out items into a rectangle, returns percentage coords */
export function squarify(items: TreemapItem[], W: number, H: number): TreemapRect[] {
  if (items.length === 0) return [];

  const totalWeight = items.reduce((s, it) => s + it.weight, 0);
  if (totalWeight === 0) return [];

  // Normalize weights to areas within W*H
  const totalArea = W * H;
  const areas = items.map(it => (it.weight / totalWeight) * totalArea);

  const rects: TreemapRect[] = [];
  layoutRecursive(items, areas, 0, 0, W, H, rects);
  return rects;
}

function layoutRecursive(
  items: TreemapItem[],
  areas: number[],
  x: number, y: number,
  w: number, h: number,
  out: TreemapRect[]
): void {
  if (items.length === 0) return;

  if (items.length === 1) {
    out.push({ item: items[0], x, y, w, h });
    return;
  }

  // Determine shorter side
  const vertical = w >= h; // lay out along shorter dimension
  const sideLen = vertical ? h : w;

  // Greedily add items to current row while aspect ratio improves
  const row: number[] = [];
  const rowItems: TreemapItem[] = [];
  let remaining = areas.reduce((s, v) => s + v, 0);
  let bestRatio = Infinity;

  let splitIdx = 0;
  for (let i = 0; i < items.length; i++) {
    row.push(areas[i]);
    rowItems.push(items[i]);
    const ratio = worstRatio(row, sideLen);
    if (ratio <= bestRatio) {
      bestRatio = ratio;
      splitIdx = i + 1;
    } else {
      break;
    }
  }

  // Lay out the row
  const rowAreas = areas.slice(0, splitIdx);
  const rowTotal = rowAreas.reduce((s, v) => s + v, 0);
  const rowThickness = remaining > 0 ? (rowTotal / remaining) * (vertical ? w : h) : 0;

  let offset = 0;
  for (let i = 0; i < splitIdx; i++) {
    const itemLen = rowTotal > 0 ? (rowAreas[i] / rowTotal) * sideLen : 0;
    if (vertical) {
      out.push({ item: items[i], x, y: y + offset, w: rowThickness, h: itemLen });
    } else {
      out.push({ item: items[i], x: x + offset, y, w: itemLen, h: rowThickness });
    }
    offset += itemLen;
  }

  // Recurse on remaining items
  const restItems = items.slice(splitIdx);
  const restAreas = areas.slice(splitIdx);
  if (vertical) {
    layoutRecursive(restItems, restAreas, x + rowThickness, y, w - rowThickness, h, out);
  } else {
    layoutRecursive(restItems, restAreas, x, y + rowThickness, w, h - rowThickness, out);
  }
}
