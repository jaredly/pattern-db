import { useMemo, useState } from "react";
import { ViewTiling } from "./ViewTiling";
import { BarePath, Coord, Segment, State } from "geometricart/src/types";
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
import { closeEnough } from "geometricart/src/rendering/epsilonToZero";
import { lineLine, lineToSlope } from "geometricart/src/rendering/intersect";
import { angleBetween } from "geometricart/src/rendering/findNextSegments";
import { addPrevsToSegments } from "geometricart/src/rendering/segmentsToNonIntersectingSegments";
import { ensureClockwise } from "geometricart/src/rendering/pathToPoints";

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

const maybeFlip = (shape: BarePath): BarePath => {
    const bounds = segmentsBounds(shape.segments);
    if (bounds.w <= bounds.h) {
        return shape;
    }
    return transformBarePath(shape, [rotationMatrix(Math.PI / 2)]);
};

const verticalize = (shape: BarePath): BarePath => {
    const dists: [number, number, number][] = [];
    for (let i = 0; i < shape.segments.length; i++) {
        for (let j = i + 1; j < shape.segments.length; j++) {
            const d = dist(shape.segments[i].to, shape.segments[j].to);
            dists.push([i, j, d]);
        }
    }
    const sorted = dists.sort((a, b) => b[2] - a[2]);
    const best = sorted[0];

    let p1;
    let angle;

    if (closeEnough(sorted[1][2], best[2])) {
        const a1 = shape.segments[sorted[1][0]].to;
        const a2 = shape.segments[sorted[1][1]].to;
        const b1 = shape.segments[best[0]].to;
        const b2 = shape.segments[best[1]].to;
        // two! find the intersection, and then ... do whatsit
        const mid = lineLine(lineToSlope(a1, a2), lineToSlope(b1, b2));
        if (mid) {
            const t1 = angleTo(a1, a2);
            const t2 = angleTo(b1, b2);
            const btw = angleBetween(t1, t2, true);
            const theta = t1 + btw / 2;
            p1 = mid;
            angle = theta;
        } else {
            p1 = shape.segments[best[0]].to;
            angle = angleTo(p1, shape.segments[best[1]].to);
        }
    } else {
        p1 = shape.segments[best[0]].to;
        angle = angleTo(p1, shape.segments[best[1]].to);
    }
    const tx = [
        // origin at zero
        translationMatrix({ x: -p1.x, y: -p1.y }),
        // rotate so the first segment is on the x axis pointing positive
        rotationMatrix(-angle + Math.PI / 2),
        // scale so the first segment has length 1
        scaleMatrix(1 / best[2], 1 / best[2]),
    ];
    return transformBarePath(shape, tx);
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
    return transformBarePath(shape, tx);
};

const shapeKey = (segments: BarePath["segments"]) =>
    segments.map(segmentKeyInner).join(" $ ");

type ClassCache = { [hash: string]: [number, string] };
type Caches = { lengths: ClassCache; angles: ClassCache };

const findWithRotation = <T,>(
    items: T[],
    cache: ClassCache,
    fn: (list: T[]) => [number, string]
) => {
    const first = fn(items);
    const fkey = first[1];
    if (cache[fkey]) {
        return cache[fkey];
    }

    cache[fkey] = first;
    for (let i = 1; i < items.length; i++) {
        const rot = items.slice(i).concat(items.slice(0, i));
        const hash = fn(rot)[1];
        cache[hash] = first;
    }

    return first;
};

const unique = (items: string[]) => {
    const seen: { [key: string]: boolean } = {};
    return items.filter((a) => (seen[a] ? false : (seen[a] = true)));
};

const analyze = (
    shape: BarePath,
    caches: Caches
): { concavities: number; patternClass: [number, number, string] } => {
    const withPrevs = addPrevsToSegments(ensureClockwise(shape.segments));
    const segmentAngles = withPrevs.map((seg) =>
        angleTo(seg.prev, seg.segment.to)
    );
    const btw = segmentAngles.map((angle, i) =>
        angleBetween(angle, segmentAngles[(i + 1) % segmentAngles.length], true)
    );
    const concavities = btw.filter((a) => a > Math.PI).length;

    const lengths = withPrevs.map((seg) => dist(seg.prev, seg.segment.to));
    const sides = findWithRotation(lengths, caches.lengths, (lengths) => {
        return toPattern(lengths);
    });
    const angles = findWithRotation(btw, caches.angles, (angles) =>
        toPattern(angles)
    );
    return {
        concavities,
        patternClass: [angles[0], sides[0], sides[1] + " :: " + angles[1]],
    };
};

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
        [hash: string]: {
            shape: BarePath;
            tilings: string[];
            concavities: number;
            patternClass: [number, number, string];
        };
        // };
    } = {};

    const rotated: { [hash: string]: string } = {};

    const caches: Caches = { angles: {}, lengths: {} };

    for (let tiling of datas) {
        for (let shape of tiling.data.cache.shapes) {
            const norm = normalizeShape(shape);
            const first = shapeKey(norm.segments);

            if (rotated[first]) {
                const match = shapesAndSuch[rotated[first]];
                if (!match.tilings.includes(tiling.id)) {
                    match.tilings.push(tiling.id);
                }
                continue;
            }

            const { concavities, patternClass } = analyze(norm, caches);

            rotated[first] = first;
            shapesAndSuch[first] = {
                shape: maybeFlip(verticalize(norm)),
                tilings: [tiling.id],
                concavities,
                patternClass,
            };

            for (let i = 1; i < norm.segments.length; i++) {
                const rot = normalizeShape(rotateShape(shape, i));
                const hash = shapeKey(rot.segments);
                rotated[hash] = first;
            }
        }
    }

    const fullOrg: {
        [sides: number]: {
            [concavities: number]: {
                [patternClass: string]: (typeof shapesAndSuch)[""][];
            };
        };
    } = {};

    Object.values(shapesAndSuch).forEach((shape) => {
        const sides =
            fullOrg[shape.shape.segments.length] ??
            (fullOrg[shape.shape.segments.length] = {});
        const conc =
            sides[shape.concavities] ?? (sides[shape.concavities] = {});
        const pc =
            conc[shape.patternClass[2]] ?? (conc[shape.patternClass[2]] = []);
        pc.push(shape);
    });

    console.log("we did an org");
    console.log(fullOrg);
    return fullOrg;
};

