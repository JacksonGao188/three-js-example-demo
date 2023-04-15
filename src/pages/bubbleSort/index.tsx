import { FC, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import styles from '@styles/index.module.css';
import { Button, Space, message } from "antd";

// 场景
const scene = new THREE.Scene();
// 渲染器
const renderer = new THREE.WebGLRenderer({ alpha: true })
// 正投影 相机
const { innerWidth, innerHeight } = window;
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
camera.position.set(40, 0, 20);
camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);
scene.add(camera)
// 坐标轴助手
const axes = new THREE.AxesHelper( 16 );
scene.add(axes);
// 网格助手
const gridHelper = new THREE.GridHelper( 30, 10 );
gridHelper.rotateX( Math.PI / 2 );
scene.add( gridHelper );
// 轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
// 盒子网格集合
const Group = new THREE.Group();
let randomArr: { zHeight: number, name: string }[] = [];

const BubbleSort: FC = () => {
  const threeRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);
  const [isSorting, setIsSorting] = useState<boolean>(false);

  const initSize = useCallback(() => {
    const _threeRef = threeRef.current;
    let width = _threeRef?.offsetWidth || 0;
    let zHeight = _threeRef?.offsetHeight || 0;
    renderer.setSize(width, zHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  }, [])

  const animate = useCallback(() => {
    timer.current = requestAnimationFrame(() => {
      controls.update();
      renderer.render(scene, camera);
      animate()
    })
  }, [])
  // 最高柱体高度
  const maxZLen = 16;
  // 随机数组长度
  const sortsLen = 10;
  // 生成随机数组
  const createRandomArr = () => {
    const arr = [];
    for (let i = 0; i < sortsLen; i++) {
      const random = Math.ceil(Math.random() * maxZLen)
      arr.push({
        zHeight: random,
        name: `${i}-${random}`
      });
    }
    return arr;
  };
  
  // 输出一个盒子网格对象
  const createBoxMesh = (zHeight: number, index: number, color: number) => {
    const geometry = new THREE.BoxGeometry( 2, 2, zHeight );
    const material = new THREE.MeshBasicMaterial({ color });
    const boxMesh = new THREE.Mesh( geometry, material );
    boxMesh.position.set(0, -15 + index * 3 + 1.5, zHeight / 2);
    boxMesh.name = `${index}-${zHeight}`;
    return boxMesh;
  }
  // 根据生成随机数组来生产柱体
  const onCreateRandomArr = () => {
    if (randomArr.length) {
      randomArr.length = 0;
      Group.clear();
    }
    randomArr = createRandomArr();
    randomArr.forEach((item, index) => {
      const color = 0xFFFFFF * Math.random();
      const boxMesh = createBoxMesh(item.zHeight, index, color);
      Group.add(boxMesh);
    })
    scene.add(Group);
  }

  // 开始排序
  const onStartSort = async () => {
    if (!randomArr.length) return message.info('请先点击生成随机数按钮');
    setIsSorting(true);
    await bubbleSort();
    setIsSorting(false);
  }

  // 冒泡排序
  const bubbleSort = async () => {
    let randomArrLen = randomArr.length;
    let sorted = false;
    while (!sorted) {
      sorted = true;
      for (let i = 0; i < randomArrLen - 1; i++) {
        if (randomArr[i].zHeight > randomArr[i + 1].zHeight) {
          await setMeshPositionByName(randomArr[i].name, randomArr[i + 1].name);
          [randomArr[i], randomArr[i + 1]] = [randomArr[i + 1], randomArr[i]];
          sorted = false;
        }
      }
      randomArrLen--;
    }
    return true;
  }

  const setMeshPositionByName = (leftMeshName: string, rightMeshName: string): Promise<string> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const groupChildren = Group.children;
        if (!groupChildren.length) return resolve('over');
        const leftMesh: any = Group.getObjectByName(leftMeshName);
        const rightMesh: any  = Group.getObjectByName(rightMeshName);
        [leftMesh.position.y, rightMesh.position.y] = [rightMesh.position.y, leftMesh.position.y];
        resolve('success')
      }, 1000)
    })
  }

  useEffect(() => {
    initSize();
    threeRef.current?.appendChild(renderer.domElement);
    animate();
    return () => {
      cancelAnimationFrame(timer.current);
      randomArr.length = 0;
      Group.clear();
    }
  }, [animate, initSize])

  return (
    <>
      <Space style={{ margin: '10px' }} >
        <Button onClick={onCreateRandomArr} disabled={isSorting}>生成随机数组</Button>
        <Button onClick={onStartSort} disabled={isSorting}>开始排序</Button>
      </Space>
      <div className={styles.container} ref={threeRef} />
    </>
  )
}

export default BubbleSort;