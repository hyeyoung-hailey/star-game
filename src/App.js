import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import confetti from 'canvas-confetti';

function App() {
  const canvasRef = useRef(null);
  const CANVAS_WIDTH = 320;  // 정사각형 캔버스
  const CANVAS_HEIGHT = 320;

  const CENTER_X = CANVAS_WIDTH / 2;   // 캔버스 중심점
  const CENTER_Y = CANVAS_HEIGHT / 2;

  const [drawPoints, setDrawPoints] = useState([]);
  const [selectedVertices, setSelectedVertices] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverVertex, setHoverVertex] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [success, setSuccess] = useState(false);

  const STAR_RADIUS_OUTER = 115;  // 100에서 115로 증가 (15% 증가)
  const STAR_RADIUS_INNER = 46;   // 40에서 46으로 증가 (15% 증가)
  const LABEL_DISTANCE = 30;      // 25에서 30으로 증가 (라벨 위치 조정)

  const ROTATION_ANGLE = 45; // 별 전체 회전 각도 (도)

  // 라벨과 경로 순서 조정
  const labels = ['A', 'B', 'C', 'D', 'E']; // E부터 시작하여 시계방향으로
  const CORRECT_PATH = [1, 3, 0, 2, 4, 1]; // 새로운 경로 순서

  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 72 - 162 + ROTATION_ANGLE) * (Math.PI / 180); // -162도로 시작 (-90 - 72)
    
    return {
      x: CENTER_X + STAR_RADIUS_OUTER * Math.cos(angle),
      y: CENTER_Y + STAR_RADIUS_OUTER * Math.sin(angle),
      angle: (i * 72 - 162 + ROTATION_ANGLE),
    };
  });

  const calculateLabelPosition = (x, y, angle) => {
    const radian = (angle * Math.PI) / 180;
    return {
      dx: Math.cos(radian) * LABEL_DISTANCE,
      dy: Math.sin(radian) * LABEL_DISTANCE
    };
  };

  // 수정된 좌표 변환 함수 추가
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    let x, y;
    if (e.touches) { // 터치 이벤트
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else { // 마우스 이벤트
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    return { x, y };
  };

  const isNear = (x, y, pt) => Math.hypot(pt.x - x, pt.y - y) <= 15;

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
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    
    for (let i = 0; i < points.length; i++) {
      if (isNear(x, y, points[i])) {
        setDrawPoints([points[i]]); // 정확한 점 좌표 사용
        setSelectedVertices([i]);
        setHoverVertex(i);
        setIsDrawing(true);
        setSuccess(false);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    setCursorPos({ x: e.clientX, y: e.clientY });

    if (!isDrawing) {
      for (let i = 0; i < points.length; i++) {
        if (isNear(x, y, points[i])) {
          setHoverVertex(i);
          return;
        }
      }
      setHoverVertex(null);
      return;
    }

    setDrawPoints(prev => [...prev, { x, y }]);

    for (let i = 0; i < points.length; i++) {
      if (isNear(x, y, points[i])) {
        const alreadySelected = selectedVertices.includes(i);
        const isClosingStart = selectedVertices.length === 5 && i === selectedVertices[0];

        if (!alreadySelected || isClosingStart) {
          setSelectedVertices(prev => [...prev, i]);
          setHoverVertex(i);
          setDrawPoints(prev => [...prev, points[i]]); // 정확한 점 좌표 사용
          return;
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setHoverVertex(null);

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
    
    // 캔버스 비율 계산
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / CANVAS_WIDTH;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 점선 가이드
    const guide = [0, 2, 4, 1, 3, 0];
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(points[guide[0]].x, points[guide[0]].y);
    for (let i = 1; i < guide.length; i++) {
      ctx.lineTo(points[guide[i]].x, points[guide[i]].y);
    }
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 4;  // 점선 두께 증가
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

    // 꼭짓점 및 라벨
    points.forEach(({ x, y, angle }, i) => {
      // hover 효과
      if (i === hoverVertex) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // 꼭짓점 동그라미
      const circleRadius = 8;
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = selectedVertices.includes(i) ? 'deepskyblue' : 'white';
      ctx.fill();

      // 라벨 그리기
      const { dx, dy } = calculateLabelPosition(x, y, angle);
      const fontSize = Math.round(Math.max(14 * scale, 12));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(labels[i], x + dx, y + dy);
    });
  }, [drawPoints, selectedVertices, hoverVertex, success]);

  return (
    <div className="container">
      <div className="message-area">
        점선을 따라 별을 그려보세요!<br/>
        순서대로 연결하면 완성됩니다.
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          width: '100%',
          maxWidth: '320px',
          height: 'auto',
          touchAction: 'none',
          cursor: 'crosshair'
        }}
      />
      <p className={success ? 'success-text' : 'message-text'}>
        {success
          ? '🌟 성공! 별을 정확히 그렸습니다!'
          : '나만의 별 그리는 방법을 공유하고\n제품 추천과 랜덤 리워드까지 받아가자!'}
      </p>
      <button 
        className="event-button"
        onClick={() => window.location.href="/event"}
      >
        게임 참여하고 선물받기
      </button>
    </div>
  );
}

export default App;
