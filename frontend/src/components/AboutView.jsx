import React from 'react';
import { ExternalLink } from 'lucide-react';

const STATS = {
    practices: 803,
    geocoded: 542,
    categories: 40,
    p1Count: 14,
    p2Count: 13,
    p3Count: 13,
    references: 23,
    posts: 323,
    edges: 1198,
};

const PERSPECTIVES = [
    {
        id: 'P1',
        label: 'Typologies of Visionary Constructs',
        color: '#6366f1',
        count: STATS.p1Count,
        question: 'What kind of future is imagined?',
        desc: 'Distinguishes between concrete utopianism, critical dystopia, anti-utopianism, domesticated utopianism, open speculative, solarpunk, techno-deterministic, and other visionary models.',
    },
    {
        id: 'P2',
        label: 'Speculative Methodologies',
        color: '#10b981',
        count: STATS.p2Count,
        question: 'How is that future constructed or explored?',
        desc: 'Captures the tools and narrative approaches used to generate and examine alternative futures — Utopia as Method, speculative design, cognitive estrangement, narrative mapping, and more.',
    },
    {
        id: 'P3',
        label: 'Pedagogical Affects and Orientations',
        color: '#f59e0b',
        count: STATS.p3Count,
        question: 'What emotional or critical force drives it?',
        desc: 'Identifies the affective dimensions — educated hope, social dreaming, existential anxiety, critical pedagogical action, and the other orientations that shape how learners engage with transformative visions.',
    },
];

