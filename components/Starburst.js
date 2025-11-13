import React from 'react';
import Svg, { Polygon } from 'react-native-svg';
import { colours } from '../styles/colourScheme';

export default function Starburst({ size = 60, spikes = 20, inner = 0.45, fill = colours.mediumGreen }) {
    const cx = size / 2;
    const cy = size / 2;
    const outer = size / 2;
    const innerR = outer * inner;
    const points = [];
    const total = spikes * 2;
    for (let i = 0; i < total; i++) {
        const angle = (i * Math.PI) / spikes - Math.PI / 2; // start at top
        const r = i % 2 === 0 ? outer : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    const pointsStr = points.join(' ');
    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Polygon points={pointsStr} fill={fill} />
        </Svg>
    );
}