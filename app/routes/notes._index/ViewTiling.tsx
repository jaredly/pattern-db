import { Tiling } from "geometricart/src/types";
import { useMemo } from "react";
import * as geo from "geometricart/src/editor/tilingPoints";
import * as g2 from "geometricart/src/rendering/getMirrorTransforms";
import { LoaderReturn, handleNegZero } from "./route";

export const ViewTiling = ({
    tiling,
    count,
}: {
    tiling: LoaderReturn["tilings"][0];
    count?: number;
}) => {
    const data: Tiling = useMemo(() => JSON.parse(tiling.json), [tiling.json]);
    const ok = useMemo(() => {
        const pts = geo.tilingPoints(data.shape);
        const tx = geo.getTransform(pts);
        const p2 = pts.map((pt) => g2.applyMatrices(pt, tx));
        const full = geo.eigenShapesToLines(
            data.cache.segments.map((s) => [s.prev, s.segment.to]),
            data.shape.type === "right-triangle" && data.shape.rotateHypotenuse,
            g2.applyMatrices(pts[2], tx),
            p2
        );
        return { p2, full };
    }, [tiling]);
    // const submit = useSubmit();
    return (
        <div className="flex flex-col items-stretch p-4">
            <div className="p-3 text-center">
                {tiling.hash.slice(0, 10)} ({count ?? 0})
            </div>
            <button
                form="patterns"
                name="add-tiling"
                value={tiling.id}
                className="hover:bg-deep-orange-500 cursor-pointer px-4 py-2"
            >
                Add to selected images
            </button>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ background: "black", width: 300, height: 300 }}
                viewBox="-2.5 -2.5 5 5"
            >
                <path
                    d={`${ok.p2
                        .map(
                            ({ x, y }, i) =>
                                `${i === 0 ? "M" : "L"}${handleNegZero(
                                    x
                                )} ${handleNegZero(y)}`
                        )
                        .join(" ")}Z`}
                    fill="rgb(50,50,50)"
                    stroke="none"
                />
                {ok.full.map(([p1, p2], i) => {
                    return (
                        <line
                            key={i}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            x1={p1.x.toFixed(2)}
                            x2={p2.x.toFixed(2)}
                            y1={p1.y.toFixed(2)}
                            y2={p2.y.toFixed(2)}
                            stroke="yellow"
                            strokeWidth="0.02"
                        />
                    );
                })}
            </svg>
        </div>
    );
};