function toPattern(lengths: number[]): [number, string] {
    const fx = lengths.map((l): [number, string] => [l, l.toFixed(2)]);
    const sorted = unique(
        fx
            .slice()
            .sort((a, b) => a[0] - b[0])
            .map((m) => m[1])
    );
    const positions = fx.map((l) => sorted.indexOf(l[1]));
    return [sorted.length, positions.map((m) => m.toString()).join(",")];
}

function transformBarePath(
    shape: BarePath,
    tx: import("/Users/jared/clone/art/geometricart/src/rendering/getMirrorTransforms").Matrix[]
): BarePath {
    return {
        origin: applyMatrices(shape.origin, tx),
        segments: shape.segments.map((seg) => transformSegment(seg, tx)),
    };
}

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
            {Object.entries(org)
                .sort((a, b) => +a[0] - +b[0])
                .map(([count, byConcavity]) => (
                    <div key={count}>
                        <strong>{count}-sided</strong>

                        {Object.entries(byConcavity)
                            .sort((a, b) => +a[0] - +b[0])
                            .map(([conc, byPatternClass]) => (
                                <div key={conc}>
                                    <strong>{conc}-concavities</strong>
                                    {Object.entries(byPatternClass)
                                        .sort((one, two) => {
                                            const [a1, l1] =
                                                one[1][0].patternClass;
                                            const [a2, l2] =
                                                two[1][0].patternClass;
                                            if (a1 !== a2) return a1 - a2;
                                            return l1 - l2;
                                        })
                                        .map(([pc, shapes]) =>
                                            shapes.map((shape, i) =>
                                                showShape(
                                                    shape.shape.segments,
                                                    pc + i,
                                                    shape.shape.origin,
                                                    shape.tilings
                                                )
                                            )
                                        )}
                                </div>
                            ))}
                    </div>
                ))}
            {/* {Object.keys(org)
                // .sort((ka, kb) => {
                //     const a = org[ka];
                //     const b = org[kb];
                //     if (a.shape.segments.length !== b.shape.segments.length) {
                //         return (
                //             a.shape.segments.length - b.shape.segments.length
                //         );
                //     }
                //     if (a.concavities !== b.concavities) {
                //         return a.concavities - b.concavities;
                //     }
                //     if (a.patternClass !== b.patternClass) {
                //         return a.patternClass < b.patternClass ? -1 : 1;
                //     }
                //     return 0;
                // })
                .map(
                    (k) =>
                        showShape(
                            org[k].shape.segments,
                            k,
                            org[k].shape.origin,
                            org[k].tilings
                        )
                    // <div
                    //     key={k}
                    //     className="w-64"
                    //     style={{
                    //         display: "flex",
                    //         flexWrap: "wrap",
                    //     }}
                    // >
                    //     <div>
                    //         {k}-sided: {Object.keys(org[+k]).length}
                    //     </div>
                    //     {Object.keys(org[+k]).map((hash) => {
                    //         const {
                    //             shape: { origin, segments },
                    //             tilings: ids,
                    //         } = org[+k][hash];
                    //         return showShape(segments, hash, origin, ids);
                    //     })}
                    // </div>
                )} */}
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

function showShape(
    segments: Segment[],
    hash: string,
    origin: Coord,
    ids: string[]
) {
    const { h, w, x0, y0 } = segmentsBounds(segments);
    return (
        <div key={hash} className="p-2 relative">
            <svg
                width={(50 / h) * w}
                height={50}
                viewBox={`${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(
                    2
                )} ${h.toFixed(2)}`}
            >
                <path
                    fill="red"
                    d={`M${origin.x.toFixed(2)} ${origin.y.toFixed(2)}${segments
                        .map(
                            (seg) =>
                                `L${seg.to.x.toFixed(2)} ${seg.to.y.toFixed(2)}`
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
}

function segmentsBounds(segments: Segment[]) {
    const pts = segments.map((s) => s.to);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x0 = xs.reduce((a, b) => Math.min(a, b), Infinity);
    const x1 = xs.reduce((a, b) => Math.max(a, b), -Infinity);
    const y0 = ys.reduce((a, b) => Math.min(a, b), Infinity);
    const y1 = ys.reduce((a, b) => Math.max(a, b), -Infinity);
    const h = y1 - y0;
    const w = x1 - x0;
    return { h, w, x0, y0 };
}
