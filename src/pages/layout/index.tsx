import { ReactNode, useMemo, useState } from "react";
import styles from "./styles.module.css";
import { Radio, Switch } from "antd";
import { useTheme } from "@hooks";
import ThreeCuteBrothers from "../threeCuteBrothers";
import VisualSortingAlgorithm from "../visualSortingAlgorithm";
import PeriodicTable from "../periodicTable";
import GlowingBall from "../glowingBall";
import { GithubOutlined } from "@ant-design/icons";

type TEType =
  | "VisualSortingAlgorithm"
  | "ThreeCuteBrothers"
  | "PeriodicTable"
  | "GlowingBall";

const Layout = () => {
  const cacheTEType =
    localStorage.getItem("TEType") || "VisualSortingAlgorithm";
  const [curTEType, setCurTEType] = useState<TEType>(cacheTEType as TEType);
  const [theme, switchTheme] = useTheme();

  const tETypeKey = [
    "VisualSortingAlgorithm",
    "ThreeCuteBrothers",
    "PeriodicTable",
    "GlowingBall",
  ];
  const tETypeName = ["可视化排序算法", "萌三兄弟", "元素周期表", "发光小球"];

  const _VisualSortingAlgorithm = useMemo(() => <VisualSortingAlgorithm />, []);
  const _ThreeCuteBrothers = useMemo(() => <ThreeCuteBrothers />, []);
  const _PeriodicTable = useMemo(() => <PeriodicTable />, []);
  const _MaterialsVariations = useMemo(() => <GlowingBall />, []);

  const getComponents = (curTEType: TEType): ReactNode => {
    const components = {
      VisualSortingAlgorithm: _VisualSortingAlgorithm,
      ThreeCuteBrothers: _ThreeCuteBrothers,
      PeriodicTable: _PeriodicTable,
      GlowingBall: _MaterialsVariations,
    };
    return components[curTEType];
  };

  const onChange = (e: any) => {
    setCurTEType(e.target.value);
    localStorage.setItem("TEType", e.target.value);
  };

  return (
    <>
      <div className={styles.title}>
        <Radio.Group onChange={onChange} value={curTEType}>
          {tETypeKey.map((item, index) => (
            <Radio key={item} value={item} className={styles.radio}>
              {tETypeName[index]}
            </Radio>
          ))}
        </Radio.Group>
        <div className={styles.right}>
          <a
            target="_blank"
            rel="noreferrer"
            className={styles.linkA}
            href="https://github.com/JacksonGao188/three-js-example-demo.git"
          >
            <GithubOutlined style={{ fontSize: "20px" }} />
          </a>
          <Switch
            checkedChildren="🌞"
            unCheckedChildren="🌙"
            checked={theme === "light"}
            onChange={switchTheme}
          />
        </div>
      </div>
      <div className={styles.container}>{getComponents(curTEType)}</div>
    </>
  );
};

export default Layout;
