import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EdgesGeometry, BoxGeometry, Vector3, Euler, Quaternion } from 'three'
import { useDesignStore } from '../../store/designStore'

const EXPLOSION_FACTOR = 0.25

// Paleta por función — colores mate, sin brillo excesivo
const PIECE_COLORS = {
  structure: {
    color:     '#4a88c8',
    roughness:  0.85,
    metalness:  0.0,
  },
  top: {
    color:     '#3ab890',
    roughness:  0.85,
    metalness:  0.0,
  },
  door: {
    color:     '#e8a020',
    roughness:  0.75,
    metalness:  0.0,
  },
  drawerFront: {
    color:     '#e8a020',
    roughness:  0.75,
    metalness:  0.0,
  },
  drawerBody: {
    color:     '#6a9cbd',
    roughness:  0.90,
    metalness:  0.0,
  },
  shelf: {
    color:     '#6a9cbd',
    roughness:  0.90,
    metalness:  0.0,
  },
  back: {
    color:     '#2a5a8a',
    roughness:  0.95,
    metalness:  0.0,
  },
}

const ROLE_TO_CATEGORY = {
  'lateral-left':  'structure',
  'lateral-right': 'structure',
  'base':          'structure',
  'top':           'top',
  'back':          'back',
  'shelf':         'shelf',
  'door-left':     'door',
  'door-right':    'door',
  'door-lift':     'door',
  'drawer-front':  'drawerFront',
  'drawer-body':   'drawerBody',
}

function getPieceMaterial(role) {
  const category = ROLE_TO_CATEGORY[role] || 'structure'
  return PIECE_COLORS[category]
}

function getPieceColor(role) {
  return getPieceMaterial(role).color
}

/**
 * Calcula el offset de explosión uniforme desde el centro hacia afuera.
 * Cada pieza se aleja del centro proporcionalmente a su posición relativa.
 */
function getExplosionOffset(piece, center) {
  const { role, dims, position3D } = piece

  // Centro de la pieza
  const px = position3D.x + dims.w / 2
  const py = position3D.y + dims.h / 2
  const pz = position3D.z + dims.d / 2

  // Vector desde el centro del mueble al centro de la pieza
  const dx = px - center.x
  const dy = py - center.y
  const dz = pz - center.z

  // Factor de explosión uniforme — multiplica la distancia al centro
  const factor = 0.6

  return [dx * factor, dy * factor, dz * factor]
}

/**
 * Calcula la posición de apertura para cajones según openAmount (0-1).
 * Cajones se abren escalonados: el inferior más, el superior menos.
 * 1 cajón: 50%, 100% (si hubiera 2) / con 1 solo: 100%
 * 2 cajones: superior 50%, inferior 100%
 * 3 cajones: superior 33%, medio 66%, inferior 100%
 */
function getOpenOffset(piece, openAmount, center, allPieces) {
  if (openAmount <= 0) return [0, 0, 0]
  const { role } = piece
  if (role !== 'drawer-front' && role !== 'drawer-body') return [0, 0, 0]

  const depth = center ? center.z * 2 : 400
  const maxPullOut = (depth - 36) * 0.75

  // Find drawer index among siblings (same moduleId, same role type)
  const siblings = allPieces
    ? allPieces.filter(p => p.moduleId === piece.moduleId && (p.role === 'drawer-front' || p.role === 'drawer-body') && p.role === role)
    : []
  // Sort top to bottom (highest Y = top)
  const sortedByY = [...siblings].sort((a, b) => b.position3D.y - a.position3D.y)
  const idx = sortedByY.findIndex(p => p.id === piece.id)
  const count = sortedByY.length || 1

  // Stagger: bottom drawer opens 100%, top opens least
  // idx 0 = top, idx count-1 = bottom
  const staggerFactor = count === 1 ? 1 : (idx + 1) / count
  const drawerPullOut = maxPullOut * openAmount * staggerFactor

  return [0, 0, -drawerPullOut]
}

/**
 * Para puertas necesitamos pivotar desde la bisagra (borde lateral).
 * Retorna: { pivotOffset, meshOffset, targetRotation }
 *
 * La estrategia:
 * - El grupo principal (groupRef) se posiciona en el punto de bisagra
 * - El mesh dentro se desplaza para que el borde coincida con el pivote
 * - La rotación del grupo interno rota desde la bisagra
 */
