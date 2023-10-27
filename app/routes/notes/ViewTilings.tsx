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
import {
    segmentKey,
    segmentKeyInner,
} from "geometricart/src/rendering/segmentKey";

const rotateShape = (shape: BarePath, idx: number): BarePath => {
    if (idx === 0) return shape;
    const origin = shape.segments[idx - 1].to;
    return {
        origin,
        segments: shape.segments
            .slice(idx)
            .concat(shape.segments.slice(0, idx)),
    };
};

const verticalize = (shape: BarePath): BarePath => {
    const dists: [number, number, number][] = [];
    for (let i = 0; i < shape.segments.length; i++) {
        for (let j = i + 1; j < shape.segments.length; j++) {
            const d = dist(shape.segments[i].to, shape.segments[j].to);
            dists.push([i, j, d]);
        }
    }
    const best = dists.sort((a, b) => b[2] - a[2])[0];
    const p1 = shape.segments[best[0]].to;
    const angle = angleTo(p1, shape.segments[best[1]].to);
    const tx = [
        // origin at zero
        translationMatrix({ x: -p1.x, y: -p1.y }),
        // rotate so the first segment is on the x axis pointing positive
        rotationMatrix(-angle + Math.PI / 2),
        // scale so the first segment has length 1
        scaleMatrix(1 / best[2], 1 / best[2]),
    ];
    return {
        origin: applyMatrices(shape.origin, tx),
        segments: shape.segments.map((seg) => transformSegment(seg, tx)),
    };
};

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

const shapeKey = (segments: BarePath["segments"]) =>
    segments.map(segmentKeyInner).join(" $ ");

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
            [hash: string]: { shape: BarePath; tilings: string[] };
        };
    } = {};

    const rotated: { [hash: string]: string } = {};

    for (let tiling of datas) {
        for (let shape of tiling.data.cache.shapes) {
            const num = shape.segments.length;
            if (!shapesAndSuch[num]) {
                shapesAndSuch[num] = {};
            }

            const norm = normalizeShape(shape);
            const first = shapeKey(norm.segments);

            if (rotated[first]) {
                const match = shapesAndSuch[num][rotated[first]];
                if (!match.tilings.includes(tiling.id)) {
                    match.tilings.push(tiling.id);
                }
                continue;
            }

            rotated[first] = first;
            shapesAndSuch[num][first] = {
                shape: verticalize(norm),
                tilings: [tiling.id],
            };

            for (let i = 1; i < norm.segments.length; i++) {
                const rot = normalizeShape(rotateShape(shape, i));
                const hash = shapeKey(rot.segments);
                rotated[hash] = first;
            }

            // let most;
            // if (rotated[first]) {
            //     most = rotated[first];
            // } else {
            //     rotated[first] = first;
            //     most = first;
            //     for (let i = 1; i < norm.segments.length; i++) {
            //         const segs = norm.segments
            //             .slice(i)
            //             .concat(norm.segments.slice(0, i));
            //         const hash = shapeKey(segs);
            //         rotated[hash] = first;
            //     }
            // }

            // if (!shapesAndSuch[num][most]) {
            //     shapesAndSuch[num][most] = { shape: norm, tilings: [] };
            // }
            // shapesAndSuch[num][most].tilings.push(tiling.id);
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
                        const {
                            shape: { origin, segments },
                            tilings: ids,
                        } = org[+k][hash];
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
                            <div key={hash} className="p-2 relative">
                                <svg
                                    width={(50 / h) * w}
                                    height={50}
                                    viewBox={`${x0.toFixed(2)} ${y0.toFixed(
                                        2
                                    )} ${w.toFixed(2)} ${h.toFixed(2)}`}
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
                                {ids.length > 1 ? (
                                    <div
                                        className="absolute"
                                        style={{
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            display: "flex",
                                            textShadow: "1px 1px 2px white",
                                        }}
                                    >
                                        {ids.length}
                                    </div>
                                ) : (
                                    ""
                                )}
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
