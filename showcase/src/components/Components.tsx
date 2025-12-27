import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "./Components.css";

interface Feature {
  title: string;
  description: string;
  icon: string;
  tech: string[];
  highlights: string[];
  category: "Core" | "Interfaces" | "Security" | "Errors" | "Builders";
}

const features: Feature[] = [
  {
    title: "Multi-Format Capture",
    icon: "📸",
    description:
      "Capture screenshots in PNG, JPEG, WebP, and BMP formats with configurable quality settings. Choose the best format for your use case from documentation to debugging.",
    tech: ["PNG", "JPEG", "WebP", "BMP"],
    category: "Core",
    highlights: [
      "PNG: Lossless compression for perfect quality",
      "JPEG: Smaller file sizes with quality control (0-100)",
      "WebP: Modern format with superior compression",
      "BMP: Uncompressed format for maximum compatibility",
      "Format-specific visual indicators in editor",
    ],
  },
  {
    title: "PII Masking & Privacy",
    icon: "🛡️",
    description:
      "Automatic detection and redaction of sensitive information including email addresses, phone numbers, credit cards, and social security numbers.",
    tech: ["Privacy", "Security", "Redaction"],
    category: "Security",
    highlights: [
      "Email address detection and masking",
      "Phone number redaction (US and international)",
      "Credit card number masking",
      "Social security number detection",
      "Exclude sensitive windows from captures",
    ],
  },
  {
    title: "20 LSP Features",
    icon: "🎨",
    description:
      "Comprehensive Language Server Protocol integration with code actions, signature help, diagnostics, semantic tokens, and intelligent code navigation.",
    tech: ["LSP", "Code Intelligence", "AI Integration"],
    category: "Interfaces",
    highlights: [
      "Code Actions: Fix formats, quality ranges, add parameters",
      "Signature Help: Parameter docs as you type",
      "Inlay Hints: Dimensions and file size estimates",
      "Document Symbols: Navigate capture operations",
      "Semantic Highlighting: Visual function colors",
    ],
  },
  {
    title: "Capture Modes",
    icon: "🖥️",
    description:
      "Three capture modes for different use cases: full screen for documentation, window capture for specific apps, and region capture for precise areas.",
    tech: ["Full Screen", "Window", "Region"],
    category: "Core",
    highlights: [
      "Full Screen: Capture entire displays or all monitors",
      "Window Capture: Target specific application windows",
      "Region Capture: Select rectangular screen areas",
      "Multi-monitor support with display selection",
      "Preview and confirmation before saving",
    ],
  },
  {
    title: "AI Integration",
    icon: "🤖",
    description:
      "Seamless integration with AI agents through MCP Protocol. GitHub Copilot can capture screenshots, analyze UI, and create documentation automatically.",
    tech: ["MCP Protocol", "Copilot", "AI Agents"],
    category: "Interfaces",
    highlights: [
      "MCP Protocol: Works with Kiro, Claude Desktop, etc.",
      "GitHub Copilot Ready: Visual awareness for AI",
      "Automated documentation with screenshots",
      "UI analysis and accessibility checks",
      "Visual debugging assistance",
    ],
  },
  {
    title: "Documentation Generation",
    icon: "📚",
    description:
      "Enable AI agents to create comprehensive documentation with annotated screenshots, step-by-step guides, and visual walkthroughs.",
    tech: ["Documentation", "Automation", "AI"],
    category: "Core",
    highlights: [
      "Automated screenshot capture for docs",
      "AI-generated annotations and captions",
      "Step-by-step visual guides",
      "Feature showcase with real screenshots",
      "Responsive design documentation",
    ],
  },
  {
    title: "Visual Debugging",
    icon: "🐛",
    description:
      "Help AI agents debug UI issues by capturing actual application state. Compare before/after screenshots and analyze layout problems.",
    tech: ["Debugging", "Analysis", "Comparison"],
    category: "Core",
    highlights: [
      "Capture bug reproduction steps visually",
      "Before/after comparison for fixes",
      "Layout analysis and CSS suggestions",
      "Responsive design issue detection",
      "Accessibility contrast checking",
    ],
  },
  {
    title: "Multi-Monitor Support",
    icon: "🖼️",
    description:
      "Work seamlessly with multiple displays. List all connected monitors, select specific displays, or capture all screens at once.",
    tech: ["Multi-Display", "Display Detection", "Selection"],
    category: "Core",
    highlights: [
      "Automatic display detection",
      "List all connected monitors with details",
      "Capture specific displays by ID",
      "Capture all monitors simultaneously",
      "Display resolution and position tracking",
    ],
  },
];

