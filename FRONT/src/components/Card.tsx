import type { ReactNode } from "react";

interface CardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  /**
   * Zone « choisir un fichier » : clic souris ouvre le sélecteur.
   * Le clavier peut être géré au niveau page (raccourci global Entrée / Espace).
   */
  onOpenFilePicker?: () => void;
  /** `id` du bouton zone d’upload (ex. renvoyer le focus après suppression du fichier). */
  uploadZoneButtonId?: string;
}

export default function Card({
  icon,
  title,
  description,
  className,
  onClick,
  ariaLabel,
  onOpenFilePicker,
  uploadZoneButtonId,
}: CardProps) {
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const titleId = `card-title-${safeId}`;
  const descId = `card-desc-${safeId}`;

  const shellClassName = `
        w-full max-w-full min-w-0 min-h-[248px]
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
      `;

  const body = (
    <>
      <div
        aria-hidden="true"
        className="mb-4 text-raspberry-600 bg-raspberry-50 w-14 h-14 rounded-2xl flex items-center justify-center"
      >
        {icon}
      </div>

      <h2 id={titleId} className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h2>

      <p id={descId} className="text-sm font-normal text-gray-500 text-center max-w-[400px]">
        {description}
      </p>
    </>
  );

  const a11yLabelled = ariaLabel ? undefined : titleId;
  const a11yDesc = ariaLabel ? undefined : descId;

  if (onOpenFilePicker) {
    const open = (): void => {
      onOpenFilePicker();
    };

    return (
      <button
        type="button"
        id={uploadZoneButtonId}
        aria-label={ariaLabel}
        aria-labelledby={a11yLabelled}
        aria-describedby={a11yDesc}
        className={shellClassName}
        onClick={open}
      >
        {body}
      </button>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-labelledby={a11yLabelled}
        aria-describedby={a11yDesc}
        aria-label={ariaLabel}
        className={shellClassName}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      aria-labelledby={a11yLabelled}
      aria-describedby={a11yDesc}
      className={`${shellClassName} cursor-default active:scale-100`}
    >
      {body}
    </div>
  );
}
