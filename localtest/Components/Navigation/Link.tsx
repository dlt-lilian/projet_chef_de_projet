import React from 'react';
import Icon from '@/Components/Icon';

type LinkVariant =
    | 'none'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'link'
    | 'ghost';

interface LinkProps {
    to: string;
    variant?: LinkVariant;
    iconLeft?: string;
    iconRight?: string;
    children: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({
                                       to,
                                       variant = 'none',
                                       iconLeft,
                                       iconRight,
                                       children,
                                   }) => {
    const colorClasses: Record<LinkVariant, string> = {
        none: 'no-underline',
        primary: 'link-primary',
        secondary: 'link-secondary',
        accent: 'link-accent',
        info: 'link-info',
        success: 'link-success',
        warning: 'link-warning',
        error: 'link-error',
        link: 'link-link',
        ghost: 'link-ghost',
    };

    const classes = ['link', colorClasses[variant], 'inline-flex items-center gap-2']
        .filter(Boolean)
        .join(' ');

    return (
        <a href={to} className={classes}>
            {iconLeft && <Icon name={iconLeft} />}
            <span>{children}</span>
            {iconRight && <Icon name={iconRight} />}
        </a>
    );
};

export default Link;
