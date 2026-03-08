class RuntimeObject {
    readonly object: mod.Object | undefined;
    readonly id: number | undefined;
    readonly prefabEnum: mod.RuntimeSpawn_Common 
                       | mod.RuntimeSpawn_Granite_ResidentialNorth 
                       | mod.RuntimeSpawn_Abbasid 
                       | mod.RuntimeSpawn_Aftermath 
                       | mod.RuntimeSpawn_Badlands 
                       | mod.RuntimeSpawn_Battery 
                       | mod.RuntimeSpawn_Capstone 
                       | mod.RuntimeSpawn_Dumbo
                       | mod.RuntimeSpawn_Eastwood
                       | mod.RuntimeSpawn_FireStorm
                       | mod.RuntimeSpawn_Limestone
                       | mod.RuntimeSpawn_Outskirts
                       | mod.RuntimeSpawn_Tungsten
                       | mod.RuntimeSpawn_Granite_Downtown
                       | mod.RuntimeSpawn_Granite_Marina
                       | mod.RuntimeSpawn_Granite_MilitaryRnD
                       | mod.RuntimeSpawn_Granite_MilitaryStorage
                       | mod.RuntimeSpawn_Granite_TechCenter
                       | mod.RuntimeSpawn_Sand
                       | undefined;
    readonly offset: mod.Vector;

    private _pos: mod.Vector;
    private _rotState: [number,number,number,number];

    private _dpos: mod.Vector = mod.CreateVector(0,0,0);
    private _dQrot: [number,number,number,number] = [1,0,0,0];
    private _isTransform: boolean = false;

    private _effPos: mod.Vector;
    private _effRotState: [number,number,number,number];

    private _parent: RuntimeObject | undefined;
    private _children = new Set<RuntimeObject>();

    //getter
    get worldPos(): mod.Vector {
        return this._pos;
    }

    get localPos(): mod.Vector {
        if (this.parent) {
            const localPos = mod.Subtract(this._pos,this.parent._pos);
            return this.parent.WorldToLocalVector(localPos);
        } else {
            return this._pos;
        }
    }

    get effWorldPos(): mod.Vector {
        return this._effPos;
    }

    get effLocalPos(): mod.Vector {
        if (this.parent) {
            const effLocalPos = mod.Subtract(this._effPos,this.parent._effPos);
            return this.parent.EffWorldToLocalVector(effLocalPos);
        } else {
            return this._effPos;
        }
    }

    get parent(): RuntimeObject | undefined {
        return this._parent;
    }

    get children(): Set<RuntimeObject> {
        return new Set(this._children);
    }

    //constructor
    constructor(prefabEnum: mod.RuntimeSpawn_Common 
                          | mod.RuntimeSpawn_Granite_ResidentialNorth 
                          | mod.RuntimeSpawn_Abbasid 
                          | mod.RuntimeSpawn_Aftermath 
                          | mod.RuntimeSpawn_Badlands 
                          | mod.RuntimeSpawn_Battery 
                          | mod.RuntimeSpawn_Capstone 
                          | mod.RuntimeSpawn_Dumbo
                          | mod.RuntimeSpawn_Eastwood
                          | mod.RuntimeSpawn_FireStorm
                          | mod.RuntimeSpawn_Limestone
                          | mod.RuntimeSpawn_Outskirts
                          | mod.RuntimeSpawn_Tungsten
                          | mod.RuntimeSpawn_Granite_Downtown
                          | mod.RuntimeSpawn_Granite_Marina
                          | mod.RuntimeSpawn_Granite_MilitaryRnD
                          | mod.RuntimeSpawn_Granite_MilitaryStorage
                          | mod.RuntimeSpawn_Granite_TechCenter
                          | mod.RuntimeSpawn_Sand
                          | undefined, 
                pos: mod.Vector,
                offset: mod.Vector, 
                axis: mod.Vector,
                angle: number,
                scale: mod.Vector = mod.CreateVector(1,1,1)) {
        this.prefabEnum = prefabEnum;
        this._pos = pos;
        this.offset = offset;
        this._rotState = RuntimeObject.#MakeRotQ(axis,angle);
        if (prefabEnum) {
            this.object = mod.SpawnObject(prefabEnum, mod.Add(pos,RuntimeObject.#QRotateVector(this.offset, this._rotState)), RuntimeObject.#QtoEuler(this._rotState), scale);
            if (this.object) this.id = mod.GetObjId(this.object);
        } else { //Empty Object.
            this.object = undefined;
            this.id = undefined;
        }

        this._effPos = pos;
        this._effRotState = [...this._rotState] as [number,number,number,number];
    }

    //class method
    Move(dpos: mod.Vector) {
        let moveDpos = dpos;
        if (this._parent) moveDpos = this._parent.EffLocalToWorldVector(dpos);
        this._dpos = mod.Add(this._dpos,moveDpos);

        this._UppdateEff();
        this._isTransform = true;

        const worldDpos = this.EffWorldToLocalVector(moveDpos);
        this._children.forEach(obj => obj.Move(worldDpos));
    }

    QRotation(axis: mod.Vector, angle: number, rotCenter: mod.Vector = this._effPos) {
        let rotAxis = axis;
        if (this._parent) rotAxis = this._parent.EffLocalToWorldVector(axis);
        const [dqw,dqx,dqy,dqz] = RuntimeObject.#MakeRotQ(rotAxis,angle);
        this._dQrot = RuntimeObject.#QProduct([dqw,dqx,dqy,dqz],this._dQrot);

        const distanceCenter = mod.Subtract(this._effPos,rotCenter);
        const dpos = mod.Subtract(RuntimeObject.#QRotateVector(distanceCenter,[dqw,dqx,dqy,dqz]),distanceCenter);
        this._dpos = mod.Add(this._dpos,dpos);

        this._UppdateEff();
        this._isTransform = true;

        const worldRotAxis = this.EffWorldToLocalVector(rotAxis);
        this._children.forEach(obj => obj.QRotation(worldRotAxis,angle,rotCenter));
    }

    ApplyTransform () {
        if (this._isTransform) {
            const centerPos = mod.Add(this._pos,this._dpos);
            const [fqw,fqx,fqy,fqz] = RuntimeObject.#QProduct(this._dQrot,this._rotState);

            if (this.object) {
                const newoffset = RuntimeObject.#QRotateVector(this.offset,[fqw,fqx,fqy,fqz]);

                const pos = mod.Add(centerPos,newoffset);
                const rot = RuntimeObject.#QtoEuler([fqw,fqx,fqy,fqz]);

                const transform = mod.CreateTransform(pos,rot);
                mod.SetObjectTransform(this.object,transform);
            }
            this._pos = centerPos;
            this._rotState = [fqw,fqx,fqy,fqz];

            this._dpos = mod.CreateVector(0,0,0);
            this._dQrot = [1,0,0,0];
            this._UppdateEff();
            this._isTransform = false;
        }
        this._children.forEach(obj => obj.ApplyTransform());
    }

    NewChild(prefabEnum: mod.RuntimeSpawn_Common 
                       | mod.RuntimeSpawn_Granite_ResidentialNorth 
                       | mod.RuntimeSpawn_Abbasid 
                       | mod.RuntimeSpawn_Aftermath 
                       | mod.RuntimeSpawn_Badlands 
                       | mod.RuntimeSpawn_Battery 
                       | mod.RuntimeSpawn_Capstone 
                       | mod.RuntimeSpawn_Dumbo
                       | mod.RuntimeSpawn_Eastwood
                       | mod.RuntimeSpawn_FireStorm
                       | mod.RuntimeSpawn_Limestone
                       | mod.RuntimeSpawn_Outskirts
                       | mod.RuntimeSpawn_Tungsten
                       | mod.RuntimeSpawn_Granite_Downtown
                       | mod.RuntimeSpawn_Granite_Marina
                       | mod.RuntimeSpawn_Granite_MilitaryRnD
                       | mod.RuntimeSpawn_Granite_MilitaryStorage
                       | mod.RuntimeSpawn_Granite_TechCenter
                       | mod.RuntimeSpawn_Sand
                       | undefined, 
             pos: mod.Vector,
             offset: mod.Vector, 
             axis: mod.Vector,
             angle: number,
             scale: mod.Vector = mod.CreateVector(1,1,1)): RuntimeObject {
        const parentPos = this._effPos;
        const parentRotState = this._effRotState;
        const child = new RuntimeObject(prefabEnum,
                                        mod.Add(parentPos,this.EffLocalToWorldVector(pos)),
                                        offset,
                                        mod.CreateVector(0,1,0),
                                        0,
                                        scale);
        child._parent = this;
        this._children.add(child);
        child._dQrot = RuntimeObject.#QProduct(RuntimeObject.#MakeRotQ(this.EffLocalToWorldVector(axis),angle),parentRotState);
        child._UppdateEff();
        child._isTransform = true;
        child.ApplyTransform();

        return child;
    }

    Remove() {
        const children = [...this._children];
        for (const child of children) child.Remove();

        if (this.object) mod.UnspawnObject(this.object);
        if (this._parent) this._parent._children.delete(this);
        
        this._children.clear();
        this._parent = undefined;
    }

    LocalToWorldVector(vector: mod.Vector): mod.Vector {
        const worldVector = RuntimeObject.#QRotateVector(vector,this._rotState);
        return worldVector
    }

    WorldToLocalVector(vector: mod.Vector): mod.Vector {
        const localVector = RuntimeObject.#QRotateVector(vector,RuntimeObject.#InverseQ(this._rotState));
        return localVector
    }

    EffLocalToWorldVector(vector: mod.Vector): mod.Vector {
        const effWorldVector = RuntimeObject.#QRotateVector(vector,this._effRotState);
        return effWorldVector
    }

    EffWorldToLocalVector(vector: mod.Vector): mod.Vector {
        const effLocalVector = RuntimeObject.#QRotateVector(vector,RuntimeObject.#InverseQ(this._effRotState));
        return effLocalVector
    }

    //In-class functions
    private _UppdateEff () {
        this._effPos = mod.Add(this._pos, this._dpos);
        this._effRotState = RuntimeObject.#QProduct(this._dQrot, this._rotState);
    }

    static #QNormalize (q: readonly [number,number,number,number]): [number,number,number,number] {
        let [qw,qx,qy,qz] = q;
        
        const qnorm = Math.sqrt(qw**2 + qx**2 + qy**2 + qz**2);
        if (qnorm==0) {
            mod.SendErrorReport(mod.Message("The norm of the quaternion is zero."));
            return [1,0,0,0];
        }

        qw /= qnorm;
        qx /= qnorm;
        qy /= qnorm;
        qz /= qnorm;
        return [qw,qx,qy,qz];
    }

    static #InverseQ (q: readonly [number,number,number,number]): [number,number,number,number] {
        const [qw,qx,qy,qz] = q;
        return [qw,-qx,-qy,-qz];
    }

    static #QProduct (q1: readonly [number,number,number,number], q2: readonly [number,number,number,number]): [number,number,number,number] {
        const [qw1,qx1,qy1,qz1] = q1;
        const [qw2,qx2,qy2,qz2] = q2;

        let qw = qw1*qw2 - qx1*qx2 - qy1*qy2 - qz1*qz2;
        let qx = qw1*qx2 + qx1*qw2 + qy1*qz2 - qz1*qy2;
        let qy = qw1*qy2 - qx1*qz2 + qy1*qw2 + qz1*qx2;
        let qz = qw1*qz2 + qx1*qy2 - qy1*qx2 + qz1*qw2;

        [qw,qx,qy,qz] = RuntimeObject.#QNormalize([qw,qx,qy,qz]);
        
        return [qw,qx,qy,qz];
    }

    static #QRotateVector (vector: mod.Vector, q: readonly [number,number,number,number]): mod.Vector {
        const [qw,qx,qy,qz] = q;

        const vecX = mod.XComponentOf(vector);
        const vecY = mod.YComponentOf(vector);
        const vecZ = mod.ZComponentOf(vector);

        const fvecX = (qw**2 + qx**2 - qy**2 - qz**2)*vecX + 2*(qx*qy - qw*qz)*vecY + 2*(qx*qz + qw*qy)*vecZ;
        const fvecY = 2*(qx*qy + qw*qz)*vecX + (qw**2 - qx**2 + qy**2 - qz**2)*vecY + 2*(qy*qz - qw*qx)*vecZ;
        const fvecZ = 2*(qx*qz - qw*qy)*vecX + 2*(qy*qz + qw*qx)*vecY + (qw**2 - qx**2 - qy**2 + qz**2)*vecZ;

        const newVector = mod.CreateVector(fvecX,fvecY,fvecZ);

        return newVector;
    }

    static #MakeRotQ (axis: mod.Vector, angle: number): [number,number,number,number] {
        if (mod.DotProduct(axis,axis)==0) {
            mod.SendErrorReport(mod.Message("Rotation has been disabled because a zero vector was specified for the rotation axis."));
            return [1,0,0,0];
        }
        const naxis = mod.Normalize(axis);
        const axisX = mod.XComponentOf(naxis);
        const axisY = mod.YComponentOf(naxis);
        const axisZ = mod.ZComponentOf(naxis);

        const qw = Math.cos(angle/2);
        const qx = axisX * Math.sin(angle/2);
        const qy = axisY * Math.sin(angle/2);
        const qz = axisZ * Math.sin(angle/2);

        return [qw,qx,qy,qz];
    }

    static #QtoEuler (q: readonly [number,number,number,number]): mod.Vector {
        const [qw,qx,qy,qz] = RuntimeObject.#QNormalize(q);

        const eularX = Math.atan2(2*(qy*qz + qw*qx), qw**2 - qx**2 - qy**2 + qz**2);
        const eularY = Math.asin(Math.max(-1, Math.min(1, 2 * (qw*qy - qx*qz))));
        const eularZ = Math.atan2(2*(qx*qy + qw*qz), qw**2 + qx**2 - qy**2 - qz**2);
        const euler = mod.CreateVector(eularX,eularY,eularZ);
        return euler;
    }
}
