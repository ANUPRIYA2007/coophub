import React from 'react';
import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ["#FF7A00", "#FFFFFF", "#FF7A00"],
  animationSpeed = 8,
  showBorder = false,
  style = {},
  ...rest
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
    ...style
  };

  return (
    <div className={`animated-gradient-text-container ${showBorder ? 'has-border' : ''} ${className}`} {...rest}>
      {showBorder && (
        <div className="gradient-text-border" style={gradientStyle} />
      )}
      <span className="gradient-text-content" style={gradientStyle}>
        {children}
      </span>
    </div>
  );
}
