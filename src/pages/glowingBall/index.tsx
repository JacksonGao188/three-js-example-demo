import styles from '@styles/index.module.css';
import { useCallback, useEffect, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import CompositionShader from './shaders';
import { useLilGui } from '@/hooks';
import * as THREE from 'three';

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

const params = {
  exposure: 1,
  bloomStrength: 5,
  bloomThreshold: 0,
  bloomRadius: 0,
  scene: 'Scene with Glow'
};

let bloomComposer: any, finalComposer: any, bloomPass: any, renderScene: any;
const materials: any = {};

// 场景
const scene = new THREE.Scene();
// 渲染器
const renderer = new THREE.WebGLRenderer( { alpha: true } );
// 相机
const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 200 );
camera.position.set( 0, 0, 20 );
camera.lookAt( 0, 0, 0 );
// 控制器
const controls = new OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI * 0.5;
controls.minDistance = 1;
controls.maxDistance = 100;
// 环境光
const ambientLight = new THREE.AmbientLight( 0x404040 );
scene.add(ambientLight);

const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

const GlowingBall = () => {
  const threeRef = useRef<HTMLDivElement>(null);
  const [isload, guiEntity, destroyEntity] = useLilGui('Materials Variations Parameters');
  const timer = useRef<number>(0);

  const disposeMaterial = ( meshObj: THREE.Event ) => {
    if ( meshObj.material ) meshObj.material.dispose();
  }

  const darkenNonBloomed = ( meshObj: THREE.Event ) => {
    if ( meshObj.isMesh && bloomLayer.test( meshObj.layers ) === false ) {
      materials[ meshObj.uuid ] = meshObj.material;
      meshObj.material = darkMaterial;
    }
  }
  
  const restoreMaterial = ( meshObj: THREE.Event ) => {
    if ( materials[ meshObj.uuid ] ) {
      meshObj.material = materials[ meshObj.uuid ];
      delete materials[ meshObj.uuid ];
    }
  }
  
  const renderBloom = useCallback(( mask: boolean ) => {
    if ( mask ) {
      scene.traverse( darkenNonBloomed );
      bloomComposer.render();
      scene.traverse( restoreMaterial );
    } else {
      camera.layers.set( BLOOM_SCENE );
      bloomComposer.render();
      camera.layers.set( ENTIRE_SCENE );
    }
  }, [])

  const render = useCallback(() => {
    switch ( params.scene ) {
      case 'Scene only':
        renderer.render( scene, camera );
        break;
      case 'Glow only':
        renderBloom( false );
        break;
      case 'Scene with Glow':
      default:
        renderBloom( true );
        finalComposer.render();
        break;
    }
  }, [renderBloom])

  const setupScene = useCallback(() => {
    scene.traverse( disposeMaterial );
    scene.children.length = 0;
    const geometry = new THREE.IcosahedronGeometry( 1, 15 );
    for ( let i = 0; i < 100; i ++ ) {
      const color = new THREE.Color();
      color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );
      const material = new THREE.MeshBasicMaterial( { color: color } );
      const sphere = new THREE.Mesh( geometry, material );
      sphere.position.x = Math.random() * 100 - 50;
      sphere.position.y = Math.random() * 100 - 50;
      sphere.position.z = Math.random() * 100 - 50;
      sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
      sphere.scale.setScalar( Math.random() * Math.random() + 0.5 );
      scene.add( sphere );
      if ( Math.random() < 0.5 ) sphere.layers.enable( BLOOM_SCENE );
    }
  }, [])


  const onPointerDown = useCallback(( event: any ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    const intersects = raycaster.intersectObjects( scene.children, false );
    if ( intersects.length > 0 ) {
      const object = intersects[ 0 ].object;
      object.layers.toggle( BLOOM_SCENE );
      render();
    }
  }, [render])

  const initSize = useCallback(() => {
    const _threeRef = threeRef.current;
    const width = _threeRef?.offsetWidth || 0;
    const height = _threeRef?.offsetHeight || 0;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    renderer.toneMapping = THREE.ReinhardToneMapping;

    renderScene = new RenderPass( scene, camera );

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    bloomComposer = new EffectComposer( renderer );
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass( renderScene );
    bloomComposer.addPass( bloomPass );

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture }
        },
        vertexShader: CompositionShader.vertex,
        fragmentShader: CompositionShader.fragment,
        defines: {}
      }), 'baseTexture'
    );
    finalPass.needsSwap = true;

    finalComposer = new EffectComposer( renderer );
    finalComposer.addPass( renderScene );
    finalComposer.addPass( finalPass );
    setupScene();
  
    window.addEventListener( 'pointerdown', onPointerDown );

  }, [onPointerDown, setupScene])

  const animate = useCallback(() => {
    timer.current = requestAnimationFrame(() => {
      controls.update();
      render()
      animate()
    })
  }, [render])

  // 添加 Gui 调参可选项
  const addParametersForGui = useCallback(() => {
    const sceneAndGlowFolder =  guiEntity.addFolder('Scene & Glow');
    sceneAndGlowFolder?.add( params, 'scene', [ 'Scene with Glow', 'Glow only', 'Scene only' ] ).onChange( function ( value: any ) {
      switch ( value ) 	{
        case 'Scene with Glow':
          bloomComposer.renderToScreen = false;
          break;
        case 'Glow only':
          bloomComposer.renderToScreen = true;
          break;
        case 'Scene only':
          break;
      }
      render();
    });

    const bloomFolder = guiEntity.addFolder('Bloom');
    bloomFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value: any ) {
      renderer.toneMappingExposure = Math.pow( value, 4.0 );
      render();
    });

    bloomFolder.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value: any ) {
      bloomPass.threshold = Number( value );
      render();
    });

    bloomFolder.add( params, 'bloomStrength', 0.0, 10.0 ).onChange( function ( value: any ) {
      bloomPass.strength = Number( value );
      render();
    });
    
    bloomFolder.add( params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value: any ) {
      bloomPass.radius = Number( value );
      render();
    });
  }, [guiEntity, render])

  useEffect(() => {
    if (!isload) return;
    addParametersForGui();
    return () => {
      // 销毁 Gui 实例
      destroyEntity();
    }
  }, [addParametersForGui, destroyEntity, isload])

  useEffect(() => {
    initSize();
    threeRef.current?.appendChild(renderer.domElement);
    animate();
    return () => {
      cancelAnimationFrame(timer.current);
    }
  }, [animate, initSize])

  return (
    <div className={styles.container} ref={threeRef} />
  )
}

export default GlowingBall;