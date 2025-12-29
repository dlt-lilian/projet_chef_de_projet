import React from 'react';
import Icon from "@/Components/Icon";

type TextType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
type Size = 'sm' | 'md' | 'lg' | 'xl';
type Weight = 'light' | 'normal' | 'semibold' | 'bold' | 'black';
type Color = '' | 'white' | 'primary' | 'success' | 'warning' | 'error'| 'lightgreen'| 'green';
type bgColor = '' | 'white' | 'primary' | 'success' | 'warning' | 'error';
type IconSize = 'xs' | 'sm' | 'md' | 'lg';
type IconColor = 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    type?: TextType;
    size?: Size;
    weight?: Weight;
    color?: Color;
    bgColor?: bgColor;
    underline?: boolean;
    through?: boolean;
    iconLeft?: string | null;
    iconRight?: string | null;
    iconSize?: IconSize;
    iconColor?: IconColor;
    children?: React.ReactNode;
}

const Text: React.FC<TextProps> = ({
                                       type = 'p',
                                       size = 'md',
                                       weight = 'normal',
                                       color = '',
                                       bgColor = '',
                                       underline = false,
                                       through = false,
                                       iconLeft = null,
                                       iconRight = null,
                                       iconSize = 'xs',
                                       iconColor = 'default',
                                       children,
                                       className = '',
                                       ...restProps
                                   }) => {
    const sizeClasses: Record<Size, string> = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
        xl: 'text-3xl',
    };

    const weightClasses: Record<Weight, string> = {
        light: 'font-light',
        normal: 'font-normal',
        semibold: 'font-semibold',
        bold: 'font-bold',
        black: 'font-black',
    };

    const colorClasses: Record<Color, string> = {
        '': '',
        'white': 'text-white',
        'primary': 'text-primary',
        'success': 'text-success',
        'warning': 'text-warning',
        'error': 'text-error',
        'lightgreen': 'text-green-500',
        'green': 'text-green-700',
    };

    const bgClasses: Record<bgColor, string> = {
        '': '',
        'white': 'bg-white',
        'primary': 'bg-primary',
        'success': 'bg-success/50',
        'warning': 'bg-warning/50',
        'error': 'bg-error/50',
    };

    const classes = [
        sizeClasses[size],
        weightClasses[weight],
        through ? 'text-gray-400 line-through' : colorClasses[color],
        bgClasses[bgColor],
        bgColor !== '' ? 'px-2 py-1 rounded-full w-max' : '',
        (iconLeft || iconRight) ? 'flex items-center justify-center gap-2' : '',
        underline ? 'underline underline-offset-2' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const Component = type;

    return (
        <Component className={classes} {...restProps}>
            {iconLeft && <Icon name={iconLeft} size={iconSize} color={iconColor} />}
            {children}
            {iconRight && <Icon name={iconRight} size={iconSize} color={iconColor} />}
        </Component>
    );
};

export default Text;