import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Effects } from "./Effects";

/**
 * Cosmetic Havok juice: on a big play a baseball launches off home plate
 * into the stands. Purely visual — scoring never depends on where it lands.
 */
export class BaseballToken {
  private static groundAggregate: PhysicsAggregate | null = null;

  /** Live physics balls; the engine only steps while this is non-zero. */
  private static liveBalls = 0;

  static launch(scene: Scene, big: boolean, effects?: Effects): void {
    const physics = scene.getPhysicsEngine();
    const ball = MeshBuilder.CreateSphere("baseball", { diameter: 0.36, segments: 12 }, scene);
    ball.isPickable = false;
    ball.position = new Vector3(0, 0.5, -1.2); // home plate area
    const mat = new StandardMaterial("baseballMat", scene);
    mat.diffuseColor = new Color3(0.95, 0.93, 0.88);
    mat.emissiveColor = new Color3(0.35, 0.34, 0.32);
    ball.material = mat;

    if (big) {
      effects?.ballTrail(ball, 2600);
    }

    if (physics) {
      // Wake the (otherwise idle) physics engine only while a ball is in the air
      scene.physicsEnabled = true;
      BaseballToken.liveBalls++;
      if (!BaseballToken.groundAggregate) {
        const ground = scene.getMeshByName("diamondTable");
        if (ground) {
          BaseballToken.groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);
        }
      }
      const aggregate = new PhysicsAggregate(ball, PhysicsShapeType.SPHERE, { mass: 0.15, restitution: 0.55 }, scene);
      const spread = (Math.random() - 0.5) * 1.6;
      const power = big ? 3.4 : 2.2;
      aggregate.body.applyImpulse(new Vector3(spread, power, power * 1.4), ball.getAbsolutePosition());
      setTimeout(() => {
        aggregate.dispose();
        ball.material?.dispose();
        ball.dispose();
        if (--BaseballToken.liveBalls <= 0) {
          BaseballToken.liveBalls = 0;
          scene.physicsEnabled = false; // back to sleep until the next launch
        }
      }, 3200);
    } else {
      // No physics engine (e.g. it failed to load): simple arc fallback.
      const start = performance.now();
      const observer = scene.onBeforeRenderObservable.add(() => {
        const t = (performance.now() - start) / 1600;
        if (t >= 1) {
          scene.onBeforeRenderObservable.remove(observer);
          ball.material?.dispose();
          ball.dispose();
          return;
        }
        ball.position.z = -1.2 + t * 12;
        ball.position.y = 0.5 + Math.sin(t * Math.PI) * 4;
      });
    }
  }
}
