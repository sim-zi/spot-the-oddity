"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

interface CRTMonitorProps {
  videoUrl?: string;
}

function CRTMonitor({ videoUrl }: CRTMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch((error) => {
        console.log("Video autoplay prevented:", error);
      });
    }
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <group>
      {/* 외부 케이스 (베젤) - 더 두껍고 깊이감 있게 */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[4.8, 3.8, 0.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* 내부 프레임 */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[4.4, 3.4, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* 스크린 베이스 (검은 배경) */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* CRT 스크린 효과 - 약간 휘어진 느낌 */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial
          color="#003311"
          emissive="#005522"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* 비디오 플레이스홀더 */}
      <Html
        position={[0, 0, 0.02]}
        transform
        distanceFactor={0.4}
        style={{
          width: "4400px",
          height: "3400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: videoUrl
              ? "#000000"
              : "linear-gradient(180deg, #004422 0%, #006633 50%, #004422 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00ff88",
            fontSize: "24px",
            fontFamily: "monospace",
            textShadow: "0 0 20px #00ff88, 0 0 40px #00ff88",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", zIndex: 10 }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>📺</div>
              <div>CRT Display</div>
              <div
                style={{ fontSize: "14px", marginTop: "10px", opacity: 0.7 }}
              >
                Upload or select a video
              </div>
            </div>
          )}

          {/* 컨트롤 버튼 */}
          {videoUrl && (
            <button
              onClick={handlePlayPause}
              style={{
                position: "absolute",
                bottom: "200px",
                left: "50%",
                transform: "translateX(-50%) scale(5)",
                padding: "10px 20px",
                background: "rgba(0, 0, 0, 0.7)",
                border: "2px solid #00ff88",
                borderRadius: "5px",
                color: "#00ff88",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "14px",
                zIndex: 100,
              }}
            >
              {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
            </button>
          )}

          {/* 스캔라인 효과 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15) 0px,
                rgba(0, 0, 0, 0.15) 2px,
                transparent 2px,
                transparent 4px
              )`,
              pointerEvents: "none",
            }}
          />

          {/* CRT 글로우 효과 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              boxShadow: "inset 0 0 100px rgba(0, 255, 100, 0.1)",
              pointerEvents: "none",
            }}
          />
        </div>
      </Html>

      {/* 반사광 */}
      <mesh position={[1.2, 1, 0.03]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[1.5, 0.8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>

      {/* 화면 빛 효과 */}
      <pointLight
        position={[0, 0, 1]}
        intensity={4}
        color="#00ffaa"
        distance={8}
        decay={1.5}
      />

      {/* 버튼과 디테일 */}
      <mesh position={[1.8, -1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        <meshStandardMaterial
          color="#ff3333"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>

      <mesh position={[2.0, -1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export default function CRTDisplay() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleUrlInput = () => {
    const url = prompt("Enter video URL (YouTube, or direct video link):");
    if (url) {
      setVideoUrl(url);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 relative">
      {/* 비디오 업로드 컨트롤 */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400 rounded font-mono text-sm transition-colors"
        >
          📁 Upload Video
        </button>
        <button
          onClick={handleUrlInput}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 border border-green-400 rounded font-mono text-sm transition-colors"
        >
          🔗 URL
        </button>
        {videoUrl && (
          <button
            onClick={() => setVideoUrl("")}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-400 border border-red-400 rounded font-mono text-sm transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.0}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, -5, 2]}
          intensity={0.5}
          color="#6699ff"
        />
        <directionalLight
          position={[0, 5, 0]}
          intensity={0.8}
          color="#ffffff"
        />

        <CRTMonitor videoUrl={videoUrl} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          autoRotate={false}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
