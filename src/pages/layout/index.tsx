import { ReactNode, useMemo, useState } from 'react';
import styles from './styles.module.css';
import { Radio, Switch } from 'antd';
import ThreeCuteBrothers from '../threeCuteBrothers';
import BubbleSort from '../bubbleSort';
import { useTheme } from '@hooks';

type TEType = 'ThreeCuteBrothers' | 'BubbleSort';

const Layout = () => {
  const cacheTEType = localStorage.getItem('TEType') || 'ThreeCuteBrothers';
  const [curTEType, setCurTEType] = useState<TEType>(cacheTEType as TEType);
  const [theme, switchTheme] = useTheme();
  
  const tETypeKey = ['ThreeCuteBrothers', 'BubbleSort'];
  const tETypeName = ['萌三兄弟', '可视化冒泡排序'];

  const _ThreeCuteBrothers = useMemo(() => <ThreeCuteBrothers />, []);
  const _BubbleSort = useMemo(() => <BubbleSort />, []);

  const getComponents = (curTEType: TEType): ReactNode => {
    const components = {
      'ThreeCuteBrothers': _ThreeCuteBrothers,
      'BubbleSort': _BubbleSort
    }
    return components[curTEType];
  }

  const onChange = (e: any) => {
    setCurTEType(e.target.value);
    localStorage.setItem('TEType', e.target.value);
  };

  return (
    <>
      <div className={styles.title}>
        <Radio.Group onChange={onChange} value={curTEType} >
          { 
            tETypeKey.map((item, index) =>
              <Radio 
                key={item}
                value={item}
                className={styles.radio}
              >
                {tETypeName[index]}
              </Radio>
            ) 
          }
        </Radio.Group>
        <Switch
          checkedChildren="🌞"
          unCheckedChildren="🌙"
          checked={theme === 'light'}
          onChange={switchTheme}
        />
      </div>
      <div className={styles.container}>
        { getComponents(curTEType) }
      </div>
    </>
  )
}

export default Layout;