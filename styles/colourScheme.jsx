import { StyleSheet } from 'react-native';

export const colours = StyleSheet.create({
    darkGreen: '#0c1908',
    mediumGreen: '#356227',
    lightGreen: '#96A990',
    accentBrown: '#8a6e44',
    dullGreen: '#283325',
    accentRed: '#a83232',
    accentYellow: '#a6af25',
    offWhite: '#d7e7d2',
    darkOverlay: 'rgba(0,0,0,0.3)',
    lightOverlay: 'rgba(215, 231, 210,0.8)',
});

export function withAlpha(hex, alpha) {
    // alpha: 0..1
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}