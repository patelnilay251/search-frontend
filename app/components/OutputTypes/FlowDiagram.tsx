import React from 'react';
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowDiagramProps {
  elements: {
    id: string;
    data: { label: string };
    source?: string;
    target?: string;
    animated?: boolean;
  }[];
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({ elements }) => {
  const nodes: Node[] = elements
    .filter((el) => !el.source && !el.target)
    .map((el, index) => ({
      id: el.id,
      data: el.data,
      position: { x: 100 * (index + 1), y: 100 },
      type: 'default',
    }));

  const edges: Edge[] = elements
    .filter((el) => el.source && el.target)
    .map((el) => ({
      id: `${el.source}-${el.target}`,
      source: el.source!,
      target: el.target!,
      animated: el.animated,
      type: 'smoothstep',
    }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      style={{ background: 'transparent' }}
    />
  );
};

export default FlowDiagram;

