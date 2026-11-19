let bgSprite1;
let bgSprite2;
let bgOffsetX = 0;
let characterSprite;
let walkSprite;
let magicSprite;
let magicEffectSprite;
let characterX;
let isWalking = false;
let facingDirection = 1;
let isCasting = false;
let magicStartFrame = 0;
let magicDirection = 1;
let spaceIsDown = false;
let activeEffects = [];
let canvasElt = null;

const frameCountInSprite = 10;
const frameWidth = 139.5;
const frameHeight = 196;
const walkFrameCount = 9;
const walkFrameWidth = 1246 / walkFrameCount;
const walkFrameHeight = 198;
const magicFrameCount = 4;
const magicFrameWidth = 1039 / magicFrameCount;
const magicFrameHeight = 146;
const effectFrameCount = 5;
const effectFrameWidth = 740 / effectFrameCount;
const effectFrameHeight = 19;
const framesPerStep = 8;

function isRightKeyPressed() {
  return (
    keyIsDown(RIGHT_ARROW) ||
    keyIsDown(39) ||
    keyIsDown(68) // D
  );
}

function isLeftKeyPressed() {
  return (
    keyIsDown(LEFT_ARROW) ||
    keyIsDown(37) ||
    keyIsDown(65) // A
  );
}

function loadImageWithFallback(paths, onSuccess) {
  let index = 0;
  function tryNext() {
    if (index >= paths.length) return;
    const currentPath = paths[index++];
    loadImage(
      currentPath,
      (img) => onSuccess(img),
      () => tryNext()
    );
  }
  tryNext();
}

function preload() {
  loadImageWithFallback(["bg.png", "bg/bg.png"], (img) => {
    bgSprite1 = img;
  });
  loadImageWithFallback(["bg1.png", "bg/bg1.png"], (img) => {
    bgSprite2 = img;
  });

  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");
}

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  canvasElt = cnv.elt;
  canvasElt.tabIndex = 0;
  canvasElt.focus();
  frameRate(60);

  const targetCharacterHeight = height / 3;
  const characterScale = targetCharacterHeight / frameHeight;
  const characterWidth = frameWidth * characterScale;
  characterX = constrain((width * 2) / 3, characterWidth / 2, width - characterWidth / 2);
}

function mousePressed() {
  if (canvasElt && typeof canvasElt.focus === "function") {
    canvasElt.focus();
  }
}

function draw() {
  background("#87CEEB");

  const leftRightBg =
    bgSprite1 && bgSprite1.width && bgSprite1.height
      ? bgSprite1
      : bgSprite2 && bgSprite2.width && bgSprite2.height
      ? bgSprite2
      : null;
  const centerBg =
    bgSprite2 && bgSprite2.width && bgSprite2.height
      ? bgSprite2
      : leftRightBg;

  const targetCharacterHeight = height / 3;
  const characterScale = targetCharacterHeight / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = targetCharacterHeight;

  const hasBg = Boolean(leftRightBg && centerBg);
  const bgScale = hasBg ? height / centerBg.height : 1;
  const bgWidth = hasBg ? centerBg.width * bgScale : width;
  const bgHeight = height;
  const totalBgWidth = bgWidth * 3;
  const maxBgOffsetX = 0;
  const minBgOffsetX = min(0, width - totalBgWidth);

  const movingRight = isRightKeyPressed();
  const movingLeft = isLeftKeyPressed();
  isWalking = movingRight || movingLeft;
  const movementStep = constrain(width * 0.004, 2, 8);

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    if (bgOffsetX > minBgOffsetX) {
      bgOffsetX = max(minBgOffsetX, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    if (bgOffsetX < maxBgOffsetX) {
      bgOffsetX = min(maxBgOffsetX, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  if (hasBg) {
    push();
    imageMode(CORNER);
    image(leftRightBg, bgOffsetX, 0, bgWidth, bgHeight);
    image(centerBg, bgOffsetX + bgWidth, 0, bgWidth, bgHeight);
    image(leftRightBg, bgOffsetX + bgWidth * 2, 0, bgWidth, bgHeight);
    pop();
  }

  imageMode(CENTER);

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;

  if (activeSprite && activeSprite.width && activeSprite.height) {
    const elapsedMagicFrames = frameCount - magicStartFrame;
    const frameIndex = isCasting
      ? floor(elapsedMagicFrames / framesPerStep)
      : floor(frameCount / framesPerStep) % activeFrameCount;
    const sourceX = frameIndex * activeFrameWidth;
    const activeWidth = activeFrameWidth * characterScale;
    const activeHeight = activeFrameHeight * characterScale;
    const characterY = height - activeHeight / 2;

    push();
    translate(characterX, characterY);
    scale(isCasting ? magicDirection : facingDirection, 1);
    image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
    pop();
  }

  if (magicEffectSprite && magicEffectSprite.width && magicEffectSprite.height) {
    const effectScale = characterScale;
    const effectWidth = effectFrameWidth * effectScale;
    const effectHeight = effectFrameHeight * effectScale;
    const effectSpeed = max(6, width * 0.008);

    for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
      const effect = activeEffects[effectIndex];
      effect.x += effect.direction * effectSpeed;
      if (effect.x > width || effect.x < 0) {
        activeEffects.splice(effectIndex, 1);
        continue;
      }
      const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
      push();
      translate(effect.x, effect.y);
      scale(effect.direction, 1);
      image(
        magicEffectSprite,
        0,
        0,
        effectWidth,
        effectHeight,
        effectFrameIndex * effectFrameWidth,
        0,
        effectFrameWidth,
        effectFrameHeight
      );
      pop();
    }
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW || keyCode === 39 || keyCode === 68) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW || keyCode === 37 || keyCode === 65) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const targetCharacterHeight = height / 3;
  const characterScale = targetCharacterHeight / frameHeight;
  const characterWidth = frameWidth * characterScale;
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);
}