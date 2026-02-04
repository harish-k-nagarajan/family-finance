import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useVelocity } from 'framer-motion';

function AnimatedNumber({ value, formatFn, className = '' }) {
  const motionValue = useMotionValue(0);
  const velocity = useVelocity(motionValue);
  const [isAnimating, setIsAnimating] = useState(false);

  // Smart rounding: round to $100 for large values during animation
  const display = useTransform(motionValue, (current) => {
    const rounded = Math.abs(value - current) > 100 && Math.abs(current) > 10000
      ? Math.round(current / 100) * 100  // Round to nearest $100 during animation
      : Math.round(current);
    return formatFn ? formatFn(rounded) : rounded.toLocaleString();
  });

  useEffect(() => {
    setIsAnimating(true);
    const controls = animate(motionValue, value, {
      type: 'spring',
      stiffness: 90,
      damping: 18
    });

    // Reset animating state after animation completes
    const timeout = setTimeout(() => setIsAnimating(false), 1000);

    return () => {
      controls.stop();
      clearTimeout(timeout);
    };
  }, [motionValue, value]);

  return (
    <motion.span
      className={className}
      style={{
        filter: isAnimating ? 'blur(0.3px)' : 'blur(0px)',
        transition: 'filter 0.15s ease-out'
      }}
    >
      {display}
    </motion.span>
  );
}

export default AnimatedNumber;
