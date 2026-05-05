import Image from "next/image";

/**
 * Brand logo. Sourced from `/public/images/logo.png` (white-text-on-
 * transparent variant) so it sits cleanly on the navy sidebar without
 * a contrast pill. Match the reference's signature: `<Logo />` no
 * props, fixed size, `priority` for above-the-fold rendering.
 */
export function Logo() {
  return (
    <div className="relative flex h-10 w-auto items-center justify-center overflow-hidden rounded-md">
      <Image
        src="/images/logo.png"
        alt="Africa Hub for Innovation & Development"
        width={180}
        height={40}
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
}
