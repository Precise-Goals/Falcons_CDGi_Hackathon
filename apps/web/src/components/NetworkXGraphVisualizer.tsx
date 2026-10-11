import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, ZoomIn, ZoomOut, 
  Layers, Activity, ShieldAlert, 
  Sliders, Cpu
} from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'upstream' | 'workflow' | 'adapter' | 'consumer' | 'database';
  tier: number; // 0: Upstream, 1: Intra Adapter, 2: Shipwell Workflow, 3: Downstream Consumer
  status: 'healthy' | 'mutated' | 'adapted' | 'circuit-break' | 'idle';
  filePath?: string;
  lines?: string;
  invariantsCount?: number;
  qps?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  merkleHash?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  status: 'normal' | 'mutated' | 'adapted' | 'broken';
  trafficSpeed: number; // Speed of flowing packet particles
  particles: { progress: number; speed: number; id: number }[];
}

export type LayoutMode = 'spring' | 'kahn-dag' | 'blast-radius';

const INITIAL_NODES: GraphNode[] = [
  // Tier 0: Upstream External APIs
  {
    id: 'srv-stripe',
    label: 'PaymentGateway (/payments/charge)',
    type: 'upstream',
    tier: 0,
    status: 'mutated',
    severity: 'high',
    filePath: 'external://api.stripe.com/v1/charges',
    lines: 'M3: $ float -> cents int',
    invariantsCount: 14,
    qps: 184,
    merkleHash: '0x7f9a2b1c8402...',
    x: 120,
    y: 140,
    vx: 0,
    vy: 0,
    radius: 22,
  },
  {
    id: 'srv-users',
    label: 'UserAuthService (/users/profile)',
    type: 'upstream',
    tier: 0,
    status: 'adapted',
    severity: 'low',
    filePath: 'external://auth.identity.io/v2/users',
    lines: 'M1: name -> display_name',
    invariantsCount: 9,
    qps: 340,
    merkleHash: '0x3c8e41bf9012...',
    x: 120,
    y: 280,
    vx: 0,
    vy: 0,
    radius: 22,
  },
  {
    id: 'srv-catalog',
    label: 'CatalogSearch (/search/items)',
    type: 'upstream',
    tier: 0,
    status: 'adapted',
    severity: 'medium',
    filePath: 'external://search.catalog.net/v1/search',
    lines: 'M5: offset -> cursor pagination',
    invariantsCount: 12,
    qps: 512,
    merkleHash: '0x5d120abefc88...',
    x: 120,
    y: 420,
    vx: 0,
    vy: 0,
    radius: 22,
  },
  {
    id: 'srv-audit',
    label: 'ComplianceAudit (/audit/logs)',
    type: 'upstream',
    tier: 0,
    status: 'circuit-break',
    severity: 'critical',
    filePath: 'external://audit.sec.gov/v3/events',
    lines: 'M10: active enum semantic drift',
    invariantsCount: 6,
    qps: 45,
    merkleHash: '0x99e0134bc2fa...',
    x: 120,
    y: 560,
    vx: 0,
    vy: 0,
    radius: 22,
  },

  // Tier 1: Intra Synthesized Adapters (Safe-Handling Policy)
  {
    id: 'adp-pbe-m3',
    label: 'Adapter: M3 Unit Normalizer (* 0.01)',
    type: 'adapter',
    tier: 1,
    status: 'adapted',
    severity: 'high',
    filePath: 'packages/adapter/src/pbe.ts',
    lines: 'scale(0.01) auto-applied (p=0.98)',
    invariantsCount: 4,
    qps: 184,
    merkleHash: '0x88bb44cc2211...',
    x: 320,
    y: 160,
    vx: 0,
    vy: 0,
    radius: 18,
  },
  {
    id: 'adp-pbe-m1',
    label: 'Adapter: M1 Key Realignment',
    type: 'adapter',
    tier: 1,
    status: 'adapted',
    severity: 'low',
    filePath: 'packages/adapter/src/generator.ts',
    lines: 'rename(display_name -> name)',
    invariantsCount: 2,
    qps: 340,
    merkleHash: '0x44aa11ef5500...',
    x: 320,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 18,
  },
  {
    id: 'adp-pbe-m5',
    label: 'Adapter: M5 Cursor Demux',
    type: 'adapter',
    tier: 1,
    status: 'adapted',
    severity: 'medium',
    filePath: 'packages/adapter/src/pbe.ts',
    lines: 'unwrap(data.items, page_token)',
    invariantsCount: 3,
    qps: 512,
    merkleHash: '0x11ee99cc3388...',
    x: 320,
    y: 440,
    vx: 0,
    vy: 0,
    radius: 18,
  },

  // Tier 2: Shipwell Application Workflows (AST Parsed)
  {
    id: 'wf-checkout',
    label: 'checkout.ts (Shipwell)',
    type: 'workflow',
    tier: 2,
    status: 'healthy',
    severity: 'high',
    filePath: 'apps/demo-app/src/workflows/checkout.ts',
    lines: 'L42-L58 (AST chargePayment)',
    invariantsCount: 18,
    qps: 184,
    merkleHash: '0xfe01a24890c5...',
    x: 540,
    y: 180,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'wf-profile',
    label: 'userProfile.ts (Shipwell)',
    type: 'workflow',
    tier: 2,
    status: 'healthy',
    severity: 'low',
    filePath: 'apps/demo-app/src/workflows/userProfile.ts',
    lines: 'L18-L32 (AST getUserMetadata)',
    invariantsCount: 11,
    qps: 340,
    merkleHash: '0xac9830ef11bc...',
    x: 540,
    y: 320,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'wf-search',
    label: 'searchBrowse.ts (Shipwell)',
    type: 'workflow',
    tier: 2,
    status: 'healthy',
    severity: 'medium',
    filePath: 'apps/demo-app/src/workflows/searchBrowse.ts',
    lines: 'L65-L84 (AST paginateResults)',
    invariantsCount: 15,
    qps: 512,
    merkleHash: '0xbb2014fc66da...',
    x: 540,
    y: 450,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'wf-audit',
    label: 'audit.ts (Shipwell)',
    type: 'workflow',
    tier: 2,
    status: 'circuit-break',
    severity: 'critical',
    filePath: 'apps/demo-app/src/workflows/audit.ts',
    lines: 'L88-L102 (CIRCUIT BREAKER HALTED)',
    invariantsCount: 7,
    qps: 0,
    merkleHash: '0x00ccbb448822...',
    x: 540,
    y: 570,
    vx: 0,
    vy: 0,
    radius: 20,
  },

  // Tier 3: Downstream Consumers & Ledger Proofs
  {
    id: 'cns-ledger',
    label: 'Accounting Ledger (PostgreSQL)',
    type: 'database',
    tier: 3,
    status: 'healthy',
    filePath: 'services/db/ledger_entries',
    lines: 'Immutable Double-Entry Ledger',
    invariantsCount: 22,
    qps: 184,
    merkleHash: '0x221144778899...',
    x: 750,
    y: 190,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'cns-ui',
    label: 'Shipwell Web UI Consumer',
    type: 'consumer',
    tier: 3,
    status: 'healthy',
    filePath: 'apps/demo-app/src/components/UserProfile.tsx',
    lines: 'React DOM View Layer',
    invariantsCount: 16,
    qps: 340,
    merkleHash: '0x99553311aabb...',
    x: 750,
    y: 330,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'cns-mobile',
    label: 'Android BLE Airlink Companion',
    type: 'consumer',
    tier: 3,
    status: 'healthy',
    filePath: 'android/lib/screens/dashboard_screen.dart',
    lines: 'Flutter Native Hardware Airlink',
    invariantsCount: 14,
    qps: 120,
    merkleHash: '0x44668811eeff...',
    x: 750,
    y: 460,
    vx: 0,
    vy: 0,
    radius: 20,
  },
  {
    id: 'cns-mcp',
    label: 'Claude/Cursor Customer MCP Server',
    type: 'consumer',
    tier: 3,
    status: 'healthy',
    filePath: 'packages/mcpserver/src/server.ts',
    lines: 'Port 3002 (7 Autonomous SRE Tools)',
    invariantsCount: 28,
    qps: 65,
    merkleHash: '0xee1133557799...',
    x: 750,
    y: 580,
    vx: 0,
    vy: 0,
    radius: 20,
  },
];

