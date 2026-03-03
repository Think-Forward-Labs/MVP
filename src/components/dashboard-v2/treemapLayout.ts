/**
 * Nested Squarified Treemap Layout
 *
 * Two-level hierarchy:
 *   Level 1: Metric groups (M1, M2, ...) — sized by metric-level weight
 *   Level 2: Observations within each metric — sized by severity
 *
 * All coordinates are percentage-based (0-100).
 * Child observation rects use coordinates relative to their content area (0-100).
 */

import type { MetricInsight, StructuredObservation } from './types';

function isStructuredObs(obs: string | StructuredObservation): obs is StructuredObservation {
  return typeof obs === 'object' && obs !== null && 'lens_id' in obs;
}

export interface TreemapItem {
  id: string;
  metricCode: string;
  type: 'observation';
  text: string;
  weight: number;
  metricScore: number;
  metricName: string;
  severity: number;
  sentiment: 'positive' | 'negative';
  lensName: string;
  confidence: string;
}

export interface MetricGroup {
  metricCode: string;
  metricName: string;
  metricScore: number;
  weight: number;
  items: TreemapItem[];
}

/** Observation rect — coordinates are relative to the content area (0-100%) */
export interface ChildRect {
  item: TreemapItem;
  x: number; y: number;
  w: number; h: number;
}

/** Metric group rect — coordinates are absolute within the container (0-100%) */
export interface MetricGroupRect {
  group: MetricGroup;
  x: number; y: number;
  w: number; h: number;
  childRects: ChildRect[];
}

export function buildMetricGroups(
  insights: MetricInsight[],
  activeFilters?: Set<string>
): MetricGroup[] {
  const groups: MetricGroup[] = [];

  for (const insight of insights) {
    // Skip derived metrics (D1, D2) — they have no direct observations
    if (insight.metric_code.startsWith('D')) continue;
    if (activeFilters && activeFilters.size > 0 && !activeFilters.has(insight.metric_code)) continue;

    const fallbackWeight = Math.max(100 - (insight.score || 0), 5);
    const items: TreemapItem[] = [];

    insight.observations?.forEach((obs, i) => {
      if (isStructuredObs(obs)) {
        items.push({
          id: `${insight.metric_code}-obs-${i}`,
          metricCode: insight.metric_code,
          type: 'observation',
          text: obs.text,
          weight: Math.max(obs.severity_score * 100, 5),
          metricScore: insight.score || 0,
          metricName: insight.metric_name || insight.metric_code,
          severity: obs.severity_score,
          sentiment: obs.sentiment,
          lensName: obs.lens_name,
          confidence: obs.confidence,
        });
      } else {
        items.push({
          id: `${insight.metric_code}-obs-${i}`,
          metricCode: insight.metric_code,
          type: 'observation',
          text: obs,
          weight: fallbackWeight,
          metricScore: insight.score || 0,
          metricName: insight.metric_name || insight.metric_code,
          severity: 0,
          sentiment: 'negative',
          lensName: '',
          confidence: 'medium',
        });
      }
    });

    if (items.length === 0) continue;

    // Lower score = bigger box. Severity sum adds additional weight.
    const severitySum = items.reduce((s, it) => s + it.weight, 0);
    const inverseScore = Math.max(100 - (insight.score || 0), 10);
    const groupWeight = inverseScore + severitySum * 0.5;

    groups.push({
      metricCode: insight.metric_code,
      metricName: insight.metric_name || insight.metric_code,
      metricScore: insight.score || 0,
      weight: groupWeight,
      items: items.sort((a, b) => b.weight - a.weight),
    });
  }

  groups.sort((a, b) => b.weight - a.weight);
  return groups;
}

/**
 * Two-level squarified layout.
 * Level 1: groups laid out in 0-100 space with gaps.
 * Level 2: observations laid out in their own 0-100 coordinate space.
 */
