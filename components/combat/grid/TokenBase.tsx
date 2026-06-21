import React from 'react';

interface TokenBaseProps {
  teamColor: string;
}

const TokenBase: React.FC<TokenBaseProps> = ({ teamColor }) => (
  <div style={{
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    height: 10,
    borderRadius: '50%',
    background: teamColor,
    filter: 'blur(5px)',
    opacity: 0.38,
    pointerEvents: 'none',
  }} />
);

export default TokenBase;
