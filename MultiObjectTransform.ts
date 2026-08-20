export namespace Quaternions {
    export type Quaternion = {
        w: number;
        x: number;
        y: number;
        z: number;
    };

    export function normalize(q: Quaternion): Quaternion {
        const norm = Math.sqrt(q.w ** 2 + q.x ** 2 + q.y ** 2 + q.z ** 2);

        if (norm == 0) {
            mod.SendErrorReport(mod.Message('The norm of the quaternion is zero.'));
            return { w: 1, x: 0, y: 0, z: 0 };
        }

        return {
            w: q.w / norm,
            x: q.x / norm,
            y: q.y / norm,
            z: q.z / norm,
        };
    }

    export function inverse(q: Quaternion): Quaternion {
        return {
            w: q.w,
            x: -q.x,
            y: -q.y,
            z: -q.z,
        };
    }

    export function product(q1: Quaternion, q2: Quaternion): Quaternion {
        const w = q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z;
        const x = q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y;
        const y = q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x;
        const z = q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w;

        return normalize({ w, x, y, z });
    }

    export function rotateVector(vector: mod.Vector, q: Quaternion): mod.Vector {
        const vecX = mod.XComponentOf(vector);
        const vecY = mod.YComponentOf(vector);
        const vecZ = mod.ZComponentOf(vector);

        const x =
            (q.w ** 2 + q.x ** 2 - q.y ** 2 - q.z ** 2) * vecX +
            2 * (q.x * q.y - q.w * q.z) * vecY +
            2 * (q.x * q.z + q.w * q.y) * vecZ;

        const y =
            2 * (q.x * q.y + q.w * q.z) * vecX +
            (q.w ** 2 - q.x ** 2 + q.y ** 2 - q.z ** 2) * vecY +
            2 * (q.y * q.z - q.w * q.x) * vecZ;

        const z =
            2 * (q.x * q.z - q.w * q.y) * vecX +
            2 * (q.y * q.z + q.w * q.x) * vecY +
            (q.w ** 2 - q.x ** 2 - q.y ** 2 + q.z ** 2) * vecZ;

        return mod.CreateVector(x, y, z);
    }

    export function make(axis: mod.Vector, angle: number): Quaternion {
        if (mod.DotProduct(axis, axis) == 0) {
            mod.SendErrorReport(
                mod.Message('Rotation has been disabled because a zero vector was specified for the rotation axis.')
            );

            return { w: 1, x: 0, y: 0, z: 0 };
        }

        const normalizedAxis = mod.Normalize(axis);
        const axisX = mod.XComponentOf(normalizedAxis);
        const axisY = mod.YComponentOf(normalizedAxis);
        const axisZ = mod.ZComponentOf(normalizedAxis);

        const w = Math.cos(angle / 2);
        const x = axisX * Math.sin(angle / 2);
        const y = axisY * Math.sin(angle / 2);
        const z = axisZ * Math.sin(angle / 2);

        return { w, x, y, z };
    }

    export function toEuler(q: Quaternion): mod.Vector {
        const nQ = normalize(q);

        const x = Math.atan2(2 * (nQ.y * nQ.z + nQ.w * nQ.x), nQ.w ** 2 - nQ.x ** 2 - nQ.y ** 2 + nQ.z ** 2);
        const y = Math.asin(Math.max(-1, Math.min(1, 2 * (nQ.w * nQ.y - nQ.x * nQ.z))));
        const z = Math.atan2(2 * (nQ.x * nQ.y + nQ.w * nQ.z), nQ.w ** 2 + nQ.x ** 2 - nQ.y ** 2 - nQ.z ** 2);

        return mod.CreateVector(x, y, z);
    }

    export function fromEuler(euler: mod.Vector): Quaternion {
        const eulerX = mod.XComponentOf(euler);
        const eulerY = mod.YComponentOf(euler);
        const eulerZ = mod.ZComponentOf(euler);

        const cx = Math.cos(eulerX / 2);
        const cy = Math.cos(eulerY / 2);
        const cz = Math.cos(eulerZ / 2);
        const sx = Math.sin(eulerX / 2);
        const sy = Math.sin(eulerY / 2);
        const sz = Math.sin(eulerZ / 2);

        const w = cx * cy * cz + sx * sy * sz;
        const x = sx * cy * cz - cx * sy * sz;
        const y = cx * sy * cz + sx * cy * sz;
        const z = cx * cy * sz - sx * sy * cz;

        return { w, x, y, z };
    }
}