function getDoorPivotData(piece, openAmount) {
  const { role, dims } = piece
  const isDoor = role === 'door-left' || role === 'door-right' || role === 'door-lift'
  if (!isDoor) return null

  let pivotOffset, meshOffset, targetRotation
  // Puertas abren solo 60% para no superponerse entre sí
  const effectiveOpen = openAmount * 0.6
  const maxAngle = 110 * Math.PI / 180
  const liftAngle = 80 * Math.PI / 180

  if (role === 'door-left') {
    pivotOffset = [-dims.w / 2, 0, 0]
    meshOffset = [dims.w / 2, 0, 0]
    targetRotation = [0, maxAngle * effectiveOpen, 0]
  } else if (role === 'door-right') {
    pivotOffset = [dims.w / 2, 0, 0]
    meshOffset = [-dims.w / 2, 0, 0]
    targetRotation = [0, -maxAngle * effectiveOpen, 0]
  } else {
    // door-lift: bisagra arriba, se abre hacia adelante (hacia el espectador)
    pivotOffset = [0, dims.h / 2, 0]
    meshOffset = [0, -dims.h / 2, 0]
    targetRotation = [liftAngle * effectiveOpen, 0, 0]
  }

  return { pivotOffset, meshOffset, targetRotation }
}

/**
 * Renderiza una pieza individual con animación de posición y rotación (puertas).
 */
