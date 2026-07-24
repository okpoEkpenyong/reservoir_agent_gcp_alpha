// src/components/ui/PromptSuggestions.tsx
import { useEffect, useRef } from 'react';
import { Cpu, BarChart2, FileText, GitMerge, ArrowRight } from 'lucide-react';


const CARDS = [
  {
    icon: Cpu,
    color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    label: 'Simulation QC',
    sub: 'ECLIPSE · OPM',
    path: '/debug',
  },
  {
    icon: BarChart2,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    iconColor: 'text-amber-400',
    label: 'Asset Intelligence',
    sub: 'DCA · EUR · Reserves',
    path: '/asset',
  },
  {
    icon: FileText,
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    label: 'RelPerm Agent',
    sub: 'Relative Permeability',
    path: '/relperm',
  },
  {
    icon: GitMerge,
    color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    iconColor: 'text-violet-400',
    label: 'Flare Monitor',
    sub: 'Monitor upstream flare',
    path: '/flare',
  },
]


export function PromptSuggestions({ onSelect }: { onSelect: (path: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  
  /* ── 3D particle field Animation ──────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
	if (!canvas) return;
    const ctx = canvas.getContext('2d')
    if (!ctx) return
	
	// ← Capture in a non-nullable local so TypeScript trusts it inside all callbacks
    const el = canvas;

    let W = 0, H = 0
    const PARTICLES = 120
    const CONNECTIONS = 60

    interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number }
    let pts: P[] = []

    function resize() {
      //const parent = canvas.parentElement
	  const parent = el.parentElement;  // ← el instead of canvas
      if (!parent) return;
      W = parent.offsetWidth
      H = parent.offsetHeight
	  el.width = W;   // ← el instead of canvas
      el.height = H;  // ← el instead of canvas
      //canvas.width = W
      //canvas.height = H
    }

    function init() {
      pts = Array.from({ length: PARTICLES }, () => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.0006,
        vy: (Math.random() - 0.5) * 0.0006,
        vz: (Math.random() - 0.5) * 0.0003,
      }))
    }

    function project(x: number, y: number, z: number) {
      const fov = 1.2
      const scale = fov / (fov + z)
      return {
        sx: (x * scale + 1) * 0.5 * W,
        sy: (y * scale + 1) * 0.5 * H,
        r: Math.max(0.5, scale * 2.5),
        alpha: Math.min(1, scale * 0.9),
      }
    }

    let t = 0
    function draw() {
	  if (!ctx) return 	
      ctx.clearRect(0, 0, W, H)
      t += 0.003

      pts.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz
        if (p.x < -1.5 || p.x > 1.5) p.vx *= -1
        if (p.y < -1.5 || p.y > 1.5) p.vy *= -1
        if (p.z < 0 || p.z > 1.2) p.vz *= -1
      })

      for (let i = 0; i < CONNECTIONS; i++) {
        const a = pts[i], b = pts[(i + 7) % PARTICLES]
        const pa = project(a.x, a.y, a.z)
        const pb = project(b.x, b.y, b.z)
        const dist = Math.hypot(pa.sx - pb.sx, pa.sy - pb.sy)
        if (dist < W * 0.22) {
          const alpha = (1 - dist / (W * 0.22)) * 0.18
          ctx.beginPath()
          ctx.moveTo(pa.sx, pa.sy)
          ctx.lineTo(pb.sx, pb.sy)
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }

      pts.forEach(p => {
        const { sx, sy, r, alpha } = project(p.x, p.y, p.z)
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(125, 211, 252, ${alpha * 0.8})`
        ctx.fill()
      })

      for (let i = 0; i < 4; i++) {
        const cx = W * (0.3 + 0.15 * Math.sin(t * 0.4 + i * 1.2))
        const cy = H * (0.4 + 0.1 * Math.cos(t * 0.3 + i))
        const radius = W * (0.12 + i * 0.08 + 0.015 * Math.sin(t + i))
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.04 - i * 0.007})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas.parentElement || document.body)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative w-full max-w-2xl">
      {/* Background Animation Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 -z-10 w-full h-full pointer-events-none opacity-60"
      />

      <div className="grid grid-cols-2 gap-3">  
        {CARDS.map(card => {
          const Icon = card.icon
          return (
            <button 
              key={card.path} 
              onClick={() => onSelect(card.path)}
              className={`group text-left p-4 rounded-xl border bg-gradient-to-br
                backdrop-blur-sm transition-all duration-200
                hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]
                ${card.color}`}
            >
              <Icon size={18} className={`mb-2 ${card.iconColor}`} />
              <div className="text-sm font-medium text-white">{card.label}</div>
              <div className="text-xs text-petroleum-400 font-mono mt-0.5">{card.sub}</div>
              <div className="flex items-center gap-1 mt-2 text-petroleum-600 group-hover:text-petroleum-300 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider">Open Workspace</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}