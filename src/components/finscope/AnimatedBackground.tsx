'use client';

import { motion } from 'framer-motion';

const particles = [
  { x: '5%', y: '20%', size: 2, delay: '0s', duration: '25s' },
  { x: '12%', y: '60%', size: 1.5, delay: '2s', duration: '30s' },
  { x: '20%', y: '80%', size: 2.5, delay: '4s', duration: '22s' },
  { x: '28%', y: '10%', size: 1, delay: '6s', duration: '35s' },
  { x: '35%', y: '45%', size: 2, delay: '1s', duration: '28s' },
  { x: '42%', y: '75%', size: 1.5, delay: '3s', duration: '32s' },
  { x: '50%', y: '30%', size: 2.5, delay: '5s', duration: '20s' },
  { x: '58%', y: '90%', size: 1, delay: '7s', duration: '27s' },
  { x: '65%', y: '15%', size: 2, delay: '0.5s', duration: '33s' },
  { x: '72%', y: '55%', size: 1.5, delay: '3.5s', duration: '24s' },
  { x: '78%', y: '85%', size: 2.5, delay: '5.5s', duration: '29s' },
  { x: '85%', y: '25%', size: 1, delay: '1.5s', duration: '36s' },
  { x: '90%', y: '65%', size: 2, delay: '4.5s', duration: '21s' },
  { x: '95%', y: '40%', size: 1.5, delay: '6.5s', duration: '26s' },
  { x: '8%', y: '95%', size: 2, delay: '2.5s', duration: '31s' },
  { x: '48%', y: '5%', size: 1.5, delay: '8s', duration: '23s' },
  { x: '75%', y: '70%', size: 1, delay: '9s', duration: '34s' },
];

export default function AnimatedBackground() {
  return (
    <motion.div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* Moving grid pattern at 45 degrees */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 49px, rgba(25, 195, 125, 0.03) 49px, rgba(25, 195, 125, 0.03) 50px)',
          backgroundSize: '70.71px 70.71px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Radial gradient glow - center pulse */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(25, 195, 125, 0.06) 0%, rgba(25, 195, 125, 0.02) 40%, transparent 70%)',
          animation: 'bgPulse 8s ease-in-out infinite',
        }}
      />

      {/* Secondary off-center glow for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 40% at 30% 70%, rgba(25, 195, 125, 0.04) 0%, transparent 60%)',
          animation: 'bgPulse 10s ease-in-out infinite reverse',
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: 'rgba(25, 195, 125, 0.4)',
            boxShadow: '0 0 4px rgba(25, 195, 125, 0.3)',
            animation: `particleFloat ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      ))}
    </motion.div>
  );
}
