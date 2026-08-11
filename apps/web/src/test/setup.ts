import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these observers - stub them so components that use
// scroll-triggered animation (framer-motion useInView) or carousels (embla,
// which uses ResizeObserver) don't throw during tests.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  // @ts-expect-error - minimal test stub, not a spec-complete implementation
  globalThis.IntersectionObserver = ObserverStub;
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ObserverStub;
}

// jsdom also doesn't implement matchMedia - embla-carousel and next-themes both use it.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
