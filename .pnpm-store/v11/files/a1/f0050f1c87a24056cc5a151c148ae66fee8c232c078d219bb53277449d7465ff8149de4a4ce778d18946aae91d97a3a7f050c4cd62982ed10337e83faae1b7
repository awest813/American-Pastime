/** This file must only contain pure code and pure imports */
import { __decorate } from "../../../tslib.es6.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { NodeParticleBlock } from "../nodeParticleBlock.js";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
/**
 * Operations supported by the FloatToInt block
 */
export var ParticleFloatToIntBlockOperations;
(function (ParticleFloatToIntBlockOperations) {
    /** Round */
    ParticleFloatToIntBlockOperations[ParticleFloatToIntBlockOperations["Round"] = 0] = "Round";
    /** Ceil */
    ParticleFloatToIntBlockOperations[ParticleFloatToIntBlockOperations["Ceil"] = 1] = "Ceil";
    /** Floor */
    ParticleFloatToIntBlockOperations[ParticleFloatToIntBlockOperations["Floor"] = 2] = "Floor";
    /** Truncate */
    ParticleFloatToIntBlockOperations[ParticleFloatToIntBlockOperations["Truncate"] = 3] = "Truncate";
})(ParticleFloatToIntBlockOperations || (ParticleFloatToIntBlockOperations = {}));
/**
 * Block used to transform a float to an int
 */
export class ParticleFloatToIntBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleFloatToIntBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets the operation applied by the block
         */
        this.operation = ParticleFloatToIntBlockOperations.Round;
        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Int);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeParticleBlockConnectionPointTypes.Float | NodeParticleBlockConnectionPointTypes.Int);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ParticleFloatToIntBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _build(state) {
        super._build(state);
        let func = null;
        const input = this.input;
        switch (this.operation) {
            case ParticleFloatToIntBlockOperations.Round: {
                func = (state) => {
                    return Math.round(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Ceil: {
                func = (state) => {
                    return Math.ceil(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Floor: {
                func = (state) => {
                    return Math.floor(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Truncate: {
                func = (state) => {
                    return Math.trunc(input.getConnectedValue(state));
                };
                break;
            }
        }
        if (!func) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        this.output._storedFunction = (state) => {
            return func(state);
        };
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.operation = this.operation;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.operation = serializationObject.operation;
    }
}
__decorate([
    editableInPropertyPage("Operation", 5 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Round", value: ParticleFloatToIntBlockOperations.Round },
            { label: "Ceil", value: ParticleFloatToIntBlockOperations.Ceil },
            { label: "Floor", value: ParticleFloatToIntBlockOperations.Floor },
            { label: "Truncate", value: ParticleFloatToIntBlockOperations.Truncate },
        ],
    })
], ParticleFloatToIntBlock.prototype, "operation", void 0);
let _Registered = false;
/**
 * Register side effects for particleFloatToIntBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterParticleFloatToIntBlock() {
    if (_Registered) {
        return;
    }
    _Registered = true;
    RegisterClass("BABYLON.ParticleFloatToIntBlock", ParticleFloatToIntBlock);
}
//# sourceMappingURL=particleFloatToIntBlock.pure.js.map