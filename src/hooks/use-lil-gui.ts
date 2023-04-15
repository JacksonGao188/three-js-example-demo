import * as lilGui from 'lil-gui';
import { useCallback, useEffect, useRef, useState } from 'react';

const useLilGui = (title: string = 'Title') => {
  const GUI = useRef<any>(null);
  const isload = useRef<boolean>(false);
  const [guiEntity, setGuiEntity] = useState<any>(null);
  
  useEffect(() => {
    if (isload.current) return;
    isload.current = true;
    GUI.current = new lilGui.GUI({ title });
    const lilGuiStyle: any = document.getElementsByClassName('lil-gui')[0];
    lilGuiStyle.style.top = '31px';
    lilGuiStyle.style.right = '0';
    GUI.current.close();
    setGuiEntity(GUI.current);
  }, [title])

  const destroyEntity = useCallback(() => {
    setGuiEntity(null);
    GUI.current?.destroy();
    GUI.current = null;
    isload.current = false;
  }, [])

  return [isload.current, guiEntity, destroyEntity]
}

export default useLilGui;