import { motion } from 'framer-motion';
import Card from '../common/Card';
import AnimatedNumber from '../common/AnimatedNumber';
import { formatCurrency } from '../../utils/formatters';

function HeroStatCard({ label, value, currency, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="md:col-span-2"
    >
      <Card hover className="relative overflow-hidden">
        {/* Subtle glow effect in dark mode */}
        <div className="absolute inset-0 opacity-0 dark:opacity-30 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-teal-400 to-purple-500 blur-3xl rounded-full"></div>
        </div>

        <div className="relative z-10">
          {/* Label - muted, smaller */}
          <p className="text-xs uppercase tracking-wider font-body font-medium text-gray-500 dark:text-gray-500 mb-4">
            {label}
          </p>

          {/* Value - hero size, bold */}
          <p className="text-5xl md:text-6xl font-display font-bold text-gray-900 dark:text-white tabular-nums mb-2">
            <AnimatedNumber
              value={value}
              formatFn={(val) => formatCurrency(val, currency)}
            />
          </p>

          {/* Subtle description */}
          <p className="text-sm font-body text-gray-600 dark:text-gray-400 mt-3">
            Total assets minus liabilities
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

export default HeroStatCard;
