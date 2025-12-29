'use client';

import React from 'react';

interface AccordionItem {
    title: string;
    content: string;
}

type AccordionVariant = 'outline' | 'bg';

interface AccordionProps {
    items?: AccordionItem[];
    variant?: AccordionVariant;
    name?: string;
    className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
                                                 items = [],
                                                 variant = 'outline',
                                                 name = 'accordion',
                                                 className = '',
                                             }) => {
    const variantClasses: Record<AccordionVariant, string> = {
        outline: 'border-base-300 border hover:bg-base-200 transition-all duration-200 ease-in-out',
        bg: 'bg-base-200 hover:bg-base-300 transition-all duration-200 ease-in-out',
    };

    const classes = [
        'collapse collapse-arrow join-item',
        variantClasses[variant],
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={`join join-vertical bg-base-100 ${className}`}>
            {items.map((item, index) => (
                <div key={index} className={classes}>
                    <input
                        type="radio"
                        name={name}
                        id={`${name}-${index}`}
                    />
                    <div className="collapse-title font-semibold">{item.title}</div>
                    <div className="collapse-content text-sm">{item.content}</div>
                </div>
            ))}
        </div>
    );
};

export default Accordion;