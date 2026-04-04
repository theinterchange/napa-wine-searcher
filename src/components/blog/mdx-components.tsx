import Link from "next/link";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";

function MdxLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const href = props.href ?? "";
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link {...props} href={href} className="text-[var(--foreground)] underline underline-offset-2 hover:text-burgundy-900 dark:hover:text-burgundy-300 transition-colors" />;
  }
  return <a {...props} target="_blank" rel="noopener noreferrer" className="text-[var(--foreground)] underline underline-offset-2 hover:text-burgundy-900 dark:hover:text-burgundy-300 transition-colors" />;
}

function MdxImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt } = props;
  if (!src || typeof src !== "string") return null;
  return (
    <span className="block my-6">
      <Image
        src={src}
        alt={alt ?? ""}
        width={800}
        height={450}
        className="rounded-lg w-full h-auto"
      />
    </span>
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
};
