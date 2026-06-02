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
    const value = e.target.value
    setHexInput(value)
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
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
  )
}

export default App
