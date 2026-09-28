declare module 'three' {
  export const SRGBColorSpace: string

  export class Vector2 {
    x: number
    y: number
    constructor(x?: number, y?: number)
  }

  export class Vector3 {
    x: number
    y: number
    z: number
    constructor(x?: number, y?: number, z?: number)
    set: (x: number, y: number, z: number) => this
    copy: (v: Vector3) => this
    project: (camera: Camera) => this
  }

  export class Object3D {
    position: Vector3
    scale: Vector3
    visible: boolean
    name: string
  }

  export class Scene {
    add: (...objects: Object3D[]) => this
  }

  export class Camera {}

  export class PerspectiveCamera extends Camera {
    fov: number
    aspect: number
    position: Vector3
    constructor(fov?: number, aspect?: number, near?: number, far?: number)
    lookAt: (x: number, y: number, z: number) => void
    updateProjectionMatrix: () => void
  }

  export class Texture {
    colorSpace: string
    dispose: () => void
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement)
  }

  export class Material {
    dispose: () => void
    needsUpdate: boolean
  }

  export class SpriteMaterial extends Material {
    map: Texture | null
    constructor(params?: object)
  }

  export class Sprite extends Object3D {
    material: SpriteMaterial
    constructor(material?: SpriteMaterial)
  }

  export class WebGLRenderer {
    domElement: HTMLCanvasElement
    outputColorSpace: string
    constructor(params?: object)
    setPixelRatio: (value: number) => void
    setSize: (width: number, height: number, updateStyle?: boolean) => void
    render: (scene: Scene, camera: Camera) => void
    dispose: () => void
  }

  export class Plane {
    constructor(normal: Vector3, constant: number)
  }

  export class Ray {
    intersectPlane: (plane: Plane, target: Vector3) => Vector3 | null
  }

  export class Raycaster {
    ray: Ray
    setFromCamera: (coords: Vector2, camera: Camera) => void
    intersectObjects: (objects: Object3D[]) => { object: Object3D }[]
  }
}
