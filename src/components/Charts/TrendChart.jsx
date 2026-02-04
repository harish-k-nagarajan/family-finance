import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '../../utils/formatters';

function TrendChart({ data, currency = 'USD', timeRange = 'all' }) {
    // Only show "No data" if absolutely nothing (not even forecast)
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-500">
                No historical data available yet. Add some accounts to start tracking!
            </div>
        );
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card p-4 shadow-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">{formatDate(label)}</p>
                    {payload.map((entry, index) => {
                        // Handle Forecast label specifically
                        const name = entry.name === 'forecast' ? 'Projected NW' : entry.name;
                        return (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <p className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                                    {name}: {formatCurrency(entry.value, currency)}
                                </p>
                            </div>
                        );
                    })}
                    {payload.some(p => p.dataKey === 'forecast') && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                            * Projection based on 5% annual growth
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="banksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="investmentsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#EAB308" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatDate(date, 'short')}
                        stroke={document.body.classList.contains('dark') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        tickFormatter={(value) => formatCurrency(value, currency)}
                        stroke={document.body.classList.contains('dark') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                    />
                    {/* Forecast Line (Dashed) */}
                    <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#A78BFA"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ fill: '#A78BFA', r: 3, strokeWidth: 0 }}
                        name="Forecast"
                    />
                    <Line
                        type="monotone"
                        dataKey="netWorth"
                        stroke="url(#netWorthGradient)"
                        strokeWidth={3}
                        dot={{ fill: '#2DD4BF', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Net Worth"
                    />
                    <Line
                        type="monotone"
                        dataKey="totalBanks"
                        stroke="url(#banksGradient)"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 3 }}
                        name="Bank Accounts"
                    />
                    <Line
                        type="monotone"
                        dataKey="totalInvestments"
                        stroke="url(#investmentsGradient)"
                        strokeWidth={2}
                        dot={{ fill: '#A78BFA', r: 3 }}
                        name="Investments"
                    />
                    <Line
                        type="monotone"
                        dataKey="homeEquity"
                        stroke="url(#equityGradient)"
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', r: 3 }}
                        name="Home Equity"
                    />
                </LineChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export default TrendChart;
