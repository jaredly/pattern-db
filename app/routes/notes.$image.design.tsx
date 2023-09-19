import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import size from "image-size";
import { existsSync, readFileSync, writeFileSync } from "fs";

export const loader = async ({ params }: LoaderArgs) => {
    invariant(params.image, "image not found");

    const image = await prisma.image.findUnique({
        where: { id: params.image },
        select: { url: true },
    });
    if (!image) {
        throw new Response("Not Found", { status: 404 });
    }
    const path = "public" + image.url;
    const state = existsSync(path + ".json")
        ? JSON.parse(readFileSync(path + ".json", "utf-8"))
        : null;
    return json({ image, size: size(path), state });
};

export const action = async ({ params, request }: ActionArgs) => {
    const data = await request.json();

    const image = await prisma.image.findUnique({
        where: { id: params.image },
        select: { url: true },
    });
    if (!image) {
        throw new Error("image not found");
    }
    const path = "public" + image.url + ".json";

    writeFileSync(path, JSON.stringify(data));
    return null;
};

// export default function NoteDetailsPage() {
//     const { image, size, state: savedState } = useLoaderData<typeof loader>();
//     const submit = useSubmit();

//     const ref = useRef<HTMLDivElement>(null);
//     useEffect(() => {
//         const init = () => {
//             const { App, React, createRoot, setupState } =
//                 // @ts-ignore
//                 window.GEOMETRICART_DATA;
//             console.log("Git it", App, React, createRoot);
//             if (!ref.current) {
//                 console.log("no root sry");
//                 return;
//             }
//             const root = createRoot(ref.current!);
//             let state;
//             if (savedState) {
//                 state = savedState;
//             } else {
//                 state = setupState(null);
//                 state.attachments["pattern"] = {
//                     id: "pattern",
//                     name: "pattern",
//                     width: size.width,
//                     height: size.height,
//                     contents: image.url,
//                 };
//                 state.overlays["overlay"] = {
//                     id: "overlay",
//                     source: "pattern",
//                     scale: { x: 1, y: 1 },
//                     center: { x: 0, y: 0 },
//                     hide: false,
//                     over: false,
//                     opacity: 1,
//                 };
//                 state.selection = null;
//             }
//             root.render(
//                 React.createElement(App, {
//                     initialState: state,
//                     saveState: (state: any) => {
//                         submit(state, {
//                             method: "post",
//                             encType: "application/json",
//                         });
//                     },
//                     lastSaved: null,
//                 })
//             );
//         };

//         // @ts-ignore
//         window.GEOMETRICART_INIT = init;
//         // @ts-ignore
//         if (window.GEOMETRICART_DATA) {
//             init();
//         }
//     }, []);
//     return (
//         <div>
//             <link href="/assets/index.css" rel="stylesheet" />
//             <script src="/assets/index.js" type="module"></script>
//             <div ref={ref} />
//             Hello stuff
//             {/* <App lastSaved={null} saveState={() => {}} initialState={initialState} /> */}
//         </div>
//     );
// }
