import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg';
type IconColor = 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

interface CustomIconProps {
    name: string;
    size?: IconSize;
    color?: IconColor;
    rotate?: boolean;
    className?: string;
}

const CustomIcon: React.FC<CustomIconProps> = ({
                                                   name,
                                                   size = 'xs',
                                                   color = 'default',
                                                   rotate = false,
                                                   className = '',
                                               }) => {
    const variantClasses: Record<IconColor, string> = {
        default: '',
        primary: 'text-primary',
        secondary: 'text-secondary',
        accent: 'text-accent',
        info: 'text-info',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
    };

    const sizeClasses: Record<IconSize, string> = {
        xs: 'w-5 h-5',
        sm: 'w-10 h-10',
        md: 'w-15 h-15',
        lg: 'w-20 h-20',
    };

    const classes = [
        variantClasses[color],
        sizeClasses[size],
        'transition-transform duration-300',
        rotate ? 'rotate-180' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <IconifyIcon icon={name} className={classes} />;
};

export default CustomIcon;