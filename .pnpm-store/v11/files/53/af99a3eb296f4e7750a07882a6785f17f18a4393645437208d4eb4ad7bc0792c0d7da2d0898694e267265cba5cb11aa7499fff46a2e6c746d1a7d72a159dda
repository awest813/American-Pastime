import { type SoloNavMeshGeneratorConfig, type TileCacheGeneratorConfig, type TiledNavMeshGeneratorConfig } from "@recast-navigation/generators";
import { type CrowdAgentParams } from "@recast-navigation/core";
import { type IAgentParametersV2, type INavMeshParametersV2 } from "../types.js";
export declare const DefaultMaxObstacles = 128;
/**
 * Creates a SoloNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the SoloNavMesh generation.
 * @returns A configuration object for generating a SoloNavMesh.
 * @see https://docs.recast-navigation-js.isaacmason.com/types/index.RecastConfig.html
 */
export declare function CreateSoloNavMeshConfig(parameters: INavMeshParametersV2): Partial<SoloNavMeshGeneratorConfig>;
/**
 * Creates a TiledNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the TiledNavMesh generation.
 * @returns A configuration object for generating a TiledNavMesh.
 */
export declare function CreateTiledNavMeshConfig(parameters: INavMeshParametersV2): Partial<TiledNavMeshGeneratorConfig>;
/**
 * Creates a TileCacheNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the TileCacheNavMesh generation.
 * @returns A configuration object for generating a TileCacheNavMesh.
 */
export declare function CreateTileCacheNavMeshConfig(parameters: INavMeshParametersV2): Partial<TileCacheGeneratorConfig>;
/**
 * Convert INavMeshParametersV2 to SoloNavMeshGeneratorConfig by filtering out undefined values.
 * @param config NavMesh parameters
 * @returns Recast solo nav mesh generator config
 */
export declare function ToSoloNavMeshGeneratorConfig(config: INavMeshParametersV2): Partial<SoloNavMeshGeneratorConfig>;
/**
 * Convert IAgentParametersV2 to Recast CrowdAgentParams by filtering out undefined values.
 * @param agentParams Agent parameters
 * @returns Recast crowd agent parameters
 */
export declare function ToCrowdAgentParams(agentParams: IAgentParametersV2): Partial<CrowdAgentParams>;
