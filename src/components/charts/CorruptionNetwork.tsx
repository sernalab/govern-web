import { useRef, useEffect, useState } from 'preact/hooks';
import { forceSimulation, forceLink, forceManyBody, forceCenter, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import { select } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';

interface CaseData {
  nom: string;
  slug: string;
  partit?: string;
  persones: { nom: string; slug: string }[];
}

interface Props {
  cases: CaseData[];
}

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: 'case' | 'person' | 'party';
  slug?: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function CorruptionNetwork({ cases }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; type: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    setDimensions({ width: clientWidth, height: 450 });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    // Build nodes and links
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    // Add party nodes
    const parties = new Set<string>();
    for (const cas of cases) {
      if (cas.partit) parties.add(cas.partit);
    }
    for (const party of parties) {
      nodesMap.set(`party-${party}`, {
        id: `party-${party}`,
        label: party,
        type: 'party',
      });
    }

    // Add case and person nodes, and links
    for (const cas of cases) {
      const caseId = `case-${cas.slug}`;
      nodesMap.set(caseId, {
        id: caseId,
        label: cas.nom,
        type: 'case',
        slug: cas.slug,
      });

      // Link case to party
      if (cas.partit) {
        links.push({ source: caseId, target: `party-${cas.partit}` });
      }

      // Add persons
      for (const persona of cas.persones) {
        const personId = `person-${persona.slug}`;
        if (!nodesMap.has(personId)) {
          nodesMap.set(personId, {
            id: personId,
            label: persona.nom,
            type: 'person',
            slug: persona.slug,
          });
        }
        links.push({ source: personId, target: caseId });
      }
    }

    const nodes = Array.from(nodesMap.values());

    // Color scale - darker colors for light background
    const colorScale = scaleOrdinal<string, string>()
      .domain(['case', 'person', 'party'])
      .range(['#dc2626', '#2563eb', '#d97706']);

    // Force simulation
    const simulation = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(60))
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    // Draw nodes
    const node = svg
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation) as unknown as (selection: ReturnType<typeof svg.selectAll<SVGGElement, GraphNode>>) => void);

    // Node shapes
    node.each(function (d) {
      const el = select(this);
      if (d.type === 'party') {
        // Diamond shape
        el.append('polygon')
          .attr('points', '0,-10 10,0 0,10 -10,0')
          .attr('fill', colorScale(d.type))
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);
      } else {
        // Circle
        el.append('circle')
          .attr('r', d.type === 'case' ? 8 : 5)
          .attr('fill', colorScale(d.type))
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5);
      }
    });

    // Labels for parties and cases
    node
      .filter((d) => d.type === 'party' || d.type === 'case')
      .append('text')
      .text((d) => d.label.length > 18 ? d.label.substring(0, 16) + '...' : d.label)
      .attr('x', 14)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#4b5563')
      .attr('pointer-events', 'none');

    // Hover events
    node
      .on('mouseenter', function (_event: MouseEvent, d: GraphNode) {
        const typeLabels: Record<string, string> = {
          case: 'Caso',
          person: 'Persona',
          party: 'Partido',
        };
        setTooltip({
          x: (d.x ?? 0) + 15,
          y: (d.y ?? 0) - 10,
          label: d.label,
          type: typeLabels[d.type] || d.type,
        });
      })
      .on('mouseleave', function () {
        setTooltip(null);
      })
      .on('click', function (_event: MouseEvent, d: GraphNode) {
        if (d.type === 'case' && d.slug) {
          window.location.href = `/corrupcio/casos/${d.slug}`;
        } else if (d.type === 'person' && d.slug) {
          window.location.href = `/corrupcio/persones/${d.slug}`;
        }
      });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [cases, dimensions]);

  // Drag behavior
  function drag(simulation: ReturnType<typeof forceSimulation<GraphNode>>) {
    function dragstarted(event: { active: number; subject: GraphNode }) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: { subject: GraphNode; x: number; y: number }) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: { active: number; subject: GraphNode }) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Use d3-drag inline
    return (selection: ReturnType<typeof select>) => {
      selection
        .on('mousedown.drag', function (event: MouseEvent) {
          const d = select(this).datum() as GraphNode;
          const startX = event.clientX;
          const startY = event.clientY;

          dragstarted({ active: 1, subject: d });

          function onMouseMove(e: MouseEvent) {
            const svgEl = svgRef.current;
            if (!svgEl) return;
            const rect = svgEl.getBoundingClientRect();
            d.fx = e.clientX - rect.left;
            d.fy = e.clientY - rect.top;
          }

          function onMouseUp() {
            dragended({ active: 0, subject: d });
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          }

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        });
    };
  }

  return (
    <div ref={containerRef} class="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        class="bg-gray-50 rounded-lg border border-gray-200"
      />
      {tooltip && (
        <div
          class="absolute pointer-events-none bg-white text-gray-900 text-xs px-2 py-1 rounded shadow-md border border-gray-200 z-10"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <span class="text-gray-500">{tooltip.type}:</span> {tooltip.label}
        </div>
      )}
      {/* Legend */}
      <div class="flex gap-4 mt-3 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-red-600 inline-block" />
          Caso
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          Persona
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 bg-amber-600 inline-block" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          Partido
        </div>
      </div>
    </div>
  );
}
