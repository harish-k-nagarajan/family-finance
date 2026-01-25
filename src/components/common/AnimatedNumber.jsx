import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function AnimatedNumber({ value, formatFn, className = '' }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    formatFn ? formatFn(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

export default AnimatedNumber;
