import { defaults } from 'chart.js/auto';
import * as theme from './theme.js';

// Common Chart.js defaults
defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
defaults.color = theme.colorTextMuted;
defaults.plugins.tooltip.backgroundColor = 'rgba(31, 41, 55, 0.9)'; // gray-800
defaults.plugins.tooltip.titleColor = '#fff';
defaults.plugins.tooltip.bodyColor = '#f3f4f6'; // gray-100
defaults.plugins.tooltip.cornerRadius = 8;
defaults.plugins.tooltip.padding = 12;
defaults.plugins.legend.labels.color = theme.colorTextMuted;
defaults.plugins.legend.labels.boxWidth = 12;
defaults.plugins.legend.labels.usePointStyle = true;
defaults.plugins.legend.labels.font = { size: 11, weight: '500' };

defaults.scale.grid.color = 'rgba(0, 0, 0, 0.05)';
defaults.scale.ticks.color = theme.colorTextMuted;
defaults.scale.ticks.font = { size: 11 };

// Common configuration snippet for Bar charts
export const commonBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    scales: {
        x: {
            grid: { display: false }
        },
        y: {
            border: { display: false }
        }
    }
};

export const commonDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    cutout: '65%'
};

export const palettes = {
    tipos: [theme.colorArticulo, theme.colorLibro, theme.colorCapitulo],
    cuartiles: [theme.colorQ1, theme.colorQ2, theme.colorQ3, theme.colorQ4, theme.colorSC],
    bases: [theme.colorArticulo, theme.colorCapitulo, theme.colorLibro, theme.colorGrey],
    revistasMundial: theme.colorArticulo,
    revistasRegional: theme.colorLibro
};
