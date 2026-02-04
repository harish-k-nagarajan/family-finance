import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

function AnimatedNumber({ value, formatFn, className = '' }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (current) =>
    formatFn ? formatFn(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.5,
      ease: 'easeOut'
    });
    return controls.stop;
  }, [motionValue, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

export default AnimatedNumber;
