import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '../../utils/formatters';

function SimpleTrendChart({ data, currency = 'USD', label = 'Value', color = '#2DD4BF' }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No historical data available yet. Add some accounts to start tracking!
            </div>
        );
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label: tooltipLabel }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card p-4 shadow-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(tooltipLabel)}
                    </p>
                    <p className="text-sm font-medium" style={{ color }}>
                        {label}: {formatCurrency(payload[0].value, currency)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatDate(date, 'short')}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(val) => formatCurrency(val, currency, 0)}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2DD4BF"
                        fillOpacity={1}
                        fill="url(#trendGradient)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export default SimpleTrendChart;
