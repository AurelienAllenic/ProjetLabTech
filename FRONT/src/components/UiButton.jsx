const bgColors = {
  raspberry: "bg-raspberry-600 hover:bg-raspberry-500",
  raspberryLight: "bg-raspberry-100 hover:bg-raspberry-200",
  white: "bg-white hover:bg-raspberry-50 border border-raspberry-300",
};

const textColors = {
  white: "text-white",
  black: "text-black",
  raspberry: "text-raspberry-700",
};

export default function UiButton({
  children,
  onClick,
  bg = "raspberry",
  text = "white",
  disabled = false,
  ariaLabel,
  className = "",
  type = "button",
}) {
  const hasText =
    typeof children === "string" ||
    (Array.isArray(children) && children.some(c => typeof c === "string"));

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...(!hasText && ariaLabel ? { "aria-label": ariaLabel } : {})}
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
    >
      {children}
    </button>
  );
}
