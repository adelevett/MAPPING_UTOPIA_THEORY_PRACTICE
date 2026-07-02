import React, { useState, useEffect, useCallback } from 'react';
import GeoMap from './components/GeoMap';
import ConceptAtlas from './components/ConceptAtlas';
import ConceptFilterRail from './components/ConceptFilterRail';
import StorySheet from './components/StorySheet';
import TheorySlideOver from './components/TheorySlideOver';
import StatsDashboard from './components/StatsDashboard';
import AboutView from './components/AboutView';
import { Compass, BookOpen, RefreshCw, Layers, Info, X } from 'lucide-react';
import './App.css';

function App() {
  // ── Data state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [practices, setPractices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ontology, setOntology] = useState(null);
  const [codedMatrix, setCodedMatrix] = useState([]);
  const [referencesResolved, setReferencesResolved] = useState([]);
  const [nextBestThings, setNextBestThings] = useState({});

  // ── Welcome overlay ──────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem('mapping-utopia-visited')
  );

  const dismissWelcome = useCallback(() => {
    localStorage.setItem('mapping-utopia-visited', '1');
    setShowWelcome(false);
  }, []);

  // ── Unified UI state ─────────────────────────────────────────
  const [view, setView] = useState('map'); // 'map' | 'concepts'
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [activeStoryPracticeId, setActiveStoryPracticeId] = useState(null);
  const [activeReferenceId, setActiveReferenceId] = useState(null);
  const [expandedConceptId, setExpandedConceptId] = useState(null);

  // ── Data loading ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('data/practices.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('data/category_index.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('data/ontology.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('data/coded_matrix.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('data/references_resolved.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('data/next_best_things.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    ])
      .then(([practicesData, categoriesData, ontologyData, matrixData, refsData, nbtData]) => {
        setPractices(practicesData);
        setCategories(categoriesData);
        setOntology(ontologyData);
        // coded_matrix.json has a "references" key
        setCodedMatrix(matrixData.references || matrixData);
        setReferencesResolved(refsData);
        setNextBestThings(nbtData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Data load error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // ── State handlers ────────────────────────────────────────────
  const handleSelectPractice = useCallback((practiceId) => {
    setActiveStoryPracticeId(practiceId);
    // Don't clear the reference if one is already open
  }, []);

  const handleCloseStory = useCallback(() => {
    setActiveStoryPracticeId(null);
  }, []);

  const handleOpenReference = useCallback((refId) => {
    setActiveReferenceId(refId);
  }, []);

  const handleCloseReference = useCallback(() => {
    setActiveReferenceId(null);
  }, []);

  const handleFilterByCategory = useCallback((categoryId) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  const handleSeeOnMap = useCallback((categoryId) => {
    setActiveFilters(new Set([categoryId]));
    setView('map');
    setExpandedConceptId(null);
  }, []);

  // Navigate story sheet to a different practice without closing
  const handleNavigatePractice = useCallback((practiceId) => {
    setActiveStoryPracticeId(practiceId);
    // Keep reference panel open if it was open
  }, []);

  // ── Loading / Error screens ───────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-wrapper">
          <RefreshCw className="loading-spinner animate-spin" />
          <p>Mapping utopian practices…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-box glass-panel">
          <h2>Data Load Error</h2>
          <p className="text-secondary text-sm">
            Could not fetch data assets. Check that <code>public/data/</code> contains
            practices.json, category_index.json, ontology.json, coded_matrix.json,
            references_resolved.json, and next_best_things.json.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="header-brand">
          <div className="brand-logo animate-pulse-slow">
            <Layers className="text-accent" />
          </div>
          <div className="brand-text">
            <h1>MAPPING UTOPIA</h1>
            <p className="text-xs text-secondary">
              {practices.length} practices · {categories.length} concepts · {referencesResolved.length} texts
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="tab-control-group glass-panel">
            <button
              id="tab-btn-map"
              onClick={() => setView('map')}
              className={`tab-btn ${view === 'map' ? 'active' : ''}`}
            >
              <Compass className="tab-icon" />
              <span>The Map</span>
            </button>
            <button
              id="tab-btn-concepts"
              onClick={() => setView('concepts')}
              className={`tab-btn ${view === 'concepts' ? 'active' : ''}`}
            >
              <BookOpen className="tab-icon" />
              <span>Concept Atlas</span>
            </button>
            <button
              id="tab-btn-about"
              onClick={() => setView('about')}
              className={`tab-btn ${view === 'about' ? 'active' : ''}`}
            >
              <Info className="tab-icon" />
              <span>About</span>
            </button>
          </div>

          {(activeFilters.size > 0 || activeStoryPracticeId) && (
            <button
              id="reset-all-btn"
              className="reset-btn hover-grow"
              onClick={() => {
                setActiveFilters(new Set());
                setActiveStoryPracticeId(null);
                setActiveReferenceId(null);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Main canvas */}
      <main className="app-main" id="app-main">
        {view === 'map' ? (
          // ── MAP VIEW ──────────────────────────────────────────
          <div className="map-canvas" id="map-canvas">
            <GeoMap
              practices={practices}
              activeFilters={activeFilters}
              activeStoryPracticeId={activeStoryPracticeId}
              onSelectPractice={handleSelectPractice}
            />

            {/* Left: Concept Filter Rail */}
            <ConceptFilterRail
              categories={categories}
              practices={practices}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />

            {/* Bottom-left empty-state stats card */}
            {!activeStoryPracticeId && activeFilters.size === 0 && (
              <div className="map-empty-state">
                <StatsDashboard
                  practices={practices}
                  categories={categories}
                  references={referencesResolved}
                  onSelect={({ id }) => handleSelectPractice(id)}
                  compact
                />
              </div>
            )}

            {/* Right: Story Sheet */}
            {activeStoryPracticeId && (
              <StorySheet
                practiceId={activeStoryPracticeId}
                practices={practices}
                codedMatrix={codedMatrix}
                onClose={handleCloseStory}
                onNavigate={handleNavigatePractice}
                onFilterByCategory={handleFilterByCategory}
                onOpenReference={handleOpenReference}
                onShowOnMap={() => setView('map')}
              />
            )}
          </div>
        ) : view === 'about' ? (
          // ── ABOUT VIEW ────────────────────────────────────────
          <AboutView />
        ) : (
          // ── CONCEPT ATLAS VIEW ────────────────────────────────
          <div className="atlas-canvas" id="atlas-canvas">
            <ConceptAtlas
              categories={categories}
              ontology={ontology}
              codedMatrix={codedMatrix}
              practices={practices}
              expandedConceptId={expandedConceptId}
              onExpandConcept={setExpandedConceptId}
              onOpenReference={handleOpenReference}
              onNavigatePractice={(practiceId) => {
                setActiveStoryPracticeId(practiceId);
                setView('map');
              }}
              onSeeOnMap={handleSeeOnMap}
            />
          </div>
        )}

        {/* Theory Slide-Over — global overlay, appears over map or atlas */}
        {activeReferenceId && (
          <TheorySlideOver
            referenceId={activeReferenceId}
            referencesResolved={referencesResolved}
            codedMatrix={codedMatrix}
            nextBestThings={nextBestThings}
            practices={practices}
            categories={categories}
            onClose={handleCloseReference}
            onNavigatePractice={(practiceId) => {
              setActiveReferenceId(null);
              setActiveStoryPracticeId(practiceId);
              setView('map');
            }}
          />
        )}
      </main>

      {/* First-visit welcome overlay — inside app-container so it overlays everything */}
      {showWelcome && (
        <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Mapping Utopia">
          <div className="welcome-card glass-panel animate-fade-in">
            <button
              className="welcome-close-btn"
              onClick={dismissWelcome}
              id="welcome-close-btn"
              aria-label="Close welcome message"
            >
              <X size={16} />
            </button>
            <div className="welcome-icon animate-pulse-slow">
              <Layers size={28} className="text-accent" />
            </div>
            <h2 className="welcome-title">Welcome to Mapping Utopia</h2>
            <p className="welcome-body">
              This map connects <strong>803 community-led practices</strong> from around the world
              with <strong>40 theoretical concepts</strong> from the academic literature on
              educational utopianism.
            </p>
            <ul className="welcome-hints">
              <li><strong>The Map</strong> — click any marker to read about a practice and its theoretical connections.</li>
              <li><strong>Concept Atlas</strong> — browse all 40 theoretical concepts and the practices that exemplify them.</li>
              <li><strong>About</strong> — learn how this project was built and what it means.</li>
            </ul>
            <button
              className="welcome-start-btn hover-grow"
              onClick={dismissWelcome}
              id="welcome-start-btn"
            >
              Start exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