const Components = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="components section" id="components" ref={ref}>
      <motion.div
        className="components-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Core <span className="gradient-text">Features</span> & Capabilities
        </h2>
        <p className="components-subtitle">
          Visual superpowers for AI agents with comprehensive screenshot capabilities
        </p>

        <motion.div
          className="suite-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            Give AI agents <em>visual awareness</em> to <em>capture</em>, <em>analyze</em>, and <em>document</em> applications
          </h3>
          <p>
            <strong>
              MCP ACS Screenshot gives AI agents visual superpowers
            </strong>{" "}
            to see, analyze, and document your applications. Capture full screens, specific
            windows, or precise regions with PII masking, multi-format support, and intelligent
            automation. Enable AI to create documentation with real screenshots, debug UI issues
            visually, and analyze accessibility - all through seamless{" "}
            <strong>GitHub Copilot integration</strong>.
          </p>
          <div className="problem-solution">
            <div className="problem">
              <h4>❌ The Challenge: AI Agents Are Blind</h4>
              <ul>
                <li>Cannot see what applications actually look like</li>
                <li>Unable to debug visual UI issues effectively</li>
                <li>Cannot create documentation with real screenshots</li>
                <li>Cannot analyze accessibility or design issues</li>
                <li>Cannot compare before/after visual changes</li>
              </ul>
              <p>
                <strong>Result:</strong> AI agents work only with code, missing the entire visual layer.
              </p>
            </div>
            <div className="solution">
              <h4>✅ The Solution: Visual Awareness for AI Agents</h4>
              <p>
                <strong>MCP ACS Screenshot</strong> provides{" "}
                <strong>multi-format capture</strong> (PNG, JPEG, WebP, BMP),{" "}
                <strong>PII masking</strong> for sensitive information,{" "}
                <strong>20 LSP features</strong> for intelligent code assistance,
                and <strong>multi-monitor support</strong> for complex setups.
              </p>
              <p>
                Built on <strong>Model Context Protocol</strong> with seamless{" "}
                <strong>GitHub Copilot integration</strong>, it enables AI agents to
                capture screenshots, analyze UI layouts, create visual documentation,
                debug design issues, and perform accessibility audits. Three capture
                modes (full screen, window, region) handle any use case from
                documentation to debugging.
              </p>
            </div>
          </div>
          <div className="value-props">
            <div className="value-prop">
              <strong>📸 Multi-Format</strong>
              <p>
                PNG, JPEG, WebP, BMP with quality control and format-specific hints
              </p>
            </div>
            <div className="value-prop">
              <strong>🛡️ PII Masking</strong>
              <p>
                Automatic detection and redaction of sensitive information
              </p>
            </div>
            <div className="value-prop">
              <strong>🎨 20 LSP Features</strong>
              <p>
                Code actions, signature help, diagnostics, and semantic highlighting
              </p>
            </div>
            <div className="value-prop">
              <strong>🤖 AI Integration</strong>
              <p>
                GitHub Copilot integration for visual documentation and debugging
              </p>
            </div>
          </div>
        </motion.div>

        <div className="components-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="component-card card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="component-header">
                <div className="component-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <span
                  className={`component-badge ${feature.category.toLowerCase()}`}
                >
                  {feature.category}
                </span>
              </div>

              <p className="component-description">{feature.description}</p>

              <ul className="component-highlights">
                {feature.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>

              <div className="component-tech">
                {feature.tech.map((tech) => (
                  <span key={tech} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Components;
