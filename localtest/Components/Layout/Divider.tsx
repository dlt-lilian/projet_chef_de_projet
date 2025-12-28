import React from 'react';

type DividerColor = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

interface DividerProps {
    color?: DividerColor;
    className?: string;
    children?: React.ReactNode;
}

const Divider: React.FC<DividerProps> = ({
                                             color = 'primary',
                                             className = '',
                                             children,
                                         }) => {
    const variantClasses: Record<DividerColor, string> = {
        primary: 'divider-primary',
        secondary: 'divider-secondary',
        accent: 'divider-accent',
        info: 'divider-info',
        success: 'divider-success',
        warning: 'divider-warning',
        error: 'divider-error',
    };

    const classes = [
        'divider',
        variantClasses[color],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <div className={classes}>{children}</div>;
};

export default Divider;