const INITIAL_EDGES: GraphEdge[] = [
  // Upstream -> Adapters
  { id: 'e1', source: 'srv-stripe', target: 'adp-pbe-m3', protocol: 'HTTPS/REST', status: 'mutated', trafficSpeed: 0.015, particles: [] },
  { id: 'e2', source: 'srv-users', target: 'adp-pbe-m1', protocol: 'gRPC/Proto', status: 'adapted', trafficSpeed: 0.02, particles: [] },
  { id: 'e3', source: 'srv-catalog', target: 'adp-pbe-m5', protocol: 'HTTPS/JSON', status: 'adapted', trafficSpeed: 0.025, particles: [] },
  { id: 'e4', source: 'srv-audit', target: 'wf-audit', protocol: 'Webhooks/TLS', status: 'broken', trafficSpeed: 0.005, particles: [] },

  // Adapters -> Shipwell Workflows
  { id: 'e5', source: 'adp-pbe-m3', target: 'wf-checkout', protocol: 'TypeScript Call', status: 'adapted', trafficSpeed: 0.015, particles: [] },
  { id: 'e6', source: 'adp-pbe-m1', target: 'wf-profile', protocol: 'TypeScript Call', status: 'adapted', trafficSpeed: 0.02, particles: [] },
  { id: 'e7', source: 'adp-pbe-m5', target: 'wf-search', protocol: 'TypeScript Call', status: 'adapted', trafficSpeed: 0.025, particles: [] },

  // Workflows -> Consumers & Storage
  { id: 'e8', source: 'wf-checkout', target: 'cns-ledger', protocol: 'SQL Driver', status: 'normal', trafficSpeed: 0.015, particles: [] },
  { id: 'e9', source: 'wf-profile', target: 'cns-ui', protocol: 'React Props', status: 'normal', trafficSpeed: 0.02, particles: [] },
  { id: 'e10', source: 'wf-profile', target: 'cns-mobile', protocol: 'BLE GATT 0xFFE0', status: 'normal', trafficSpeed: 0.012, particles: [] },
  { id: 'e11', source: 'wf-search', target: 'cns-ui', protocol: 'React Query', status: 'normal', trafficSpeed: 0.025, particles: [] },
  { id: 'e12', source: 'wf-checkout', target: 'cns-mcp', protocol: 'JSON-RPC 2.0', status: 'normal', trafficSpeed: 0.01, particles: [] },
  { id: 'e13', source: 'wf-audit', target: 'cns-mcp', protocol: 'Incident Hook', status: 'broken', trafficSpeed: 0.0, particles: [] },
];

