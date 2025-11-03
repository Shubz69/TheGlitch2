# CONTACT US BINARY BACKGROUND - EXACT CODE BACKUP
# ⚠️ DO NOT MODIFY - PERFECT AS IS ⚠️
# Saved on: 2024

## COMPONENT: SharedBackground.js
### Location: src/components/SharedBackground.js

### EXACT BINARY MATRIX CODE (lines 26-65):

```javascript
// Matrix-like particle effect
useEffect(() => {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    
    const characters = "01010101";  // ⚠️ EXACT CHARACTERS - DO NOT CHANGE
    const columns = canvas.width / 20;
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';  // ⚠️ EXACT FADE - DO NOT CHANGE
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';  // ⚠️ EXACT COLOR - WHITE - DO NOT CHANGE
        ctx.font = '15px monospace';  // ⚠️ EXACT FONT SIZE - DO NOT CHANGE
        
        for (let i = 0; i < drops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * 20, drops[i] * 20);  // ⚠️ EXACT SPACING - 20px - DO NOT CHANGE
            
            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            drops[i]++;
        }
    }
    
    const interval = setInterval(draw, 70);  // ⚠️ EXACT INTERVAL - 70ms - DO NOT CHANGE
    
    return () => clearInterval(interval);
}, []);
```

### CANVAS ELEMENT (line 88):
```jsx
<canvas id="matrixCanvas" className="matrix-background"></canvas>
```

---

## CSS STYLING: SharedBackground.css
### Location: src/styles/SharedBackground.css

### EXACT CSS FOR BINARY BACKGROUND (lines 44-53):

```css
/* Matrix Background */
.matrix-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -3;  /* ⚠️ EXACT Z-INDEX - DO NOT CHANGE */
    opacity: 0.3;  /* ⚠️ EXACT OPACITY - DO NOT CHANGE */
}
```

---

## COMPLETE COMPONENT STRUCTURE:

### Full SharedBackground.js Component:
```javascript
import React, { useEffect, useRef } from 'react';

const SharedBackground = () => {
    const gridRef = useRef(null);

    // 3D grid effect with improved animation
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        for (let i = 0; i < 15; i++) {
            const gridLine = document.createElement('div');
            gridLine.className = 'grid-line';
            gridLine.style.setProperty('--delay', i * 0.4);
            gridLine.style.top = `${i * 7}%`;
            grid.appendChild(gridLine);
        }

        return () => {
            while (grid && grid.firstChild) {
                grid.removeChild(grid.firstChild);
            }
        };
    }, []);

    // Matrix-like particle effect
    useEffect(() => {
        const canvas = document.getElementById('matrixCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        
        const characters = "01010101";
        const columns = canvas.width / 20;
        const drops = [];
        
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '15px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);
                
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        }
        
        const interval = setInterval(draw, 70);
        
        return () => clearInterval(interval);
    }, []);

    // Render chart background with more complex pattern
    const renderChartBg = () => (
        <div className="chart-bg">
            <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <path 
                    className="chart-line" 
                    d="M0,600 C100,580 200,620 300,580 C400,540 500,600 600,550 C700,500 800,650 900,600 C1000,550 1100,570 1200,540" 
                    stroke="#fff" 
                />
                <path 
                    className="chart-line" 
                    d="M0,500 C100,480 200,520 300,490 C400,460 500,510 600,470 C700,430 800,550 900,500 C1000,450 1100,470 1200,430" 
                    stroke="#ccc" 
                    style={{ animationDelay: '0.5s' }}
                />
            </svg>
        </div>
    );

    return (
        <>
            <canvas id="matrixCanvas" className="matrix-background"></canvas>
            {renderChartBg()}
            
            {/* Floating elements with enhanced SVGs */}
            <div className="floating-element el1">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <path d="M50,10 L90,50 L50,90 L10,50 Z" stroke="#fff" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="floating-element el2">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#ccc" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="floating-element el3">
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <path d="M20,20 L80,20 L80,80 L20,80 Z" stroke="#fff" strokeWidth="1" fill="none" />
                </svg>
            </div>
            
            <div className="grid-3d" ref={gridRef}></div>
        </>
    );
};

export default SharedBackground;
```

---

## USAGE IN ContactUs.js:

```jsx
import SharedBackground from '../components/SharedBackground';

// In the return statement:
<div className="contact-container">
    <SharedBackground />
    <div className="stars"></div>
    {/* ... rest of content ... */}
</div>
```

---

## CRITICAL SETTINGS - DO NOT MODIFY:

1. **Characters**: `"01010101"` - Exact binary pattern
2. **Font**: `'15px monospace'` - Exact font size and family
3. **Color**: `'#fff'` - White color for binary digits
4. **Fade**: `'rgba(0, 0, 0, 0.1)'` - Exact fade effect
5. **Spacing**: `20` pixels between columns
6. **Interval**: `70` milliseconds between frames
7. **Opacity**: `0.3` in CSS
8. **Z-index**: `-3` in CSS
9. **Reset probability**: `0.975` - controls when columns restart

---

## IMPORTANT NOTES:

- This binary background is PERFECT and should NOT be modified
- It creates the exact grid-like pattern seen on the Contact Us page
- The binary digits (0s and 1s) are randomly selected from "01010101"
- The effect creates a subtle, static-looking binary grid pattern
- Canvas size adjusts to window dimensions automatically
- The fade effect creates the trailing/ghosting effect

---

## FILE LOCATIONS:

- Component: `src/components/SharedBackground.js`
- CSS: `src/styles/SharedBackground.css`
- Usage: `src/pages/ContactUs.js` (line 91)

---

# END OF BACKUP
# ⚠️ THIS CODE IS PERFECT - DO NOT MODIFY ⚠️

