import { useCallback, useEffect, useState } from "react"

type Theme = 'light' | 'dark';

const useTheme = ():[Theme, (checked: boolean) => void] => {
  const lsTheme = localStorage.getItem('theme') || 'light';
  const [theme, setTheme] = useState(lsTheme as Theme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme);
  }, [theme])

  const switchTheme = useCallback((checked: boolean) => setTheme(checked ? 'light' : 'dark'), []);

  return [theme, switchTheme]
}

export default useTheme;