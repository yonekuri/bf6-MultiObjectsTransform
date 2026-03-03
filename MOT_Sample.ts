import * as modlib from 'modlib';

export async function OnPlayerJoinGame(eventPlayer: mod.Player) {
    PlayerDatas.get(eventPlayer);
}

export async function OnPlayerLeaveGame(playerId: number) {
    PlayerDatas.remove(playerId);
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    const pD = PlayerDatas.get(eventPlayer);
    if(!pD) return;

    const isAlive = mod.GetSoldierState(eventPlayer,mod.SoldierStateBool.IsAlive);

    if (isAlive) {
        const isZooming = mod.GetSoldierState(eventPlayer,mod.SoldierStateBool.IsZooming);
        const isCrouching = mod.GetSoldierState(eventPlayer,mod.SoldierStateBool.IsCrouching);
        const jumpedNow = modlib.getPlayerCondition(eventPlayer, 0).update(mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsJumping));

        const eyePosition = mod.GetSoldierState(eventPlayer,mod.SoldierStateVector.EyePosition);
        const facingDirection = mod.GetSoldierState(eventPlayer,mod.SoldierStateVector.GetFacingDirection);

        if (isZooming) {
            pD.axis = mod.Normalize(facingDirection);

            if (jumpedNow) {
                if (pD.object) pD.object.Remove();

                const pos = mod.Add(eyePosition,mod.Multiply(facingDirection,20));
                pD.object = new RuntimeObject(undefined,
                                              pos, mod.CreateVector(0,0,0),
                                              mod.CreateVector(1,0,0), Math.PI/4); //Create Parent Empty Object.
                const offset = mod.CreateVector(-10.25,0,-10.25);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(0,10.25,0), offset,
                                   mod.CreateVector(0,1,0), 0);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(0,0,10.25), offset,
                                   mod.CreateVector(1,0,0), Math.PI/2);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(0,0,-10.25), offset,
                                   mod.CreateVector(1,0,0), -Math.PI/2);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(0,-10.25,0), offset,
                                   mod.CreateVector(1,0,0), Math.PI);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(-10.25,0,0), offset,
                                   mod.CreateVector(0,0,1), Math.PI/2);
                pD.object.NewChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01,
                                   mod.CreateVector(10.25,0,0), offset,
                                   mod.CreateVector(0,0,1), -Math.PI/2);
            }
        }
        if (isCrouching) {
            if (pD.object) {
                pD.object.Move(mod.Multiply(pD.axis,0.1)); //Translation
                pD.object.QRotation(pD.axis,Math.PI/180); //Rotation about the center of gravity
                pD.object.QRotation(mod.CreateVector(0,1,0),Math.PI/180,mod.GetSoldierState(eventPlayer,mod.SoldierStateVector.GetPosition)); //Rotation centered on a point other than the center of gravity (here, the player)
                pD.object.ApplyTransform(); //Application of Translation and Rotation
            }
        }
    }
}

class PlayerDatas {
    player: mod.Player;

    object: RuntimeObject | undefined;
    axis: mod.Vector;

    constructor(eventplayer: mod.Player) {
        this.player = eventplayer;
        this.axis = mod.CreateVector(0,1,0);
    }

    static #allPlayers: { [key: number] : PlayerDatas }  = {};

    static get(eventPlayer: mod.Player) {
        let id = mod.GetObjId(eventPlayer);

        if (id <= -1) return undefined;
        let regiPlayer = PlayerDatas.#allPlayers[id];
        if (!regiPlayer) {
            regiPlayer = new PlayerDatas(eventPlayer);
            PlayerDatas.#allPlayers[id] = regiPlayer;
        }

        return regiPlayer;
    }

