'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/Components/Actions/Button';

type DropdownAlign = 'start' | 'center' | 'end';
type DropdownPosition = 'top' | 'bottom' | 'left' | 'right';
type DropdownSize = 'xs' | 'sm' | 'md' | 'lg';
type DropdownVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'link' | 'ghost';

interface DropdownItem {
    id?: string;
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
}

interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: DropdownAlign;
    position?: DropdownPosition;
    variant?: DropdownVariant;
    size?: DropdownSize;
    hover?: boolean;
    open?: boolean;
    items?: DropdownItem[];
    trigger?: React.ReactNode;
    content?: React.ReactNode;
    children?: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({
                                               align = 'start',
                                               position = 'bottom',
                                               variant = 'primary',
                                               size = 'md',
                                               hover = false,
                                               open = false,
                                               items = [],
                                               trigger,
                                               content,
                                               children,
                                               className = '',
                                               ...restProps
                                           }) => {
    // Classes pour les positions
    const positionClasses: Record<DropdownPosition, string> = {
        top: 'dropdown-top',
        bottom: 'dropdown-bottom',
        left: 'dropdown-left',
        right: 'dropdown-right',
    };

    // Classes pour l'alignement
    const alignClasses: Record<DropdownAlign, string> = {
        start: 'dropdown-start',
        center: 'dropdown-center',
        end: 'dropdown-end',
    };

    // variantes
    const variantClasses: Record<DropdownVariant, string> = {
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

    // Classes pour les tailles
    const sizeClasses: Record<DropdownSize, string> = {
        xs: 'btn-xs',
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    };

    const classes = [
        'dropdown',
        positionClasses[position],
        alignClasses[align],
        hover ? 'dropdown-hover' : '',
        open ? 'dropdown-open' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const buttonClasses = ['btn', variantClasses[variant], sizeClasses[size]].filter(Boolean).join(' ');

    const defaultTrigger = (
        <>
            <span>Dropdown</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </>
    );

    return (
        <div className={classes}>
            <div tabIndex={0} role="button" className={buttonClasses} {...restProps}>
                {trigger || defaultTrigger}
            </div>
            <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                {items.map((item, index) => (
                    <li key={item.id || item.label || index}>
                        {item.href ? (
                            <Link
                                href={item.href}
                                className={item.disabled ? 'disabled' : ''}
                                onClick={(e) => item.disabled && e.preventDefault()}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <Button onClick={item.onClick} disabled={item.disabled}>
                                {item.label}
                            </Button>
                        )}
                    </li>
                ))}
                {content}
                {children}
            </ul>
        </div>
    );
};

export default Dropdown;