import { motion } from 'framer-motion';
import Card from '../common/Card';
import AnimatedNumber from '../common/AnimatedNumber';
import { formatCurrency } from '../../utils/formatters';

function StatCard({ label, value, gradient, currency, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      <Card hover>
        {/* Label - quiet, small, muted, uppercase */}
        <p className="text-xs uppercase tracking-wider font-body font-medium text-gray-500 dark:text-gray-500 mb-3">
          {label}
        </p>

        {/* Value - large, gradient, tabular numerals */}
        <p className={`text-3xl md:text-4xl font-display font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent tabular-nums`}>
          <AnimatedNumber
            value={value}
            formatFn={(val) => formatCurrency(val, currency)}
          />
        </p>
      </Card>
    </motion.div>
  );
}

export default StatCard;
