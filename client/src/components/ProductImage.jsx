import { useEffect, useState } from "react";

export default function ProductImage({ src, alt, className = "", onError }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return <span className={`${className} product-image-fallback`} role="img" aria-label={`${alt}: image unavailable`}>Image unavailable</span>;
  }

  return <img
    className={className}
    src={src}
    alt={alt}
    loading="lazy"
    onError={() => {
      setFailed(true);
      onError?.();
    }}
  />;
}
