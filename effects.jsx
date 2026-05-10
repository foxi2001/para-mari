// Hooks utiles para reveals, parallax, magnetic, counters, lightbox
const { useEffect, useRef, useState, useCallback, useMemo } = React;

/* Reveal-on-scroll: also adds .in to descendant .reveal nodes */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    el.querySelectorAll('.reveal').forEach((d) => io.observe(d));
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* Word-by-word stagger split */
function StaggerText({ text, as = 'span', wordDelay = 80, baseDelay = 0, className = '' }) {
  const words = text.split(/(\s+)/);
  let widx = 0;
  const Tag = as;
  return (
    <Tag className={className}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <React.Fragment key={i}>{w}</React.Fragment>;
        const d = baseDelay + widx * wordDelay;
        widx++;
        return (
          <span key={i} className="stagger-word" style={{ transitionDelay: `${d}ms` }}>{w}</span>
        );
      })}
    </Tag>
  );
}

/* Char-by-char split with overflow:hidden mask (cinematic) */
function CharText({ text, baseDelay = 0, charDelay = 24, className = '' }) {
  const chars = Array.from(text);
  return (
    <span className={`char-reveal ${className}`}>
      {chars.map((c, i) => (
        <span key={i} style={{ transitionDelay: `${baseDelay + i * charDelay}ms` }}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}

/* Typing effect that fires when scrolled into view */
function useTypeWhenVisible(text, speedMs = 22) {
  const ref = useRef(null);
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let i = 0;
          const tick = () => {
            i++;
            setShown(text.slice(0, i));
            if (i < text.length) setTimeout(tick, speedMs + (Math.random() * 12));
            else setDone(true);
          };
          tick();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [text, speedMs]);
  return { ref, shown, done };
}

/* Parallax based on scroll position. `speed` < 1 = slower than scroll (background) */
function useParallax(speed = 0.2, axis = 'y') {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const center = r.top + r.height / 2;
        const offset = (center - vh / 2) * speed * -1;
        el.style.transform = axis === 'x' ? `translate3d(${offset}px,0,0)` : `translate3d(0,${offset}px,0)`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed, axis]);
  return ref;
}

/* Mouse parallax — title 3D effect (subtle tilt) */
function useMouseTilt(strength = 8) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * strength;
      ty = py * strength;
    };
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform = `perspective(1200px) rotateY(${cx}deg) rotateX(${-cy}deg)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

/* Animated number counter when visible */
function useCountUp(target, duration = 1600) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const t0 = performance.now();
          const ease = (t) => 1 - Math.pow(1 - t, 3);
          const tick = (now) => {
            const t = Math.min(1, (now - t0) / duration);
            setV(Math.round(target * ease(t)));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);
  return [ref, v];
}

/* Lightbox controller (single, app-wide) */
const Lightbox = (() => {
  let lb, inner, cap, xBtn;
  let onCloseFn = null;
  function ensure() {
    if (lb) return;
    lb = document.getElementById('lightbox');
    inner = document.getElementById('lb-inner');
    cap = document.getElementById('lb-cap');
    xBtn = document.getElementById('lb-x');
    if (xBtn) xBtn.addEventListener('click', close);
    if (lb) lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  function open(slotId, captionText) {
    ensure();
    inner.innerHTML = '';
    const s = document.createElement('image-slot');
    s.setAttribute('id', slotId);
    s.setAttribute('shape', 'rect');
    s.style.width = '100%';
    s.style.height = '100%';
    inner.appendChild(s);
    cap.textContent = captionText || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { if (inner) inner.innerHTML = ''; }, 400);
  }
  return { open, close };
})();

/* Confetti hearts burst */
function emitHearts(centerEl, n = 1) {
  if (!centerEl) return;
  const r = centerEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height * 0.32;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.textContent = '♥';
    el.style.cssText = `position:fixed;pointer-events:none;z-index:1000;color:var(--rose);font-size:${
      14 + Math.random() * 16
    }px;left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);transition:transform 1.6s cubic-bezier(.2,.7,.2,1),opacity 1.6s ease;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      const dx = (Math.random() - 0.5) * 220;
      const dy = -120 - Math.random() * 220;
      const rot = (Math.random() - 0.5) * 80;
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${.7 + Math.random()})`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 1700);
  }
}

/* expose globally */
Object.assign(window, {
  useReveal, StaggerText, CharText, useTypeWhenVisible,
  useParallax, useMouseTilt, useCountUp, Lightbox, emitHearts
});
