import { Coord, Tiling } from "geometricart/src/types";
import { useMemo } from "react";
import * as geo from "geometricart/src/editor/tilingPoints";
import * as g2 from "geometricart/src/rendering/getMirrorTransforms";
import { LoaderReturn, handleNegZero } from "./route";

export const ViewTiling = ({
    tiling,
    count,
    onToggle,
    selected,
}: {
    tiling: LoaderReturn["tilings"][0];
    count?: number;
    onToggle: (selected: boolean) => void;
    selected: boolean;
}) => {
    const { bounds, lines } = useMemo(() => getSvgData(tiling), [tiling]);
    // const submit = useSubmit();
    return (
        <div className="flex flex-col items-stretch p-4">
            <button
                className={
                    "hover:bg-deep-orange-500 cursor-pointer px-4 py-2" +
                    (selected ? " bg-deep-orange-500" : "")
                }
                // href={`/notes/${tiling.id}`}
                onClick={() => {
                    onToggle(!selected);
                }}
            >
                {tiling.hash.slice(0, 10)} ({count ?? 0})
            </button>
            <button
                form="patterns"
                name="add-tiling"
                value={tiling.id}
                className="hover:bg-deep-orange-500 cursor-pointer px-4 py-2"
            >
                Add to selected images
            </button>
            {tilingSvg(bounds, lines)}
            <button
                form="patterns"
                name="delete-tiling"
                value={tiling.id}
                className="hover:bg-deep-orange-500 cursor-pointer px-4 py-2"
            >
                Delete tiling
            </button>
        </div>
    );
};

export function getSvgData(tiling: {
    data: Tiling;
    hash: string;
    json: string;
    id: string;
}): { bounds: Coord[]; lines: [Coord, Coord][] } {
    console.log("geting", tiling);
    const pts = geo.tilingPoints(tiling.data.shape);
    const tx = geo.getTransform(pts);
    const bounds = pts.map((pt) => g2.applyMatrices(pt, tx));
    const lines = geo.eigenShapesToLines(
        tiling.data.cache.segments.map((s) => [s.prev, s.segment.to]),
        tiling.data.shape,
        g2.applyMatrices(pts[2], tx),
        bounds
    );
    return { bounds, lines };
}

export function tilingSvg(bounds: Coord[], lines: [Coord, Coord][]) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ background: "black", width: 300, height: 300 }}
            viewBox="-2.5 -2.5 5 5"
        >
            <path
                d={`${bounds
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
            {lines.map(([p1, p2], i) => {
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
    );
}
