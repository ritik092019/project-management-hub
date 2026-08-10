import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { motion } from 'motion/react';

export const AmbientBackgroundFX: React.FC = () => {
  const { theme } = useTheme();

  if (theme.ambientEffect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {theme.ambientEffect === 'blobs' && (
        <>
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-3xl opacity-70"
          />
          <motion.div
            animate={{
              x: [0, -50, 30, 0],
              y: [0, 40, -30, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-gradient-to-bl from-purple-600/20 via-pink-600/15 to-cyan-500/10 blur-3xl opacity-60"
          />
          <motion.div
            animate={{
              x: [0, 30, -40, 0],
              y: [0, 50, -20, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-600/15 via-emerald-600/10 to-blue-600/15 blur-3xl opacity-60"
          />
        </>
      )}

      {theme.ambientEffect === 'aurora' && (
        <div className="absolute inset-0 opacity-40">
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/20 to-slate-950"
          />
        </div>
      )}

      {theme.ambientEffect === 'grid' && (
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {theme.ambientEffect === 'particles' && (
        <div className="absolute inset-0 opacity-30">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                scale: Math.random() * 0.6 + 0.4,
              }}
              animate={{
                y: ['0%', '-100%'],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: Math.random() * 12 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'linear',
              }}
              className="absolute w-2 h-2 rounded-full bg-blue-400 blur-xs"
            />
          ))}
        </div>
      )}
    </div>
  );
};
