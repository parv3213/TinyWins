'use client';

import { useEffect, useRef, useState } from 'react';
import { TreeRenderer } from './treeRenderer';

interface TreeCanvasProps {
  health: number; // 0 to 100
}

export default function TreeCanvas({ health }: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | null>(null);
  const animationRef = useRef<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current || !containerRef.current) return;

    // Initialize renderer if not exists
    if (!rendererRef.current) {
      rendererRef.current = new TreeRenderer(canvasRef.current);
    }

    const renderer = rendererRef.current;
    
    // Set initial and handle resize
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        renderer.resize(clientWidth, clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation Loop
    const animate = () => {
      renderer.update();
      renderer.draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isClient]);

  // Update health when prop changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setHealth(health);
    }
  }, [health]);

  if (!isClient) {
    return (
      <div className="w-full h-64 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Determine glow class based on health
  let glowClass = '';
  if (health >= 60) glowClass = 'glow-healthy';
  else if (health <= 40) glowClass = 'glow-struggling';

  // Determine sky background
  let skyStyle = {};
  if (health >= 80) skyStyle = { background: 'var(--tree-sky-healthy)' };
  else if (health >= 40) skyStyle = { background: 'var(--tree-sky-growing)' };
  else skyStyle = { background: 'var(--tree-sky-struggling)' };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[350px] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)] glow-container ${glowClass}`}
      style={skyStyle}
      title={`Tree Health: ${health}%`}
    >
      {/* CSS Glow overlay */}
      <div className="absolute inset-0 z-0"></div>
      
      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-10 w-full h-full"
      />
      
      {/* Ground Overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-12 z-20 transition-colors duration-1000"
        style={{
          background: health >= 60 
            ? 'var(--tree-ground-healthy)' 
            : (health >= 40 ? 'var(--tree-ground-growing)' : 'var(--tree-ground-struggling)'),
          borderTopLeftRadius: '50% 20px',
          borderTopRightRadius: '50% 20px'
        }}
      ></div>

      {/* State Badge */}
      <div className="absolute top-4 left-4 z-30 bg-[var(--card)]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
        <span className="text-sm font-medium text-[var(--fg)]">
          {health >= 80 ? '🌳 Flourishing' : 
           health >= 60 ? '🌲 Healthy' : 
           health >= 40 ? '🌿 Growing' : 
           health >= 20 ? '🥀 Struggling' : '🪵 Dying'}
        </span>
      </div>
    </div>
  );
}
