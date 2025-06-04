import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import confetti from 'canvas-confetti';

function App() {
  const canvasRef = useRef(null);
  const [drawPoints, setDrawPoints] = useState([]);
  const [selectedVertices, setSelectedVertices] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverVertex, setHoverVertex] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [success, setSuccess] = useState(false);

  const points = [
    { x: 100, y: 20 },   // 0: A
    { x: 180, y: 75 },   // 1: B
    { x: 150, y: 170 },  // 2: C
    { x: 50,  y: 170 },  // 3: D
    { x: 20,  y: 75 },   // 4: E
  ];
  const labels = ['A', 'B', 'C', 'D', 'E'];
  const CORRECT_PATH = [0, 2, 4, 1, 3, 0];

  const isNear = (x, y, pt) => Math.hypot(pt.x - x, pt.y - y) < 15;

  const isCyclicEqual = (ref, input) => {
    const refCore = ref.slice(0, -1);
    const inputCore = input.slice(0, -1);
    if (refCore.length !== inputCore.length) return false;

    const len = refCore.length;
    for (let i = 0; i < len; i++) {
      const rotated = [...refCore.slice(i), ...refCore.slice(0, i)];
      if (rotated.join() === inputCore.join()) return true;
    }
    return false;
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    for (let i = 0; i < points.length; i++) {
      if (isNear(offsetX, offsetY, points[i])) {
        setDrawPoints([{ x: offsetX, y: offsetY }]);
        setSelectedVertices([i]);
        setHoverVertex(i);
        setIsDrawing(true);
        setSuccess(false);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const { clientX, clientY } = e;
    setCursorPos({ x: clientX, y: clientY });

    if (!isDrawing) {
      // hover 효과만 적용
      for (let i = 0; i < points.length; i++) {
        if (isNear(offsetX, offsetY, points[i])) {
          setHoverVertex(i);
          return;
        }
      }
      setHoverVertex(null);
      return;
    }

    setDrawPoints((prev) => [...prev, { x: offsetX, y: offsetY }]);

    for (let i = 0; i < points.length; i++) {
      if (isNear(offsetX, offsetY, points[i])) {
        const alreadySelected = selectedVertices.includes(i);
        const isClosingStart =
          selectedVertices.length === 5 && i === selectedVertices[0];

        if (!alreadySelected || isClosingStart) {
          setSelectedVertices((prev) => [...prev, i]);
          setHoverVertex(i);
          return;
        }
      }
    }
    setHoverVertex(null);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setHoverVertex(null);

    console.log("경로:", selectedVertices);
    const path = [...selectedVertices];
    const reversed = [...CORRECT_PATH].reverse();

    const isCorrect =
      path.length === 6 &&
      (isCyclicEqual(CORRECT_PATH, path) || isCyclicEqual(reversed, path));

    if (isCorrect) {
      setSuccess(true);
    }
  };

  useEffect(() => {
    if (success) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.3 },
        colors: ['#ffffff', '#ffff66', '#ffd700'],
      });
    }
  }, [success]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 점선 가이드
    const guide = [0, 2, 4, 1, 3, 0];
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(points[guide[0]].x, points[guide[0]].y);
    for (let i = 1; i < guide.length; i++) {
      ctx.lineTo(points[guide[i]].x, points[guide[i]].y);
    }
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 성공한 별
    if (success) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(points[CORRECT_PATH[0]].x, points[CORRECT_PATH[0]].y);
      for (let i = 1; i < CORRECT_PATH.length; i++) {
        ctx.lineTo(points[CORRECT_PATH[i]].x, points[CORRECT_PATH[i]].y);
      }
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (drawPoints.length > 1) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
      }
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 꼭짓점
    points.forEach(({ x, y }, i) => {
      if (i === hoverVertex) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = selectedVertices.includes(i) ? 'deepskyblue' : 'white';
      ctx.fill();

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(labels[i], x - 10, y - 12);
    });
  }, [drawPoints, selectedVertices, hoverVertex, success]);

  return (
    <div className="container">
      <canvas
        ref={canvasRef}
        width={220}
        height={220}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div
        className={`custom-cursor ${hoverVertex !== null ? 'hover' : ''}`}
        style={{
          top: `${cursorPos.y}px`,
          left: `${cursorPos.x}px`,
        }}
      />
      <p className={success ? 'success-text' : ''}>
        {success
          ? '🌟 성공! 별을 정확히 그렸습니다!'
          : '점선을 따라 별을 그려보세요!'}
      </p>
    </div>
  );
}

export default App;
