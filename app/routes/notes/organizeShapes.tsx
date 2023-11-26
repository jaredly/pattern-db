import { BarePath, State } from "geometricart/src/types";
import {
    Matrix,
    angleTo,
    applyMatrices,
    dist,
    rotationMatrix,
    scaleMatrix,
    translationMatrix,
} from "geometricart/src/rendering/getMirrorTransforms";
import { transformSegment } from "geometricart/src/rendering/points";
import { segmentKeyInner } from "geometricart/src/rendering/segmentKey";
import { closeEnough } from "geometricart/src/rendering/epsilonToZero";
import { lineLine, lineToSlope } from "geometricart/src/rendering/intersect";
import { angleBetween } from "geometricart/src/rendering/findNextSegments";
import { addPrevsToSegments } from "geometricart/src/rendering/segmentsToNonIntersectingSegments";
import { ensureClockwise } from "geometricart/src/rendering/pathToPoints";
import { segmentsBounds } from "./ViewTilings";
import {
    consoleSvg,
    renderSegments,
} from "geometricart/src/animation/renderSegments";

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
export const organizeShapes = (
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
            hash: string;
            shape: BarePath;
            tilings: string[];
            concavities: number;
            patternClass: [number, number, string];
        };
    } = {};

    const rotated: { [hash: string]: string } = {};

    const caches: Caches = { angles: {}, lengths: {} };

    for (let tiling of datas) {
        for (let shape of tiling.data.cache.shapes) {
            const segs = ensureClockwise(shape.segments);
            if (segs !== shape.segments) {
                shape.segments = segs;
                shape.origin = segs[segs.length - 1].to;
            }
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
                hash: first,
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

    // console.log("w17wenty", fullOrg[17]);
    // Object.values(fullOrg[17][8]).forEach((ok) => {
    //     const sss = renderSegments(addPrevsToSegments(ok[0].shape.segments));
    //     consoleSvg(sss);
    //     console.log(sss);
    // });

    return { fullOrg, byHash: shapesAndSuch };
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
function transformBarePath(shape: BarePath, tx: Matrix[]): BarePath {
    return {
        origin: applyMatrices(shape.origin, tx),
        segments: shape.segments.map((seg) => transformSegment(seg, tx)),
    };
}
