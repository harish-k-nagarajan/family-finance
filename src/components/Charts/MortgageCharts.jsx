import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

export function AmortizationChart({ data, currency = 'USD' }) {
    if (!data || data.length === 0) return null;

    // Sample data to avoid too many points (e.g., yearly)
    // Or just pass all 360, Recharts handles it okay usually, but sampling is better for tooltips
    const sampledData = data.filter((_, i) => i % 12 === 0 || i === data.length - 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampledData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => new Date(date).getFullYear()}
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
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        labelFormatter={(date) => new Date(date).getFullYear()}
                        formatter={(value) => [formatCurrency(value, currency), 'Balance']}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#2DD4BF"
                        fillOpacity={1}
                        fill="url(#balanceGradient)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export function PaymentCompositionChart({ data, currency = 'USD' }) {
    if (!data || data.length === 0) return null;

    // Group by year for the stacked bar
    const yearlyData = [];
    let currentYear = null;
    let yearPrincipal = 0;
    let yearInterest = 0;

    data.forEach((p) => {
        const year = new Date(p.date).getFullYear();
        if (year !== currentYear) {
            if (currentYear) {
                yearlyData.push({ year: currentYear, principal: yearPrincipal, interest: yearInterest });
            }
            currentYear = year;
            yearPrincipal = 0;
            yearInterest = 0;
        }
        yearPrincipal += p.principal;
        yearInterest += p.interest;
    });
    // Push last year
    yearlyData.push({ year: currentYear, principal: yearPrincipal, interest: yearInterest });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-80"
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="year"
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
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value, name) => [formatCurrency(value, currency), name]}
                    />
                    <Legend />
                    <Bar dataKey="interest" stackId="a" fill="#EC4899" radius={[0, 0, 4, 4]} name="Interest" />
                    <Bar dataKey="principal" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Principal" />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
