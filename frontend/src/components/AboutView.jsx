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
                        reimagination with the theoretical frameworks that help us understand them.
                    </p>
                </div>

                {/* ── What Is This ──────────────────────────────────── */}
                <section className="about-section">
                    <h2>What Is This?</h2>
                    <p>
                        <strong>Mapping Utopia</strong> visualises the work of communities around the world
                        who are building resilience, experimenting with alternatives, and
                        practicing the futures they want to inhabit — drawing on the extensive
                        empirical documentation of <strong>Rob Hopkins</strong> and the
                        Transition Town movement. Hopkins’ most recent book, <em>How to Fall in Love with the Future</em> (2025),
                        deepens this work by examining how communities throughout history
                        have used visions of the future to inspire large-scale positive
                        change — and invites us to do the same.
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
                    <p>
                        As Papastephanou, Antonacopoulou, and Drousioti (2024) observe,
                        there is a &ldquo;resurgent and fruitful interest in utopian thought
                        across disciplines,&rdquo; and communities are actively engaged in
                        rethinking &ldquo;what counts as a desirable future.&rdquo;
                        <sup>
                            <a
                                href="https://doi.org/10.1177/14782103241283192"
                                target="_blank"
                                rel="noreferrer"
                                className="about-ref-link"
                                title="Papastephanou et al., 2024"
                            >
                                [1]
                            </a>
                        </sup>
                        This project makes those visions visible — and traceable to the
                        theory that helps name them.
                    </p>
                </section>

                {/* ── Methodology ───────────────────────────────────── */}
                <section className="about-section">
                    <h2>The CSR Methodology</h2>
                    <p>
                        The ontology powering the Concept Atlas was built using a{' '}
                        <strong>Conceptual Systematic Review (CSR)</strong> framework as
                        defined by Schreiber & Cramer (2024):
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
                                <strong>Identify the tangled term</strong>
                                <p className="about-step-desc">
                                    &ldquo;Utopianism and dystopianism in digital education&rdquo;
                                    — a polysemous concept requiring systematic resolution.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">2</span>
                            <div>
                                <strong>Build a baseline taxonomy</strong>
                                <p className="about-step-desc">
                                    A deductive starting point of 10 categories across 3 analytical
                                    perspectives, drawn from the literature.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">3</span>
                            <div>
                                <strong>Rolling inductive coding loop</strong>
                                <p className="about-step-desc">
                                    Each of the {STATS.references} references was coded against the
                                    current ontology. When a claim didn&rsquo;t fit any existing
                                    category, a new one was created — growing the ontology from
                                    10 to {STATS.categories} categories.
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">4</span>
                            <div>
                                <strong>Anchor to evidence</strong>
                                <p className="about-step-desc">
                                    Every applied code is tied to a verbatim quote from its source
                                    text, satisfying the CSR requirement of
                                    &ldquo;operationalizability.&rdquo;
                                </p>
                            </div>
                        </div>
                        <div className="about-pipeline-step">
                            <span className="about-step-num">5</span>
                            <div>
                                <strong>Validate</strong>
                                <p className="about-step-desc">
                                    Programmatic verification confirmed 100% matrix coverage —
                                    zero orphaned references, all {STATS.categories} category IDs
                                    resolved.
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
                            concepts it theorises, and suggested open-access further reading.
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
                        robhopkins.net,
                        covering {STATS.posts} posts. Hopkins’ recent book
                        <em>How to Fall in Love with the Future</em> (Chelsea Green, 2025)
                        explores the power of imaginative time-travel as a tool for
                        transformation — the same practice that animates many of the
                        projects on this map.
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
                                Papastephanou, M., Antonacopoulou, E., & Drousioti, K.
                                (2024). Educational utopianism beyond the &ldquo;real versus
                                blueprint&rdquo; dichotomy. <em>Policy Futures in Education</em>.
                                <a
                                    href="https://doi.org/10.1177/14782103241283192"
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
                                Hopkins, R. (2008). <em>The Transition Handbook: From Oil
                                    Dependency to Local Resilience</em>. Green Books.
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
                            <li>
                                Hopkins, R. (2025). <em>How to Fall in Love with the Future</em>.
                                Chelsea Green Publishing UK.
                                <a
                                    href="https://www.chelseagreen.com/product/how-to-fall-in-love-with-the-future/"
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
                        Mapping Utopia — Theory & Practice &middot;{' '}
                        EDTECH575, Penn State University &middot; 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
