import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

const COLORS = {
    '401k': '#2DD4BF',
    'IRA': '#A78BFA',
    'Roth IRA': '#EC4899',
    'Pension': '#F59E0B',
    'Taxable': '#3B82F6',
    'Other': '#6B7280',
};

function AllocationPieChart({ data, currency = 'USD' }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-500">
                No investment data available yet
            </div>
        );
    }

    // Custom label
    const renderLabel = (entry) => {
        const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
        return `${percent}%`;
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="glass-card p-4 shadow-lg">
                    <p className="text-sm font-medium text-white mb-1">{data.name}</p>
                    <p className="text-sm text-gray-400">
                        {formatCurrency(data.value, currency)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.name] || COLORS.Other}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value, entry) => (
                            <span className="text-sm text-gray-300">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export default AllocationPieChart;
