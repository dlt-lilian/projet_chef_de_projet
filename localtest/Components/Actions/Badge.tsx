import React from "react";

type Color = "primary" | "secondary" | "accent" | "neutral" | "info" | "success" | "warning" | "error";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: Color;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
                                         color,
                                         children,
                                         className = "",
                                         ...restProps
                                     }) => {
    const colorClasses: Record<Color, string> = {
        primary: "badge-primary",
        secondary: "badge-secondary",
        accent: "badge-accent",
        neutral: "badge-neutral",
        info: "badge-info",
        success: "badge-success",
        warning: "badge-warning",
        error: "badge-error",
    };

    const classes = [
        "badge badge-soft",
        color ? colorClasses[color] : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <span className={classes} {...restProps}>
      {children}
    </span>
    );
};

export default Badge;
