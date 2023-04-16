import { FC, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import styles from '@styles/index.module.css';
import { Button, Select, Space, message } from "antd";

type SortType = 'bubbleSort' | 'quickSort' | 'selectionSort' | 'insertionSort' | 'shellSort';
type RandomArrType = { zHeight: number, name: string }[];

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
controls.minDistance = 40;
controls.maxDistance = 50;
// 盒子网格集合
const Group = new THREE.Group();
let randomArr: RandomArrType = [];

const VisualSortingAlgorithm: FC = () => {
  const [curSortName, setCurSortName] = useState<SortType>('bubbleSort');
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const threeRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);

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
    if (!randomArr.length) return message.info('请先点击生成随机数组按钮');
    setIsSorting(true);
    if (curSortName === 'bubbleSort') await bubbleSort(randomArr);
    if (curSortName === 'quickSort') await quickSort(randomArr, 0, randomArr.length - 1);
    if (curSortName === 'selectionSort') await selectionSort(randomArr);
    if (curSortName === 'insertionSort') await insertionSort(randomArr);
    if (curSortName === 'shellSort') await shellSort(randomArr);
    setIsSorting(false);
  }

  // 冒泡排序
  const bubbleSort = async (arr: any[]) => {
    let arrLen = arr.length;
    let sorted = false;
    while (!sorted) {
      sorted = true;
      for (let i = 0; i < arrLen - 1; i++) {
        if (arr[i].zHeight > arr[i + 1].zHeight) {
          await exchangeMeshPositionByName(arr[i].name, arr[i + 1].name);
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          sorted = false;
        }
      }
      arrLen--;
    }
    return arr;
  }

  // 快速排序
  const quickSort = async (arr: RandomArrType, left: number, right: number) => {
    let partitionIndex;
    if (left < right) {
      partitionIndex = await partition(arr, left, right);
      await quickSort(arr, left, partitionIndex - 1);
      await quickSort(arr, partitionIndex + 1, right);
    }
    return arr;
  };
  const partition = async (arr: RandomArrType, left: number, right: number) => {
    let pivot = left, index = pivot + 1;
    for (let i = index; i <= right; i++) {
      if (arr[i].zHeight < arr[pivot].zHeight) {
        [arr[i], arr[index]] = [arr[index], arr[i]];
        await exchangeMeshPositionByName(arr[i].name, arr[index].name);
        index++;
      }
    }
    [arr[pivot], arr[index - 1]] = [arr[index - 1], arr[pivot]];
    await exchangeMeshPositionByName(arr[pivot].name, arr[index - 1].name);
    return index - 1;
  };

  // 选择排序
  const selectionSort = async (arr: RandomArrType) => {
    const arrLen = arr.length;
    let minIndex;
    for (let i = 0; i < arrLen - 1; i++) {
      minIndex = i;
      for (let j = i + 1; j < arrLen; j++) {
        if (arr[j].zHeight < arr[minIndex].zHeight) minIndex = j;
      }
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      await exchangeMeshPositionByName(arr[i].name, arr[minIndex].name);
    }
    return arr;
  };

  // 插入排序
  const insertionSort = async (arr: RandomArrType) => {
    const arrLen = arr.length;
    if (arrLen <= 1) return arr;
    let preIndex, current;
    for (let i = 1; i < arrLen; i++) {
      preIndex = i - 1; // 待比较元素的下标
      current = arr[i]; // 当前元素
      const curMesh: any = Group.getObjectByName(current.name);
      curMesh.position.z = curMesh.position.z * -1;
      while (preIndex >= 0 && arr[preIndex].zHeight > current.zHeight) {
        // 前置条件之一: 待比较元素比当前元素大
        arr[preIndex + 1] = arr[preIndex]; // 将待比较元素后移一位
        await exchangeMeshPositionByName(arr[preIndex + 1].name, current.name);
        preIndex--; // 待比较元素的下标前移一位
      }
      if (preIndex + 1 !== i) {
        // 避免同一个元素赋值给自身
        arr[preIndex + 1] = current; // 将当前元素插入预留空位
        await sleep();
        curMesh.position.y = Group.getObjectByName(arr[preIndex + 1].name)?.position.y;
      }
      curMesh.position.z = curMesh.position.z * -1;
    }
    return arr;
  };
  
  // 希尔排序
  const shellSort = async (arr: RandomArrType) => {
    let arrLen = arr.length, temp, gap = 1;
    while (gap < arrLen / 3) gap = gap * 3 + 1;
    for (gap; gap > 0; gap = Math.floor(gap / 3)) {
      for (let i = gap; i < arrLen; i++) {
        temp = arr[i];
        let j = i - gap;
        for (; j >= 0 && arr[j].zHeight > temp.zHeight; j -= gap) {
          arr[j + gap] = arr[j];
          await exchangeMeshPositionByName(arr[j + gap].name, temp.name);
        }
        arr[j + gap] = temp;
      }
    }
    return arr;
  };

  const sleep = (delay: number = 1000) => {
    return new Promise(res => {
      setTimeout(() => {
        res(true);
      }, delay)
    })
  }

  const exchangeMeshPositionByName = (leftMeshName: string, rightMeshName: string): Promise<string> => {
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
    <div className={styles.sortSpace}>
      <Space align='center' >
        <Select
          value={curSortName}
          style={{ width: 120 }}
          disabled={isSorting}
          onChange={setCurSortName}
          options={[
            { value: 'bubbleSort', label: '冒泡排序' },
            { value: 'quickSort', label: '快速排序' },
            { value: 'selectionSort', label: '选择排序' },
            { value: 'insertionSort', label: '插入排序' },
            { value: 'shellSort', label: '希尔排序' },
          ]}
        />
        <Button onClick={onCreateRandomArr} disabled={isSorting}>生成随机数组</Button>
        <Button onClick={onStartSort} disabled={isSorting}>开始排序</Button>
      </Space>
    </div>
      <div className={styles.container} ref={threeRef} />
    </>
  )
}

export default VisualSortingAlgorithm;