# bf6-MultiObjectTransform
[*Here is the English description of this repository.](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/README.md)

このスクリプトは主にBF6 Portalにおける以下の機能をサポートします。  
・複数のオブジェクトに対する親子関係の設定  
・オブジェクトの移動/任意軸での回転、それらを合成した運動  


これによって複数のオブジェクトを効率的に動かすことが可能です。  
![movie1](https://github.com/user-attachments/assets/547a08e6-6d3e-495f-9512-9b3a43ade3f4)
![movie2](https://github.com/user-attachments/assets/746ad1b1-8aa3-4610-9405-345af69e7aeb)

これらの機能を用いれば、BF1の飛行船などの巨大兵器の再現や、オブジェクトのアニメーションによるBF4のレボリューションの再現、ある程度の物理演算を実装すればオブジェクトによるサッカーまで様々な機能が実装できると考えています。

## 使い方
[MultiObjectsTransform.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MultiObjectTransform.ts)の内容をスクリプトの末尾にコピー&ペーストしてください。

## サンプルコード
[MotSample.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MotSample.ts)を使用することで機能を試すことが可能です。

このサンプルコードではエイムを行いながらジャンプすることで視線の先に6つの板状オブジェクトを組み合わせた立方体が出現します。  
しゃがむことで立方体は以下の運動を同時に行います。
* エイムで指定した方向への移動（コード86行目で指定）
* エイムで指定した軸を中心にその場で回転（コード87行目で指定）
* 呼び出したプレイヤーを中心に回転（コード88行目で指定）

## 機能
このライブラリは、複数オブジェクトの変形を管理するTransformableObjectクラス、クォータニオン計算を提供するQuaternions名前空間、およびTransformableObjectクラスに関連する型を定義する同名の名前空間を追加します。  
ここでは主にTransformableObjectクラスに含まれるメソッドとプロパティについて説明します。

### オブジェクトの生成
ライブラリで扱うTransformableObjectは3種類あり、それぞれに生成関数が存在します。  
オブジェクトの生成は以下のように行います。
```typescript
let obj = TransformableObject.createRuntimeObject(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25), 1);
let existObj = TransformableObject.createExistingObject(mod.GetSpatialObject(1));
```
#### createRuntimeObject
```typescript
static createRuntimeObject(prefabEnum, position, rotation, offset, scale): TransformableObject
static createRuntimeObject(prefabEnum, position, angle, axis, offset, scale): TransformableObject
```
新たにTransformableObjectを生成します。  
* `prefabEnum`  
`mod.RuntimeSpawn_Common.FiringRange_Floor_01`などオブジェクトのprefabEnumを入力します。


* `position: mod.Vector`  
オブジェクトの生成位置を指定します。  


オブジェクトの姿勢には2通りの指定方法があります。  
1. **`mod.SpawnObject`と同様にオイラー角で指定する方法**  
* `rotation: mod.Vector`  
オブジェクトの初期姿勢を指定します。  
`mod.SpawnObject`と同様の感覚で使用できる、Godotの値をコピーして使用できるなどのメリットがあります。  
Godotの値をコピーする際は事前にRotation OrderをZYXに設定する必要があります。
<p align="center">
<img width="352" height="410" alt="image" src="https://github.com/user-attachments/assets/4c514fbe-2082-45d7-87c5-65d1c9307f3c" />
</p>

2. **回転角と回転軸を指定してオブジェクトの初期姿勢からの回転で指定する方法**  
* `angle: number`  
回転角をラジアンで指定します。  
* `axis: mod.Vector`  
回転軸を指定します。  
初期姿勢はオブジェクトのデフォルトの姿勢から_axis_を中心に_angle_だけ回転させた姿勢として決定します。  
この方法は仕組みを理解していればオイラー角よりも直感的に扱うことができます。  


* `offset: mod.Vector`（省略可能）  
スポーンさせるオブジェクトの位置のオフセットを指定します。  
この設定は主にオブジェクトの回転を行う際に重要です。   
例えば`mod.RuntimeSpawn_Common.FiringRange_Floor_01`は大きさ20.5×20.5の標準的な板型オブジェクトですが、ゲーム内でのオブジェクトの原点は板の角の部分に設定されています。
これは`mod.RotateObject`などを使用してオブジェクトを回転させた際に角を中心に回転することを意味し、板の中心などを軸とした回転は公式の関数では不可能です。  
`mod.RuntimeSpawn_Common.FiringRange_Floor_01`の例では`offset=mod.CreateVector(-10.25,0,-10.25)`と指定すると後述する`rotate`などによる回転の中心が板の中心として変更されます。  
省略された場合は`offset=mod.CreateVector(0,0,0)`として扱われます。
<p align="center">
<img width="547" height="322" alt="figure1" src="https://github.com/user-attachments/assets/a44f80ea-03b6-4430-9b3b-5825e87e1698" />
</p>


* `scale: number`（省略可能）  
オブジェクトのスケールを指定します。  
省略された場合は`scale=1`として扱われます。
> ⚠️現在のBattlefield 6のバージョンでは公式で用意されている`mod.SetObjectTransform`関数や`mod.MoveObject`関数などを利用してスケールを変更したオブジェクトを回転させると、見た目の回転がズレるというバグが存在しています。<br>
> そのため現状ではこの引数を使用することはおすすめしません。


#### createEmptyObject
```typescript
static createEmptyObject(position, rotation, scale): TransformableObject
static createEmptyObject(position, angle, axis, scale): TransformableObject
```
新たに空のTransformableObjectオブジェクトを生成します。
これはGodotにおけるNode3Dオブジェクトに対応します。  
主に複数のオブジェクトをまとめて動かす際の親オブジェクトとして使用します。


####  createExistingObject
```typescript
static createExistingObject(object, offset, scale): TransformableObject
```
既にゲーム内に存在するオブジェクトをTransformableObjectとして管理できるようにします。  
* `object: Object`  
対象のオブジェクトを指定します。  


### 子オブジェクトの生成
対象オブジェクトの子オブジェクトとしてTransformableObjectを生成します。  
子オブジェクトの仕様は基本的にGodotを参考にしています。  
各引数の意味はオブジェクト生成関数と同様です（`offset`, `scale`は省略可能）。  
ただし、Godotにおける子オブジェクトの仕様に基づいて、**入力された`position`, `rotation`, `angle`, `axis`は親のローカル座標系における値として解釈されることに注意してください**。  
子オブジェクトの生成は以下のように行います。
```typescript
let root = TransformableObject.createEmptyObject(mod.CreateVector(0,100,0), mod.CreateVector(0,0,0));
let child = root.createRuntimeChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25));
let camera = TransformableObject.createExistingChild(mod.GetFixedCamera(1));
```
####  createRuntimeChild
```typescript
createRuntimeChild(prefabEnum, position, rotation, offset, scale): TransformableObject | undefined
createRuntimeChild(prefabEnum, position, angle, axis, offset, scale): TransformableObject | undefined
```
新たに対象の子オブジェクトとしてRuntimeオブジェクトを生成します。  
対象が既に削除されている場合は返り値が`undefined`になります。


####  createEmptyChild
```typescript
createEmptyChild(position, rotation, scale): TransformableObject | undefined
createEmptyChild(position, angle, axis, scale): TransformableObject | undefined
```
新たに対象の子オブジェクトとしてEmptyオブジェクトを生成します。  
対象が既に削除されている場合は返り値が`undefined`になります。


####  createExistingChild
```typescript
createExistingChild(object, offset, scale): TransformableObject | undefined
```
既にゲーム内に存在するオブジェクトを対象の子オブジェクトとして管理できるようにします。  
対象が既に削除されている場合は返り値が`undefined`になります。  


### オブジェクトの管理
管理関数は以下のように使用します。
```typescript
let root = TransformableObject.createEmptyObject(mod.CreateVector(0,100,0), mod.CreateVector(0,0,0));
let child = root.createRuntimeChild(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,0,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25));
child.detachFromParent();

let camera = TransformableObject.createExistingObject(mod.GetFixedCamera(1));
camera.attachAsChild(root);

root.remove();
```
#### attachAsChild
```typescript
attachAsChild(newParent): void
```
対象を指定したオブジェクトの子オブジェクトに設定します。
* `newParent: TransformableObject`  
親オブジェクトを指定します。  

#### detachFromParent
```typescript
detachFromParent(): void
```
対象が他のオブジェクトの子オブジェクトである場合、それを解除します。  

#### remove
```typescript
remove(): void
```
対象のTransformableObjectを削除します。  
また、対象に子オブジェクトが存在する場合、それらも再帰的に削除します。  
ただし、対象がExistingオブジェクトの場合はオブジェクトそのものは削除されず、単にTransformableObjectの管理下から外れます。  
`remove`後のTransformableObjectを対象としたメソッドは基本的に失敗します。


### オブジェクトの移動・回転
本ライブラリにおける移動・回転は
1. `move`, `rotate`で移動・回転を予約
2. それまでに予約された移動・回転を`applyTransform`で実際のTransformableObjectに反映
の流れで行われます。
`applyTransform`が実行されるまでは実際にはオブジェクトは移動しません。
**子オブジェクトは親オブジェクトのローカル座標系に属しており、子オブジェクトに対する移動・回転の操作はローカル座標系におけるものとして解釈されます。**
また、子オブジェクトを持つオブジェクトに対して移動・回転の操作を行った場合、**子オブジェクトとの相対的な位置・姿勢を維持したまま一体となって移動します**。
> ⚠️TransformableObjectの管理下にあるオブジェクトは外部から`mod.MoveObject`などで移動されることを想定していないため、それらによる操作は行わないでください。


メソッドは以下のように使用します。
```typescript
let obj = TransformableObject.createRuntimeObject(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25), 1);
obj.move(mod.CreateVector(10,0,0));
obj.applyTransform();
```
#### move
```typescript
move(dpos): void
```
オブジェクトの移動を相対座標で指示します。
移動を反映するためにはこのメソッドが実行された後に`applyTransform`を実行する必要があります。  
* `dpos: mod.Vector`  
オブジェクトの移動量を指定します。

#### rotate
```typescript
rotate(angle, axis, rotCenter): void
```
オブジェクトの回転を回転角と回転軸で指示します。
回転を反映するためにはこのメソッドが実行された後に`applyTransform`を実行する必要があります。  
* `angle: number`  
回転角をラジアンで指定します。 
* `axis: mod.Vector`  
回転軸を指定します。

#### applyTransform
```typescript
applyTransform(): void
```
`move`, `rotate`で予約された移動、回転を実際のオブジェクトに適用します。  
また、オブジェクトが子オブジェクトを持つ場合、それらにも再帰的に実行を行います。

### ベクトル変換
ワールド座標系と対象が属する親オブジェクトのローカル座標系の間でベクトルを変換する操作を行います。  
メソッドは以下のように使用します。
```typescript
let obj = TransformableObject.createRuntimeObject(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25), 1);
obj.localToWorldVector(mod.CreateVector(20,0,0));
```
#### localToWorldVector
```typescript
localToWorldVector(vector): mod.Vector
```
入力されたローカル座標系のベクトルをワールド座標系における値に変換します。

#### worldToLocalVector
```typescript
worldToLocalVector(vector): mod.Vector
```
入力されたワールド座標系のベクトルをローカル座標系における値に変換します。

#### effectiveLocalToWorldVector
```typescript
effectiveLocalToWorldVector(vector): mod.Vector
```
入力された**親オブジェクトが予定している移動も考慮した**ローカル座標系のベクトルをワールド座標系における値に変換します。

#### effectiveWorldToLocalVector
```typescript
effectiveWorldToLocalVector(vector): mod.Vector
```
入力されたワールド座標系のベクトルを**親オブジェクトが予定している移動も考慮した**ローカル座標系における値に変換します。


### プロパティ
TransformableObjectが持つ情報を取得できます。  
対象のオブジェクトが既に削除されていた場合、基本的には`undefined`を返します（一部を除く）。  
プロパティは以下のように取得できます。
```typescript
let obj = TransformableObject.createRuntimeObject(mod.RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(0,0,0), mod.CreateVector(-10.25,0,-10.25), 1);
let object = obj.object;
let pos = obj.worldPos;
```
#### object
* `object: Object | undefined`  
対象のオブジェクトそのものを取得します。
対象のオブジェクトがEmptyオブジェクトの場合は`undefined`を返します。

#### id
* `id: number | undefined`  
対象のオブジェクトのObjIdを取得します。
対象のオブジェクトがEmptyオブジェクトの場合は`undefined`を返します。

#### prefabEnum
* `prefabEnum`  
対象のオブジェクトのprefabEnumを取得します。  
対象がRuntimeオブジェクト以外の場合は`undefined`を返します。

#### offset
* `offset: mod.Vector`  
対象のオブジェクトに生成時に設定されたoffsetを取得します。

#### worldPos
* `worldPos: mod.Vector | undefined`  
オブジェクトの現在の座標をワールド座標系で取得します。

#### effectiveWorldPos
* `effectiveWorldPos: mod.Vector | undefined`  
オブジェクトが移動を予定している座標をワールド座標系で取得します。

#### localPos
* `localPos: mod.Vector | undefined`  
オブジェクトの現在の座標を**親オブジェクトのローカル座標系で**取得します。

#### effectiveLocalPos
* `effectiveLocalPos: mod.Vector | undefined`  
オブジェクトが移動を予定している座標を**親オブジェクトのローカル座標系で**取得します。
<p align="center">
<img width="630" height="388" alt="figure2" src="https://github.com/user-attachments/assets/1c056632-7f13-49a8-832e-8a9eedf3706c" />
</p>

#### worldRot
* `worldRot: mod.Vector | undefined`  
オブジェクトの現在の姿勢をオイラー座標形式でワールド座標系で取得します。

#### effectiveWorldRot
* `effectiveWorldRot: mod.Vector | undefined`  
オブジェクトが回転を予定している姿勢をワールド座標系で取得します。

#### localRot
* `localRot: mod.Vector | undefined`  
オブジェクトの現在の姿勢をオイラー座標形式で**親オブジェクトのローカル座標系で**取得します。

#### effectiveLocalRot
* `effectiveLocalRot: mod.Vector | undefined`  
オブジェクトが回転を予定している姿勢を**親オブジェクトのローカル座標系で**取得します。

#### worldScale
* `worldScale: number | undefined`  
オブジェクトのスケールをワールド座標系で取得します。

#### localScale
* `localScale: number | undefined`  
オブジェクトのスケールを**親オブジェクトのローカル座標系で**取得します。

#### parent
* `parent: TransformableObject | undefined`  
対象の親オブジェクトを取得します。  
親オブジェクトが存在しない場合は`undefined`を返します。

#### children
* `children: Set<TransformableObject> | undefined`  
対象の子オブジェクトをTypescriptにおける`Set`形式で取得します。

#### deleted
* `deleted: boolean`  
オブジェクトが既に削除されているかを取得します。  
既に削除されている場合は`true`、まだ存在している場合は`false`を返します。

