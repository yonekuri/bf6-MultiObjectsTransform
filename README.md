# bf6-MultiObjectTransform
[※日本語の解説はこちらです](https://github.com/yonekuri/bf6-MultiObjectsTransform/blob/main/README-JP.md)

This script supports moving objects and rotating them around any axis within the BF6 Portal, as well as combining these motions.
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

