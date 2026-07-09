import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

/** Shared material set for a chunky ballplayer; one set per uniform style. */
export interface PlayerMaterials {
  uniform: StandardMaterial;
  skin: StandardMaterial;
  cap: StandardMaterial;
  shadow: StandardMaterial;
  base?: StandardMaterial;
  glove?: StandardMaterial;
}

/**
 * A molded-plastic material: saturated diffuse, a little emissive so it stays
 * readable under the night lights, and a broad cool-white specular sheen — the
 * glossy highlight that makes the tokens read as toy figurines, not clay.
 */
export function makePlasticMaterial(scene: Scene, name: string, hex: string, emissive = 0.25): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const c = Color3.FromHexString(hex);
  mat.diffuseColor = c;
  mat.emissiveColor = c.scale(emissive);
  mat.specularColor = new Color3(0.85, 0.86, 0.92); // bright plastic highlight
  mat.specularPower = 44; // broad, soft sheen rather than a sharp mirror dot
  mat.freeze();
  return mat;
}

/** The dark glossy stand every toy figure is molded onto. */
export function makeToyBaseMaterial(scene: Scene): StandardMaterial {
  const mat = new StandardMaterial("toyBase", scene);
  mat.diffuseColor = Color3.FromHexString("#191c24");
  mat.emissiveColor = new Color3(0.05, 0.05, 0.06);
  mat.specularColor = new Color3(0.7, 0.7, 0.78);
  mat.specularPower = 32;
  mat.freeze();
  return mat;
}

/** A flat, unlit, alpha-blended dark disc that grounds every token. */
export function makeShadowMaterial(scene: Scene): StandardMaterial {
  const mat = new StandardMaterial("tokenShadow", scene);
  mat.diffuseColor = Color3.Black();
  mat.emissiveColor = Color3.Black();
  mat.specularColor = Color3.Black();
  mat.disableLighting = true;
  mat.alpha = 0.26;
  mat.freeze();
  return mat;
}

/**
 * Build one chunky ballplayer under a fresh TransformNode: tapered torso,
 * squashed shoulders, ball head, team cap with a bill facing home, a soft
 * ground shadow, and an optional fielder's glove. All meshes are parented to
 * the returned node (move/scale it), non-pickable, and skip bounding sync.
 * The silhouette lives here so runners and fielders always match.
 */
/** Overall figure size relative to the modeled geometry. The animation code
 *  drives the root at scale 1; this inner rig does the actual shrink so the
 *  figures read as small tabletop minis without touching any of that math. */
const FIGURE_SCALE = 0.85;

export function buildPlayer(scene: Scene, id: string, mats: PlayerMaterials, withGlove = false): TransformNode {
  const root = new TransformNode(`player-${id}`, scene);
  const rig = new TransformNode(`playerRig-${id}`, scene);
  rig.parent = root;
  rig.scaling.setAll(FIGURE_SCALE);
  const parts: Mesh[] = [];

  const shadow = MeshBuilder.CreateCylinder(`pShadow-${id}`, { height: 0.02, diameter: 0.7, tessellation: 16 }, scene);
  shadow.position.y = 0.011;
  shadow.material = mats.shadow;
  parts.push(shadow);

  // The molded stand the figure sits on — the strongest "toy" tell.
  if (mats.base) {
    const stand = MeshBuilder.CreateCylinder(`pBase-${id}`, { height: 0.1, diameterTop: 0.58, diameterBottom: 0.72, tessellation: 20 }, scene);
    stand.position.y = 0.05;
    stand.material = mats.base;
    parts.push(stand);
  }

  const body = MeshBuilder.CreateCylinder(`pBody-${id}`, { height: 0.8, diameterTop: 0.46, diameterBottom: 0.62, tessellation: 14 }, scene);
  body.position.y = 0.42;
  body.material = mats.uniform;
  parts.push(body);

  const shoulders = MeshBuilder.CreateSphere(`pShoulder-${id}`, { diameterX: 0.66, diameterY: 0.36, diameterZ: 0.5, segments: 8 }, scene);
  shoulders.position.y = 0.8;
  shoulders.material = mats.uniform;
  parts.push(shoulders);

  const head = MeshBuilder.CreateSphere(`pHead-${id}`, { diameter: 0.42, segments: 10 }, scene);
  head.position.y = 1.08;
  head.material = mats.skin;
  parts.push(head);

  const cap = MeshBuilder.CreateCylinder(`pCap-${id}`, { height: 0.13, diameter: 0.46, tessellation: 12 }, scene);
  cap.position.y = 1.28;
  cap.material = mats.cap;
  parts.push(cap);

  const bill = MeshBuilder.CreateBox(`pBill-${id}`, { width: 0.3, height: 0.05, depth: 0.22 }, scene);
  bill.position.set(0, 1.23, -0.26); // points home, toward the broadcast camera
  bill.material = mats.cap;
  parts.push(bill);

  if (withGlove && mats.glove) {
    const glove = MeshBuilder.CreateSphere(`pGlove-${id}`, { diameterX: 0.3, diameterY: 0.34, diameterZ: 0.18, segments: 8 }, scene);
    glove.position.set(0.32, 0.52, -0.08);
    glove.material = mats.glove;
    parts.push(glove);
  }

  for (const mesh of parts) {
    mesh.parent = rig;
    mesh.isPickable = false;
    mesh.doNotSyncBoundingInfo = true;
  }
  return root;
}
