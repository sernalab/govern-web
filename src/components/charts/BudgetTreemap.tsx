import { useRef, useEffect, useState } from 'preact/hooks';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';

interface BudgetNode {
  name: string;
  value: number;
  children?: BudgetNode[];
}

interface BudgetTreemapProps {
  data: BudgetNode[];
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#22c55e',
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function BudgetTreemap({ data }: BudgetTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    name: string;
    value: number;
    percent: number;
  }>({ visible: false, x: 0, y: 0, name: '', value: 0, percent: 0 });
  const [zoomedNode, setZoomedNode] = useState<string | null>(null);

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  function renderTreemap() {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.max(400, Math.min(600, width * 0.5));

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const displayData = zoomedNode
      ? data.find((d) => d.name === zoomedNode)?.children ?? data
      : data;

    const root = hierarchy({ name: 'root', children: displayData, value: 0 })
      .sum((d) => (d as BudgetNode).value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemapLayout = treemap<BudgetNode>()
      .size([width, height])
      .padding(2)
      .tile(treemapSquarify);

    treemapLayout(root);

    const colorScale = scaleOrdinal<string>().domain(data.map((d) => d.name)).range(COLORS);

    const leaves = root.leaves();

    const groups = svg
      .selectAll('g')
      .data(leaves)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

    // Rectangles
    groups
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1! - d.x0!))
      .attr('height', (d) => Math.max(0, d.y1! - d.y0!))
      .attr('fill', (d) => {
        const color = colorScale(d.data.name);
        return color;
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        select(this).attr('fill-opacity', 1);
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 10,
          name: d.data.name,
          value: d.value ?? 0,
          percent: totalValue > 0 ? ((d.value ?? 0) / totalValue) * 100 : 0,
        });
      })
      .on('mousemove', function (event) {
        const rect = containerRef.current!.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 10,
        }));
      })
      .on('mouseleave', function () {
        select(this).attr('fill-opacity', 0.85);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('click', function (_event, d) {
        if (d.data.children && d.data.children.length > 0) {
          setZoomedNode(d.data.name);
        }
      });

    // Labels
    groups
      .append('text')
      .attr('x', 6)
      .attr('y', 18)
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => {
        const w = d.x1! - d.x0!;
        return w > 120 ? '12px' : w > 80 ? '10px' : '0px';
      })
      .attr('font-weight', '500')
      .text((d) => {
        const w = d.x1! - d.x0!;
        const name = d.data.name;
        if (w < 80) return '';
        return name.length > Math.floor(w / 7) ? name.slice(0, Math.floor(w / 7)) + '...' : name;
      });

    // Value labels
    groups
      .append('text')
      .attr('x', 6)
      .attr('y', 34)
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', (d) => {
        const w = d.x1! - d.x0!;
        const h = d.y1! - d.y0!;
        return w > 80 && h > 40 ? '10px' : '0px';
      })
      .text((d) => (d.value ? `${formatCurrency(d.value)}` + '\u20AC' : ''));
  }

  useEffect(() => {
    renderTreemap();

    const handleResize = () => renderTreemap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, zoomedNode]);

  return (
    <div ref={containerRef} class="relative w-full">
      {/* Breadcrumb for zoom */}
      {zoomedNode && (
        <div class="flex items-center gap-2 mb-3 text-sm">
          <button
            onClick={() => setZoomedNode(null)}
            class="text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Tots els departaments
          </button>
          <span class="text-gray-400">/</span>
          <span class="text-gray-700">{zoomedNode}</span>
        </div>
      )}

      <svg ref={svgRef} class="w-full" />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          class="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p class="text-gray-900 font-medium text-sm">{tooltip.name}</p>
          <p class="text-emerald-600 font-mono text-sm">{formatFullCurrency(tooltip.value)}</p>
          <p class="text-gray-400 text-xs">{tooltip.percent.toFixed(1)}% del total</p>
        </div>
      )}
    </div>
  );
}
