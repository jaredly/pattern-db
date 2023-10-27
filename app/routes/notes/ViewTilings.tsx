import { useMemo, useState } from "react";
import { ViewTiling } from "./ViewTiling";
import { Coord, Segment } from "geometricart/src/types";
import { coordKey } from "geometricart/src/rendering/coordKey";
import { segmentKey } from "geometricart/src/rendering/segmentKey";
import { organizeShapes } from "./organizeShapes";

import {
    Menu,
    MenuHandler,
    MenuList,
    MenuItem,
    Button,
} from "@material-tailwind/react";

const OrgMenu = ({
    tilings,
}: {
    tilings: { hash: string; json: string; id: string }[];
}) => {
    const org = useMemo(() => organizeShapes(tilings), [tilings]);

    return (
        <div>
            <Menu>
                <MenuHandler>
                    <Button>Hello</Button>
                </MenuHandler>
                <MenuList>
                    {Object.entries(org)
                        .sort((a, b) => +a[0] - +b[0])
                        .map(([count, byConcavity]) => (
                            <Menu key={count} placement="right-start">
                                <MenuHandler>
                                    <MenuItem>{count} sides</MenuItem>
                                </MenuHandler>
                                <MenuList>
                                    {Object.entries(byConcavity)
                                        .sort((a, b) => +a[0] - +b[0])
                                        .map(([conc, byPatternClass]) => (
                                            <Menu
                                                key={conc}
                                                placement="right-start"
                                            >
                                                <MenuHandler>
                                                    <MenuItem>
                                                        {conc} concavities
                                                    </MenuItem>
                                                </MenuHandler>
                                                <MenuList>
                                                    {Object.entries(
                                                        byPatternClass
                                                    )
                                                        .sort((one, two) => {
                                                            const [a1, l1] =
                                                                one[1][0]
                                                                    .patternClass;
                                                            const [a2, l2] =
                                                                two[1][0]
                                                                    .patternClass;
                                                            if (a1 !== a2)
                                                                return a1 - a2;
                                                            return l1 - l2;
                                                        })
                                                        .map(([pc, shapes]) => (
                                                            <MenuItem className="flex">
                                                                {shapes.map(
                                                                    (
                                                                        shape,
                                                                        i
                                                                    ) =>
                                                                        showShape(
                                                                            shape
                                                                                .shape
                                                                                .segments,
                                                                            pc +
                                                                                i,
                                                                            shape
                                                                                .shape
                                                                                .origin,
                                                                            shape.tilings
                                                                        )
                                                                )}
                                                            </MenuItem>
                                                        ))}
                                                </MenuList>
                                            </Menu>
                                        ))}
                                </MenuList>
                            </Menu>
                        ))}
                </MenuList>
            </Menu>
        </div>
    );
};

export function ViewTilings({
    tilings,
    tilingCounts,
}: {
    tilings: { hash: string; json: string; id: string }[];
    tilingCounts: Record<string, number>;
}) {
    const [what, setWhat] = useState("hi");

    return (
        <div className="w-64 min-w-max overflow-scroll">
            <OrgMenu tilings={tilings} />
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

export function segmentsBounds(segments: Segment[]) {
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
