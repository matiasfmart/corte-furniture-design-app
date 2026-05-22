import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useDesignStore } from '../../store/designStore'
import { useMemo } from 'react'
import { getTotalWidth, getMaxHeight } from '../../utils/moduleEngine.js'
import FurnitureFloor from './FurnitureFloor'
import ViewControls from './ViewControls'
import ModuleObject from './ModuleObject'

export default function FurnitureViewer() {
  const modules = useDesignStore((s) => s.modules)
  const design = useDesignStore((s) => s.design)
  const viewState = useDesignStore((s) => s.viewState)
  const renderMode = useDesignStore((s) => s.renderMode)
  const clearSelection = useDesignStore((s) => s.clearSelection)

  const totalWidth = useMemo(() => getTotalWidth(modules), [modules])
  const maxHeight = useMemo(() => getMaxHeight(modules), [modules])

  // Camera position based on furniture size
  const cameraDistance = useMemo(() => {
    const maxDim = Math.max(totalWidth, maxHeight, design.depth)
    return Math.max(maxDim * 3.5, 2500)
  }, [totalWidth, maxHeight, design.depth])

  // Center of the furniture for camera target
  const center = useMemo(() => {
    return [totalWidth / 2, maxHeight / 2, design.depth / 2]
  }, [totalWidth, maxHeight, design.depth])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{
          position: [cameraDistance * 0.3, cameraDistance * 0.35, -cameraDistance * 0.7],
          fov: 40,
          near: 1,
          far: cameraDistance * 10,
        }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        shadows
        style={{ background: '#282828' }}
        onPointerMissed={clearSelection}
      >
        <color attach="background" args={['#282828']} />

        {/* Lighting — realistic with cast shadows */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight
          position={[600, 1400, 800]}
          intensity={2.2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={5000}
          shadow-camera-left={-2000}
          shadow-camera-right={2000}
          shadow-camera-top={2000}
          shadow-camera-bottom={-2000}
          shadow-bias={-0.001}
        />
        <directionalLight position={[-500, 600, -300]} intensity={0.6} color="#d0e0f0" />
        <directionalLight position={[200, 400, -1200]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[1200, 300, -400]} intensity={0.8} color="#f0f4ff" />

        {/* Floor - hidden only in exploded view */}
        {viewState !== 'exploded' && modules.length > 0 && (
          <FurnitureFloor
            totalWidth={totalWidth}
            depth={design.depth}
          />
        )}

        {/* Furniture modules */}
        <ModuleObject />

        {/* Orbit Controls */}
        <OrbitControls
          target={modules.length > 0 ? center : [0, 0, 0]}
          enableDamping
          dampingFactor={0.1}
          minDistance={100}
          maxDistance={cameraDistance * 5}
        />
      </Canvas>

      {/* View Controls overlay */}
      <ViewControls />
    </div>
  )
}
