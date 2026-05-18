export default function FooterAnalysis() {
  return (
    <footer
      role="contentinfo"
      className="
        w-full
        bg-white
        border-t border-gray-100
        p-4
        text-center
        mt-12
      "
    >
      <div
        role="note"
        aria-labelledby="analysis-warning-title"
        aria-describedby="analysis-warning-text"
        className="max-w-3xl mx-auto"
      >
        <p
          id="analysis-warning-title"
          className="sr-only"
        >
          Avertissement médical
        </p>

        <p
          id="analysis-warning-text"
          className="text-sm text-gray-400"
        >
          Cet outil fournit uniquement des informations éducatives.
          Consultez toujours un professionnel de santé qualifié pour tout conseil médical,
          diagnostic ou traitement.
        </p>
      </div>
    </footer>
  );
}
