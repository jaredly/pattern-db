import { useState } from "react";

export const Zoomage = ({
    src,
    className,
}: {
    src: string;
    className?: string;
}) => {
    const [pos, setPos] = useState(null as null | { x: number; y: number });

    return (
        <img
            onMouseLeave={() => setPos(null)}
            style={{
                objectFit: pos ? "none" : "contain",
                objectPosition: pos
                    ? `${(pos.x * 100).toFixed(2)}% ${(pos.y * 100).toFixed(
                          2
                      )}%`
                    : undefined,
            }}
            className={className}
            src={src}
            onMouseMove={(evt) => {
                const box = evt.currentTarget.getBoundingClientRect();
                const x = (evt.clientX - box.left) / box.width;
                const y = (evt.clientY - box.top) / box.height;
                setPos({ x, y });
            }}
        />
    );
};
