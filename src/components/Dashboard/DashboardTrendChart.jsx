import { useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '../../utils/formatters';

function DashboardTrendChart({ data, currency = 'USD', timeRange = 'all', lastHistoricalDate, forecastMs }) {
    // Series visibility state - Net Worth always visible
    const [visibleSeries, setVisibleSeries] = useState({
        netWorth: true, // locked, always visible
        banks: true,
        investments: true,
        homeEquity: true,
        forecast: true,
    });

    const toggleSeries = (seriesKey) => {
        if (seriesKey === 'netWorth') return; // Net Worth is locked
        setVisibleSeries(prev => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
    };
    // Only show "No data" if absolutely nothing (not even forecast)
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-500">
                No historical data available yet. Add some accounts to start tracking!
            </div>
        );
    }

    // Custom tooltip with color dots and tabular numerals - only show visible series, Net Worth first
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Filter out hidden series and reorder with Net Worth first
            const visiblePayload = payload
                .filter(entry => {
                    const key = entry.dataKey;
                    if (key === 'netWorth') return visibleSeries.netWorth;
                    if (key === 'totalBanks') return visibleSeries.banks;
                    if (key === 'totalInvestments') return visibleSeries.investments;
                    if (key === 'homeEquity') return visibleSeries.homeEquity;
                    if (key === 'forecast') return visibleSeries.forecast;
                    return false;
                })
                .sort((a, b) => {
                    // Net Worth first, then forecast, then others
                    const order = { netWorth: 0, forecast: 1, totalBanks: 2, totalInvestments: 3, homeEquity: 4 };
                    return (order[a.dataKey] || 99) - (order[b.dataKey] || 99);
                });

            if (visiblePayload.length === 0) return null;

            return (
                <div className="glass-card p-4 shadow-xl border border-white/20 dark:border-white/10 rounded-xl">
                    <p className="text-xs font-body text-gray-600 dark:text-gray-400 mb-2">
                        {formatDate(label)}
                    </p>
                    <div className="space-y-1.5">
                        {visiblePayload.map((entry, index) => {
                            const name = entry.name === 'Forecast' ? 'Projected NW' : entry.name;
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    {/* Color dot */}
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <p className="text-sm font-medium tabular-nums" style={{ color: entry.color }}>
                                        {name}: {formatCurrency(entry.value, currency)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    {visiblePayload.some(p => p.dataKey === 'forecast') && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                            * Projection based on 5% annual growth
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Series toggle configuration - solid colors for legend
    const seriesConfig = [
        { key: 'netWorth', label: 'Net Worth', color: '#2DD4BF', locked: true },
        { key: 'banks', label: 'Banks', color: '#3B82F6', locked: false },
        { key: 'investments', label: 'Investments', color: '#A78BFA', locked: false },
        { key: 'homeEquity', label: 'Home Equity', color: '#F59E0B', locked: false },
        { key: 'forecast', label: 'Forecast', color: '#A78BFA', locked: false },
    ];

    // Calculate X-axis domain to limit empty space
    const xDomainMax = lastHistoricalDate ? lastHistoricalDate + forecastMs : undefined;

    return (
        <div className="space-y-4">
            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                className="w-full h-80"
            >
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        {/* Net Worth Area Fill - Gradient with subtle glow */}
                        <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
                            <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.02} />
                        </linearGradient>

                        {/* Net Worth Stroke - Hero gradient */}
                        <linearGradient id="netWorthGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#2DD4BF" stopOpacity={1} />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={1} />
                        </linearGradient>

                        {/* Supporting Series Gradients */}
                        <linearGradient id="banksGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.9} />
                        </linearGradient>
                        <linearGradient id="investmentsGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#EC4899" stopOpacity={0.9} />
                        </linearGradient>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#EAB308" stopOpacity={0.9} />
                        </linearGradient>

                        {/* Glow filter for Net Worth line in dark mode */}
                        <filter id="netWorthGlow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Horizontal grid only - very subdued */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={document.body.classList.contains('dark') ? 'rgba(255,255,255,0.06)' : 'rgba(156,163,175,0.15)'}
                    />

                    {/* Subdued axes - no lines, with domain control */}
                    <XAxis
                        dataKey="date"
                        type="number"
                        domain={['dataMin', xDomainMax || 'dataMax']}
                        tickFormatter={(date) => formatDate(date, 'short')}
                        stroke={document.body.classList.contains('dark') ? '#6B7280' : '#9CA3AF'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => formatCurrency(value, currency, 0)}
                        stroke={document.body.classList.contains('dark') ? '#6B7280' : '#9CA3AF'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={85}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* Forecast Shaded Region */}
                    {lastHistoricalDate && visibleSeries.forecast && (
                        <ReferenceArea
                            x1={lastHistoricalDate}
                            x2={xDomainMax}
                            fill={document.body.classList.contains('dark') ? 'rgba(167, 139, 250, 0.08)' : 'rgba(139, 92, 246, 0.05)'}
                            fillOpacity={1}
                            label={{
                                value: 'Forecast',
                                position: 'insideTopRight',
                                fill: document.body.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
                                fontSize: 11,
                                fontFamily: 'Inter',
                            }}
                        />
                    )}

                    {/* Area Fill - Renders Behind Lines (Net Worth only) */}
                    {visibleSeries.netWorth && (
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            stroke="none"
                            fill="url(#netWorthFill)"
                            fillOpacity={1}
                        />
                    )}

                    {/* Forecast Line (Dashed) */}
                    {visibleSeries.forecast && (
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#A78BFA"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#A78BFA', r: 2, strokeWidth: 0 }}
                            name="Forecast"
                            strokeOpacity={0.6}
                        />
                    )}

                    {/* Net Worth Line - On Top (hero series) */}
                    {visibleSeries.netWorth && (
                        <Line
                            type="monotone"
                            dataKey="netWorth"
                            stroke="url(#netWorthGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#2DD4BF', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Net Worth"
                        />
                    )}

                    {/* Supporting Series Lines - Thinner, lower opacity */}
                    {visibleSeries.banks && (
                        <Line
                            type="monotone"
                            dataKey="totalBanks"
                            stroke="url(#banksGradient)"
                            strokeWidth={1.5}
                            dot={{ fill: '#3B82F6', r: 2 }}
                            name="Bank Accounts"
                            strokeOpacity={0.7}
                        />
                    )}
                    {visibleSeries.investments && (
                        <Line
                            type="monotone"
                            dataKey="totalInvestments"
                            stroke="url(#investmentsGradient)"
                            strokeWidth={1.5}
                            dot={{ fill: '#A78BFA', r: 2 }}
                            name="Investments"
                            strokeOpacity={0.7}
                        />
                    )}
                    {visibleSeries.homeEquity && (
                        <Line
                            type="monotone"
                            dataKey="homeEquity"
                            stroke="url(#equityGradient)"
                            strokeWidth={1.5}
                            dot={{ fill: '#F59E0B', r: 2 }}
                            name="Home Equity"
                            strokeOpacity={0.7}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
            </motion.div>

            {/* Subdued Legend/Toggle Row at Bottom */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200 dark:border-white/10"
            >
                {seriesConfig.map((series) => (
                    <button
                        key={series.key}
                        onClick={() => toggleSeries(series.key)}
                        disabled={series.locked}
                        className={`
                            flex items-center gap-2 px-2 py-1 rounded text-xs font-medium font-body transition-all
                            ${visibleSeries[series.key]
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-600 line-through'
                            }
                            ${series.locked ? 'cursor-default' : 'cursor-pointer hover:text-gray-900 dark:hover:text-white'}
                        `}
                    >
                        {/* Small solid color dot */}
                        <div
                            className={`w-2 h-2 rounded-full ${series.key === 'forecast' ? 'border border-current' : ''}`}
                            style={{
                                backgroundColor: visibleSeries[series.key] ? series.color : 'transparent',
                                borderColor: series.key === 'forecast' ? series.color : 'transparent',
                                borderStyle: series.key === 'forecast' ? 'dashed' : 'solid',
                                borderWidth: series.key === 'forecast' ? '1px' : '0',
                            }}
                        />
                        <span>{series.label}</span>
                    </button>
                ))}
            </motion.div>
        </div>
    );
}

export default DashboardTrendChart;
