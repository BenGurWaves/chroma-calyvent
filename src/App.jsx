import { useState, useEffect } from 'react'
import './App.css'

// Target Lightness distribution mapping array for UI scales
const targetLightness = {
  50:  0.97,
  100: 0.92,
  200: 0.84,
  300: 0.74,
  400: 0.65,
  500: 0.55,
  600: 0.46,
  700: 0.38,
  800: 0.30,
  900: 0.21,
  950: 0.14
}

// HEX to OKLCH conversion
function hexToOklch(hex) {
  let r = 0, g = 0, b = 0
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255
    g = parseInt(hex[2] + hex[2], 16) / 255
    b = parseInt(hex[3] + hex[3], 16) / 255
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255
    g = parseInt(hex.slice(3, 5), 16) / 255
    b = parseInt(hex.slice(5, 7), 16) / 255
  }
  
  // Linearize
  const linearize = (c) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  
  const rLin = linearize(r)
  const gLin = linearize(g)
  const bLin = linearize(b)
  
  // sRGB to OKLab
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin
  
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  
  // OKLab to OKLCH
  const C = Math.sqrt(a * a + b_ * b_)
  const H = C < 0.0001 ? 0 : Math.atan2(b_, a) * (180 / Math.PI)
  
  return { L, C, H: H < 0 ? H + 360 : H }
}

// Generate scale from base OKLCH
function generateScale(baseL, baseC, baseH) {
  const scale = {}
  for (const [step, lightness] of Object.entries(targetLightness)) {
    scale[step] = {
      oklch: `oklch(${lightness.toFixed(3)} ${baseC.toFixed(4)} ${baseH.toFixed(2)})`,
      L: lightness,
      C: baseC,
      H: baseH
    }
  }
  return scale
}

