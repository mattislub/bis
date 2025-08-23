import React from 'react';

export type AlignOptions = 'left' | 'center' | 'right';

interface AlignProps {
  align?: AlignOptions;
  className?: string;
  children: React.ReactNode;
}

const Align: React.FC<AlignProps> = ({ align = 'left', className = '', children }) => {
  const alignmentClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return <div className={`${alignmentClass} ${className}`.trim()}>{children}</div>;
};

export default Align;
