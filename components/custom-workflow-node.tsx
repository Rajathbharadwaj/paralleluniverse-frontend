"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';

const NODE_COLORS = {
  navigate: { bg: '#3b82f6', icon: '🧭' },
  analyze: { bg: '#a855f7', icon: '🔍' },
  action: { bg: '#22c55e', icon: '⚡' },
  loop: { bg: '#eab308', icon: '🔄' },
  research: { bg: '#06b6d4', icon: '📚' },
  memory: { bg: '#ec4899', icon: '💾' },
  condition: { bg: '#f97316', icon: '❓' },
  filter: { bg: '#6366f1', icon: '🔎' },
  end: { bg: '#6b7280', icon: '✅' },
};

function CustomWorkflowNodeComponent({ data, selected }: NodeProps) {
  const stepType = data.stepType || 'action';
  const nodeStyle = NODE_COLORS[stepType as keyof typeof NODE_COLORS] || NODE_COLORS.action;

  return (
    <div
      style={{
        background: nodeStyle.bg,
        border: selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.5)',
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '200px',
        boxShadow: selected
          ? '0 10px 25px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#fff',
          width: '12px',
          height: '12px',
          border: '2px solid ' + nodeStyle.bg,
        }}
      />

      <div style={{ color: '#fff' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '20px' }}>{nodeStyle.icon}</span>
          <Badge
            variant="secondary"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '10px',
            }}
          >
            {stepType}
          </Badge>
        </div>
        <div style={{
          fontWeight: '600',
          fontSize: '14px',
          lineHeight: '1.4',
        }}>
          {data.label}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#fff',
          width: '12px',
          height: '12px',
          border: '2px solid ' + nodeStyle.bg,
        }}
      />
    </div>
  );
}

export default memo(CustomWorkflowNodeComponent);
