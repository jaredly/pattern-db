import { useMemo, useState } from "react";
import { ViewTiling } from "./ViewTiling";
import { BarePath, State } from "geometricart/src/types";
import {
    angleTo,
    applyMatrices,
    dist,
    rotationMatrix,
    scaleMatrix,
    translationMatrix,
} from "geometricart/src/rendering/getMirrorTransforms";
import { transformSegment } from "geometricart/src/rendering/points";
import { coordKey } from "geometricart/src/rendering/coordKey";

const normalizeShape = (shape: BarePath): BarePath => {
    const theta = angleTo(shape.origin, shape.segments[0].to);
    const len = dist(shape.origin, shape.segments[0].to);
    const tx = [
        // origin at zero
        translationMatrix({ x: -shape.origin.x, y: -shape.origin.y }),
        // rotate so the first segment is on the x axis pointing positive
        rotationMatrix(-theta),
        // scale so the first segment has length 1
        scaleMatrix(1 / len, 1 / len),
    ];
    return {
        origin: applyMatrices(shape.origin, tx),
        segments: shape.segments.map((seg) => transformSegment(seg, tx)),
    };
};

const shapeKey = (shape: BarePath) =>
    `${coordKey(shape.origin)} ${shape.segments
        .map((seg) =>
            seg.type === "Line"
                ? coordKey(seg.to)
                : `${coordKey(seg.center)} ${coordKey(seg.to)} ${
                      seg.clockwise ? "CC" : "C"
                  }`
        )
        .join(" $ ")}`;

const organizeShapes = (
    tilings: { hash: string; json: string; id: string }[]
) => {
    const datas: { data: State["tilings"][""]; hash: string; id: string }[] =
        tilings.map((t) => ({
            data: JSON.parse(t.json),
            hash: t.hash,
            id: t.id,
        }));

    const shapesAndSuch: {
        [count: number]: {
            [hash: string]: BarePath;
        };
    } = {};

    for (let tiling of datas) {
        for (let shape of tiling.data.cache.shapes) {
            const num = shape.segments.length;
            if (!shapesAndSuch[num]) {
                shapesAndSuch[num] = {};
            }
            const norm = normalizeShape(shape);
            const hash = shapeKey(norm);
            if (!shapesAndSuch[num][hash]) {
                shapesAndSuch[num][hash] = shape;
            }
        }
    }

    console.log("we did an org");
    console.log(shapesAndSuch);
    return shapesAndSuch;
};

export function ViewTilings({
    tilings,
    tilingCounts,
}: {
    tilings: { hash: string; json: string; id: string }[];
    tilingCounts: Record<string, number>;
}) {
    const [what, setWhat] = useState("hi");
    const org = useMemo(() => organizeShapes(tilings), [tilings]);

    return (
        <div className="w-64 min-w-max overflow-scroll">
            {Object.keys(org).map((k) => (
                <div
                    key={k}
                    className="w-64"
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        {k}-sided: {Object.keys(org[+k]).length}
                    </div>
                    {Object.keys(org[+k]).map((hash) => {
                        const { origin, segments } = org[+k][hash];
                        const pts = segments.map((s) => s.to);
                        const xs = pts.map((p) => p.x);
                        const ys = pts.map((p) => p.y);
                        const x0 = xs.reduce(
                            (a, b) => Math.min(a, b),
                            Infinity
                        );
                        const x1 = xs.reduce(
                            (a, b) => Math.max(a, b),
                            -Infinity
                        );
                        const y0 = ys.reduce(
                            (a, b) => Math.min(a, b),
                            Infinity
                        );
                        const y1 = ys.reduce(
                            (a, b) => Math.max(a, b),
                            -Infinity
                        );
                        const h = y1 - y0;
                        const w = x1 - x0;
                        return (
                            <div key={hash} className="p-2">
                                <svg
                                    width={(50 / h) * w}
                                    height={50}
                                    viewBox={`${x0} ${y0} ${w} ${h}`}
                                >
                                    <path
                                        fill="red"
                                        d={`M${origin.x.toFixed(
                                            2
                                        )} ${origin.y.toFixed(2)}${segments
                                            .map(
                                                (seg) =>
                                                    `L${seg.to.x.toFixed(
                                                        2
                                                    )} ${seg.to.y.toFixed(2)}`
                                            )
                                            .join("")}Z`}
                                    />
                                </svg>
                            </div>
                        );
                    })}
                </div>
            ))}
            {tilings.map((tiling) => (
                <ViewTiling
                    key={tiling.id}
                    tiling={tiling}
                    count={tilingCounts[tiling.hash]}
                />
            ))}
        </div>
    );
}