export function squarifyNested(groups: MetricGroup[], W: number, H: number): MetricGroupRect[] {
  if (groups.length === 0) return [];

  const totalWeight = groups.reduce((s, g) => s + g.weight, 0);
  if (totalWeight === 0) return [];

  // Level 1: lay out groups with small gaps
  const GAP = 0.4; // gap between groups as % of container
  const areas = groups.map(g => (g.weight / totalWeight) * W * H);
  const positions = squarifyRects(areas, 0, 0, W, H);

  // Inset each group for gap
  const result: MetricGroupRect[] = [];
  for (let i = 0; i < groups.length; i++) {
    const p = positions[i];
    const gx = p.x + GAP;
    const gy = p.y + GAP;
    const gw = Math.max(p.w - GAP * 2, 0.5);
    const gh = Math.max(p.h - GAP * 2, 0.5);

    // Level 2: lay out children in their own 0-100 coordinate space
    const group = groups[i];
    const childTotalWeight = group.items.reduce((s, it) => s + it.weight, 0);
    const childAreas = group.items.map(it =>
      childTotalWeight > 0 ? (it.weight / childTotalWeight) * 100 * 100 : 0
    );
    const childPositions = squarifyRects(childAreas, 0, 0, 100, 100);

    const childRects: ChildRect[] = group.items.map((item, ci) => ({
      item,
      x: childPositions[ci].x,
      y: childPositions[ci].y,
      w: childPositions[ci].w,
      h: childPositions[ci].h,
    }));

    result.push({ group, x: gx, y: gy, w: gw, h: gh, childRects });
  }

  return result;
}

// ── Generic squarified layout engine ──

interface Rect { x: number; y: number; w: number; h: number }

function squarifyRects(areas: number[], x: number, y: number, w: number, h: number): Rect[] {
  const out: Rect[] = new Array(areas.length);
  let idx = 0;
  layoutRecursive(areas, x, y, w, h, (rx, ry, rw, rh) => { out[idx++] = { x: rx, y: ry, w: rw, h: rh }; });
  return out;
}

function worstRatio(row: number[], length: number): number {
  const total = row.reduce((s, v) => s + v, 0);
  if (total === 0 || length === 0) return Infinity;
  let worst = 0;
  for (const a of row) {
    const rw = total / length;
    const rh = a / rw;
    const r = Math.max(rw / rh, rh / rw);
    if (r > worst) worst = r;
  }
  return worst;
}

function layoutRecursive(
  areas: number[],
  x: number, y: number, w: number, h: number,
  emit: (x: number, y: number, w: number, h: number) => void
): void {
  if (areas.length === 0) return;
  if (areas.length === 1) { emit(x, y, w, h); return; }

  const vertical = w >= h;
  const sideLen = vertical ? h : w;
  const remaining = areas.reduce((s, v) => s + v, 0);

  const row: number[] = [];
  let bestRatio = Infinity;
  let splitIdx = 0;

  for (let i = 0; i < areas.length; i++) {
    row.push(areas[i]);
    const ratio = worstRatio(row, sideLen);
    if (ratio <= bestRatio) { bestRatio = ratio; splitIdx = i + 1; }
    else break;
  }

  const rowAreas = areas.slice(0, splitIdx);
  const rowTotal = rowAreas.reduce((s, v) => s + v, 0);
  const thickness = remaining > 0 ? (rowTotal / remaining) * (vertical ? w : h) : 0;

  let offset = 0;
  for (let i = 0; i < splitIdx; i++) {
    const len = rowTotal > 0 ? (rowAreas[i] / rowTotal) * sideLen : 0;
    if (vertical) emit(x, y + offset, thickness, len);
    else emit(x + offset, y, len, thickness);
    offset += len;
  }

  const rest = areas.slice(splitIdx);
  if (vertical) layoutRecursive(rest, x + thickness, y, w - thickness, h, emit);
  else layoutRecursive(rest, x, y + thickness, w, h - thickness, emit);
}