export default function PieceMesh({ piece, allPieces, renderMode, viewState, materialType, center, isSelected, onSelect, handleHoles }) {
  const { dims, position3D, role } = piece
  const groupRef = useRef()
  const pivotRef = useRef()
  const openAmount = useDesignStore((s) => s.openAmount)

  const doorData = useMemo(() => getDoorPivotData(piece, openAmount), [piece, openAmount])
  const isDoor = !!doorData

  // Posición del grupo principal
  const basePosition = useMemo(() => {
    if (isDoor) {
      // Posicionar en el punto de bisagra
      return new Vector3(
        position3D.x + dims.w / 2 + doorData.pivotOffset[0],
        position3D.y + dims.h / 2 + doorData.pivotOffset[1],
        position3D.z + dims.d / 2 + doorData.pivotOffset[2],
      )
    }
    return new Vector3(
      position3D.x + dims.w / 2,
      position3D.y + dims.h / 2,
      position3D.z + dims.d / 2,
    )
  }, [position3D, dims, isDoor, doorData])

  // Posición objetivo
  const targetPosition = useMemo(() => {
    let offset = [0, 0, 0]
    if (viewState === 'exploded') {
      offset = getExplosionOffset(piece, center)
    } else if (openAmount > 0) {
      offset = getOpenOffset(piece, openAmount, center, allPieces)
    }
    return new Vector3(
      basePosition.x + offset[0],
      basePosition.y + offset[1],
      basePosition.z + offset[2],
    )
  }, [basePosition, piece, viewState, openAmount, center, allPieces])

  // Target rotation as quaternion for smooth interpolation
  const targetQuaternion = useMemo(() => {
    if (!isDoor) return new Quaternion()
    const euler = new Euler(...doorData.targetRotation)
    return new Quaternion().setFromEuler(euler)
  }, [isDoor, doorData])

  const mounted = useRef(false)
  const prevBase = useRef(null)

  useFrame(() => {
    if (!groupRef.current) return
    if (!mounted.current) {
      groupRef.current.position.copy(targetPosition)
      if (pivotRef.current && isDoor) {
        pivotRef.current.quaternion.copy(targetQuaternion)
      }
      prevBase.current = basePosition.clone()
      mounted.current = true
      return
    }

    // Snap immediately only if BASE position jumped (dimension change)
    // View state changes (open/exploded) should always animate smoothly
    if (prevBase.current && prevBase.current.distanceTo(basePosition) > 100) {
      groupRef.current.position.copy(targetPosition)
      prevBase.current = basePosition.clone()
    } else {
      // Animate position smoothly
      const dist = groupRef.current.position.distanceTo(targetPosition)
      const t = dist > 50 ? 0.22 : dist > 10 ? 0.18 : 0.14
      groupRef.current.position.lerp(targetPosition, t)
      prevBase.current = basePosition.clone()
    }

    // Animate rotation (doors)
    if (pivotRef.current && isDoor) {
      pivotRef.current.quaternion.slerp(targetQuaternion, 0.18)
    }
  })

  // Color
  const color = useMemo(() => getPieceColor(role), [role])

  const edges = useMemo(() => {
    const geo = new BoxGeometry(dims.w, dims.h, dims.d)
    return new EdgesGeometry(geo)
  }, [dims.w, dims.h, dims.d])

  // Mesh offset: for doors, offset from pivot; for others, centered (0,0,0)
  const meshPosition = isDoor ? doorData.meshOffset : [0, 0, 0]

  // Drawer body geometry: render as open-top box (sides + back + bottom)
  const isDrawerBody = role === 'drawer-body'
  const drawerGeo = useMemo(() => {
    if (!isDrawerBody) return null
    const { w, h, d } = dims
    const side = 12   // side panel thickness
    const back = 12   // back panel thickness
    const bottom = 9  // bottom panel thickness (HDF)
    return { w, h, d, side, back, bottom }
  }, [isDrawerBody, dims])

  return (
    <group ref={groupRef}>
      <group ref={pivotRef}>
        <group position={meshPosition}>
          {renderMode === 'cad' ? (
            <>
              <mesh onClick={(e) => { e.stopPropagation(); onSelect?.() }}>
                <boxGeometry args={[dims.w, dims.h, dims.d]} />
                <meshBasicMaterial
                  color="#ebdbb2"
                  opacity={isSelected ? 0.08 : 0.04}
                  transparent
                  depthWrite={false}
                />
              </mesh>
              <lineSegments geometry={edges}>
                <lineBasicMaterial color={isSelected ? '#ebdbb2' : '#d5c4a1'} opacity={isSelected ? 1 : 0.65} transparent />
              </lineSegments>
            </>
          ) : isDrawerBody && drawerGeo ? (
            <DrawerBodyMesh
              geo={drawerGeo}
              role={role}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          ) : (
            <mesh castShadow receiveShadow onClick={(e) => { e.stopPropagation(); onSelect?.() }}>
              <boxGeometry args={[dims.w, dims.h, dims.d]} />
              <meshStandardMaterial
                color={color}
                roughness={getPieceMaterial(role).roughness}
                metalness={getPieceMaterial(role).metalness}
                flatShading={true}
              />
            </mesh>
          )}
          {/* Handle hole markers — small black dots indicating drill points */}
          {handleHoles && handleHoles.map((pos, i) => (
            <mesh key={`hole-${i}`} position={[pos[0], pos[1], -dims.d / 2 - 0.3]}>
              <circleGeometry args={[2.5, 16]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

/**
 * Renders a drawer body as an open-top box: two sides, one back, one bottom.
 * Origin is at center of the bounding box (same as a regular box would be).
 */
function DrawerBodyMesh({ geo, role, isSelected, onSelect }) {
  const { w, h, d, side, back, bottom } = geo
  const mat = getPieceMaterial(role)
  const matProps = {
    color: mat.color,
    roughness: mat.roughness,
    metalness: mat.metalness,
    flatShading: true,
  }

  // All positions relative to center of bounding box (w × h × d)
  const halfW = w / 2
  const halfH = h / 2
  const halfD = d / 2

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect?.() }}>
      {/* Left side panel */}
      <mesh castShadow receiveShadow position={[-halfW + side / 2, 0, 0]}>
        <boxGeometry args={[side, h, d]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Right side panel */}
      <mesh castShadow receiveShadow position={[halfW - side / 2, 0, 0]}>
        <boxGeometry args={[side, h, d]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Back panel */}
      <mesh castShadow receiveShadow position={[0, 0, halfD - back / 2]}>
        <boxGeometry args={[w - 2 * side, h, back]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Bottom panel */}
      <mesh castShadow receiveShadow position={[0, -halfH + bottom / 2, 0]}>
        <boxGeometry args={[w - 2 * side, bottom, d - back]} />
        <meshStandardMaterial {...matProps} color="#2a5a8a" />
      </mesh>
    </group>
  )
}
