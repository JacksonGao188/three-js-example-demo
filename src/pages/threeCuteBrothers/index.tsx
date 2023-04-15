import { FC, useCallback, useEffect, useRef } from "react";
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useLilGui } from "@hooks";
import styles from '@styles/index.module.css';

type Params = {
  angleIndex: number,
  axisOfRotation: number,
  lightIndex: number,
}

const params: Params = {
  angleIndex: 0.005,
  axisOfRotation: 1,
  lightIndex: 0.5,
};

// 场景
const scene = new THREE.Scene();
// 渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true })
// 正投影 相机
const camera = new THREE.OrthographicCamera();
// 环境光
let ambient = new THREE.AmbientLight(0xffffff, params.lightIndex)
scene.add(ambient)
// 方向光
const directionalLight = new THREE.DirectionalLight(0xffffff)
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 80;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(-20, 0, 2);
scene.add(directionalLight);
// 萌三兄弟对象
let threeCuteBrothers: any = null;
// 加载萌三兄弟glb模型文件
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
// draco是谷歌出的一款模型压缩工具，可以将glb/gltf格式的模型进行压缩用以提高页面加载速度。
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.load('/glb/threeCuteBrothers.glb', (glb) => {
  glb.scene.children.forEach(item => {
    item.castShadow = true;
    item.receiveShadow = true;
    // 注意模型内部的命名要与这里代码的命名保持一致哦, 我在Blender里把三个模型合成里一个模型。
    if (item.name === 'threeCuteBrothers') {
      threeCuteBrothers = item;
    };
  })
  scene.add(glb.scene)
})
// 坐标轴助手
const axes = new THREE.AxesHelper( 6 );
scene.add(axes);
// 网格助手
const gridHelper = new THREE.GridHelper( 10, 10 );
gridHelper.rotateX( Math.PI );
scene.add( gridHelper );
// 轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);

const ThreeCuteBrothers: FC = () => {
  const threeRef = useRef<HTMLDivElement>(null);
  const [isload, guiEntity, destroyEntity] = useLilGui('Modify Model Parameters');
  const timer = useRef<number>(0);

  const initSize = useCallback(() => {
    const _threeRef = threeRef.current;
    let width = _threeRef?.offsetWidth || 0;
    let height = _threeRef?.offsetHeight || 0;
    let aspect = width / height;
    let frustrum = 10;
    let pixelRatio = Math.min(window.devicePixelRatio, 3);
    camera.left = (-aspect * frustrum) / 2;
    camera.right = (aspect * frustrum) / 2;
    camera.top = frustrum / 2;
    camera.bottom = -frustrum / 2;
    camera.position.set(-20, 4, 0);
    // threejs会重新计算相机对象的投影矩阵值。无论正投影相机还是投影投影相机对象的.near和.far属性变化，都需要手动更新相机对象的投影矩阵。
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
  }, [])

  const updateParams = (e: number, type: keyof Params) => params[type] = e;

  // 添加 Gui 调参可选项
  const addParametersForGui = useCallback(() => {
    const aboutAxis =  guiEntity.addFolder('Axis');
    aboutAxis?.add(params, 'axisOfRotation').min(0).max(2).step(1).onFinishChange((e: number) => updateParams(e, 'axisOfRotation'));
    const aboutIndex =  guiEntity.addFolder('Index');
    aboutIndex?.add(params, 'angleIndex').min(-3.1416).max(3.1416).step(0.005).onFinishChange((e: number) => updateParams(e, 'angleIndex'));
    aboutIndex?.add(params, 'lightIndex').min(0).max(1).step(0.1).onFinishChange((e: number) => updateParams(e, 'lightIndex'));
  }, [guiEntity])

  useEffect(() => {
    if (!isload) return;
    addParametersForGui();
    return () => {
      // 销毁 Gui 实例
      destroyEntity();
    }
  }, [addParametersForGui, destroyEntity, isload])

  const animate = useCallback(() => {
    timer.current = requestAnimationFrame(() => {
      // 修改模型的旋转轴
      let axis = new THREE.Vector3(1, 0, 0);
      if (params.axisOfRotation === 1) axis = new THREE.Vector3(0, 1, 0);
      if (params.axisOfRotation === 2) axis = new THREE.Vector3(0, 0, 1);
      // Quaternion四元数方法修改模型每帧旋转的角度
      const qInitial = new THREE.Quaternion().setFromAxisAngle( axis, params.angleIndex );
      threeCuteBrothers?.applyQuaternion(qInitial)
      // 修改环境光照的亮度
      scene.remove(ambient)
      ambient = new THREE.AmbientLight(0xffffff, params.lightIndex)
      scene.add(ambient)
      
      controls.update();
      renderer.render(scene, camera);
      animate()
    })
  }, [])

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

export default ThreeCuteBrothers;