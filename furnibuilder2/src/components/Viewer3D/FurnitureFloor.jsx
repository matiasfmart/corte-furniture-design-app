import { Grid } from '@react-three/drei'

/**
 * Grilla infinita con fade suave. Sin animación de aparición/desaparición.
 */
export default function FurnitureFloor({ totalWidth, depth }) {
  const baseSize = Math.max(totalWidth, depth, 600)
  return (
    <Grid
      position={[totalWidth / 2, -0.5, depth / 2]}
      infiniteGrid={true}
      cellSize={50}
      cellThickness={0.9}
      cellColor="#625850"
      sectionSize={200}
      sectionThickness={1.2}
      sectionColor="#918578"
      fadeDistance={Math.max(baseSize * 4, 3000)}
      fadeStrength={0.8}
      followCamera={false}
    />
  )
}
