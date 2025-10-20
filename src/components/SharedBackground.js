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

    return (
        <>
            <canvas id="matrixCanvas" className="matrix-background"></canvas>
            <div className="grid-3d" ref={gridRef}></div>
        </>
    );
};

export default SharedBackground;
