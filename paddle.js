import * as THREE from 'three';

/* Creates a ping pong paddle, with a customizable logo on the front. Intended to be used
in the final project to create a fully functional ping pong game.
Logo is facing the screen immediately, screen is adjusted to cut out unnecessary screen space.
    Params can be altered as you wish, there are default values in paddle.js that
exist, so no worry for crashes (hopefully). Not everything is intended to be altered with full freedom, geometry issues
can and will happen, but, the permission to edit is kept in-mind for more minor tweaks. ie, making the paddle radius massive is probably
going to lead to more issues than one, but tweaking the size a bit won't. This is intended, as this paddle is meant to serve
a function in the coming project.
Textures can also be freely changed in the paddle.js file, currently there is a placeholder image of a character from the series 'Higurashi no Naku Koro ni'
This can be freely edited.

PaddleBase origin is 0, 0, 0, which is where everything is built off of. So this is the origin.
Has textures already provided that can be easily altered in the "Textures" portion below, just need to upload them


Hopefully this can export, I am a bit not confident in its ability to do so bc I never have done this before.
*/


export function makePaddle(params) {
    const group = new THREE.Group();
    group.name = "paddle";



    // =============
    // Default values in case none are entered.
    const paddleRadius = params.paddleRadius ?? 1;
    const paddleBaseDepth = params.paddleBaseDepth ?? 0.1;
    const paddleBaseTop = params.paddleBaseTop ?? (paddleRadius * 1.01);
    const paddleBaseBottom = params.paddleBaseBottom ?? (paddleRadius * 1.01);
    const handleHeight = params.handleHeight ?? (paddleRadius * 1.1);

    const paddleBaseGeom = new THREE.CylinderGeometry(
        paddleBaseTop, paddleBaseBottom, paddleBaseDepth
    );


    // =============
    // Textures
    const loader = new THREE.TextureLoader();

    // Base Texture
    const baseTexture = loader.load('./textures/baseTexture.jpg');
    baseTexture.colorSpace = THREE.SRGBColorSpace;
    baseTexture.wrapS = THREE.RepeatWrapping;
    baseTexture.wrapT = THREE.RepeatWrapping;
    baseTexture.repeat.set(1, 1);

    // =============
    // Pad Texture
     const padTexture = loader.load('./textures/padTexture.jpg');
     padTexture.colorSpace = THREE.SRGBColorSpace;
     padTexture.wrapS = THREE.RepeatWrapping;
     padTexture.wrapT = THREE.RepeatWrapping;
     padTexture.repeat.set(1, 1);

    // =============
    // Logo Texture
    const logoTexture = loader.load('./textures/logoHanyuu.png');
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.wrapS = THREE.RepeatWrapping;
    logoTexture.wrapT = THREE.RepeatWrapping;
    logoTexture.repeat.set(1, 1);

    // =============
    // Wooden base, consists of the paddle
    // paddleBaseGeom is made prior for ease of sorting out the numbers, the whole paddle falls apart if it isn't handled pretty delicately.
    const paddleBaseMat = new THREE.MeshPhongMaterial({ map: baseTexture });
    const paddleBase = new THREE.Mesh( paddleBaseGeom, paddleBaseMat );
    paddleBase.scale.set(1, 1, 1.22);
    paddleBase.rotation.x = Math.PI / 2;

    // =============

    // Paddle Material (Not wooden base)
    const paddleGeom = new THREE.CircleGeometry(paddleRadius, 48);
    const paddleMat = new THREE.MeshPhongMaterial({ map: padTexture, side: THREE.DoubleSide });
    const paddle = new THREE.Mesh( paddleGeom, paddleMat );
    const paddle2 = new THREE.Mesh( paddleGeom, paddleMat );

    paddle.scale.set(1, 1.2, 1);
    paddle2.scale.set(1, 1.2, 1);

    paddle.position.z = paddleBaseDepth / 2 + .001;
    paddle2.position.z = -(paddleBaseDepth / 2 + .001);  

    // =============

    // Wooden handle, consists of the handle, also extends "handle" upward like on a real paddle
    const paddleHandleGeom = new THREE.CylinderGeometry(0.13, 0.2, handleHeight, 20, 20);
    const paddleHandleMat = new THREE.MeshPhongMaterial({map: baseTexture, side: THREE.DoubleSide});
    const paddleHandle = new THREE.Mesh( paddleHandleGeom, paddleHandleMat);

    paddleHandle.position.y = -(paddleRadius * 1) - handleHeight / 2;

    // =============

    // Lower Paddle Portion
    //     Lower quarter on front face
    //     Will be very honest, had to look up a lot of math for this section. All of this is done so it looks like the padding/cover stops before the bottom like on
    //     a real paddle.
    const r = paddleRadius;
    const yCut = -0.8 * r;   // Lower quarter

    const xCut = Math.sqrt(r * r - yCut * yCut); 

    const thetaLeft = Math.atan2(yCut, -xCut);
    const thetaRight = Math.atan2(yCut, xCut);

    const lowerShape = new THREE.Shape();
    lowerShape.moveTo(-xCut, yCut);

        // Bottom Arc
    lowerShape.absarc(0, 0, r, thetaLeft, thetaRight, false);
    lowerShape.lineTo(-xCut, yCut);

    const lowerPaddleGeom = new THREE.ShapeGeometry(lowerShape, 32);
    const lowerPaddleMat = new THREE.MeshPhongMaterial({ map: baseTexture, side: THREE.DoubleSide});
    const lowerPaddleFront = new THREE.Mesh(lowerPaddleGeom, lowerPaddleMat);
    const lowerPaddleBack = new THREE.Mesh(lowerPaddleGeom, lowerPaddleMat);

        // Places it
    lowerPaddleFront.scale.set(1, 1.21, 1);
    lowerPaddleFront.position.z = paddle.position.z + 0.002;

    lowerPaddleBack.scale.set(1, 1.21, 1);
    lowerPaddleBack.position.z = -(paddle.position.z + 0.002);

    // =============
    // Ping Pong Cover
    const coverGeom = new THREE.CylinderGeometry(paddleBaseTop + .005, paddleBaseBottom + .005, paddleBaseDepth + .001, 32, 32, false, 0.65, 4.979);
    const coverMat = new THREE.MeshBasicMaterial({color: 'black'});
    const coverPaddle = new THREE.Mesh( coverGeom, coverMat );
    coverPaddle.scale.set(1, 1, 1.23);
    coverPaddle.rotation.x = Math.PI / 2;

    // =============
    // Paddle Logo, optional, can not be enabled and not harm anything.
    const logoGeom = new THREE.CircleGeometry(paddleRadius * 0.7, 32);
    const logoMat = new THREE.MeshPhongMaterial({ map: logoTexture, alphaTest: 0.4 });
    const frontLogo = new THREE.Mesh( logoGeom, logoMat );
    const backLogo = new THREE.Mesh( logoGeom, logoMat );

    frontLogo.name = "frontPaddleLogo";
    backLogo.name = "backPaddleLogo";

    frontLogo.scale.set(1, 1, 1);
    frontLogo.position.z = paddleBaseDepth / 2 + .01;

    backLogo.scale.set(1, 1, 1);
    backLogo.position.z = -(paddleBaseDepth / 2 + .01);
    backLogo.rotation.y = Math.PI;

    group.add(paddle);
    group.add(paddle2);
    group.add(paddleBase);
    group.add(paddleHandle);
    group.add(lowerPaddleFront);
    group.add(lowerPaddleBack);
    group.add(coverPaddle);
    group.add(frontLogo);
    group.add(backLogo);

    return group;

}
