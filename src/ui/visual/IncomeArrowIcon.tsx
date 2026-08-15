/** Flecha de subida de ingreso (como ficha física Brass). */
export function IncomeArrowIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className="mat-income-arrow" aria-hidden>
      <path
        d="M2 9.5 L7.5 4 M7.5 4 H4.8 M7.5 4 V6.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
