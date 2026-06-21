import React from 'react';

interface TokenRingProps {
  isCurrent: boolean;
  isSelected: boolean;
  teamColor: string;
  formaColor?: string | null;
  unionColor?: string | null;
  isUnionSelected: boolean;
  isAreaSelected: boolean;
  unionMode: boolean;
}

const TokenRing: React.FC<TokenRingProps> = ({
  isCurrent, isSelected, teamColor, formaColor,
  unionColor, isUnionSelected, isAreaSelected, unionMode,
}) => (
  <>
    {isCurrent && (
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        border: `2px solid ${teamColor}`,
        boxShadow: `0 0 18px ${teamColor}88`,
        animation: 'turn-pulse 2.2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {isSelected && !isCurrent && (
      <div style={{
        position: 'absolute', inset: -6, borderRadius: '50%',
        border: '2px solid rgba(52,211,153,0.8)',
        boxShadow: '0 0 14px rgba(52,211,153,0.45)',
        animation: 'turn-pulse 1.8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {formaColor && (
      <div style={{
        position: 'absolute', inset: -12, borderRadius: '50%',
        border: `2px solid ${formaColor}`,
        boxShadow: `0 0 20px ${formaColor}88, 0 0 40px ${formaColor}22`,
        animation: 'forma-combatant-pulse 2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {unionColor && (
      <div style={{
        position: 'absolute',
        inset: isUnionSelected ? -12 : -8,
        borderRadius: '50%',
        border: `2px solid ${unionColor}`,
        boxShadow: `0 0 10px ${unionColor}88`,
        animation: 'turn-pulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
    {unionMode && (
      <div style={{
        position: 'absolute', inset: -9, borderRadius: '50%',
        border: `2px dashed ${isUnionSelected ? '#a855f7' : 'rgba(168,85,247,0.3)'}`,
        boxShadow: isUnionSelected ? '0 0 16px rgba(168,85,247,0.6)' : 'none',
        pointerEvents: 'none',
      }} />
    )}
    {isAreaSelected && (
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        border: '2.5px solid #fb923c',
        boxShadow: '0 0 20px rgba(234,88,12,0.8)',
        animation: 'turn-pulse 1.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    )}
  </>
);

export default TokenRing;
