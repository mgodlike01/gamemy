import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Мини-лоадер при переходах.
 * - не срабатывает на первый рендер (чтобы не спорить со стартовым LoadingScreen)
 * - показывает оверлей на duration мс
 * - имеет форс-хайд maxDuration на случай глюков
 */
export function usePageLoader(duration = 600, maxDuration = 2000) {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const firstMount = useRef(true);

    useEffect(() => {
        // пропускаем самый первый рендер приложения
        if (firstMount.current) {
            firstMount.current = false;
            return;
        }

        setLoading(true);

        const t1 = window.setTimeout(() => setLoading(false), duration);
        // страховка: вдруг что-то не размонтировалось
        const t2 = window.setTimeout(() => setLoading(false), Math.max(duration, maxDuration));

        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
    }, [location.key]); // key надёжнее pathname (меняется на каждый переход)

    return loading;
}
