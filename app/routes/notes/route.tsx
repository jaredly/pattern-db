import { Tiling } from "geometricart/src/types";
import { useEffect, useState } from "react";

import NotesPage from "./NotesPage";
import { loader } from "./loader";

export const meta = () => [{ title: "Pattern Database" }];

export default NotesPage;
export { action } from "./action";
export { loader } from "./loader";

export const tilingSort = (o: { json: string }, t: { json: string }) => {
    const on: Tiling = JSON.parse(o.json);
    const tn: Tiling = JSON.parse(t.json);
    return on.cache.segments.length - tn.cache.segments.length;
};

export type LoaderReturn = Awaited<
    ReturnType<Awaited<ReturnType<typeof loader>>["json"]>
>;

export type PatternSelected = LoaderReturn["patterns"][0];

export const lsText = (key: string) => {
    const [value, setValue] = useState("");
    useEffect(() => {
        setValue(window.localStorage[key]);
    }, []);
    return {
        value,
        onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            setValue((window.localStorage[key] = evt.target.value));
        },
    };
};

export const customStyle = `input[type=checkbox]:checked + div {
    --tw-bg-opacity: 0.8;
    background-color: rgb(207 216 220 / var(--tw-bg-opacity));
}
label:hover > input[type=checkbox]:checked + div {
    --tw-bg-opacity: 1;
    background-color: rgb(207 216 220 / var(--tw-bg-opacity));
}`;

export const handleNegZero = (n: number) => {
    const m = n.toFixed(2);
    return m === "-0.00" ? "0.00" : m;
};

export const HOST = "http://localhost:3000";

export const compareTags = (
    one: { name: string; category: string },
    two: { name: string; category: string }
) => {
    if (one.category < two.category) {
        return -1;
    }
    if (two.category < one.category) {
        return 1;
    }
    const onum = one.name.match(/^\d+/);
    const tnum = two.name.match(/^\d+/);
    if (onum && !tnum) {
        return -1;
    }
    if (tnum && !onum) {
        return 1;
    }
    if (onum && tnum) {
        return +onum[0] - +tnum[0];
    }
    return one.name < two.name ? -1 : one.name > two.name ? 1 : 0;
};
