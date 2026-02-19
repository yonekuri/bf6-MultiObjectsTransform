class RuntimeObject {
    object: mod.Object;
    id: number;
    Enum: mod.RuntimeSpawn_Common 
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
        | mod.RuntimeSpawn_Sand;
    offset: mod.Vector;

    center: mod.Vector;
    rotState: [number,number,number,number];

    dpos: mod.Vector;
    dQrot: [number,number,number,number];
    isTransform: boolean;

    //In-class functions
    static #QNormalize(q: readonly [number,number,number,number]): [number,number,number,number] {
        let [qw,qx,qy,qz] = q;
        
        const qnorm = Math.sqrt(qw**2 + qx**2 + qy**2 + qz**2);
        if (qnorm==0) mod.SendErrorReport(mod.Message("The norm of the quaternion is zero."));

        qw /= qnorm;
        qx /= qnorm;
        qy /= qnorm;
        qz /= qnorm;
        return [qw,qx,qy,qz];
    }

    static #QProduct(q1: readonly [number,number,number,number], q2: readonly [number,number,number,number]): [number,number,number,number] {
        const [qw1,qx1,qy1,qz1] = q1;
        const [qw2,qx2,qy2,qz2] = q2;

        let qw = qw1*qw2 - qx1*qx2 - qy1*qy2 - qz1*qz2;
        let qx = qw1*qx2 + qx1*qw2 + qy1*qz2 - qz1*qy2;
        let qy = qw1*qy2 - qx1*qz2 + qy1*qw2 + qz1*qx2;
        let qz = qw1*qz2 + qx1*qy2 - qy1*qx2 + qz1*qw2;

        [qw,qx,qy,qz] = RuntimeObject.#QNormalize([qw,qx,qy,qz])
        
        return [qw,qx,qy,qz];
    }

    static #QRotateVector(vector: mod.Vector, q: readonly [number,number,number,number]): mod.Vector {
        const [qw,qx,qy,qz] = q;

        const vecX = mod.XComponentOf(vector);
        const vecY = mod.YComponentOf(vector);
        const vecZ = mod.ZComponentOf(vector);

        const fvecX = (1 - 2*(qy**2 + qz**2))*vecX + 2*(qx*qy - qw*qz)*vecY + 2*(qx*qz + qw*qy)*vecZ;
        const fvecY = 2*(qx*qy + qw*qz)*vecX + (1 - 2*(qx**2 + qz**2))*vecY + 2*(qy*qz - qw*qx)*vecZ;
        const fvecZ = 2*(qx*qz - qw*qy)*vecX + 2*(qy*qz + qw*qx)*vecY + (1 - 2*(qx**2 + qy**2))*vecZ;

        const newVector = mod.CreateVector(fvecX,fvecY,fvecZ);

        return newVector;
    }

    static #MakeRotQ(axis: mod.Vector, angle: number): [number,number,number,number] {
        if (mod.DotProduct(axis,axis)==0) {
            mod.SendErrorReport(mod.Message("Rotation has been disabled because a zero vector was specified for the rotation axis."));
            return [1,0,0,0];
        }
        const naxis = mod.Normalize(axis)
        const axisX = mod.XComponentOf(naxis);
        const axisY = mod.YComponentOf(naxis);
        const axisZ = mod.ZComponentOf(naxis);

        const qw = Math.cos(angle/2);
        const qx = axisX * Math.sin(angle/2);
        const qy = axisY * Math.sin(angle/2);
        const qz = axisZ * Math.sin(angle/2);

        return [qw,qx,qy,qz];
    }

    static #QtoEuler(q: readonly [number,number,number,number]): mod.Vector {
        const [qw,qx,qy,qz] = q;

        const eularX = Math.atan2(2*(qw*qx + qy*qz),1-2*(qx**2 + qy**2));
        const eularY = Math.asin(Math.max(-1,Math.min(1,2*(qw*qy - qz*qx))));
        const eularZ = Math.atan2(2*(qw*qz + qx*qy),1-2*(qy**2 + qz**2));
        const euler = mod.CreateVector(eularX,eularY,eularZ);
        return euler;
    }

    //constructor
    constructor(Enum: mod.RuntimeSpawn_Common 
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
                    | mod.RuntimeSpawn_Sand, 
                center: mod.Vector,
                offset: mod.Vector, 
                axis: mod.Vector,
                angle: number,
                scale: mod.Vector) {
        this.Enum = Enum;
        this.center = center;
        this.rotState = RuntimeObject.#MakeRotQ(axis,angle);

        this.object = mod.SpawnObject(Enum, mod.Add(center,RuntimeObject.#QRotateVector(offset,this.rotState)), RuntimeObject.#QtoEuler(this.rotState), scale);
        this.id = mod.GetObjId(this.object);
        this.offset = offset;

        this.dpos = mod.CreateVector(0,0,0);
        this.dQrot = [1,0,0,0];
        this.isTransform = false;
    }

    //class method
    remove() {
        mod.UnspawnObject(this.object);
    }

    Move(delta: mod.Vector) {
        const dpos = delta;
        this.dpos = mod.Add(this.dpos,dpos);
        this.isTransform = true;
    }

    QRotation(axis: mod.Vector, angle: number, rotCent: mod.Vector = this.center) {
        const [dqw,dqx,dqy,dqz] = RuntimeObject.#MakeRotQ(axis,angle);
        this.dQrot = RuntimeObject.#QProduct([dqw,dqx,dqy,dqz],this.dQrot);

        const diffCenter = mod.Subtract(this.center,rotCent)
        const dpos = mod.Subtract(RuntimeObject.#QRotateVector(diffCenter,[dqw,dqx,dqy,dqz]),diffCenter)
        this.dpos = mod.Add(this.dpos,dpos);

        this.isTransform = true;
    }

    ApplyTransform () {
        if (this.isTransform) {
            const [qw,qx,qy,qz] = this.rotState;
            const [dqw,dqx,dqy,dqz] = this.dQrot;
            const [fqw,fqx,fqy,fqz] = RuntimeObject.#QProduct([dqw,dqx,dqy,dqz],[qw,qx,qy,qz]);
            const rot = RuntimeObject.#QtoEuler([fqw,fqx,fqy,fqz]);

            const oldoffset = RuntimeObject.#QRotateVector(this.offset,[qw,qx,qy,qz]);
            const newoffset = RuntimeObject.#QRotateVector(this.offset,[fqw,fqx,fqy,fqz]);
            const dpos = mod.Add(this.dpos,mod.Subtract(newoffset,oldoffset));
            const pos = mod.Add(mod.GetObjectPosition(this.object),dpos);

            const transform = mod.CreateTransform(pos,rot);
            mod.SetObjectTransform(this.object,transform);
            this.center = mod.Subtract(pos,newoffset);
            this.rotState = [fqw,fqx,fqy,fqz];

            this.dpos = mod.CreateVector(0,0,0);
            this.dQrot = [1,0,0,0];
            this.isTransform = false;
        }
    }
}