/**
 * Dashboard/index.jsx — Dashboard component barrel export
 *
 * Re-exports dashboard-related components for clean imports:
 *   import { StatsCard, RiskFilter } from "../components/Dashboard";
 */

export { StatsCard }  from "../StatsCard";
export { RiskFilter } from "../RiskFilter";
export { default as RiskTrendChart }       from "../Charts/RiskTrendChart";
export { default as RiskDistributionChart } from "../Charts/RiskDistributionChart";
export { default as UserActivityChart }    from "../Charts/UserActivityChart";
export { default as DailyActivityChart }   from "../Charts/DailyActivityChart";
export { default as RiskScoreHeatmap }     from "../Charts/RiskScoreHeatmap";
