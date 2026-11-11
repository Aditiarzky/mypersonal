export function reveal(node: HTMLElement) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isInitiallyVisible = node.getBoundingClientRect().top < window.innerHeight;

  if (reducedMotion || isInitiallyVisible || !("IntersectionObserver" in window)) {
    node.classList.add("section-reveal-visible");
    return;
  }

  node.classList.add("section-reveal");

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add("section-reveal-visible");
      observer.disconnect();
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