    static remove(playerId: number) {
        PlayerDatas.#allPlayers[playerId].object?.Remove();
        delete PlayerDatas.#allPlayers[playerId];
    }
}

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
    private _rotState: [number,number,number,number] = [1,0,0,0];

    private _dpos: mod.Vector = mod.CreateVector(0,0,0);
    private _dQrot: [number,number,number,number] = [1,0,0,0];
    private _isTransform: boolean = false;

    private _parent: RuntimeObject | undefined;
    private _children = new Set<RuntimeObject>();

    //getter
    get worldPos(): mod.Vector {
        return this._pos;
    }

    get localPos(): mod.Vector {
        if (this.parent) {
            const localPos = mod.Subtract(this._pos,this.parent._pos)
            const [pqw,pqx,pqy,pqz] = this.parent._rotState;
            return RuntimeObject.#QRotateVector(localPos,[pqw,-pqx,-pqy,-pqz]);
        } else {
            return this._pos;
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
    }

    //class method
    Move(dpos: mod.Vector) {
        let world_dpos = dpos;
        if (this._parent) world_dpos = RuntimeObject.#QRotateVector(dpos,this._parent._effRotState());
        this._dpos = mod.Add(this._dpos,world_dpos);
        this._isTransform = true;

        const [pqw,pqx,pqy,pqz] = this._effRotState();
        this._children.forEach(obj => obj.Move(RuntimeObject.#QRotateVector(world_dpos,[pqw,-pqx,-pqy,-pqz])));
    }

    QRotation(axis: mod.Vector, angle: number, rotCenter: mod.Vector = this._effPos()) {
        let world_axis = axis;
        if (this._parent) world_axis = RuntimeObject.#QRotateVector(axis,this._parent._effRotState());
        const [dqw,dqx,dqy,dqz] = RuntimeObject.#MakeRotQ(world_axis,angle);
        this._dQrot = RuntimeObject.#QProduct([dqw,dqx,dqy,dqz],this._dQrot);

        const distanceCenter = mod.Subtract(this._effPos(),rotCenter)
        const dpos = mod.Subtract(RuntimeObject.#QRotateVector(distanceCenter,[dqw,dqx,dqy,dqz]),distanceCenter)
        this._dpos = mod.Add(this._dpos,dpos);

        this._isTransform = true;

        const [pqw,pqx,pqy,pqz] = this._effRotState();
        this._children.forEach(obj => obj.QRotation(RuntimeObject.#QRotateVector(world_axis,[pqw,-pqx,-pqy,-pqz]),angle,rotCenter));
    }

    ApplyTransform () {
        if (this._isTransform) {
            const [qw,qx,qy,qz] = this._rotState;
            const [dqw,dqx,dqy,dqz] = this._dQrot;
            const [fqw,fqx,fqy,fqz] = RuntimeObject.#QProduct([dqw,dqx,dqy,dqz],[qw,qx,qy,qz]);

            const oldoffset = RuntimeObject.#QRotateVector(this.offset,[qw,qx,qy,qz]);
            const newoffset = RuntimeObject.#QRotateVector(this.offset,[fqw,fqx,fqy,fqz]);
            if (this.object) {
                const dpos = mod.Add(this._dpos,mod.Subtract(newoffset,oldoffset));
                const pos = mod.Add(mod.GetObjectPosition(this.object),dpos);
                const rot = RuntimeObject.#QtoEuler([fqw,fqx,fqy,fqz]);

                const transform = mod.CreateTransform(pos,rot);
                mod.SetObjectTransform(this.object,transform);
                this._pos = mod.Subtract(pos,newoffset);
            } else {
                this._pos = mod.Add(this._pos,this._dpos);
            }
            this._rotState = [fqw,fqx,fqy,fqz];

            this._dpos = mod.CreateVector(0,0,0);
            this._dQrot = [1,0,0,0];
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
        const parentPos = this._effPos();
        const parentRotState = this._effRotState();
        const child = new RuntimeObject(prefabEnum,
                                        mod.Add(parentPos,RuntimeObject.#QRotateVector(pos,parentRotState)),
                                        offset,
                                        mod.CreateVector(0,1,0),
                                        0,
                                        scale);
        child._parent = this;
        this._children.add(child);
        child._dQrot = RuntimeObject.#QProduct(RuntimeObject.#MakeRotQ(RuntimeObject.#QRotateVector(axis,parentRotState),angle),parentRotState);
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

    //In-class functions
    private _effPos (): mod.Vector {
        return mod.Add(this._pos, this._dpos);
    }

    private _effRotState (): [number,number,number,number] {
        return RuntimeObject.#QProduct(this._dQrot, this._rotState);
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

    static #QProduct (q1: readonly [number,number,number,number], q2: readonly [number,number,number,number]): [number,number,number,number] {
        const [qw1,qx1,qy1,qz1] = q1;
        const [qw2,qx2,qy2,qz2] = q2;

        let qw = qw1*qw2 - qx1*qx2 - qy1*qy2 - qz1*qz2;
        let qx = qw1*qx2 + qx1*qw2 + qy1*qz2 - qz1*qy2;
        let qy = qw1*qy2 - qx1*qz2 + qy1*qw2 + qz1*qx2;
        let qz = qw1*qz2 + qx1*qy2 - qy1*qx2 + qz1*qw2;

        [qw,qx,qy,qz] = RuntimeObject.#QNormalize([qw,qx,qy,qz])
        
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
