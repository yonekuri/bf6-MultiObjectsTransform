# bf6-MultiObjectTransform
[※日本語の解説はこちらです](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/README-JP.md)

This script primarily adds support for the following features in Battlefield 6 Portal:

- Creating parent-child relationships between multiple objects
- Moving objects, rotating them around arbitrary axes, and combining these transformations into more complex motion

These features make it possible to move and animate multiple objects efficiently.

![movie1](https://github.com/user-attachments/assets/547a08e6-6d3e-495f-9512-9b3a43ade3f4)
![movie2](https://github.com/user-attachments/assets/746ad1b1-8aa3-4610-9405-345af69e7aeb)

Possible applications include recreating large vehicles such as the airship from Battlefield 1, reproducing Battlefield 4-style Levolution events through object animation, and even creating games such as object-based soccer by implementing a simple physics system.

## Usage

Copy and paste the contents of [MultiObjectTransform.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MultiObjectTransform.ts) at the end of your script.

## Sample Code

You can try the library by using [MotSample.ts](https://github.com/yonekuri/bf6-MultiObjectTransform/blob/main/MotSample.ts).

In this sample, jumping while aiming spawns a cube made from six flat objects at the point you are looking at. Crouching then makes the cube perform the following motions simultaneously:

- Move in the direction specified by aiming, configured on line 86
- Rotate in place around the axis specified by aiming, configured on line 87
- Orbit around the player who spawned it, configured on line 88

## Features

This library adds the `TransformableObject` class for managing transformations across multiple objects, the `Quaternions` namespace for quaternion calculations, and a second `TransformableObject` namespace containing types related to the class.

This README mainly describes the methods and properties provided by the `TransformableObject` class.

### Creating Objects

The library supports three types of `TransformableObject`, each with its own creation method.

```typescript
let obj = TransformableObject.createRuntimeObject(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25),
    1
);

let existingObj = TransformableObject.createExistingObject(
    mod.GetSpatialObject(1)
);
```

#### `createRuntimeObject`

```typescript
static createRuntimeObject(
    prefabEnum,
    position,
    rotation,
    offset?,
    scale?
): TransformableObject

static createRuntimeObject(
    prefabEnum,
    position,
    angle,
    axis,
    offset?,
    scale?
): TransformableObject
```

Creates a new runtime object and returns it as a `TransformableObject`.

- `prefabEnum: TransformableObject.PrefabEnum`

  Specifies the prefab to spawn, such as `mod.RuntimeSpawn_Common.FiringRange_Floor_01`.

- `position: mod.Vector`

  Specifies the world position at which the object is created.

There are two ways to specify the initial orientation of the object.

1. **Specify Euler angles, as with `mod.SpawnObject`**

   - `rotation: mod.Vector`

     Specifies the initial orientation of the object using Euler angles. This method can be used in a similar way to `mod.SpawnObject`, and values can be copied from Godot. Before copying rotation values from Godot, set the Rotation Order to `ZYX`.

<p align="center">
<img width="352" height="410" alt="Godot Rotation Order setting" src="https://github.com/user-attachments/assets/4c514fbe-2082-45d7-87c5-65d1c9307f3c" />
</p>

2. **Specify a rotation angle and axis relative to the object's default orientation**

   - `angle: number`

     Specifies the rotation angle in radians.

   - `axis: mod.Vector`

     Specifies the rotation axis. The initial orientation is determined by rotating the object's default orientation around `axis` by `angle`. Once understood, this method can be more intuitive than using Euler angles.

- `offset: mod.Vector` *(optional)*

  Specifies a positional offset for the spawned object. This setting is especially important when rotating an object.

  For example, `mod.RuntimeSpawn_Common.FiringRange_Floor_01` is a standard flat object measuring 20.5 × 20.5 units, but its in-game origin is located at one of its corners. As a result, rotating it with a function such as `mod.RotateObject` causes it to rotate around that corner. The official functions do not provide a direct way to rotate it around another point, such as the center of the object.

  For this prefab, setting `offset` to `mod.CreateVector(-10.25, 0, -10.25)` changes the center used by methods such as `rotate` to the center of the panel.

  When omitted, `offset` is treated as `mod.CreateVector(0, 0, 0)`.

<p align="center">
<img width="547" height="322" alt="Offset example" src="https://github.com/user-attachments/assets/a44f80ea-03b6-4430-9b3b-5825e87e1698" />
</p>

- `scale: number` *(optional)*

  Specifies the scale of the object. When omitted, `scale` is treated as `1`.

> ⚠️ In the current version of Battlefield 6, rotating a scaled object with official functions such as `mod.SetObjectTransform` or `mod.MoveObject` may cause its visual rotation to become misaligned.<br>
> For this reason, using this argument is not currently recommended.

#### `createEmptyObject`

```typescript
static createEmptyObject(
    position,
    rotation,
    scale?
): TransformableObject

static createEmptyObject(
    position,
    angle,
    axis,
    scale?
): TransformableObject
```

Creates an empty `TransformableObject` that has transformation data but does not contain an in-game object. It is similar to a `Node3D` in Godot and is mainly used as a parent for grouping and moving multiple objects together.

#### `createExistingObject`

```typescript
static createExistingObject(
    object,
    offset?,
    scale?
): TransformableObject
```

Allows an object that already exists in the game to be managed as a `TransformableObject`.

- `object: Object`

  Specifies the existing object to manage.

### Creating Child Objects

These methods create a new `TransformableObject` as a child of the target object. Their behavior is primarily based on Godot's child-node system.

The arguments have the same meanings as those used by the object creation methods. `offset` and `scale` are optional.

However, note that **the supplied `position`, `rotation`, `angle`, and `axis` values are interpreted in the local coordinate system of the parent object**.

```typescript
let root = TransformableObject.createEmptyObject(
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0)
);

let child = root.createRuntimeChild(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25)
);

let camera = root.createExistingChild(mod.GetFixedCamera(1));
```

#### `createRuntimeChild`

```typescript
createRuntimeChild(
    prefabEnum,
    position,
    rotation,
    offset?,
    scale?
): TransformableObject | undefined

createRuntimeChild(
    prefabEnum,
    position,
    angle,
    axis,
    offset?,
    scale?
): TransformableObject | undefined
```

Creates a new runtime object as a child of the target object. If the target object has already been deleted, the method returns `undefined`.

#### `createEmptyChild`

```typescript
createEmptyChild(
    position,
    rotation,
    scale?
): TransformableObject | undefined

createEmptyChild(
    position,
    angle,
    axis,
    scale?
): TransformableObject | undefined
```

Creates a new empty object as a child of the target object. If the target object has already been deleted, the method returns `undefined`.

#### `createExistingChild`

```typescript
createExistingChild(
    object,
    offset?,
    scale?
): TransformableObject | undefined
```

Allows an object that already exists in the game to be managed as a child of the target object. If the target object has already been deleted, the method returns `undefined`.

### Managing Objects

The object-management methods can be used as follows:

```typescript
let root = TransformableObject.createEmptyObject(
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0)
);

let child = root.createRuntimeChild(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25)
);

child?.detachFromParent();

let camera = TransformableObject.createExistingObject(
    mod.GetFixedCamera(1)
);

camera.attachAsChild(root);
root.remove();
```

#### `attachAsChild`

```typescript
attachAsChild(newParent): void
```

Attaches the target object as a child of the specified object.

- `newParent: TransformableObject`

  Specifies the new parent object.

#### `detachFromParent`

```typescript
detachFromParent(): void
```

Removes the target object from its current parent, if it has one.

#### `remove`

```typescript
remove(): void
```

Removes the target `TransformableObject`. If it has child objects, they are removed recursively as well.

When the target is an existing object, the original in-game object is not deleted. It is only removed from the management of `TransformableObject`.

Most method calls made on a `TransformableObject` after `remove` has been called will fail.

### Moving and Rotating Objects

Movement and rotation with this library follow a two-step process:

1. Schedule movement and rotation with `move` and `rotate`.
2. Apply all scheduled transformations to the actual objects with `applyTransform`.

The actual objects do not move until `applyTransform` is called.

**A child object belongs to the local coordinate system of its parent, so movement and rotation applied directly to the child are interpreted in that local coordinate system.**

When movement or rotation is applied to an object that has children, **the parent and all of its children move together while preserving their relative positions and orientations**.

> ⚠️ Objects managed by `TransformableObject` are not designed to be moved externally with functions such as `mod.MoveObject`. Do not use those functions on managed objects.

```typescript
let obj = TransformableObject.createRuntimeObject(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25),
    1
);

obj.move(mod.CreateVector(10, 0, 0));
obj.applyTransform();
```

#### `move`

```typescript
move(dpos): void
```

Schedules a relative movement for the object. Call `applyTransform` afterward to apply the movement to the actual object.

- `dpos: mod.Vector`

  Specifies the amount by which the object should move.

#### `rotate`

```typescript
rotate(angle, axis, rotCenter?): void
```

Schedules a rotation using a rotation angle and axis. Call `applyTransform` afterward to apply the rotation to the actual object.

- `angle: number`

  Specifies the rotation angle in radians.

- `axis: mod.Vector`

  Specifies the rotation axis.

- `rotCenter: mod.Vector` *(optional)*

  Specifies the center of rotation in world coordinates. When omitted, the object rotates around its own effective position.

#### `applyTransform`

```typescript
applyTransform(): void
```

Applies the movement and rotation scheduled with `move` and `rotate` to the actual object. If the object has children, the method is also called recursively for all descendants.

### Vector Conversion

These methods convert vectors between the world coordinate system and the local coordinate system of the parent to which the target object belongs.

```typescript
let obj = TransformableObject.createRuntimeObject(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25),
    1
);

obj.localToWorldVector(mod.CreateVector(20, 0, 0));
```

#### `localToWorldVector`

```typescript
localToWorldVector(vector): mod.Vector
```

Converts a vector from the local coordinate system to the world coordinate system.

#### `worldToLocalVector`

```typescript
worldToLocalVector(vector): mod.Vector
```

Converts a vector from the world coordinate system to the local coordinate system.

#### `effectiveLocalToWorldVector`

```typescript
effectiveLocalToWorldVector(vector): mod.Vector
```

Converts a vector from the local coordinate system to the world coordinate system while also accounting for transformations currently scheduled on the parent object.

#### `effectiveWorldToLocalVector`

```typescript
effectiveWorldToLocalVector(vector): mod.Vector
```

Converts a vector from the world coordinate system to the local coordinate system while also accounting for transformations currently scheduled on the parent object.

### Properties

The following properties expose information held by a `TransformableObject`.

When the target object has already been deleted, most properties return `undefined`, with a few exceptions.

```typescript
let obj = TransformableObject.createRuntimeObject(
    RuntimeSpawn_Common.FiringRange_Floor_01,
    mod.CreateVector(0, 100, 0),
    mod.CreateVector(0, 0, 0),
    mod.CreateVector(-10.25, 0, -10.25),
    1
);

let object = obj.object;
let position = obj.worldPos;
```

#### `object`

- `object: Object | undefined`

  Returns the managed in-game object itself. Returns `undefined` when the target is an empty object.

#### `id`

- `id: number | undefined`

  Returns the object ID of the managed object. Returns `undefined` when the target is an empty object.

#### `prefabEnum`

- `prefabEnum: TransformableObject.PrefabEnum | undefined`

  Returns the prefab enum used to create the object. Returns `undefined` when the target is not a runtime object.

#### `offset`

- `offset: mod.Vector`

  Returns the offset that was assigned when the object was created.

#### `worldPos`

- `worldPos: mod.Vector | undefined`

  Returns the object's current position in world coordinates.

#### `effectiveWorldPos`

- `effectiveWorldPos: mod.Vector | undefined`

  Returns the object's planned position in world coordinates, including transformations that have been scheduled but not yet applied.

#### `localPos`

- `localPos: mod.Vector | undefined`

  Returns the object's current position in the local coordinate system of its parent.

#### `effectiveLocalPos`

- `effectiveLocalPos: mod.Vector | undefined`

  Returns the object's planned position in the local coordinate system of its parent, including transformations that have been scheduled but not yet applied.

<p align="center">
<img width="630" height="388" alt="World and local coordinates" src="https://github.com/user-attachments/assets/1c056632-7f13-49a8-832e-8a9eedf3706c" />
</p>

#### `worldRot`

- `worldRot: mod.Vector | undefined`

  Returns the object's current orientation in world coordinates as Euler angles.

#### `effectiveWorldRot`

- `effectiveWorldRot: mod.Vector | undefined`

  Returns the object's planned orientation in world coordinates, including rotations that have been scheduled but not yet applied.

#### `localRot`

- `localRot: mod.Vector | undefined`

  Returns the object's current orientation as Euler angles in the local coordinate system of its parent.

#### `effectiveLocalRot`

- `effectiveLocalRot: mod.Vector | undefined`

  Returns the object's planned orientation in the local coordinate system of its parent, including rotations that have been scheduled but not yet applied.

#### `worldScale`

- `worldScale: number | undefined`

  Returns the object's scale in world coordinates.

#### `localScale`

- `localScale: number | undefined`

  Returns the object's scale relative to the local coordinate system of its parent.

#### `parent`

- `parent: TransformableObject | undefined`

  Returns the parent object. Returns `undefined` when the target does not have a parent.

#### `children`

- `children: Set<TransformableObject> | undefined`

  Returns the target's direct child objects as a TypeScript `Set`.

#### `deleted`

- `deleted: boolean`

  Returns whether the object has already been deleted. Returns `true` if it has been deleted and `false` if it still exists.
