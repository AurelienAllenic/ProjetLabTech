import type { ReactNode } from "react";

interface CardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export default function Card({
  icon,
  title,
  description,
  className,
  onClick,
  ariaLabel,
}: CardProps) {
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const titleId = `card-title-${safeId}`;
  const descId = `card-desc-${safeId}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-labelledby={ariaLabel ? undefined : titleId}
      aria-describedby={ariaLabel ? undefined : descId}
      aria-label={ariaLabel}
      className={`
        w-120 h-64
        bg-white
        border border-gray-100
        rounded-2xl
        shadow-sm
        flex flex-col items-center justify-center
        p-6
        cursor-pointer
        transition
        hover:shadow-md hover:border-raspberry-200
        focus:outline-none
        focus-visible:ring-4
        focus-visible:ring-raspberry-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-blue-50
        active:scale-[0.98]
        ${className ?? ""}
      `}
    >
      <div
        aria-hidden="true"
        className="mb-4 text-raspberry-600 bg-raspberry-50 w-14 h-14 rounded-2xl flex items-center justify-center"
      >
        {icon}
      </div>

      <h2
        id={titleId}
        className="text-lg font-semibold text-gray-900 mb-2 text-center"
      >
        {title}
      </h2>

      <p
        id={descId}
        className="text-sm font-normal text-gray-500 text-center max-w-[400px]"
      >
        {description}
      </p>
    </button>
  );
}