function App() {
  const [hexInput, setHexInput] = useState('#A8927E')
  const [colorPicker, setColorPicker] = useState('#A8927E')
  const [scale, setScale] = useState({})
  const [copySuccess, setCopySuccess] = useState('')
  const [copiedStep, setCopiedStep] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const parsed = hexToOklch(hexInput)
    const generatedScale = generateScale(parsed.L, parsed.C, parsed.H)
    setScale(generatedScale)
  }, [hexInput])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleHexChange = (e) => {
    let value = e.target.value.toUpperCase()
    if (!value.startsWith('#')) {
      value = '#' + value
    }
    value = value.replace(/[^#0-9A-F]/g, '')
    if (value.length > 7) {
      value = value.slice(0, 7)
    }
    setHexInput(value)
    if (/^#[0-9A-F]{6}$/.test(value)) {
      setColorPicker(value)
    }
  }

  const handleColorPicker = (e) => {
    const value = e.target.value
    setColorPicker(value)
    setHexInput(value)
  }

  const handleCopy = async (text, step) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStep(step)
      setTimeout(() => setCopiedStep(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyAll = async () => {
    try {
      const allColors = Object.values(scale).map(c => c.oklch).join('\n')
      await navigator.clipboard.writeText(allColors)
      setCopySuccess('ALL COPIED')
      setTimeout(() => setCopySuccess(''), 1500)
    } catch (err) {
      console.error('Failed to copy all:', err)
    }
  }

  const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  if (isLoading) {
    return (
      <div className="chroma-app">
        <div className="loader loader-fade">
          <div className="loader-content">
            <div className="loader-text">CHROMA</div>
            <div className="loader-bar">
              <div className="loader-progress"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="chroma-app">
        <header className="top-bar">
          <div className="logo-container">
            <h1 className="logo">CHROMA</h1>
            <a href="https://calyvent.com" target="_blank" rel="noopener" className="logo-subtitle">by calyvent</a>
          </div>
        </header>

        <div className="control-deck">
          <div className="control-group">
            <label>HEX</label>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              className="hex-input"
              maxLength={7}
            />
          </div>
          <div className="control-group">
            <label>PICKER</label>
            <input
              type="color"
              value={colorPicker}
              onChange={handleColorPicker}
              className="color-picker"
            />
          </div>
          <div className="control-group spacer"></div>
          <div className="control-group">
            <a href="/privacy.html" className="control-link">PRIVACY</a>
          </div>
          <div className="control-group">
            <a href="/terms.html" className="control-link">TERMS</a>
          </div>
        </div>

        <main className="spectrum-wall">
          <div className="copy-all-container">
            <button onClick={handleCopyAll} className="copy-all-btn">COPY ALL COLORS</button>
          </div>
          {steps.map((step) => {
            const color = scale[step]
            if (!color) return null
            return (
              <div
                key={step}
                className="color-column"
                style={{ backgroundColor: color.oklch }}
                onClick={() => handleCopy(color.oklch, step)}
              >
                <div className="column-label">{step}</div>
                <div className="column-data">
                  <div className="data-oklch">{color.oklch}</div>
                  <div className="data-lightness">L: {color.L.toFixed(2)}</div>
                </div>
                {copiedStep === step && (
                  <div className="column-copied">COPIED</div>
                )}
              </div>
            )
          })}
        </main>

        <footer className="attribution">
          <a href="https://velocity.calyvent.com" target="_blank" rel="noopener" className="footer-link">DESIGN BY VELOCITY</a>
        </footer>

        {copySuccess && (
          <div className="copy-toast">{copySuccess}</div>
        )}
      </div>

      <section className="seo-content">
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">OKLCH Color Generator</span>
        </nav>

        <h2>How to Generate OKLCH Color Scales</h2>
        <ol>
          <li>Enter your base HEX color code in the input field</li>
          <li>Use the color picker to visually select your starting color</li>
          <li>Chroma instantly generates an 11-step color scale (50-950)</li>
          <li>Click any color column to copy its OKLCH value</li>
          <li>Use "COPY ALL COLORS" to export the entire palette</li>
        </ol>

        <h2>Key Features of Chroma</h2>
        <ul>
          <li><strong>Perceptually Uniform:</strong> OKLCH provides consistent color perception across lightness levels</li>
          <li><strong>11-Step Scale:</strong> Generate complete design system palettes from a single color</li>
          <li><strong>Instant Results:</strong> Real-time color calculation with no page reloads</li>
          <li><strong>100% Private:</strong> All processing happens in your browser, no data ever leaves your device</li>
          <li><strong>Free Forever:</strong> No account, no installation, no limits</li>
          <li><strong>Mobile Optimized:</strong> Works perfectly on smartphones and tablets</li>
        </ul>

        <h2>Code Example</h2>
        <div className="code-example">
          <div className="code-example__label">Before (Single Color)</div>
          <pre><code>background-color: #A8927E;</code></pre>
          <div className="code-example__label">After (Complete Palette)</div>
          <pre><code>/* 50 */ background-color: oklch(0.970 0.1400 45.00);
/* 100 */ background-color: oklch(0.920 0.1400 45.00);
/* 200 */ background-color: oklch(0.840 0.1400 45.00);
/* 300 */ background-color: oklch(0.740 0.1400 45.00);
/* 400 */ background-color: oklch(0.650 0.1400 45.00);
/* 500 */ background-color: oklch(0.550 0.1400 45.00);
/* 600 */ background-color: oklch(0.460 0.1400 45.00);
/* 700 */ background-color: oklch(0.380 0.1400 45.00);
/* 800 */ background-color: oklch(0.300 0.1400 45.00);
/* 900 */ background-color: oklch(0.210 0.1400 45.00);
/* 950 */ background-color: oklch(0.140 0.1400 45.00);</code></pre>
        </div>

        <h2>Why Use OKLCH for Design Systems?</h2>
        <p>OKLCH is the modern standard for color in design systems because it provides perceptual uniformity—colors that appear equally spaced to the human eye. Unlike HSL or RGB, OKLCH maintains consistent lightness and chroma relationships across the color space, making it ideal for generating harmonious color scales. Major design systems including Tailwind CSS v4 have adopted OKLCH as their default color space.</p>

        <h2>Use Cases</h2>
        <p>Chroma is perfect for UI designers, frontend developers, and design system architects who need to create consistent color palettes. Use it to generate background colors, text colors, border colors, and accent colors that work together harmoniously. The 11-step scale (50-950) matches the standard naming convention used by modern CSS frameworks, making it easy to integrate into your existing workflow.</p>

        <h2>Security & Privacy</h2>
        <p>Chroma is built with privacy as a core principle. All color calculations happen entirely in your browser using JavaScript. Your color values are never transmitted to, stored on, or processed by any server. We use no cookies, no tracking, and no third-party analytics. The tool is open source and the code can be audited at any time.</p>

        <h2>Frequently Asked Questions</h2>
        <div className="faq">
          <div className="faq-item">
            <h3>Is this OKLCH color generator free?</h3>
            <p>Yes, Chroma is 100% free to use online. No account or installation required.</p>
          </div>
          <div className="faq-item">
            <h3>Is my color data private?</h3>
            <p>Absolutely. All color calculations happen in your browser. Your color values are never uploaded or stored on any server.</p>
          </div>
          <div className="faq-item">
            <h3>What is OKLCH color space?</h3>
            <p>OKLCH is a perceptually uniform color space that provides better color consistency and perceptual uniformity compared to HSL or RGB. It's the modern standard for color in design systems.</p>
          </div>
          <div className="faq-item">
            <h3>Can I use the generated colors in my projects?</h3>
            <p>Yes, all generated color palettes are yours to use freely in personal and commercial projects.</p>
          </div>
          <div className="faq-item">
            <h3>Does Chroma work on mobile devices?</h3>
            <p>Yes, Chroma is fully optimized for mobile browsers and works perfectly on smartphones and tablets.</p>
          </div>
          <div className="faq-item">
            <h3>What browsers support OKLCH?</h3>
            <p>OKLCH is supported in all modern browsers including Chrome, Firefox, Safari, and Edge. For older browsers, you may need a polyfill.</p>
          </div>
        </div>
      </section>
    </>
  )
}

export default App
