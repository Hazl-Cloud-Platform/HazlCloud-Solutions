export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 1000"
      width="36"
      height="36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 320 230 C 200 230, 130 320, 130 430 C 130 460, 135 485, 145 510 C 100 540, 80 595, 80 650 C 80 750, 150 815, 250 815 L 760 815 C 870 815, 940 745, 940 645 C 940 555, 880 490, 790 480 C 780 380, 695 305, 595 305 C 545 305, 500 322, 465 350 C 430 280, 380 230, 320 230 Z"
        fill="#ffffff"
      />
      <path
        d="M 340 470 C 320 470, 305 485, 305 505 L 305 640 C 305 660, 320 675, 340 675 L 460 675 L 460 760 L 560 675 L 700 675 C 720 675, 735 660, 735 640 L 735 505 C 735 485, 720 470, 700 470 Z"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="42"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
