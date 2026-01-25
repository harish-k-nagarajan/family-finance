import { motion } from 'framer-motion';

function Card({ children, className = '', hover = false, ...props }) {
  const baseClasses = 'glass-card rounded-xl p-6';
  const hoverClasses = hover ? 'hover-glow cursor-pointer' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Card;
