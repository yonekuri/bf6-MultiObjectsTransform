# bf6-MultiObjectTransform
[※日本語の解説はこちらです](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/README-JP.md)

This script supports moving objects and rotating them around arbitrary axis within the BF6 Portal, as well as combining these motions.
Furthermore, by creating composite objects through parent-child relationships with other objects, you can efficiently manage multiple objects.<br>
![movie1](https://github.com/user-attachments/assets/547a08e6-6d3e-495f-9512-9b3a43ade3f4)
![movie2](https://github.com/user-attachments/assets/746ad1b1-8aa3-4610-9405-345af69e7aeb)

Using these features, I believe it's possible to create a wide range of functionalities: recreating BF1's Behemoth, such as a airship, animating objects to recreate BF4's Revolution, and if you implement a physics simulation, even playing football with a physics simulation.
If you use this script, I'd be happy to take a look if you let me know.

## Usage
Copy and paste the contents of [MultiObjectsTransform.ts](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/MultiObjectsTransform.ts "スクリプト") to the end of your script.

## Sample code
Using [MOT_Sample.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MOT_Sample.ts "スクリプト") allows you to test the functionality.

In this sample code, aiming down and jumping, a cube appears.<br>
By crouching, the cube simultaneously performs the following movements.
* Move in the direction specified by aiming down (line 58 of the code)
* Rotate in place around the axis specified by aiming down (line 59 of the code)
* Rotate around the summoned player (line 60 of the code)

## Features
This script adds only the `RuntimeObject` class.<br>
When you create an instance of the class by specifying arguments as shown below, an object will also spawn within the game.
```typescript
let obj = new RuntimeObject(prefabEnum, pos, offset, axis, angle, scale);
```
The meaning of each argument is as follows.

* `prefabEnum`:<br>
Specify the object to spawn.
The available parameters are the same as those currently provided for the official `SpawnObject` function.<br>
Additionally, specifying `undefined` allows you to spawn an “empty object”.
This feature is primarily used when setting object parent-child relationships, described later.

<br>

* `pos: mod.Vector`:<br>
Specify the position where objects are spawned.

<br>

* `offset: mod.Vector`:<br>
Set the offset for the position of spawned objects.<br>
This setting is primarily important when rotating objects.<br>
For example, `RuntimeSpawn_Common.FiringRange_Floor_01` is a standard 20.5×20.5 plane-type object, but the object's origin point in-game is set at the corner of the plane.
This means that when rotating an object using functions like `RotateObject`, it rotates around its corner.
Rotating around the center of a plane is not possible using the official functions.<br>
In this example, specifying `offset=mod.CreateVector(-10.25,0,-10.25)` changes the center of rotation for `QRotation`, described later, to the center of the plane.
<p align="center">
<img width="547" height="322" alt="figure1" src="https://github.com/user-attachments/assets/a44f80ea-03b6-4430-9b3b-5825e87e1698" />
</p>

<br>

* `axis: mod.Vector, angle: nuber`:<br>
Specify the initial pose of the object using two arguments.<br>
This is set as rotation around arbitrary axis from the default pose.<br>
Specify the rotation axis with `axis` and the rotation angle in radians with `angle`.
Specifying a positive value for `angle` performs a counterclockwise rotation relative to the axis, while specifying a negative value performs a clockwise rotation.<br>
For example, when you specify `axis=mod.CreateVector(0,1,0), angle=Math.PI/3`, the object will spawn rotated 30 degrees from the default position around the y-axis.
> ⚠️**Note**<br>
> If you specify the zero vector `axis=mod.CreateVector(0,0,0)` for the rotation axis, a warning will appear in the console, and the object will spawn with rotation disabled.

<br>

* `scale: mod.Vector`:<br>
Specify the scale of the object.<br>
This argument is optional.
If omitted, the object's default scale, `scale=mod.CreateVector(1,1,1)`, is specified.
> ⚠️**Note**<br>
> In the current version of Battlefield 6, there is a bug where moving an object whose scale has been altered using official functions like `SetObjectTransform` or `MoveObject` causes only the visual scale to revert to default, while the object's collision scale remains unchanged.<br>
> Therefore, I do not recommend using this argument at this time.

<br>

## Method
`RuntimeObject` class has five methods.<br>
The method is used as follows.
```typescript
let obj = new RuntimeObject(RuntimeSpawn_Common.FiringRange_Floor_01, mod.CreateVector(0,100,0), mod.CreateVector(-10.25,0,-10.25), mod.CreateVector(0,1,0), 0);
obj.Move(mod.CreateVector(10,0,0));
obj.ApplyTransform();
```
The descriptions of each method are as follows.

### Move
```typescript
Move(dpos)
```
Specify object movement using relative coordinates.<br>
Note, however, **executing only this method will not reflect the object's movement within the game.**<br>
To reflect the movement, you must call `ApplyTransform`, described later, after this method is executed.
* `dpos: mod.Vector`: Specify the amount by which the object is moved.
<br>

### QRotation
```typescript
QRotation(axis, angle, rotCenter)
```
Specify the rotation of an object using the rotation axis and rotation angle.<br>
Note, however, **executing only this method will not reflect the object's rotation within the game.**<br>
To reflect the rotation, you must call `ApplyTransform`, described later, after this method is executed.
* `axis: mod.Vector`: Specify the rotation axis.
* `angle: number`: Specify the rotation angle.

Additionally, rotation typically centers around the object's origin specified by `offset` during spawn, but specifying the additional argument `rotCenter`, you can change the center of rotation to the arbitrary position.
* `rotCenter: mod:Vector`: Specify the rotation center point arbitrarily. This argument is optional.
<br>

### ApplyTransform
```typescript
ApplyTransform()
```
Reflect the movement and rotation of the object previously specified by `Move` and `QRotation` in the game.<br>
For example, if you keep calling `Move` in `Ongoing`, the object will gradually move by the specified amount every frame.
<br>

### NewChild
```typescript
NewChild(prefabEnum, pos, offset, axis, angle, scale): RuntimeObject
```
Spawn a new object as a child of the object.<br>
The arguments that can be specified are the same as when creating an instance.
Note, however, `pos, offset, axis` are specified in the **local coordinate of the parent object**.
Detailed usage of parent-child relationships will be described later.
<br>

### Remove
```typescript
Remove()
```
Remove the object.<br>

## Parent-child relationships
Using `NewChild` allows to specify the parent-child relationship between objects.<br>
This makes it easy to move and rotate multiple objects when used effectively.

Objects with parent-child relationships have the following properties.
* When creating child objects using `NewChild`, the `pos, offset, axis` values are calculated **in the parent object's local coordinate**.
* When the parent object is moved or rotated, child objects will also move or rotate while maintaining their relative positions to the parent object.
* The movement vector for `Move` and the rotation axis for `QRotation` on child objects are all calculated **in the parent object's local coordinate**.
* When you delete a parent object using `Remove`, **all child objects and their descendants will also be deleted**.

Specifying displacement amounts and rotation axis in the parent object's local coordinate may be easier to understand if you imagine manipulating objects in the spatial editor.<br>

To apeear a cube like the sample code, execute the following:
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
In this example, a parent empty object is created, and six boards are generated as its children with varying positions and angles to represent a cube.<br>
When the parent moves, the child also moves while maintaining its relative position.
Therefore, to move the cube, you can simply call the parent's method.
```typescript
obj.Move(mod.CreateVector(0.5,0,0));
obj.QRotation(mod.CreateVector(0,1,0), Math.PI/180);
obj.ApplyTransform();
```
Additionally, when generating a child with the parent's posture altered as shown below, the position and rotation axis are calculated in the parent's coordinate system.
So the cube will be generated in a rotated state from the start.
```typescript
let obj = new RuntimeObject(undefined, pos, mod.CreateVector(0,0,0), mod.CreateVector(1,0,0), Math.PI/4); //Rotate 45 degrees around the x-axis.
```
