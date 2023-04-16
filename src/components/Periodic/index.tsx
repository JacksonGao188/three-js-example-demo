import styles from './index.module.css';

export interface PeriodicProps {
  number: any,
  symbol: any,
  details: any,
}

const Periodic = (props: PeriodicProps) => {
  const { number = 1, symbol = 2, details = 3 } = props;
  return (
    <div 
      className={styles.element}
      onClick={() => console.log(number)}
      style={{ backgroundColor: `rgba(0,127,127,${Math.random() * 0.5 + 0.25 })` }}
    >
      <div className={styles.number}>{number}</div>
      <div className={styles.symbol}>{symbol}</div>
      <div className={styles.details}>{details}</div>
    </div>
  )
}

export default Periodic;