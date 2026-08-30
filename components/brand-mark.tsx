export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="512" height="512" fill="#0B0A09" />
      <path
        d="M64 104L139 48H430L457 86L424 136H390L411 106H158L107 145V390L145 418H384L417 387V310H459V405L405 464H126L56 411V123L64 104Z"
        fill="#F15A24"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M173 129H283C368 129 412 181 398 260C383 345 327 389 237 389H123L173 129ZM221 193L196 326H239C286 326 315 304 324 257C332 214 312 193 271 193H221Z"
        fill="#F4EDDC"
      />
      <path d="M111 151L74 181V346L102 368L111 151Z" fill="#A93E1D" />
      <path d="M392 77H441L424 102H375L392 77Z" fill="#FF7A43" />
    </svg>
  );
}
