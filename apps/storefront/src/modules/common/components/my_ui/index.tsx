"use client"

import { forwardRef } from "react"
import clsx from "clsx"
import { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react"
import { Icon as Iconify, addCollection } from "@iconify/react"
import lucideIcons from "@iconify-json/lucide/icons.json"
import hugeIcons from "@iconify-json/hugeicons/icons.json"
import lucideLabIcons from "@iconify-json/lucide-lab/icons.json"

addCollection(hugeIcons)
addCollection(lucideLabIcons)

addCollection(lucideIcons)

// Button Component
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "success" | "transparent"
  size?: "max" | "full"
  isLoading?: boolean
  iconLeft?: string
  iconRight?: string
  iconTop?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "medium",
      isLoading,
      disabled,
      children,
      iconLeft,
      iconRight,
      iconTop,
      ...props
    },
    ref
  ) => {
    const iconSize = size === "max" ? 16 : 20
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "rounded-xl inline-flex items-center justify-center",
          iconTop ? "flex-col gap-1" : "flex-row gap-2",
          variant === "primary" && "bg-sky-950 text-white hover:bg-gray-800 transition-colors duration-50",
          variant === "secondary" && "bg-red-500 text-white hover:bg-red-600 transition-colors duration-50",
          variant === "success" && "bg-lime-500 text-white hover:bg-lime-600 transition-colors duration-50",
          variant === "transparent" && "bg-transparent border border-gray-300 hover:border-gray-400 transition-colors duration-50",
          size === "max" && "w-max",
          size === "full" && "w-full",
          !iconTop && "h-10 px-4",
          iconTop && "h-16 p-2",
          className
        )}
        {...props}
      >
        {!isLoading && iconTop && (
          <Iconify icon={`lucide:${iconTop}`} width={iconSize} height={iconSize} />
        )}
        {!isLoading && iconLeft && (
          <Iconify icon={`lucide:${iconLeft}`} width={iconSize} height={iconSize} />
        )}
        {isLoading ? "Loading..." : children}
        {!isLoading && iconRight && (
          <Iconify icon={`lucide:${iconRight}`} width={iconSize} height={iconSize} />
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

// Icon Component
type IconLibrary = "lucide" | "hugeicons" | "lucide-lab"

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string
  library?: IconLibrary
  size?: number | string
  strokeWidth?: number
  color?: string
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ name, library = "lucide", size = 20, strokeWidth, color, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx("inline-flex items-center justify-center", className)}
        {...props}
      >
        <Iconify
          icon={`${library}:${name}`}
          width={size}
          height={size}
          color={color}
          style={strokeWidth ? { "--stroke-width": strokeWidth } as React.CSSProperties : undefined}
        />
      </span>
    )
  }
)
Icon.displayName = "Icon"

// Input Component
type InputType = "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date" | "time" | "checkbox" | "radio" | "range" | "file" | "color"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  size?: "max" | "full"
  variant?: "default" | "search"
  type?: InputType
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "max", variant = "default", type = "text", ...props }, ref) => {

    const isCheckbox = type === "checkbox"
    const isRadio = type === "radio"
    const isRange = type === "range"
    const isFile = type === "file"
    const isColor = type === "color"
    const isBox = isCheckbox || isRadio

    return (
      <div className={clsx(
        "relative inline-flex items-center",
        !isBox && !isRange && !isColor && size === "max" && "w-max",
        !isBox && !isRange && !isColor && size === "full" && "w-full",
      )}>
        {variant === "search" && !isBox && (
          <Iconify
            icon="lucide:search"
            width={16}
            height={16}
            className="absolute right-3 text-gray-400 pointer-events-none"
          />
        )}
          <input
            ref={ref}
            type={type}
            className={clsx(
              "disabled:opacity-50 disabled:cursor-not-allowed",

              // text-like inputs
              !isBox && !isRange && !isFile && !isColor && [
                "bg-gray-200 px-4 py-2 rounded-xl w-full",
                "placeholder:text-gray-400 text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-sky-950",
                variant === "search" && "pr-9",
              ],

              // checkbox & radio
              isBox && [
                "w-4 h-4 cursor-pointer accent-sky-950",
              ],

              // range
              isRange && [
                "w-full h-2 cursor-pointer accent-sky-950",
                size === "max" && "w-40",
                size === "full" && "w-full",
              ],

              // file
              isFile && [
                "cursor-pointer text-sm text-gray-500 w-full",
                "file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0",
                "file:bg-sky-950 file:text-white file:cursor-pointer",
                "file:hover:bg-gray-800 file:transition-colors",
              ],

              // color
              isColor && [
                "w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-1",
              ],

              className
            )}
            {...props}
          />
      </div>
    )
  }
)
Input.displayName = "Input"