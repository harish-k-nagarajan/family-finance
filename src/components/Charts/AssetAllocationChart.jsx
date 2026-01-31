import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#9CA3AF" className="text-sm font-medium">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={10} textAnchor="middle" fill={fill} className="text-xl font-bold font-display">
                {((props.percent || 0) * 100).toFixed(0)}%
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 14}
                fill={fill}
            />
        </g>
    );
};

function AssetAllocationChart({ cash, investments, homeEquity, currency = 'USD' }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const data = [
        { name: 'Cash', value: cash, color: '#3B82F6' },
        { name: 'Investments', value: investments, color: '#8B5CF6' },
        { name: 'Home Equity', value: homeEquity, color: '#10B981' },
    ].filter(item => item.value > 0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                No asset data available
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                            <span className="text-gray-600 dark:text-gray-300 ml-2 font-medium">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export default AssetAllocationChart;
