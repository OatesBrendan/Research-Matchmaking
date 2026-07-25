import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { NETWORK_CONFIG, RESEARCH_AREAS } from '../../utils/networkConfig';
import { buildNetworkLinks } from '../../utils/networkDataBuilder';

const NetworkChart = ({ data, onNodeClick, technicalSkillsFilter }) => {
  const svgRef = useRef();
  const simulationRef = useRef();
  const [selectedId, setSelectedId] = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [connectionType, setConnectionType] = useState('all');
  const [viewMode, setViewMode] = useState('connections');
  const [networkStats, setNetworkStats] = useState({});
  const [showLegend, setShowLegend] = useState(false);

  const colorScale = useMemo(() => 
    d3.scaleOrdinal().domain(RESEARCH_AREAS).range(d3.schemeTableau10),
    []
  );

  const getNodeColor = useCallback((d) => {
    return d.data?.researchAreas?.[0] ? colorScale(d.data.researchAreas[0]) : '#6b7280';
  }, [colorScale]);

  const networkData = useMemo(() => {
    if (!data?.children) return { nodes: [], links: [] };

    const nodes = data.children
      .flatMap(area => (area.children || []).map(r => ({
        id: r.data._id,
        name: r.data.name,
        publications: r.data.publications?.length || 0,
        researchAreas: r.data.researchAreas || [],
        technicalSkills: r.data.technicalSkills || [],
        data: r.data,
        size: Math.max(NETWORK_CONFIG.MIN_NODE_SIZE, Math.sqrt((r.data.publications?.length || 0) + 1) * 2.5),
        publicationTitles: new Set((r.data.publications || []).map(p => p.title?.toLowerCase().trim()).filter(Boolean))
      })));

    const { links, stats } = buildNetworkLinks(nodes, technicalSkillsFilter);

    setNetworkStats({
      nodes: nodes.length,
      coauthorships: stats.coauthor,
      research: stats.research,
      technical: stats.technical
    });

    return { nodes, links };
  }, [data, technicalSkillsFilter]);

  const resetZoom = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(d3.zoom().transform, d3.zoomIdentity);
    if (simulationRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      simulationRef.current
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(NETWORK_CONFIG.FORCES.CENTER_STRENGTH))
        .force("y", d3.forceY(height / 2).strength(NETWORK_CONFIG.FORCES.CENTER_STRENGTH))
        .alpha(0.2)
        .restart();
    }
  }, []);

  useEffect(() => {
    if (!networkData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = svgRef.current.getBoundingClientRect();
    const virtualSpaceMultiplier = Math.min(2, Math.sqrt(networkData.nodes.length / 50) * 0.8);
    const virtualWidth = width * virtualSpaceMultiplier;
    const virtualHeight = height * virtualSpaceMultiplier;

    const g = svg.append("g");

    const zoom = d3.zoom().scaleExtent(NETWORK_CONFIG.ZOOM_EXTENT).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    const initialScale = 1 / virtualSpaceMultiplier;
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialScale).translate(-virtualWidth / 2, -virtualHeight / 2);
    svg.call(zoom.transform, initialTransform);

    const filteredLinks = connectionType === 'all' ? networkData.links : networkData.links.filter(l => l.type === connectionType);

    const areaGroups = {};
    if (viewMode === 'clustered') {
      networkData.nodes.forEach(node => {
        const area = node.researchAreas?.[0] || 'Other';
        areaGroups[area] = areaGroups[area] || [];
        areaGroups[area].push(node);
      });
    }

    const simulation = d3.forceSimulation(networkData.nodes)
      .force("link", d3.forceLink(filteredLinks).id(d => d.id).strength(d => viewMode === 'clustered' ? 0 : (d.strength / NETWORK_CONFIG.FORCES.LINK_STRENGTH_DIVISOR)).distance(d => d.distance))
      .force("charge", d3.forceManyBody().strength(viewMode === 'clustered' ? -150 : NETWORK_CONFIG.FORCES.CHARGE_STRENGTH))
      .force("center", d3.forceCenter(virtualWidth / 2, virtualHeight / 2))
      .force("collide", d3.forceCollide().radius(d => d.size + NETWORK_CONFIG.FORCES.COLLISION_RADIUS))
      .force("radial", d3.forceRadial(Math.min(virtualWidth, virtualHeight) * 0.3, virtualWidth / 2, virtualHeight / 2).strength(d => {
        const connectionCount = filteredLinks.filter(l => l.source.id === d.id || l.target.id === d.id).length;
        return connectionCount === 0 ? 0.25 : Math.max(0.03, 0.15 - connectionCount * 0.015);
      }))
      .force("x", d3.forceX(d => {
        if (viewMode === 'clustered') {
          const area = d.researchAreas?.[0] || 'Other';
          const areas = Object.keys(areaGroups);
          const index = areas.indexOf(area);
          const cols = Math.ceil(Math.sqrt(areas.length));
          return (virtualWidth / (cols + 1)) * ((index % cols) + 1);
        }
        return virtualWidth / 2;
      }).strength(viewMode === 'clustered' ? 0.25 : NETWORK_CONFIG.FORCES.CENTER_STRENGTH))
      .force("y", d3.forceY(d => {
        if (viewMode === 'clustered') {
          const area = d.researchAreas?.[0] || 'Other';
          const areas = Object.keys(areaGroups);
          const index = areas.indexOf(area);
          const cols = Math.ceil(Math.sqrt(areas.length));
          return (virtualHeight / (Math.ceil(areas.length / cols) + 1)) * (Math.floor(index / cols) + 1);
        }
        return virtualHeight / 2;
      }).strength(viewMode === 'clustered' ? 0.25 : NETWORK_CONFIG.FORCES.CENTER_STRENGTH))
      .alphaMin(0.002)
      .alphaDecay(0.05);

    simulationRef.current = simulation;

    const link = g.append("g").selectAll("line").data(filteredLinks).enter().append("line")
      .attr("stroke", d => ({ coauthor: '#dc2626', technical: '#16a34a', research: '#2563eb' }[d.type]))
      .attr("stroke-opacity", viewMode === 'clustered' ? 0.15 : 0.5)
      .attr("stroke-width", d => Math.max(0.8, d.strength * 0.8));

    const nodeGroup = g.append("g").selectAll("g").data(networkData.nodes).enter().append("g")
      .call(d3.drag().on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.08).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
      }))
      .on("click", (event, d) => {
        event.stopPropagation();
        if (selectedId === d.id) {
          setSelectedId(null);
          onNodeClick(null);
        } else {
          setSelectedId(d.id);
          onNodeClick(d);
        }
      });

    nodeGroup.append("circle")
      .attr("r", d => d.size)
      .attr("fill", getNodeColor)
      .attr("stroke", "var(--border-color)")
      .attr("stroke-width", 1.5);

    nodeGroup.append("text")
      .text(d => {
        const nameParts = d.name.trim().split(/\s+/);
        return nameParts.length === 1 ? nameParts[0].substring(0, 2).toUpperCase() : nameParts.map(part => part[0]).join('').substring(0, 3).toUpperCase();
      })
      .attr("font-size", d => Math.max(7, d.size * 0.35) + "px")
      .attr("font-family", "system-ui, -apple-system, sans-serif")
      .attr("font-weight", "600")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#fff")
      .style("pointer-events", "none");

    const labels = g.selectAll(".node-label").data(showLabels ? networkData.nodes : []).enter().append("text")
      .attr("class", "node-label")
      .text(d => d.name.split(' ').pop())
      .attr("font-size", "9px")
      .attr("font-family", "system-ui, -apple-system, sans-serif")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.size + 12)
      .attr("fill", "#374151")
      .style("opacity", 0.8)
      .style("pointer-events", "none");

    const highlightSelected = () => {
      if (!selectedId) {
        nodeGroup.style("opacity", 1);
        link.style("opacity", viewMode === 'clustered' ? 0.15 : 0.5);
        return;
      }
      const connected = new Set([selectedId]);
      const connectedLinks = new Set();
      filteredLinks.forEach((l, i) => {
        if (l.source.id === selectedId || l.target.id === selectedId) {
          connected.add(l.source.id === selectedId ? l.target.id : l.source.id);
          connectedLinks.add(i);
        }
      });
      nodeGroup.style("opacity", n => connected.has(n.id) ? 1 : 0.2);
      link.style("opacity", (l, i) => connectedLinks.has(i) ? 0.7 : 0.05);
    };

    highlightSelected();

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      labels.attr("x", d => d.x).attr("y", d => d.y);
    });

    return () => {
      if (simulation) simulation.stop();
      simulationRef.current = null;
    };
  }, [networkData, showLabels, connectionType, viewMode, selectedId, getNodeColor, onNodeClick]);

  const connectionTypeOptions = useMemo(() => [
    { value: 'all', label: 'All Connections', count: (networkStats.coauthorships || 0) + (networkStats.research || 0) + (networkStats.technical || 0) },
    { value: 'coauthor', label: `Co-authorship (${NETWORK_CONFIG.COAUTHOR_MIN_PAPERS}+ papers)`, count: networkStats.coauthorships || 0 },
    { value: 'technical', label: 'Technical Skills', count: networkStats.technical || 0 },
    { value: 'research', label: 'Research Similarity', count: networkStats.research || 0 }
  ], [networkStats]);

  if (networkData.nodes.length === 0) {
    return (
      <div className="qut-bg-primary border-2 qut-border-primary rounded-lg shadow-sm" id='map'>
        <div className="flex items-center justify-between p-4 border-b-2 qut-border-primary">
          <div>
            <h3 className="text-lg font-semibold qut-text-primary">Research Network</h3>
            <p className="text-sm qut-text-tertiary">No researchers match your current filters</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center qut-text-tertiary">
            <div className="font-medium mb-2">No network to display</div>
            <div className="text-sm">Try adjusting your search or filter criteria</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qut-bg-primary border-2 qut-border-primary rounded-lg shadow-sm" id='map'>
      <div className="flex items-center justify-between p-4 border-b-2 qut-border-primary">
        <div>
          <h3 className="text-lg font-semibold qut-text-primary">Research Network</h3>
          <p className="text-sm qut-text-tertiary">Showing {networkStats.nodes || 0} researchers</p>
        </div>
        <div className="flex gap-2 overflow-auto">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="text-sm rounded-md px-3 py-2 qut-bg-primary border-2 qut-border-primary focus:ring-2 focus:ring-blue-500"
          >
            <option value="connections">Connection View</option>
            <option value="clustered">Clustered by Area</option>
          </select>
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value)}
            className="text-sm rounded-md px-3 py-2 qut-bg-primary border-2 qut-border-primary focus:ring-2 focus:ring-blue-500"
          >
            {connectionTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <button 
            onClick={() => setShowLabels(!showLabels)} 
            className={`text-sm px-3 py-2 border-2 rounded-md transition-colors ${
              showLabels 
                ? 'bg-qut-blue text-qut-vlight-blue border-blue-200 hover:bg-qut-dark-blue hover:border-qut-blue' 
                : 'qut-bg-primary qut-text-primary qut-border-primary hover:qut-bg-secondary hover:border-qut-blue'
            }`}
          >
            {showLabels ? 'Hide' : 'Show'} Labels
          </button>
          <button 
            onClick={resetZoom} 
            className="text-sm px-3 py-2 qut-bg-primary border-2 qut-border-primary qut-text-primary hover:qut-bg-secondary hover:border-qut-blue rounded-md"
          >
            Reset View
          </button>
        </div>
      </div>
      
      <div className="relative qut-bg-tertiary border-b-2 rounded-lg border-transparent" style={{ height: '600px' }}>
        <svg ref={svgRef} width="100%" height="100%" className="w-full h-full" />
        
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="absolute bottom-4 left-4 w-10 h-10 qut-bg-primary border-2 qut-border-primary rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Toggle legend"
        >
          <span className="qut-text-primary font-semibold text-lg">?</span>
        </button>

        {showLegend && (
          <div className="absolute bottom-16 left-4 qut-bg-primary border-2 qut-border-primary rounded-lg shadow-xl p-4 text-xs max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold qut-text-primary">Legend</div>
              <button
                onClick={() => setShowLegend(false)}
                className="qut-text-tertiary hover:text-qut-light-blue text-lg leading-none"
                aria-label="Close legend"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <div className="font-medium qut-text-tertiary mb-2">Connection Types</div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-red-600"></div>
                <span className="qut-text-primary">Co-authorship ({networkStats.coauthorships || 0})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-green-600"></div>
                <span className="qut-text-primary">Technical Skills ({networkStats.technical || 0})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-blue-600"></div>
                <span className="qut-text-primary">Research Similarity ({networkStats.research || 0})</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t qut-border-primary qut-text-tertiary space-y-1 text-xs">
              <div>• Node size ∝ Publication count</div>
              <div>• Node color by primary research area</div>
              <div>• Click node to highlight connections</div>
              <div>• Drag to move • Scroll to zoom</div>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 qut-bg-primary border-2 qut-border-primary rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-2 qut-text-primary">Network Statistics</div>
          <div className="space-y-1 qut-text-tertiary">
            <div>Researchers: {networkStats.nodes || 0}</div>
            <div>Total Connections: {(networkStats.coauthorships || 0) + (networkStats.research || 0) + (networkStats.technical || 0)}</div>
            <div>Density: {networkData.nodes.length > 1 ? 
              (((networkStats.coauthorships || 0) + (networkStats.research || 0) + (networkStats.technical || 0)) / 
              (networkData.nodes.length * (networkData.nodes.length - 1) / 2) * 100).toFixed(1) + '%' : 
              '0%'
            }</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkChart;