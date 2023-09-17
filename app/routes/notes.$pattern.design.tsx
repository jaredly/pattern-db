import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { readFileSync } from "fs";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import size from "image-size";

export const loader = async ({ params }: LoaderArgs) => {
    invariant(params.pattern, "pattern not found");

    const pattern = await prisma.pattern.findUnique({
        where: { id: params.pattern },
        select: { images: { select: { url: true } } },
    });
    if (!pattern?.images.length) {
        throw new Response("Not Found", { status: 404 });
    }
    // const size = images
    // const image = pattern.images[0].url;
    return json({ pattern, size: size("public" + pattern.images[0].url) });
};

// type DATA = {
//     App: typeof App;
//     initialState: State;
//     React: typeof React;
//     createRoot: typeof createRoot;
//     setupState: (mirror: Mirror | null) => unknown;
// };

// declare global {
//     interface Window {
//         GEOMETRICART_DATA: DATA;
//         GEOMETRICART_INIT: () => unknown;
//     }
// }

export default function NoteDetailsPage() {
    const { pattern, size } = useLoaderData<typeof loader>();

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!pattern.images.length) {
            return;
        }
        const image = pattern.images[0];

        const init = () => {
            const { App, initialState, React, createRoot, setupState } =
                // @ts-ignore
                window.GEOMETRICART_DATA;
            console.log("Git it", App, React, createRoot);
            if (!ref.current) {
                console.log("no root sry");
                return;
            }
            const rt = createRoot(ref.current!);
            const state = setupState(null);
            state.attachments["pattern"] = {
                id: "pattern",
                name: "pattern",
                width: size.width,
                height: size.height,
                contents: image.url,
            };
            rt.render(
                React.createElement(App, {
                    initialState: state,
                    saveState: () => {},
                    lastSaved: null,
                })
            );
        };

        // @ts-ignore
        window.GEOMETRICART_INIT = init;
        // @ts-ignore
        if (window.GEOMETRICART_DATA) {
            init();
        }
    }, []);
    return (
        <div>
            <link href="/assets/index.css" rel="stylesheet" />
            <script src="/assets/index.js" type="module"></script>
            <div ref={ref} />
            {!pattern.images.length && "NO IMAGES"}
            Hello stuff
            {/* <App lastSaved={null} saveState={() => {}} initialState={initialState} /> */}
        </div>
    );
}
