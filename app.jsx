function App() {
  // Re-render when the dashboard pushes new content (cms.js / admin / API ping).
  // Components themselves read window.SiteContent on every render via the c()
  // helper, so a forced re-render is enough — no prop drilling needed.
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const onReady = () => force((n) => n + 1);
    window.addEventListener('mari:content-ready', onReady);
    return () => window.removeEventListener('mari:content-ready', onReady);
  }, []);

  return (
    <React.Fragment>
      <Hero />
      <Motherhood />
      <Bouquet />
      <Letter />
      <RoseGarden3D />
      <Timeline />
      <Gallery />
      <QuotesCarousel />
      <Recipe />
      <Reasons />
      <Bouquet flip={true} />
      <Promises />
      <MusicBox />
      <Constellation />
      <HeartSection />
      <GiftBox />
      <Finale />
      <FooterEnd />
    </React.Fragment>
  );
}

// Mount as soon as content is ready (or after ~1.5s if the API is slow / down,
// so we never block the first paint indefinitely).
const mount = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
};
if (window.SiteContentReady) {
  Promise.race([
    window.SiteContentReady,
    new Promise((r) => setTimeout(r, 1500))
  ]).then(mount);
} else {
  mount();
}