export default function AboutView() {
    return (
        <div className="about-view-container scrollbar-custom">
            <div className="about-content animate-fade-in">

                {/* ── Hero ──────────────────────────────────────────── */}
                <div className="about-hero">
                    <h1 className="about-title">Mapping Utopia</h1>
                    <p className="about-subtitle">
                        A conceptual map connecting community-led practices of resilience and
                        reimagination with the theoretical frameworks that anticipated them.
                    </p>
                </div>

                {/* ── What Is This ──────────────────────────────────── */}
                <section className="about-section">
                    <h2>What Is This?</h2>
                    <p>
By correlating 803 empirical practices from the blog archives of <a href="https://robhopkins.net/" target="_blank" rel="noreferrer">Rob Hopkins</a> with a theoretical ontology derived from 23 sources in the literature on educational utopianism, this project maps the correspondence between imagined and enacted futures — ideas made real.
                    
                    </p>
                    <p>
                        Each marker on the map represents a real practice extracted from one of
                        <strong> {STATS.posts} community blog posts</strong>. These
                        {STATS.geocoded > 500 ? ` ${STATS.geocoded} geocoded ` : ' '}
                        practices have been mapped against a{' '}
                        <strong>{STATS.categories}-node theoretical ontology</strong> built
                        through a Conceptual Systematic Review of{' '}
                        <strong>{STATS.references} academic texts</strong> on utopianism,
                        dystopianism, and speculative futures in education.
                    </p>

                </section>

                {/* ── Methodology ───────────────────────────────────── */}
                <section className="about-section">
                    <h2>The CSR Methodology</h2>
                    <p>
                        The ontology powering the Concept Atlas was built using a{' '}
                        <strong>Conceptual Systematic Review (CSR)</strong> — a structured
                        method for mapping contested academic concepts across a body of literature
                        — following the framework defined by Schreiber &amp; Cramer (2024):
                        <sup>
                            <a
                                href="https://doi.org/10.1080/00131911.2022.2116561"
                                target="_blank"
                                rel="noreferrer"
                                className="about-ref-link"
                                title="Schreiber & Cramer, 2024"
                            >
                                [2]
                            </a>
                        </sup>
                    </p>

                    <div className="about-pipeline">
                        <div className="about-pipeline-step">
                            <span className="about-step-num">1</span>
                            <div>
                                <strong>Identify the research goal</strong>
                                <p className="about-step-desc">
                                    Define the core concepts to be explored and clarified.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">2</span>
                            <div>
                                <strong>Create an initial framework</strong>
                                <p className="about-step-desc">
                                    Develop a starting set of categories based on existing research.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">3</span>
                            <div>
                                <strong>Refine and expand iteratively</strong>
                                <p className="about-step-desc">
                                    Review the literature to update categories, adding new ones as they emerge from the text.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">4</span>
                            <div>
                                <strong>Support findings with evidence</strong>
                                <p className="about-step-desc">
                                    Ensure every category is grounded in direct quotes from the source materials.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">5</span>
                            <div>
                                <strong>Perform final verification</strong>
                                <p className="about-step-desc">
                                    Verify that all data points are accurately categorized and fully accounted for.
                                </p>
                            </div>
                        </div>
                    </div>

                    <blockquote className="about-quote">
                        &ldquo;Conceptual systematic reviews aim to map, systematise, and
                        resolve polysemous or tangled concepts across a selected literature
                        corpus, maintaining definiteness, selectivity, independence, and
                        exhaustiveness.&rdquo;
                        <cite>— Schreiber & Cramer (2024)</cite>
                    </blockquote>
                </section>

                {/* ── The Three Perspectives ────────────────────────── */}
                <section className="about-section">
                    <h2>The Three Perspectives</h2>
                    <p>
                        Practices can carry one P1 code, optionally one P2 code, and
                        multiple P3 codes — reflecting that a single real-world project can
                        embody a typology of future, use a method of speculative inquiry,
                        and express multiple affective orientations simultaneously.
                    </p>

                    {PERSPECTIVES.map(p => (
                        <div
                            key={p.id}
                            className="about-perspective-card"
                            style={{ borderLeftColor: p.color }}
                        >
                            <div className="about-perspective-header">
                                <span
                                    className="about-perspective-badge"
                                    style={{ backgroundColor: p.color }}
                                >
                                    {p.id}
                                </span>
                                <span className="about-perspective-label">{p.label}</span>
                                <span className="about-perspective-count">
                                    {p.count} categories
                                </span>
                            </div>
                            <p className="about-perspective-question">{p.question}</p>
                            <p className="about-perspective-desc">{p.desc}</p>
                        </div>
                    ))}
                </section>

                {/* ── How to Use ────────────────────────────────────── */}
                <section className="about-section">
                    <h2>How to Use This Tool</h2>
                    <ul className="about-list">
                        <li>
                            <strong>The Map</strong> — Browse {STATS.geocoded} geocoded
                            practices. Use the filter rail (left) to highlight practices
                            matching specific concepts. Click any marker to open the Story
                            Sheet with the verbatim quote, Ostrom SES analysis, and links
                            to the underlying theory.
                        </li>
                        <li>
                            <strong>Concept Atlas</strong> — Explore all {STATS.categories}{' '}
                            categories across three columns. Expand a card to see its
                            definition, coding rule, anchor quotes from the literature, and
                            a gallery of linked practices. Click &ldquo;See on Map&rdquo; to
                            jump back to the map filtered to that concept.
                        </li>
                        <li>
                            <strong>Theory Slide-Over</strong> — Click &ldquo;explore&rdquo;
                            on any reference to see the full citation, key passages, the
                            concepts it theorises, and suggested open-access further reading where available.
                        </li>
                    </ul>
                </section>

                {/* ── Data Provenance ───────────────────────────────── */}
                <section className="about-section">
                    <h2>Data Provenance</h2>

                    <div className="about-stats-grid">
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.posts}</span>
                            <span className="about-stat-label">blog posts</span>
                        </div>
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.practices}</span>
                            <span className="about-stat-label">practices extracted</span>
                        </div>
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.geocoded}</span>
                            <span className="about-stat-label">geocoded</span>
                        </div>
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.categories}</span>
                            <span className="about-stat-label">theoretical concepts</span>
                        </div>
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.references}</span>
                            <span className="about-stat-label">academic references</span>
                        </div>
                        <div className="about-stat-card">
                            <span className="about-stat-num">{STATS.edges}</span>
                            <span className="about-stat-label">typed connections</span>
                        </div>
                    </div>

                    <p>
                        <strong>Empirical corpus:</strong> Practices were extracted from
                        robhopkins.net, covering {STATS.posts} posts as of June 2026.
                    </p>
                    <p>
                        <strong>Theoretical corpus:</strong> {STATS.references} peer-reviewed
                        papers on utopianism, dystopianism, and speculative futures in
                        education, sourced from journals including <em>Educational Review</em>,{' '}
                        <em>Futures</em>, <em>Policy Futures in Education</em>, and others.
                    </p>
                    <p>
                        <strong>Coding pipeline:</strong> For a full technical description of the
                        ontology extraction, practice correlation, and validation pipeline,
                        see the <a href="https://github.com/adelevett/MAPPING_UTOPIA_THEORY_PRACTICE#readme" target="_blank" rel="noreferrer">project README</a>.
                    </p>

                    <div className="about-refs">
                        <h3>References</h3>
                        <ol className="about-ref-list">
                            <li>
                                Papastephanou, M. (2024). Educational utopianism beyond the
                                &ldquo;real versus blueprint&rdquo; dichotomy. <em>Studies in Philosophy and Education</em>.
                                <a
                                    href="https://doi.org/10.1007/s11217-024-09951-6"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </li>
                            <li>
                                Schreiber, F., & Cramer, C. (2024). Towards a conceptual
                                systematic review: proposing a methodological framework.{' '}
                                <em>Educational Review</em>, 76(6), 1458–1479.
                                <a
                                    href="https://doi.org/10.1080/00131911.2022.2116561"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </li>
                            <li>
                                Hopkins, R. (2025). <em>How to Fall in Love with the Future</em>.
                                Chelsea Green Publishing UK. ISBN: 9781915294517.
                                <a
                                    href="https://www.chelseagreen.com/product/how-to-fall-in-love-with-the-future/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </li>
                            <li>
                                Ostrom, E. (2009). A general framework for analyzing
                                sustainability of social-ecological systems.{' '}
                                <em>Science</em>, 325(5939), 419–422.
                                <a
                                    href="https://doi.org/10.1126/science.1172133"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </li>

                        </ol>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────── */}
                <div className="about-footer">
                    <p>
                        Mapping Utopia — Theory &amp; Practice
                    </p>
                    <p className="about-footer-sub">
                        Built by Google Gemini · 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
