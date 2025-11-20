"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";

// Custom node component with tooltip
function CustomNode({ data, style }: NodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        ...style,
        position: "relative",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div style={{ whiteSpace: "pre-line" }}>{data.label}</div>

      {showTooltip && data.tooltipText && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            whiteSpace: "pre-line",
            zIndex: 1000,
            minWidth: "150px",
            textAlign: "left",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            pointerEvents: "none",
          }}
        >
          {data.tooltipText}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

// Custom edge component with tooltip
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, style, label, markerEnd }: any) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate midpoint for tooltip
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Extract overlap percentage from label
  const overlapPct = parseInt(String(label).replace('%', ''));

  // Determine influence level
  const influenceLevel = overlapPct >= 70 ? 'Very High' :
                        overlapPct >= 60 ? 'High' :
                        overlapPct >= 50 ? 'Moderate' : 'Low';

  const tooltipText = `${overlapPct}% Audience Overlap\n\nInfluence: ${influenceLevel}\n\n${
    overlapPct >= 70 ? 'Very High Priority - Study their content strategy closely. This competitor shares most of your audience.' :
    overlapPct >= 60 ? 'High Priority - Strong overlap indicates similar target audience. Learn from their successful posts.' :
    overlapPct >= 50 ? 'Moderate Priority - Good overlap. Analyze their approach to engage this shared audience.' :
    'Lower Priority - Less audience overlap, but still relevant in your niche.'
  }`;

  return (
    <g
      onMouseEnter={(e) => {
        setShowTooltip(true);
        setTooltipPos({ x: midX, y: midY });
      }}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ cursor: 'help' }}
    >
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        markerEnd={markerEnd}
      />

      {showTooltip && (
        <foreignObject
          x={tooltipPos.x - 125}
          y={tooltipPos.y - 80}
          width={250}
          height={160}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11px',
              whiteSpace: 'pre-line',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {tooltipText}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

const edgeTypes = {
  default: CustomEdge,
};

// Custom dark mode styles for ReactFlow
const darkModeStyles = `
  .react-flow__controls {
    background: rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .react-flow__controls button {
    background: rgba(255, 255, 255, 0.1) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.8) !important;
  }
  .react-flow__controls button:hover {
    background: rgba(255, 255, 255, 0.2) !important;
  }
  .react-flow__attribution {
    display: none !important;
  }
  .react-flow__edge-path {
    stroke-width: 3px !important;
  }
  .react-flow__edge {
    z-index: 1 !important;
  }
  .react-flow__edges {
    z-index: 1 !important;
  }
`;

interface SocialGraphVisualizationProps {
  graphData: {
    user_handle: string;
    user_following: string[];
    top_competitors: Array<{
      username: string;
      overlap_score: number;
      overlap_percentage: number;
      common_follows: string[];
    }>;
  };
  clusterData?: {
    tiers: Record<string, {
      count: number;
      accounts: Array<{ username: string; followers?: number }>;
      tier_type: string;
    }>;
  };
}

export function SocialGraphVisualization({ graphData, clusterData }: SocialGraphVisualizationProps) {
  // Tier color palette (vibrant colors for better distinction)
  const tierColors: Record<string, string> = {
    "Mega (1M+)": "#dc2626",      // Red
    "Macro (500K-1M)": "#ea580c",  // Orange
    "Mid (50K-500K)": "#ca8a04",   // Yellow
    "Micro (10K-50K)": "#16a34a",  // Green
    "Nano (1K-10K)": "#2563eb",    // Blue
    "Nano (<1K)": "#9333ea",       // Purple
    // Fallback colors for engagement-based tiers
    "Viral Creator": "#dc2626",
    "Popular Creator": "#ea580c",
    "Mid-Tier Creator": "#ca8a04",
    "Growing Creator": "#16a34a",
    "Micro Influencer": "#9333ea",
  };

  // Build cluster lookup map
  const clusterLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    if (clusterData?.tiers) {
      Object.entries(clusterData.tiers).forEach(([tierName, tier]) => {
        tier.accounts.forEach((account) => {
          lookup[account.username] = tierName;
        });
      });
    }
    return lookup;
  }, [clusterData]);

  // Build nodes and edges with simple hub-and-spoke layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center node - YOU
    nodes.push({
      id: "user",
      type: "input",
      data: {
        label: `@${graphData.user_handle}\n(You)`
      },
      position: { x: 500, y: 350 },
      style: {
        background: "#3b82f6",
        color: "white",
        border: "3px solid #2563eb",
        borderRadius: "50%",
        width: 120,
        height: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "bold",
        textAlign: "center",
      },
    });

    // Top competitors in a circle
    const topCompetitors = graphData.top_competitors.slice(0, 12);
    const radius = 280;
    const angleStep = (2 * Math.PI) / topCompetitors.length;

    topCompetitors.forEach((competitor, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = 500 + radius * Math.cos(angle);
      const y = 350 + radius * Math.sin(angle);
      const intensity = competitor.overlap_percentage;

      // Determine color: use clusters if available, otherwise fallback to overlap
      let color: string;
      const tierName = clusterLookup[competitor.username];

      // Get follower count from cluster data
      let followerCount: number | undefined;
      if (tierName && clusterData?.tiers[tierName]) {
        const account = clusterData.tiers[tierName].accounts.find(
          (acc: any) => acc.username === competitor.username
        );
        followerCount = account?.followers;
      }

      if (tierName && tierColors[tierName]) {
        // Use cluster-based color
        color = tierColors[tierName];
      } else {
        // Fallback to overlap-based color
        color = intensity >= 70 ? "#dc2626" :  // Dark red for 70%+
                intensity >= 60 ? "#ef4444" :  // Red for 60-70%
                intensity >= 50 ? "#f97316" :  // Orange for 50-60%
                "#94a3b8";                     // Gray for edge cases
      }

      const textColor = "#ffffff"; // All high overlap = white text

      // Format follower count for tooltip
      const formatFollowers = (count?: number) => {
        if (!count) return "N/A";
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
      };

      // Build tooltip text
      const tooltipText = [
        `@${competitor.username}`,
        tierName ? `Tier: ${tierName}` : null,
        followerCount ? `Followers: ${formatFollowers(followerCount)}` : null,
        `Overlap: ${intensity}%`
      ].filter(Boolean).join('\n');

      nodes.push({
        id: competitor.username,
        type: "custom",
        data: {
          label: `@${competitor.username}\n${intensity}%`,
          tier: tierName,
          followers: followerCount,
          tooltipText,
        },
        position: { x, y },
        style: {
          background: color,
          color: textColor,
          border: `2px solid ${color}`,
          borderRadius: "8px",
          padding: "10px",
          fontSize: "11px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "100px",
          cursor: "pointer",
        },
      });

      // Edge from user to competitor with influence visualization
      // Calculate edge properties based on overlap/influence
      const strokeWidth = Math.max(2, Math.min(8, (intensity / 10))); // 2-8px based on intensity
      const strokeOpacity = Math.max(0.5, Math.min(1, (intensity / 70))); // 0.5-1.0 opacity

      // Determine edge label and style based on influence level
      let edgeLabel = `${intensity}%`;
      let labelStyle = {
        fill: color,
        fontWeight: 600,
        fontSize: 11,
      };

      // Add animated edge for very high influence (70%+)
      const animated = intensity >= 70;

      edges.push({
        id: `user-${competitor.username}`,
        source: "user",
        target: competitor.username,
        type: "default",
        label: edgeLabel,
        labelStyle: labelStyle,
        labelBgStyle: {
          fill: "rgba(0, 0, 0, 0.8)",
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        animated: animated,
        style: {
          stroke: color,
          strokeWidth: strokeWidth,
          strokeOpacity: strokeOpacity,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: color,
          width: 20,
          height: 20,
        },
      });
    });

    console.log('Social Graph Debug:', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      sampleEdge: edges[0],
      topCompetitors: graphData.top_competitors.length
    });

    return { nodes, edges };
  }, [graphData, clusterLookup]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Card className="p-0 overflow-hidden">
      <style>{darkModeStyles}</style>
      <div style={{ height: "500px", width: "100%", overflow: "hidden" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: "#3b82f6" }}></div>
              <span>You</span>
            </div>

            {clusterData?.tiers ? (
              // Show cluster-based legend
              <>
                {Object.keys(clusterData.tiers).map((tierName) => {
                  const color = tierColors[tierName] || "#94a3b8";
                  return (
                    <div key={tierName} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: color }}></div>
                      <span>{tierName}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              // Fallback to overlap-based legend
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: "#dc2626" }}></div>
                  <span>70%+ (Very Strong)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: "#ef4444" }}></div>
                  <span>60-70% (Strong)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: "#f97316" }}></div>
                  <span>50-60% (Good)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
