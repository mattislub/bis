import React from 'react';

export type HorizontalAlignOptions = 'left' | 'center' | 'right';
export type VerticalAlignOptions = 'top' | 'center' | 'bottom';

interface AlignProps {
  /** Horizontal alignment */
  align?: HorizontalAlignOptions;
  /** Vertical alignment */
  vertical?: VerticalAlignOptions;
  className?: string;
  children: React.ReactNode;
}

const Align: React.FC<AlignProps> = ({
  align = 'left',
  vertical = 'top',
  className = '',
  children,
}) => {
  const horizontalClass =
    align === 'center'
      ? 'text-center justify-center'
      : align === 'right'
      ? 'text-right justify-end'
      : 'text-left justify-start';

  const verticalClass =
    vertical === 'center'
      ? 'items-center'
      : vertical === 'bottom'
      ? 'items-end'
      : 'items-start';

  return (
    <div className={`flex flex-wrap ${horizontalClass} ${verticalClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Align;