export class TransformableObject {
    public static createRuntimeObject(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        angle: number, axis: mod.Vector, scale?: number
    ): TransformableObject;
    public static createRuntimeObject(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        angle: number, axis: mod.Vector, offset: mod.Vector, scale?: number
    ): TransformableObject;
    public static createRuntimeObject(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        rotation: mod.Vector, scale?: number
    ): TransformableObject;
    public static createRuntimeObject(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        rotation: mod.Vector, offset: mod.Vector, scale?: number
    ): TransformableObject;
    
    public static createRuntimeObject(
        prefabEnum: TransformableObject.PrefabEnum,
        position: mod.Vector,
        arg1: number | mod.Vector,
        arg2?: number | mod.Vector,
        arg3?: number | mod.Vector,
        arg4?: number,
    ): TransformableObject {
        let rotation: Quaternions.Quaternion;
        let offset: mod.Vector = mod.CreateVector(0, 0, 0);
        let scale: number = 1;
        if (typeof arg1 === "number") {
            rotation = Quaternions.make(arg2 as mod.Vector, arg1);
            if (typeof arg3 === "number") {
                scale = arg3;
            } else if (arg3 !== undefined) {
                offset = arg3;
                if (typeof arg4 === "number") {
                    scale = arg4;
                }
            }
        } else {
            rotation = Quaternions.fromEuler(arg1);
            if (typeof arg2 === "number") {
                scale = arg2;
            } else if (arg2 !== undefined) {
                offset = arg2;
                if (typeof arg3 === "number") {
                    scale = arg3;
                }
            }
        }

        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createRuntimeObject: Scale must be greater than zero.")
            );
            scale = 1;
        }

        return new TransformableObject({ position, offset, rotation, scale, prefabEnum });
    }

    public static createExistingObject(
        object: TransformableObject.Object,
        scale?: number
    ): TransformableObject;
    public static createExistingObject(
        object: TransformableObject.Object,
        offset: mod.Vector,  
        scale?: number
    ): TransformableObject;

    public static createExistingObject(
        object: TransformableObject.Object,
        arg1?: number | mod.Vector,  
        arg2?: number
    ): TransformableObject {
        let offset: mod.Vector = mod.CreateVector(0, 0, 0);
        let scale: number = 1;
        if (typeof arg1 === "number") {
            scale = arg1;
        } else if (arg1 !== undefined) {
            offset = arg1;
            if (typeof arg2 === "number") {
                scale = arg2;
            }
        }

        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createExistingObject: Scale must be greater than zero.")
            );
            scale = 1;
        }

        return new TransformableObject({ object, offset, scale });
    }

    public static createEmptyObject(
        position: mod.Vector,
        angle: number, axis: mod.Vector, scale?: number
    ): TransformableObject;
    public static createEmptyObject(
        position: mod.Vector,
        rotation: mod.Vector, scale?: number
    ): TransformableObject;

    public static createEmptyObject(
        position: mod.Vector,
        arg1: number | mod.Vector,
        arg2?: number | mod.Vector,
        arg3?: number
    ): TransformableObject {
        let rotation: Quaternions.Quaternion;
        let scale: number = 1;
        if (typeof arg1 === "number") {
            rotation = Quaternions.make(arg2 as mod.Vector, arg1);
            if (arg3 !== undefined) {
                scale = arg3;
            }
        } else {
            rotation = Quaternions.fromEuler(arg1);
            if (arg2 !== undefined) {
                scale = arg2 as number;
            }
        }

        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createEmptyObject: Scale must be greater than zero.")
            );
            scale = 1;
        }

        return new TransformableObject({ position, rotation, scale });
    }

    public readonly object?: TransformableObject.Object;
    public readonly id?: number;
    public readonly prefabEnum?: TransformableObject.PrefabEnum;
    public readonly offset: mod.Vector;

    private _pos: mod.Vector;
    private _rotState: Quaternions.Quaternion;
    private _scale: number;

    private _dpos: mod.Vector = mod.CreateVector(0, 0, 0);
    private _dQrot: Quaternions.Quaternion = { w: 1, x: 0, y: 0, z: 0 };
    private _isTransform: boolean = false;

    private _effectivePos: mod.Vector;
    private _effectiveRotState: Quaternions.Quaternion;

    private _parent?: TransformableObject;
    private _children = new Set<TransformableObject>();

    private _deleted: boolean = false;

    public get worldPos(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("worldPos: This object has been deleted.")
            );
            return undefined;
        }

        return this._pos;
    }

    public get localPos(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("localPos: This object has been deleted.")
            );
            return undefined;
        }

        const parent = this._parent;
        if (parent) {
            const localPos = mod.Subtract(this._pos, parent._pos);
            return parent.worldToLocalVector(localPos);
        } else {
            return this._pos;
        }
    }

    public get effectiveWorldPos(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveWorldPos: This object has been deleted.")
            );
            return undefined;
        }

        return this._effectivePos;
    }

    public get effectiveLocalPos(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveLocalPos: This object has been deleted.")
            );
            return undefined;
        }

        const parent = this._parent;
        if (parent) {
            const effectiveLocalPos = mod.Subtract(this._effectivePos, parent._effectivePos);
            return parent.effectiveWorldToLocalVector(effectiveLocalPos);
        } else {
            return this._effectivePos;
        }
    }

    public get worldRot(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("worldRot: This object has been deleted.")
            );
            return undefined;
        }

        return Quaternions.toEuler(this._rotState);
    }

    public get localRot(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("localRot: This object has been deleted.")
            );
            return undefined;
        }

        const parent = this._parent;
        if (parent) {
            const localRot = Quaternions.product(Quaternions.inverse(parent._rotState),this._rotState);
            return Quaternions.toEuler(localRot);
        } else {
            return Quaternions.toEuler(this._rotState);
        }
    }

    public get effectiveWorldRot(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveWorldRot: This object has been deleted.")
            );
            return undefined;
        }

        return Quaternions.toEuler(this._effectiveRotState);
    }

    public get effectiveLocalRot(): mod.Vector | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveLocalRot: This object has been deleted.")
            );
            return undefined;
        }

        const parent = this._parent;
        if (parent) {
            const effectiveLocalRot = Quaternions.product(Quaternions.inverse(parent._effectiveRotState),this._effectiveRotState);
            return Quaternions.toEuler(effectiveLocalRot);
        } else {
            return Quaternions.toEuler(this._effectiveRotState);
        }
    }

    public get worldScale(): number | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("worldScale: This object has been deleted.")
            );
            return undefined;
        }

        return this._scale;
    }

    public get localScale(): number | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("localScale: This object has been deleted.")
            );
            return undefined;
        }

        const parent = this._parent;
        if (parent) {
            return this._scale / parent._scale;
        } else {
            return this._scale;
        }
    }

    public get parent(): TransformableObject | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("parent: This object has been deleted.")
            );
            return undefined;
        }

        return this._parent;
    }

    public get children(): Set<TransformableObject> | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("children: This object has been deleted.")
            );
            return undefined;
        }

        return new Set(this._children);
    }

    public get deleted(): boolean {
        return this._deleted;
    }

    private constructor(properties: TransformableObject.Properties) {
        if ((properties as TransformableObject.RuntimeObjectProperties).prefabEnum !== undefined) {
            const { offset, position, rotation, scale, prefabEnum } = properties as TransformableObject.RuntimeObjectProperties;

            this._pos = position;
            this._rotState = Quaternions.normalize(rotation);
            this._scale = scale;
            this.offset = offset;
            this.prefabEnum = prefabEnum;

            this.object = mod.SpawnObject(
                prefabEnum,
                mod.Add(position, Quaternions.rotateVector(mod.Multiply(offset,scale), this._rotState)),
                Quaternions.toEuler(this._rotState),
                mod.CreateVector(scale, scale, scale)
            );

            this.id = mod.GetObjId(this.object!);
        } else if ((properties as TransformableObject.ExistingObjectProperties).object !== undefined) {
            const { object, offset, scale } = properties as TransformableObject.ExistingObjectProperties;

            this.object = object;
            this.id = mod.GetObjId(object);
            this.offset = offset;
            this._rotState = Quaternions.fromEuler(mod.GetObjectRotation(object));
            this._scale = scale;

            this._pos = mod.Subtract(
                mod.GetObjectPosition(object),
                Quaternions.rotateVector(mod.Multiply(offset,scale), this._rotState)
            );
        } else {
            const { position, rotation, scale } = properties as TransformableObject.EmptyObjectProperties;

            this._pos = position;
            this._rotState = Quaternions.normalize(rotation);
            this._scale = scale;
            this.offset = mod.CreateVector(0, 0, 0);
        }

        this._effectivePos = this._pos;

        this._effectiveRotState = {
            w: this._rotState.w,
            x: this._rotState.x,
            y: this._rotState.y,
            z: this._rotState.z,
        };
    }

    public createRuntimeChild(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        angle: number, axis: mod.Vector, scale?: number
    ): TransformableObject | undefined;
    public createRuntimeChild(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        angle: number, axis: mod.Vector, offset: mod.Vector, scale?: number
    ): TransformableObject | undefined;
    public createRuntimeChild(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        rotation: mod.Vector, scale?: number
    ): TransformableObject | undefined;
    public createRuntimeChild(
        prefabEnum: TransformableObject.PrefabEnum, position: mod.Vector,
        rotation: mod.Vector, offset: mod.Vector, scale?: number
    ): TransformableObject | undefined;

    public createRuntimeChild(
        prefabEnum: TransformableObject.PrefabEnum,
        position: mod.Vector,
        arg1: number | mod.Vector,
        arg2?: number | mod.Vector,
        arg3?: number | mod.Vector,
        arg4?: number,
    ): TransformableObject | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("createRuntimeChild: This object has been deleted.")
            );
            return undefined;
        }

        let rotation: Quaternions.Quaternion;
        let offset: mod.Vector = mod.CreateVector(0, 0, 0);
        let scale: number = 1;
        if (typeof arg1 === "number") {
            rotation = Quaternions.make(arg2 as mod.Vector, arg1);
            if (typeof arg3 === "number") {
                scale = arg3;
            } else if (arg3 !== undefined) {
                offset = arg3;
                if (typeof arg4 === "number") {
                    scale = arg4;
                }
            }
        } else {
            rotation = Quaternions.fromEuler(arg1);
            if (typeof arg2 === "number") {
                scale = arg2;
            } else if (arg2 !== undefined) {
                offset = arg2;
                if (typeof arg3 === "number") {
                    scale = arg3;
                }
            }
        }

        const worldPos = mod.Add(
            this._effectivePos,
            this.effectiveLocalToWorldVector(position)
        );

        const worldRot = Quaternions.product(
            this._effectiveRotState,
            Quaternions.normalize(rotation)
        );

        let worldScale: number;
        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createRuntimeChild: Scale must be greater than zero.")
            );
            worldScale = 1;
        } else {
            worldScale = this._scale * scale;
        }

        const child = new TransformableObject({
            position: worldPos,
            offset,
            rotation: worldRot,
            scale: worldScale,
            prefabEnum,
        });

        child._parent = this;
        this._children.add(child);

        return child;
    }

    public createExistingChild(
        object: TransformableObject.Object,
        scale?: number
    ): TransformableObject | undefined;
    public createExistingChild(
        object: TransformableObject.Object,
        offset: mod.Vector,  
        scale?: number
    ): TransformableObject | undefined;

    public createExistingChild(
        object: TransformableObject.Object,
        arg1?: number | mod.Vector,  
        arg2?: number
    ): TransformableObject | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("createExistingChild: This object has been deleted.")
            );
            return undefined;
        }

        let offset: mod.Vector = mod.CreateVector(0, 0, 0);
        let scale: number = 1;
        if (typeof arg1 === "number") {
            scale = arg1;
        } else if (arg1 !== undefined) {
            offset = arg1;
            if (typeof arg2 === "number") {
                scale = arg2;
            }
        }

        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createExistingChild: Scale must be greater than zero.")
            );
            scale = 1;
        }

        const child = new TransformableObject({ object, offset, scale });

        child._parent = this;
        this._children.add(child);

        return child;
    }

    public createEmptyChild(
        position: mod.Vector,
        angle: number, axis: mod.Vector, scale?: number
    ): TransformableObject | undefined;
    public createEmptyChild(
        position: mod.Vector,
        rotation: mod.Vector, scale?: number
    ): TransformableObject | undefined;

    public createEmptyChild(
        position: mod.Vector,
        arg1: number | mod.Vector,
        arg2?: number | mod.Vector,
        arg3?: number
    ): TransformableObject | undefined {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("createEmptyChild: This object has been deleted.")
            );
            return undefined;
        }

        let rotation: Quaternions.Quaternion;
        let scale: number = 1;
        if (typeof arg1 === "number") {
            rotation = Quaternions.make(arg2 as mod.Vector, arg1);
            if (arg3 !== undefined) {
                scale = arg3;
            }
        } else {
            rotation = Quaternions.fromEuler(arg1);
            if (arg2 !== undefined) {
                scale = arg2 as number;
            }
        }

        const worldPos = mod.Add(
            this._effectivePos,
            this.effectiveLocalToWorldVector(position)
        );

        const worldRot = Quaternions.product(
            this._effectiveRotState,
            Quaternions.normalize(rotation)
        );

        let worldScale: number;
        if (scale <= 0) {
            mod.SendErrorReport(
                mod.Message("createEmptyChild: Scale must be greater than zero.")
            );
            worldScale = 1;
        } else {
            worldScale = this._scale * scale;
        }

        const child = new TransformableObject({
            position: worldPos,
            rotation: worldRot,
            scale: worldScale,
        });

        child._parent = this;
        this._children.add(child);

        return child;
    }

    public attachAsChild(newParent: TransformableObject): void {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("attachAsChild: This object has been deleted.")
            );
            return;
        }
        if (newParent._deleted) {
            mod.SendErrorReport(
                mod.Message("attachAsChild: The specified parent has been deleted.")
            );
            return;
        }
        if (newParent === this) {
            mod.SendErrorReport(
                mod.Message(
                    "attachAsChild: An object cannot be its own parent."
                )
            );
            return;
        }

        let ancestor: TransformableObject | undefined = newParent;
        while (ancestor) {
            if (ancestor === this) {
                mod.SendErrorReport(
                    mod.Message("attachAsChild: Circular parent-child relationships are not allowed.")
                );
                return;
            }
            ancestor = ancestor._parent;
        }

        if (this._parent === newParent) return;

        this.detachFromParent();
        this._parent = newParent;
        newParent._children.add(this);
    }

    public detachFromParent(): void {
        const parent = this._parent;

        if (!parent) return;

        parent._children.delete(this);
        this._parent = undefined;
    }

    public remove(): void {
        if (this._deleted) return;

        this._deleted = true;

        const children = [...this._children];

        for (const child of children) {
            child.remove();
        }

        this._children.clear();
        this.detachFromParent();

        if (
            this.prefabEnum !== undefined &&
            this.object !== undefined
        ) {
            mod.UnspawnObject(this.object);
        }
    }

    public move(dpos: mod.Vector): void {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("move: Deleted objects cannot be transformed.")
            );
            return;
        }

        const moveDpos = this._parent ? this._parent.effectiveLocalToWorldVector(dpos) : dpos;

        this._dpos = mod.Add(this._dpos, moveDpos);

        this._updateEffective();
        this._isTransform = true;

        const localDpos = this.effectiveWorldToLocalVector(moveDpos);

        this._children.forEach((obj) => obj.move(localDpos));
    }

    public rotate(angle: number, axis: mod.Vector, rotCenter: mod.Vector = this._effectivePos): void {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("rotate: Deleted objects cannot be transformed.")
            );
            return;
        }

        const rotAxis = this._parent ? this._parent.effectiveLocalToWorldVector(axis) : axis;

        const dQ = Quaternions.make(rotAxis, angle);

        this._dQrot = Quaternions.product(dQ, this._dQrot);

        const distanceCenter = mod.Subtract(this._effectivePos, rotCenter);

        const dpos = mod.Subtract(Quaternions.rotateVector(distanceCenter, dQ), distanceCenter);

        this._dpos = mod.Add(this._dpos, dpos);

        this._updateEffective();
        this._isTransform = true;

        const localRotAxis = this.effectiveWorldToLocalVector(rotAxis);

        this._children.forEach((obj) => obj.rotate(angle, localRotAxis, rotCenter));
    }

    public applyTransform(): void {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("applyTransform: Deleted objects cannot be transformed.")
            );
            return;
        }

        if (this._isTransform) {
            const centerPos = mod.Add(this._pos, this._dpos);
            const fq = Quaternions.product(this._dQrot, this._rotState);

            if (this.object) {
                const newOffset = Quaternions.rotateVector(mod.Multiply(this.offset,this._scale), fq);
                const pos = mod.Add(centerPos, newOffset);
                const rot = Quaternions.toEuler(fq);
                const transform = mod.CreateTransform(pos, rot);

                mod.SetObjectTransform(this.object, transform);
            }

            this._pos = centerPos;
            this._rotState = fq;

            this._dpos = mod.CreateVector(0, 0, 0);
            this._dQrot = { w: 1, x: 0, y: 0, z: 0 };
            this._updateEffective();
            this._isTransform = false;
        }

        this._children.forEach((obj) => obj.applyTransform());
    }

    public localToWorldVector(vector: mod.Vector): mod.Vector {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("localToWorldVector: This object has been deleted.")
            );
            return mod.CreateVector(0, 0, 0);
        }

        return Quaternions.rotateVector(mod.Multiply(vector, this._scale), this._rotState);
    }

    public worldToLocalVector(vector: mod.Vector): mod.Vector {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("worldToLocalVector: This object has been deleted.")
            );
            return mod.CreateVector(0, 0, 0);
        }
        
        return mod.Divide(Quaternions.rotateVector(vector, Quaternions.inverse(this._rotState)), this._scale);
    }

    public effectiveLocalToWorldVector(vector: mod.Vector): mod.Vector {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveLocalToWorldVector: This object has been deleted.")
            );
            return mod.CreateVector(0, 0, 0);
        }

        return Quaternions.rotateVector(mod.Multiply(vector, this._scale), this._effectiveRotState);
    }

    public effectiveWorldToLocalVector(vector: mod.Vector): mod.Vector {
        if (this._deleted) {
            mod.SendErrorReport(
                mod.Message("effectiveWorldToLocalVector: This object has been deleted.")
            );
            return mod.CreateVector(0, 0, 0);
        }

        return mod.Divide(Quaternions.rotateVector(vector, Quaternions.inverse(this._effectiveRotState)), this._scale);
    }

    private _updateEffective(): void {
        this._effectivePos = mod.Add(this._pos, this._dpos);
        this._effectiveRotState = Quaternions.product(this._dQrot, this._rotState);
    }
}

