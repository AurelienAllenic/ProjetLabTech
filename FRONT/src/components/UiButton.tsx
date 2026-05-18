import type { ReactNode, ButtonHTMLAttributes } from "react";

type BgVariant = "raspberry" | "raspberryLight" | "white";
type TextVariant = "white" | "black" | "raspberry";

const bgColors: Record<BgVariant, string> = {
  raspberry:      "bg-raspberry-600 hover:bg-raspberry-500",
  raspberryLight: "bg-raspberry-100 hover:bg-raspberry-200",
  white:          "bg-white hover:bg-raspberry-50 border border-raspberry-300",
};

const textColors: Record<TextVariant, string> = {
  white:     "text-white",
  black:     "text-black",
  raspberry: "text-raspberry-700",
};

interface UiButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode;
  bg?: BgVariant;
  text?: TextVariant;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
}

export default function UiButton({
  children,
  bg = "raspberry",
  text = "white",
  disabled = false,
  ariaLabel,
  className = "",
  type = "button",
  ...rest
}: UiButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={rest["aria-label"] ?? ariaLabel}
      className={`
        px-5 py-2.5
        rounded-full
        font-medium
        transition
        shadow-sm
        focus:outline-none
        focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${bgColors[bg]}
        ${textColors[text]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
