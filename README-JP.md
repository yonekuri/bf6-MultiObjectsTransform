# bf6-MultiObjectTransform
[*Here is the English description of this repository.](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/README.md)

このスクリプトはBF6 Portalでのオブジェクトの移動/任意軸での回転や、それらを合成した運動をサポートします。
さらに、他のオブジェクトとの親子関係を設定してオブジェクトを生成することで複合オブジェクトを作成し、複数のオブジェクトを効率的に動かすことが可能です。<br>
![movie1](https://github.com/user-attachments/assets/547a08e6-6d3e-495f-9512-9b3a43ade3f4)
![movie2](https://github.com/user-attachments/assets/746ad1b1-8aa3-4610-9405-345af69e7aeb)

これらの機能を用いれば、BF1の飛行船などの巨大兵器の再現や、オブジェクトのアニメーションによるBF4のレボリューションの再現、ある程度の物理演算を実装すればオブジェクトによるサッカーまで様々な機能が実装できると考えています。
この機能を使用していただけた場合は教えていただけると喜んで見に行きます。

## 使い方
[MultiObjectsTransform.ts](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/MultiObjectsTransform.ts "スクリプト")の内容をスクリプトの末尾にコピー&ペーストしてください。

## サンプルコード
[MOT_Sample.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MOT_Sample.ts "スクリプト")を使用することで機能を試すことが可能です。

このサンプルコードではエイムを行いながらジャンプすることで視線の先に立方体が出現します。<br>
しゃがむことで立方体は以下の運動を同時に行います。
* エイムで指定した方向への移動（コード58行目で指定）
* エイムで指定した軸を中心にその場で回転（コード59行目で指定）
* 呼び出したプレイヤーを中心に回転（コード60行目で指定）

## 機能
このスクリプトでは`RuntimeObject`クラスのみを追加します。<br>
以下のように引数を指定してクラスのインスタンスを生成すると、ゲーム内にもオブジェクトがスポーンします。
```typescript
let obj = new RuntimeObject(prefabEnum, pos, offset, axis, angle, scale);
```
各引数の意味は以下の通りです。

* `prefabEnum`:<br>
スポーンさせるオブジェクトを指定します。
指定できる内容は現状公式で用意されている`SpawnObject`の引数と同様です。<br>
また、`undefined`を指定することで「空オブジェクト」をスポーンさせることも可能です。
この機能は主に後述するオブジェクトの親子関係を設定する際に使用できます。

<br>

* `pos: mod.Vector`:<br>
オブジェクトをスポーンさせる位置を指定します。

<br>

* `offset: mod.Vector`:<br>
スポーンさせるオブジェクトの位置のオフセットを設定します。<br>
この設定は主にオブジェクトの回転を行う際に重要です。<br>
例えば`RuntimeSpawn_Common.FiringRange_Floor_01`は大きさ20.5×20.5の標準的な板型オブジェクトですが、ゲーム内でのオブジェクトの原点は板の角の部分に設定されています。
これは`RotateObject`などを使用してオブジェクトを回転させた際に角を中心に回転することを意味し、板の中心などを軸とした回転は公式の関数では不可能です。<br>
`RuntimeSpawn_Common.FiringRange_Floor_01`の例では`offset=mod.CreateVector(-10.25,0,-10.25)`と指定すると後述する`QRotation`などによる回転の中心が板の中心として変更されます。
<p align="center">
<img width="547" height="322" alt="figure1" src="https://github.com/user-attachments/assets/a44f80ea-03b6-4430-9b3b-5825e87e1698" />
</p>

<br>

* `axis: mod.Vector, angle: nuber`:<br>
2つの引数でオブジェクトの初期姿勢を指定します。<br>
これはデフォルトの姿勢からの任意軸での回転という形で設定します。<br>
`axis`で回転軸、`angle`でラジアンでの回転角の指定を行います。
`angle`に正の値を指定した場合は軸に対して左回転、負の値を指定した場合は右回転を行います。<br>
例えば、`axis=mod.CreateVector(0,1,0), angle=Math.PI/3`を指定した場合、オブジェクトはy軸を中心にデフォルトから30度回転した状態でスポーンします。
> ⚠️回転軸にゼロベクトル`axis=mod.CreateVector(0,0,0)`を指定した場合コンソールに警告が表示され、回転が無効化された状態でオブジェクトがスポーンします。

<br>

* `scale: mod.Vector`:<br>
オブジェクトのスケールを指定します。<br>
この引数は省略可能であり、省略した場合にはオブジェクトのデフォルトのスケールである`scale=mod.CreateVector(1,1,1)`が指定されます。
> ⚠️現在のBattlefield 6のバージョンでは公式で用意されている`SetObjectTransform`関数や`MoveObject`関数などを利用してスケールを変更したオブジェクトを移動すると、オブジェクトの当たり判定のスケールはそのままに、見た目のスケールだけがデフォルトに戻ってしまうというバグが存在しています。<br>
> そのため現状ではこの引数を使用することはおすすめしません。

### プロパティ
`RuntimeObject`のインスタンスは8つのプロパティを持ちます。<br>
プロパティは以下のように取得できます。
```typescript
let obj = new RuntimeObject(RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(-10.25,0,-10.25), mod.CreateVector(0,1,0), 0);
let object = obj.object;
let pos = obj.pos;
```
各プロパティの説明は以下の通りです。

#### object
`object: mod.Object | undefined`: <br>
オブジェクト本体を取得します。<br>
インスタンスが空オブジェクトの場合には`undefined`となります。

#### id
`id: number | undefined`: <br>
オブジェクトのIDを取得します。<br>
インスタンスが空オブジェクトの場合には`undefined`となります。

#### prefabEnum
`prefabEnum`: <br>
スポーン時に指定したオブジェクトのprefabEnumを取得します。<br>
インスタンスが空オブジェクトの場合には`undefined`となります。

#### offset
`offset: mod.Vector`: <br>
スポーン時に指定したオブジェクトのオフセットを取得します。

#### pos
`pos: mod.Vector`: <br>
オブジェクトの**回転中心の座標**を取得します。

#### offsetNow
`offsetNow: mod.Vector`: <br>
オブジェクトの現在のオフセットを取得します。<br>
これはスポーン時に指定したオフセットがオブジェクトの姿勢に従って回転したベクトルです。

#### parent
`parent: RuntimeObject | undefined`: <br>
自オブジェクトの親を取得します。<br>
親が存在しない場合は`undefined`となります。

#### children
`children: Set<RuntimeObject>`: <br>
自オブジェクトの子を取得します。<br>
子はTypescriptにおける`Set`として取得されます。

### メソッド
`RuntimeObject`クラスには5つのメソッドが存在します。<br>
メソッドは以下のように使用します。
```typescript
let obj = new RuntimeObject(RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(-10.25,0,-10.25), mod.CreateVector(0,1,0), 0);
obj.Move(mod.CreateVector(10,0,0));
obj.ApplyTransform();
```
各メソッドの説明は以下の通りです。

#### Move
```typescript
Move(dpos)
```
オブジェクトの移動を相対座標で指示します。<br>
ただし、**このメソッドを実行するだけではゲーム内でオブジェクトの移動は反映されません。**<br>
移動を反映するためには後述する`ApplyTransform`をこのメソッドが実行された後に呼ぶ必要があります。
* `dpos: mod.Vector`: オブジェクトの移動量を指定します。
<br>

#### QRotation
```typescript
QRotation(axis, angle, rotCenter)
```
オブジェクトの回転を回転軸と回転角で指示します。<br>
ただし、**このメソッドを実行するだけではゲーム内でオブジェクトの回転は反映されません。**<br>
回転を反映するためには後述する`ApplyTransform`をこのメソッドが実行された後に呼ぶ必要があります。
* `axis: mod.Vector`: 回転軸を指定します。
* `angle: number`: 回転角を指定します。

また、回転は通常スポーン時に`offset`で指定したオブジェクトの原点を中心に回転しますが、追加の引数`rotCenter`を指定することで、任意の場所を中心とした回転に変更できます。
* `rotCenter: mod:Vector`: 回転の中心点を任意で指定します。この引数は省略可能です。
<br>

#### ApplyTransform
```typescript
ApplyTransform()
```
それまでに指示された`Move`と`QRotation`によるオブジェクトの移動/回転を反映します。<br>
例えば`Move`を使用してオブジェクトを徐々に移動させるような場合、`Ongoing`の中でこのメソッドを常に実行し続けると指示された移動が毎フレームオブジェクトに反映されるようになります。
<br>

#### NewChild
```typescript
NewChild(prefabEnum, pos, offset, axis, angle, scale): RuntimeObject
```
オブジェクトの子として新たにオブジェクトをスポーンさせます。<br>
指定できる引数はインスタンスの生成の際と同じです。
ただし、`pos, offset, axis`は**親オブジェクトのローカル座標系**での指定になります。
親子関係の詳しい使い方は後述します。
<br>

#### Remove
```typescript
Remove()
```
オブジェクトを削除します。<br>

### オブジェクトの親子関係
`NewChild`を使用することでオブジェクトの親子関係を指定することができます。<br>
これはうまく使えば複数のオブジェクトの移動や回転を容易にします。

親子関係を設定したオブジェクトは次のような性質を持ちます。
* `NewChild`による子オブジェクトの生成の際の`pos, offset, axis`は**親オブジェクトのローカル座標系**で計算されます。
* 親オブジェクトを移動/回転した場合、子オブジェクトも親オブジェクトとの相対位置を保ったまま移動/回転を行います。
* 子オブジェクトに対する`Move`の移動ベクトルや`QRotation`の回転軸はすべて**親オブジェクトのローカル座標系**で計算されます。
* `Remove`で親オブジェクトを削除した場合、**子オブジェクト以下もすべて削除**されます。

移動ベクトルや回転軸の親オブジェクトのローカル座標系での指定は空間エディタでのオブジェクトの操作をイメージすると理解しやすいかもしれません。<br>

サンプルコードのような立方体を出現させたい場合は次のように実行します。
```typescript
const pos = mod.CreateVector(0,100,0);
let obj = new RuntimeObject(undefined, pos, mod.CreateVector(0,0,0), mod.CreateVector(1,0,0), 0); //Create Parent Empty Object.
const prefabEnum = mod.RuntimeSpawn_Common.FiringRange_Floor_01;
const offset = mod.CreateVector(-10.25,0,-10.25);
obj.NewChild(prefabEnum, mod.CreateVector(     0, 10.25,     0), offset, mod.CreateVector(0,1,0),          0);
obj.NewChild(prefabEnum, mod.CreateVector(     0,     0, 10.25), offset, mod.CreateVector(1,0,0),  Math.PI/2);
obj.NewChild(prefabEnum, mod.CreateVector(     0,     0,-10.25), offset, mod.CreateVector(1,0,0), -Math.PI/2);
obj.NewChild(prefabEnum, mod.CreateVector(     0,-10.25,     0), offset, mod.CreateVector(1,0,0),    Math.PI);
obj.NewChild(prefabEnum, mod.CreateVector(-10.25,     0,     0), offset, mod.CreateVector(0,0,1),  Math.PI/2);
obj.NewChild(prefabEnum, mod.CreateVector( 10.25,     0,     0), offset, mod.CreateVector(0,0,1), -Math.PI/2);
```
この例では親として空オブジェクトを用意し、その子として6個の板を位置と角度を変えて生成することで立方体を表現しています。<br>
親を動かすと子も相対位置を保ちながら運動するため、立方体を動かしたい場合は親のメソッドを呼ぶだけで実行できます。
```typescript
obj.Move(mod.CreateVector(0.5,0,0));
obj.QRotation(mod.CreateVector(0,1,0), Math.PI/180);
obj.ApplyTransform();
```
また、次のように親の姿勢を変えた状態で子を生成した場合も、位置や回転軸は親の座標系で計算されるため、立方体が最初から回転した状態で生成されます。
```typescript
let obj = new RuntimeObject(undefined, pos, mod.CreateVector(0,0,0), mod.CreateVector(1,0,0), Math.PI/4); //Rotate 45 degrees around the x-axis.
```
プロパティの`parent`や`children`を使用することで、それぞれオブジェクトの親と子を取得できます。<br>
子はTypescriptにおける`Set`として取得され、子オブジェクトがスポーン順に格納されていることに注意してください。
特定の子を取得したい場合は`Set`を配列に変換してから取り出すことをお勧めします。
