type LogoProps = {
  href?: string;
};

/** Nombre de la marca: "Clean" en ink y "Link" en primary. Aún no hay logo gráfico. */
export function Logo({ href = '/' }: LogoProps) {
  return (
    <a href={href} className="text-[22px] leading-7 font-bold tracking-[-0.02em] text-ink no-underline">
      Clean<span className="text-primary">Link</span>
    </a>
  );
}