export namespace TransformableObject {
    export type Object =
        | mod.Bomb
        | mod.EmplacementSpawner
        | mod.FixedCamera
        | mod.InteractPoint
        | mod.LootSpawner
        | mod.MCOM
        | mod.SFX
        | mod.SpatialObject
        | mod.Spawner
        | mod.VehicleSpawner
        | mod.VL7Cloud
        | mod.VO
        | mod.WorldIcon;

    export type PrefabEnum =
        | mod.RuntimeSpawn_Common
        | mod.RuntimeSpawn_Abbasid
        | mod.RuntimeSpawn_Aftermath
        | mod.RuntimeSpawn_Badlands
        | mod.RuntimeSpawn_Battery
        | mod.RuntimeSpawn_Capstone
        | mod.RuntimeSpawn_Contaminated
        | mod.RuntimeSpawn_Dumbo
        | mod.RuntimeSpawn_Eastwood
        | mod.RuntimeSpawn_FireStorm
        | mod.RuntimeSpawn_Limestone
        | mod.RuntimeSpawn_Outskirts
        | mod.RuntimeSpawn_Subsurface
        | mod.RuntimeSpawn_Tungsten
        | mod.RuntimeSpawn_Granite_Downtown
        | mod.RuntimeSpawn_Granite_Marina
        | mod.RuntimeSpawn_Granite_MilitaryRnD
        | mod.RuntimeSpawn_Granite_MilitaryStorage
        | mod.RuntimeSpawn_Granite_ResidentialNorth
        | mod.RuntimeSpawn_Granite_TechCenter
        | mod.RuntimeSpawn_Granite_Underground
        | mod.RuntimeSpawn_Sand
        | mod.RuntimeSpawn_GolmudRailway
        | mod.RuntimeSpawn_Plaza
        | mod.RuntimeSpawn_Isolated;

    export type RuntimeObjectProperties = {
        position: mod.Vector;
        offset: mod.Vector;
        rotation: Quaternions.Quaternion;
        scale: number;
        prefabEnum: PrefabEnum;
    };

    export type ExistingObjectProperties = {
        object: TransformableObject.Object;
        offset: mod.Vector;
        scale: number;
    };

    export type EmptyObjectProperties = {
        position: mod.Vector;
        rotation: Quaternions.Quaternion;
        scale: number;
    };

    export type Properties = RuntimeObjectProperties | ExistingObjectProperties | EmptyObjectProperties;
}
