'use client';

import React, { useState } from 'react';

type SwapType = 'rotate' | 'flip' | 'indeterminate';

interface SwapProps {
    type?: SwapType;
    active?: boolean;
    disabled?: boolean;
    onChange?: (active: boolean) => void;
    onContent?: React.ReactNode;
    offContent?: React.ReactNode;
    className?: string;
}

const Swap: React.FC<SwapProps> = ({
                                       type = 'rotate',
                                       active: controlledActive,
                                       disabled = false,
                                       onChange,
                                       onContent,
                                       offContent,
                                       className = '',
                                   }) => {
    const [internalActive, setInternalActive] = useState(false);

    // Support controlled et uncontrolled
    const isControlled = controlledActive !== undefined;
    const active = isControlled ? controlledActive : internalActive;

    const swapClasses = [
        'swap',
        type === 'rotate' ? 'swap-rotate' : '',
        type === 'flip' ? 'swap-flip' : '',
        type === 'indeterminate' ? 'swap-indeterminate' : '',
        disabled ? 'swap-disabled' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const newActive = event.target.checked;

        if (!isControlled) {
            setInternalActive(newActive);
        }

        if (onChange) {
            onChange(newActive);
        }
    };

    const defaultOnContent = (
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L12 14.8l-4.9 4.9-1.4-1.4L12 12 5.7 5.7l1.4-1.4L12 9.2l4.9-4.9z" />
        </svg>
    );

    const defaultOffContent = (
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
    );

    return (
        <label className={swapClasses}>
            <input
                type="checkbox"
                checked={active}
                disabled={disabled}
                onChange={handleChange}
            />
            <div className="swap-on">
                {onContent || defaultOnContent}
            </div>
            <div className="swap-off">
                {offContent || defaultOffContent}
            </div>
        </label>
    );
};

export default Swap;