export function NetworkXGraphVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('spring');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [repulsionStrength, setRepulsionStrength] = useState<number>(1800);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(INITIAL_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({ x: 30, y: 30, k: 0.95 });
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Shockwave blast radius ripple time
  const shockwaveRef = useRef<number>(0);

  // Initialize edge particle streams
  useEffect(() => {
    setEdges(prevEdges => prevEdges.map(edge => {
      const particles = Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        progress: (i / 4),
        speed: edge.trafficSpeed * (0.8 + Math.random() * 0.4),
      }));
      return { ...edge, particles };
    }));
  }, []);

  // Set positions according to layout mode
  const applyLayout = useCallback((mode: LayoutMode) => {
    setNodes(prev => prev.map(node => {
      if (mode === 'kahn-dag') {
        // Strict 4-tier Kahn DAG topological coordinates
        const tierX = 110 + node.tier * 220;
        const tierNodes = prev.filter(n => n.tier === node.tier);
        const indexInTier = tierNodes.findIndex(n => n.id === node.id);
        const spacing = 460 / Math.max(1, tierNodes.length);
        const tierY = 120 + indexInTier * spacing + (spacing * 0.5);
        return {
          ...node,
          x: tierX,
          y: tierY,
          vx: 0,
          vy: 0,
        };
      } else if (mode === 'blast-radius') {
        // Centered blast radius concentric layout
        const isM3 = node.id.includes('stripe') || node.id.includes('m3') || node.id.includes('checkout') || node.id.includes('ledger');
        const isAudit = node.id.includes('audit');
        if (isAudit) {
          return { ...node, x: 220, y: 530, vx: 0, vy: 0 };
        }
        if (isM3) {
          const angleMap: Record<string, number> = {
            'srv-stripe': 0,
            'adp-pbe-m3': Math.PI * 0.4,
            'wf-checkout': Math.PI * 0.9,
            'cns-ledger': Math.PI * 1.4,
          };
          const distMap: Record<string, number> = {
            'srv-stripe': 60,
            'adp-pbe-m3': 180,
            'wf-checkout': 290,
            'cns-ledger': 390,
          };
          const dist = distMap[node.id] || 250;
          const angle = angleMap[node.id] || (node.tier * 0.7);
          return {
            ...node,
            x: 440 + Math.cos(angle) * dist,
            y: 320 + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
          };
        }
        return {
          ...node,
          x: 100 + node.tier * 210,
          y: 200 + (node.tier % 2 === 0 ? 100 : 250),
          vx: 0,
          vy: 0,
        };
      } else {
        // Organic initial spring arrangement
        return {
          ...node,
          x: node.x + (Math.random() - 0.5) * 20,
          y: node.y + (Math.random() - 0.5) * 20,
        };
      }
    }));
  }, []);

  useEffect(() => {
    applyLayout(layoutMode);
  }, [layoutMode, applyLayout]);

  // Main Canvas Animation and Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Advance blast-radius shockwave
      shockwaveRef.current = (shockwaveRef.current + 0.03 * speedMultiplier) % 1.0;

      // Physics step (Fruchterman-Reingold Spring layout simulation)
      if (isPlaying && layoutMode === 'spring') {
        setNodes(currNodes => {
          const updated = currNodes.map(n => ({ ...n }));
          const nodeMap = new Map<string, GraphNode>(updated.map(n => [n.id, n]));

          // 1. Repulsive forces (Coulomb's Law)
          const kRepulse = repulsionStrength;
          for (let i = 0; i < updated.length; i++) {
            for (let j = i + 1; j < updated.length; j++) {
              const u = updated[i];
              const v = updated[j];
              const dx = v.x - u.x;
              const dy = v.y - u.y;
              let dist = Math.hypot(dx, dy);
              if (dist < 1) dist = 1;

              const force = (kRepulse * 25) / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (u.id !== draggedNodeId) {
                u.vx -= fx;
                u.vy -= fy;
              }
              if (v.id !== draggedNodeId) {
                v.vx += fx;
                v.vy += fy;
              }
            }
          }

          // 2. Attractive spring forces along edges (Hooke's Law)
          const springLength = 160;
          const kSpring = 0.035;
          edges.forEach(edge => {
            const u = nodeMap.get(edge.source);
            const v = nodeMap.get(edge.target);
            if (!u || !v) return;

            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.hypot(dx, dy);
            const delta = dist - springLength;

            const force = delta * kSpring;
            const fx = (dx / (dist || 1)) * force;
            const fy = (dy / (dist || 1)) * force;

            if (u.id !== draggedNodeId) {
              u.vx += fx;
              u.vy += fy;
            }
            if (v.id !== draggedNodeId) {
              v.vx -= fx;
              v.vy -= fy;
            }
          });

          // 3. Center gravity and velocity damping
          const centerX = 440;
          const centerY = 330;
          const damping = 0.82;

          updated.forEach(u => {
            if (u.id === draggedNodeId) return;

            // Soft pull toward center
            u.vx += (centerX - u.x) * 0.003;
            u.vy += (centerY - u.y) * 0.003;

            // Velocity integration
            u.vx *= damping;
            u.vy *= damping;

            // Speed clamp
            const vMag = Math.hypot(u.vx, u.vy);
            if (vMag > 12) {
              u.vx = (u.vx / vMag) * 12;
              u.vy = (u.vy / vMag) * 12;
            }

            u.x += u.vx;
            u.y += u.vy;

            // Boundary margins
            u.x = Math.max(50, Math.min(840, u.x));
            u.y = Math.max(50, Math.min(620, u.y));
          });

          return updated;
        });
      }

      // Step edge particle streams
      setEdges(currEdges => 
        currEdges.map(edge => {
          if (edge.trafficSpeed === 0) return edge;
          const updatedParticles = edge.particles.map(p => {
            let nextProgress = p.progress + p.speed * speedMultiplier;
            if (nextProgress > 1.0) nextProgress -= 1.0;
            return { ...p, progress: nextProgress };
          });
          return { ...edge, particles: updatedParticles };
        })
      );

      // ─── CANVAS RENDERING ───
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Render Technical Background Dot Grid
      ctx.save();
      ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
      const gridSize = 24;
      for (let gx = -100; gx < 1000; gx += gridSize) {
        for (let gy = -100; gy < 800; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw Kahn DAG Tier Dividers if active
      if (layoutMode === 'kahn-dag') {
        const tiers = [
          { label: 'TIER 0: UPSTREAM APIS', x: 110 },
          { label: 'TIER 1: INTRA PBE ADAPTERS', x: 330 },
          { label: 'TIER 2: SHIPWELL WORKFLOWS', x: 550 },
          { label: 'TIER 3: DOWNSTREAM CONSUMERS', x: 770 },
        ];
        ctx.save();
        tiers.forEach((t) => {
          ctx.strokeStyle = 'rgba(200, 16, 46, 0.15)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(t.x, 30);
          ctx.lineTo(t.x, 650);
          ctx.stroke();

          ctx.fillStyle = 'rgba(200, 16, 46, 0.7)';
          ctx.font = 'bold 9px Poppins, sans-serif';
          ctx.fillText(t.label, t.x - 50, 45);
        });
        ctx.restore();
      }

      // Draw AST Blast Radius concentric ripple rings
      if (layoutMode === 'blast-radius') {
        const centerNode = nodes.find(n => n.id === 'srv-stripe');
        if (centerNode) {
          const cx = centerNode.x;
          const cy = centerNode.y;
          const currentRadius = 60 + shockwaveRef.current * 360;
          ctx.save();
          ctx.strokeStyle = `rgba(200, 16, 46, ${1.0 - shockwaveRef.current})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Core pulse halo
          ctx.fillStyle = 'rgba(200, 16, 46, 0.08)';
          ctx.beginPath();
          ctx.arc(cx, cy, 70, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

      // ─── DRAW EDGES & FLOWING PARTICLES ───
      edges.forEach(edge => {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) return;

        const isHovered = hoveredNode && (hoveredNode.id === u.id || hoveredNode.id === v.id);
        const isSelected = selectedNode && (selectedNode.id === u.id || selectedNode.id === v.id);

        ctx.save();

        // Edge Line Style
        let strokeColor = 'rgba(10, 10, 10, 0.2)';
        let lineWidth = 1.5;

        if (edge.status === 'mutated') {
          strokeColor = 'rgba(200, 16, 46, 0.8)';
          lineWidth = 2.5;
        } else if (edge.status === 'adapted') {
          strokeColor = 'rgba(16, 185, 129, 0.8)';
          lineWidth = 2;
        } else if (edge.status === 'broken') {
          strokeColor = 'rgba(220, 38, 38, 0.9)';
          lineWidth = 2;
          ctx.setLineDash([4, 4]);
        }

        if (isHovered || isSelected) {
          lineWidth = 3.5;
          strokeColor = '#C8102E';
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;

        // Draw Edge Path (Quadratic curve for elegance)
        const mx = (u.x + v.x) / 2;
        const my = (u.y + v.y) / 2 - 12;

        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.quadraticCurveTo(mx, my, v.x, v.y);
        ctx.stroke();

        // Draw Flowing Packet Particles
        edge.particles.forEach(p => {
          // Quadratic Bezier interpolation: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
          const t = p.progress;
          const px = Math.pow(1 - t, 2) * u.x + 2 * (1 - t) * t * mx + Math.pow(t, 2) * v.x;
          const py = Math.pow(1 - t, 2) * u.y + 2 * (1 - t) * t * my + Math.pow(t, 2) * v.y;

          ctx.save();
          if (edge.status === 'mutated') {
            ctx.fillStyle = '#C8102E';
            ctx.shadowColor = '#C8102E';
            ctx.shadowBlur = 8;
          } else if (edge.status === 'adapted') {
            ctx.fillStyle = '#10B981';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 6;
          } else if (edge.status === 'broken') {
            ctx.fillStyle = '#DC2626';
          } else {
            ctx.fillStyle = '#0A0A0A';
          }

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Edge Protocol Label
        if (edge.protocol && (isSelected || isHovered)) {
          ctx.fillStyle = '#0A0A0A';
          ctx.font = 'bold 8px monospace';
          ctx.fillText(edge.protocol, mx - 15, my - 6);
        }

        ctx.restore();
      });

      // ─── DRAW NODES ───
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        ctx.save();

        // Node Outer Glow / Selection Halo
        if (isSelected || isHovered) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200, 16, 46, 0.2)';
          ctx.fill();
          ctx.strokeStyle = '#C8102E';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // Mutation Ripple Shockwave ring if node is actively mutated
        if (node.status === 'mutated' || node.status === 'circuit-break') {
          ctx.save();
          const pulseR = node.radius + 6 + Math.sin(Date.now() * 0.006) * 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = node.status === 'circuit-break' ? '#DC2626' : '#C8102E';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.restore();
        }

        // Node Circle Background
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

        // Color coding by type & status
        let fillColor = '#FFFFFF';
        let strokeColor = '#0A0A0A';

        if (node.type === 'upstream') {
          fillColor = node.status === 'mutated' ? '#FDECEF' : '#FAF7F2';
          strokeColor = node.status === 'mutated' ? '#C8102E' : '#0A0A0A';
        } else if (node.type === 'adapter') {
          fillColor = '#ECFDF5';
          strokeColor = '#059669';
        } else if (node.type === 'workflow') {
          fillColor = node.status === 'circuit-break' ? '#FEE2E2' : '#FFFFFF';
          strokeColor = node.status === 'circuit-break' ? '#DC2626' : '#0A0A0A';
        } else if (node.type === 'database') {
          fillColor = '#0A0A0A';
          strokeColor = '#C8102E';
        } else {
          fillColor = '#F4EFEB';
          strokeColor = '#4A4A4A';
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Inner Type Icon Glyph
        ctx.save();
        ctx.fillStyle = node.type === 'database' ? '#FFFFFF' : strokeColor;
        ctx.font = 'bold 9px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let glyph = '●';
        if (node.type === 'upstream') glyph = 'API';
        else if (node.type === 'adapter') glyph = 'PBE';
        else if (node.type === 'workflow') glyph = 'AST';
        else if (node.type === 'database') glyph = 'DB';
        else glyph = 'APP';

        ctx.fillText(glyph, node.x, node.y);
        ctx.restore();

        // Node Label Typography
        ctx.save();
        ctx.fillStyle = '#0A0A0A';
        ctx.font = isSelected ? 'bold 11px Poppins, sans-serif' : '600 10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.length > 24 ? node.label.slice(0, 22) + '...' : node.label, node.x, node.y + node.radius + 14);

        // QPS / Latency Sub-badge
        ctx.fillStyle = 'rgba(10, 10, 10, 0.55)';
        ctx.font = '500 8px monospace';
        ctx.fillText(`${node.qps || 0} req/s • ${node.severity ? node.severity.toUpperCase() : 'OK'}`, node.x, node.y + node.radius + 24);
        ctx.restore();

        ctx.restore();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, layoutMode, speedMultiplier, transform, nodes, edges, hoveredNode, selectedNode, draggedNodeId, repulsionStrength]);

  // Mouse interaction handling (Node dragging and canvas panning)
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Invert transform
    const x = (mouseX - transform.x) / transform.k;
    const y = (mouseY - transform.y) / transform.k;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);
    // Hit test nodes
    const hitNode = nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 6);
    if (hitNode) {
      setIsDraggingNode(true);
      setDraggedNodeId(hitNode.id);
      setSelectedNode(hitNode);
    } else {
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);

    if (isDraggingNode && draggedNodeId) {
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x, y, vx: 0, vy: 0 } : n));
    } else if (panStart) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else {
      const hitNode = nodes.find(n => Math.hypot(n.x - x, n.y - y) <= n.radius + 6);
      setHoveredNode(hitNode || null);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setPanStart(null);
  };

  const handleZoom = (delta: number) => {
    setTransform(prev => ({
      ...prev,
      k: Math.max(0.5, Math.min(2.2, prev.k + delta)),
    }));
  };

  const resetView = () => {
    setTransform({ x: 30, y: 30, k: 0.95 });
    applyLayout(layoutMode);
  };

  return (
    <div className="maximalist-card bg-[#FAF7F2] border border-black/15 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden technical-bracket">
      {/* Decorative Technical Grid Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-crimson/10 text-crimson border border-crimson/30">
              NETWORKX GRAPH ENGINE
            </span>
            <span className="text-[11px] font-mono text-black/50">
              FRUCHTERMAN-REINGOLD FORCE SIMULATION
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="font-display font-black text-2xl text-black flex items-center gap-2">
            Interactive Dependency Topology &amp; AST Blast-Radius Visualizer
          </h2>
          <p className="text-xs text-black/70 max-w-3xl font-sans">
            Live dynamic spring-embedder canvas executing continuous repulsion physics, real-time packet telemetry flows, and Kahn DAG topological sequencing.
          </p>
        </div>

        {/* Tactical HUD Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black/5 p-1 rounded-xl border border-black/10">
            <button
              onClick={() => { setLayoutMode('spring'); applyLayout('spring'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'spring'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Spring Layout
            </button>
            <button
              onClick={() => { setLayoutMode('kahn-dag'); applyLayout('kahn-dag'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'kahn-dag'
                  ? 'bg-crimson text-white shadow-sm'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Kahn DAG Tiers
            </button>
            <button
              onClick={() => { setLayoutMode('blast-radius'); applyLayout('blast-radius'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'blast-radius'
                  ? 'bg-crimson text-white shadow-sm ring-2 ring-crimson/30'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              AST Blast Ripple
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Display Viewport (3 Columns) */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-black/15 bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            width={900}
            height={680}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-[540px] md:h-[620px] cursor-grab active:cursor-grabbing block"
          />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-black/10 shadow-sm text-xs font-mono">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-black transition-colors"
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-crimson" /> : <Play className="w-4 h-4 text-emerald-600" />}
            </button>
            <span className="text-black/30">|</span>
            <button
              onClick={() => handleZoom(0.15)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-black transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-black transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg hover:bg-black/5 text-black transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-black/30">|</span>
            <span className="text-[11px] text-black/60 font-bold">
              {nodes.length} Nodes &bull; {edges.length} Edges &bull; 60 FPS
            </span>
          </div>

          {/* Quick HUD Legend */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-black/10 shadow-sm text-[11px] font-mono">
            <div className="flex items-center gap-4 text-black/70">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FAF7F2] border border-black" />
                Upstream API
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ECFDF5] border border-emerald-600" />
                PBE Adapter
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
                Shipwell Workflow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A] border border-crimson" />
                Ledger/Storage
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-crimson font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
                STREAM PACKETS: {isPlaying ? 'FLOWING' : 'HALTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Inspector Panel (1 Column) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-black/15 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-crimson" />
                Node Inspector
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 text-black/70 font-bold uppercase">
                {selectedNode?.type || 'Select Node'}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-black/50 uppercase block">Selected Target:</span>
                  <div className="font-bold text-black text-sm">{selectedNode.label}</div>
                </div>

                <div className="p-3 rounded-xl bg-cream-subtle/80 border border-black/10 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black/60">Status:</span>
                    <span className={`font-bold uppercase ${
                      selectedNode.status === 'mutated' || selectedNode.status === 'circuit-break'
                        ? 'text-crimson'
                        : selectedNode.status === 'adapted'
                        ? 'text-emerald-600'
                        : 'text-black'
                    }`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Tier Level:</span>
                    <span className="font-bold text-black">Stage {selectedNode.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Throughput:</span>
                    <span className="font-bold text-black">{selectedNode.qps} req/sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Invariants:</span>
                    <span className="font-bold text-black">{selectedNode.invariantsCount} active</span>
                  </div>
                </div>

                {selectedNode.filePath && (
                  <div>
                    <span className="text-[10px] text-black/50 uppercase block">AST Source Path:</span>
                    <div className="text-[11px] font-bold text-crimson truncate bg-crimson/5 p-1.5 rounded border border-crimson/20">
                      {selectedNode.filePath}
                    </div>
                  </div>
                )}

                {selectedNode.lines && (
                  <div>
                    <span className="text-[10px] text-black/50 uppercase block">AST Range / Transformation:</span>
                    <div className="text-[11px] text-black/80 bg-black/5 p-2 rounded">
                      {selectedNode.lines}
                    </div>
                  </div>
                )}

                {selectedNode.merkleHash && (
                  <div>
                    <span className="text-[10px] text-black/50 uppercase block">Cryptographic Merkle Leaf:</span>
                    <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 truncate">
                      {selectedNode.merkleHash}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-black/40 text-xs font-mono">
                Click any node on the canvas to inspect its AST blast profile and invariants.
              </div>
            )}
          </div>

          {/* Simulation Tuning Controls */}
          <div className="p-5 rounded-2xl bg-white border border-black/15 shadow-sm space-y-3 font-mono text-xs">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1.5 border-b border-black/10 pb-2">
              <Sliders className="w-3.5 h-3.5 text-crimson" />
              Physics Engine Parameters
            </span>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-black/60">Particle Stream Speed:</span>
                <span className="font-bold text-black">{speedMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={speedMultiplier}
                onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-crimson cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-black/60">Coulomb Repulsion Force:</span>
                <span className="font-bold text-black">{repulsionStrength}</span>
              </div>
              <input
                type="range"
                min="800"
                max="3500"
                step="100"
                value={repulsionStrength}
                onChange={e => setRepulsionStrength(parseInt(e.target.value, 10))}
                className="w-full accent-crimson cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => applyLayout(layoutMode)}
                className="w-full py-2 px-3 rounded-xl bg-black text-white hover:bg-black/90 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-crimson" />
                Re-seed Force Equilibrium
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkXGraphVisualizer;
