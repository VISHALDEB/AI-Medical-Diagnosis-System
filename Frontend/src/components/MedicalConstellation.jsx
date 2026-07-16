import React, { useEffect, useRef } from "react";

export default function MedicalConstellation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create soft computational diagnostic density matrices (Biometric Tissue Scan Clouds)
    const scanClouds = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3, r: 240, vx: 0.2, vy: 0.15, phase: 0 },
      { x: canvas.width * 0.7, y: canvas.height * 0.4, r: 280, vx: -0.15, vy: 0.2, phase: Math.PI / 3 },
      { x: canvas.width * 0.4, y: canvas.height * 0.7, r: 220, vx: 0.1, vy: -0.1, phase: Math.PI / 1.5 }
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");

      // Dynamic Medical Thermal spectrum setup (Violet/Teal clinical blur matrices)
      const primaryColor = isDark ? "rgba(124, 58, 237, " : "rgba(167, 139, 250, ";
      const cleanSecondaryColor = isDark ? "rgba(6, 182, 212, " : "rgba(103, 232, 249, ";

      // Set global composite operation to blend soft biological fluid layers nicely
      ctx.globalCompositeOperation = isDark ? "screen" : "multiply";

      scanClouds.forEach((cloud, idx) => {
        // Controlled organic shifting acceleration trajectory
        cloud.phase += 0.003;
        cloud.x += cloud.vx;
        cloud.y += cloud.vy;

        // Bounce smoothly off viewport canvas thresholds
        if (cloud.x - cloud.r < 0 || cloud.x + cloud.r > canvas.width) cloud.vx *= -1;
        if (cloud.y - cloud.r < 0 || cloud.y + cloud.r > canvas.height) cloud.vy *= -1;

        // Subtle fluid respiration dilation scaling
        const dynamicRadius = cloud.r + Math.sin(cloud.phase) * 35;
        const alphaScalar = isDark 
          ? (0.05 + Math.sin(cloud.phase) * 0.02) 
          : (0.04 + Math.sin(cloud.phase) * 0.015);

        // Draw the fluid biometric scatter mesh overlay
        const scanGradient = ctx.createRadialGradient(
          cloud.x, cloud.y, 5,
          cloud.x, cloud.y, dynamicRadius
        );

        const coreColor = idx % 2 === 0 ? primaryColor : cleanSecondaryColor;

        scanGradient.addColorStop(0, `${coreColor}${alphaScalar})`);
        scanGradient.addColorStop(0.5, `${coreColor}${alphaScalar * 0.4})`);
        scanGradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = scanGradient;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Restore normal layout blending constraints for text interfaces
      ctx.globalCompositeOperation = "source-over";

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}