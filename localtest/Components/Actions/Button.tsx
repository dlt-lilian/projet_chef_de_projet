'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/Components/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'link' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonWidth = 'full' | 'col' | 'max';
type IconSize = 'xs' | 'sm' | 'md' | 'lg';
type IconColor = 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    width?: ButtonWidth;
    iconLeft?: string | null;
    iconRight?: string | null;
    iconSize?: IconSize;
    iconColor?: IconColor;
    link?: string | null;
    outline?: boolean;
    wide?: boolean;
    disabled?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'primary',
                                           size = 'md',
                                           width = 'max',
                                           iconLeft = null,
                                           iconRight = null,
                                           iconSize = 'xs',
                                           iconColor = 'default',
                                           link = null,
                                           outline = false,
                                           wide = false,
                                           disabled = false,
                                           onClick,
                                           children = '',
                                           className = '',
                                           ...restProps
                                       }) => {
    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        info: 'btn-info',
        success: 'btn-success',
        warning: 'btn-warning',
        error: 'btn-error',
        ghost: 'btn-ghost',
        link: 'btn-link p-0',
    };

    const sizeClasses: Record<ButtonSize, string> = {
        xs: 'btn-xs',
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    const widthClasses: Record<ButtonWidth, string> = {
        full: 'w-full',
        col: 'col-span-full',
        max: 'w-max',
    };

    const classes = [
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        widthClasses[width],
        outline ? 'btn-outline' : '',
        wide ? 'btn-wide' : '',
        disabled ? 'btn-disabled' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled && onClick) {
            onClick(event);
        }
    };

    const buttonContent = (
        <>
            {iconLeft && <Icon name={iconLeft} size={iconSize} color={iconColor} />}
            {children}
            {iconRight && <Icon name={iconRight} size={iconSize} color={iconColor} />}
        </>
    );

    const buttonElement = (
        <button
            className={classes}
            disabled={disabled}
            onClick={handleClick}
            type="button"
            {...restProps}
        >
            {buttonContent}
        </button>
    );

    if (link) {
        return (
            <Link href={link}>
                {buttonElement}
            </Link>
        );
    }

    return buttonElement;
};

export default Button;