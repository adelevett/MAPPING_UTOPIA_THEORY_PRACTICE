import React, { useState, useEffect } from 'react';
import GeoMap from './components/GeoMap';
import NetworkGraph from './components/NetworkGraph';
import StatsDashboard from './components/StatsDashboard';
import DetailPanel from './components/DetailPanel';
import { Compass, Network, RefreshCw, Layers } from 'lucide-react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [practices, setPractices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [references, setReferences] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Shared Selection State: { type: 'practice' | 'category' | 'reference' | null, id: string | null }
  const [selection, setSelection] = useState({ type: null, id: null });
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'network'

  // Fetch all data static files in parallel
  useEffect(() => {
    Promise.all([
      fetch('/data/practices.json').then(res => {
        if (!res.ok) throw new Error('Failed to load practices.json');
        return res.json();
      }),
      fetch('/data/category_index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load category_index.json');
        return res.json();
      }),
      fetch('/data/reference_index.json').then(res => {
        if (!res.ok) throw new Error('Failed to load reference_index.json');
        return res.json();
      }),
      fetch('/data/graph_edges.json').then(res => {
        if (!res.ok) throw new Error('Failed to load graph_edges.json');
        return res.json();
      })
    ])
      .then(([practicesData, categoriesData, referencesData, edgesData]) => {
        setPractices(practicesData);
        setCategories(categoriesData);
        setReferences(referencesData);
        setEdges(edgesData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Data Fetch Error:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const handleSelect = (newSelection) => {
    setSelection(newSelection);
  };

  const handleClearSelection = () => {
    setSelection({ type: null, id: null });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-wrapper">
          <RefreshCw className="loading-spinner animate-spin" />
          <p>Analyzing Ontological Structures...</p>
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
            Could not fetch data assets. Please run the build script `build_practices_json.py` to populate static data in the `public/data` directory, or check your console logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Banner / Header */}
      <header className="app-header glass-panel">
        <div className="header-brand">
          <div className="brand-logo animate-pulse-slow">
            <Layers className="text-accent" />
          </div>
          <div className="brand-text">
            <h1>MAPPING UTOPIA</h1>
            <p className="text-xs text-secondary">
              Digital Education Theory & Practice Ontology Vis Layer
            </p>
          </div>
        </div>

        {/* Tab switch control */}
        <div className="header-controls">
          <div className="tab-control-group glass-panel">
            <button 
              onClick={() => setActiveTab('map')} 
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            >
              <Compass className="tab-icon" />
              <span>Geo Map View</span>
            </button>
            <button 
              onClick={() => setActiveTab('network')} 
              className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            >
              <Network className="tab-icon" />
              <span>Network Graph View</span>
            </button>
          </div>
          
          {selection.id && (
            <button onClick={handleClearSelection} className="reset-btn hover-grow">
              Reset Focus
            </button>
          )}
        </div>
      </header>

      {/* Main visualization grid */}
      <main className="app-main">
        {/* Left Side: Active Visualization tab */}
        <section className="visualization-section glass-panel">
          {activeTab === 'map' ? (
            <GeoMap 
              practices={practices}
              selection={selection}
              onSelect={handleSelect}
            />
          ) : (
            <NetworkGraph 
              practices={practices}
              categories={categories}
              references={references}
              edges={edges}
              selection={selection}
              onSelect={handleSelect}
            />
          )}
        </section>

        {/* Right Side: Sidebar panels */}
        <section className="sidebar-section glass-panel scrollbar-custom">
          {selection.id ? (
            <DetailPanel 
              selection={selection}
              practices={practices}
              categories={categories}
              references={references}
              edges={edges}
              onSelect={handleSelect}
              onClear={handleClearSelection}
            />
          ) : (
            <StatsDashboard 
              practices={practices}
              categories={categories}
              references={references}
              onSelect={handleSelect}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
